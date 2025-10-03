import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { RecognitionResult, RecognitionSession } from './entities/recognition-result.entity';
import { StartRecognitionDto, AudioFormat, Language } from './dto/start-recognition.dto';
import { OpenAIService } from '../openai/openai.service';
import { TTSService, TTSAudioChunk, VisemeData } from '../tts/tts.service';

@Injectable()
export class SttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SttService.name);
  private readonly sessions = new Map<string, RecognitionSession>();
  private readonly recognizers = new Map<string, sdk.SpeechRecognizer>();
  private readonly pushStreams = new Map<string, sdk.PushAudioInputStream>();
  
  private speechConfig: sdk.SpeechConfig;
  private audioConfig: sdk.AudioConfig;
  private isInitialized = false;
  private onRecognitionResultCallback?: (sessionId: string, result: RecognitionResult) => void;
  private onOpenAIResponseCallback?: (sessionId: string, response: any) => void;
  private onTTSAudioChunkCallback?: (sessionId: string, chunk: TTSAudioChunk) => void;
  private onVisemeDataCallback?: (sessionId: string, visemeData: VisemeData[]) => void;
  private onTTSSynthesisCompleteCallback?: (sessionId: string) => void;

  constructor(
    private configService: ConfigService,
    private openaiService: OpenAIService,
    private ttsService: TTSService,
  ) {}

  async onModuleInit() {
    try {
      const speechKey = this.configService.get<string>('AZURE_SPEECH_KEY');
      const speechRegion = this.configService.get<string>('AZURE_SPEECH_REGION');

      if (!speechKey || !speechRegion) {
        this.logger.warn('Azure Speech Service credentials not configured. STT functionality will be limited.');
        return;
      }

      this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
      this.speechConfig.speechRecognitionLanguage = Language.EN_US;
      this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      
      this.logger.log(`Speech config initialized with language: ${this.speechConfig.speechRecognitionLanguage}`);
      
      this.isInitialized = true;
      this.logger.log('Azure Speech Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Azure Speech Service:', error);
      this.isInitialized = false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up STT service...');
    
    for (const [sessionId, recognizer] of this.recognizers) {
      try {
        recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
        this.logger.log(`Cleaned up recognizer for session: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Error cleaning up recognizer for session ${sessionId}:`, error);
      }
    }
    
    this.recognizers.clear();
    this.pushStreams.clear();
    this.sessions.clear();
    this.logger.log('STT service cleanup completed');
  }

  async startRecognition(sessionId: string, options: StartRecognitionDto): Promise<RecognitionSession> {
    try {
      if (!this.isInitialized || !this.speechConfig) {
        throw new Error('Azure Speech Service not properly initialized. Please check your configuration.');
      }

      if (this.sessions.has(sessionId)) {
        this.logger.warn(`Session ${sessionId} already exists. Stopping previous session.`);
        await this.stopRecognition(sessionId);
      }

      const language = options.language || Language.EN_US;
      if (!Object.values(Language).includes(language)) {
        throw new Error(`Unsupported language: ${language}`);
      }

      this.speechConfig.speechRecognitionLanguage = language;

      const pushStream = sdk.AudioInputStream.createPushStream(
        sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1) // 16kHz, 16-bit, mono
      );
      this.audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, this.audioConfig);
      
      this.logger.log(`Created recognizer for session ${sessionId} with audio format: 16kHz, 16-bit, mono`);
      
      this.recognizers.set(sessionId, recognizer);
      this.pushStreams.set(sessionId, pushStream);
      
      const session: RecognitionSession = {
        id: sessionId,
        language: language,
        audioFormat: options.audioFormat || AudioFormat.PCM,
        startTime: new Date(),
        isActive: true,
        results: [],
      };
      
      this.sessions.set(sessionId, session);

      this.setupRecognizerEvents(recognizer, sessionId);

      this.logger.log(`Started recognition session: ${sessionId} with language: ${language}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to start recognition for session ${sessionId}:`, error);
      throw error;
    }
  }

  async processAudioChunk(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      const recognizer = this.recognizers.get(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!recognizer) {
        throw new Error(`Recognizer for session ${sessionId} not found`);
      }

      if (!session.isActive) {
        throw new Error(`Session ${sessionId} is not active`);
      }

      const pushStream = this.pushStreams.get(sessionId);
      if (pushStream) {
        pushStream.write(audioData);
      } else {
        throw new Error(`Push stream not found for session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing audio chunk for session ${sessionId}:`, error);
      throw error;
    }
  }

  async stopRecognition(sessionId: string): Promise<RecognitionResult[]> {
    try {
      const session = this.sessions.get(sessionId);
      const recognizer = this.recognizers.get(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!recognizer) {
        this.logger.warn(`Recognizer for session ${sessionId} not found, but session exists`);
        session.isActive = false;
        this.sessions.delete(sessionId);
        return session.results;
      }

      recognizer.stopContinuousRecognitionAsync();
      recognizer.close();
      
      session.isActive = false;
      
      this.recognizers.delete(sessionId);
      this.pushStreams.delete(sessionId);
      
      this.logger.log(`Stopped recognition session: ${sessionId} with ${session.results.length} results`);
      return session.results;
    } catch (error) {
      this.logger.error(`Error stopping recognition for session ${sessionId}:`, error);
      
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.recognizers.delete(sessionId);
        this.pushStreams.delete(sessionId);
      }
      
      throw error;
    }
  }

  getSession(sessionId: string): RecognitionSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): RecognitionSession[] {
    return Array.from(this.sessions.values());
  }

  setOnRecognitionResultCallback(callback: (sessionId: string, result: RecognitionResult) => void): void {
    this.onRecognitionResultCallback = callback;
  }

  setOnOpenAIResponseCallback(callback: (sessionId: string, response: any) => void): void {
    this.onOpenAIResponseCallback = callback;
  }

  setOnTTSAudioChunkCallback(callback: (sessionId: string, chunk: TTSAudioChunk) => void): void {
    this.onTTSAudioChunkCallback = callback;
  }

  setOnVisemeDataCallback(callback: (sessionId: string, visemeData: VisemeData[]) => void): void {
    this.onVisemeDataCallback = callback;
  }

  setOnTTSSynthesisCompleteCallback(callback: (sessionId: string) => void): void {
    this.onTTSSynthesisCompleteCallback = callback;
  }

  private setupRecognizerEvents(recognizer: sdk.SpeechRecognizer, sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error(`Session ${sessionId} not found when setting up events`);
      return;
    }

    recognizer.recognizing = (s, e) => {
      try {
        this.logger.debug(`Recognizing event for session ${sessionId}, reason: ${e.result.reason}`);
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
          const result: RecognitionResult = {
            id: `${sessionId}-${Date.now()}`,
            text: e.result.text,
            confidence: this.extractConfidence(e.result),
            offset: e.result.offset,
            duration: e.result.duration,
            sessionId,
            timestamp: new Date(),
            isFinal: false,
          };
          
          session.results.push(result);
          this.logger.log(`Recognizing: "${result.text}" (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        } else {
          this.logger.debug(`Recognizing event with reason: ${e.result.reason}, text: "${e.result.text}"`);
        }
      } catch (error) {
        this.logger.error(`Error in recognizing event for session ${sessionId}:`, error);
      }
    };

    recognizer.recognized = (s, e) => {
      try {
        this.logger.debug(`Recognized event for session ${sessionId}, reason: ${e.result.reason}`);
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const result: RecognitionResult = {
            id: `${sessionId}-${Date.now()}`,
            text: e.result.text,
            confidence: this.extractConfidence(e.result),
            offset: e.result.offset,
            duration: e.result.duration,
            sessionId,
            timestamp: new Date(),
            isFinal: true,
          };
          
          session.results.push(result);
          this.logger.log(`Recognized: "${result.text}" (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
          
          if (this.onRecognitionResultCallback) {
            this.onRecognitionResultCallback(sessionId, result);
          }
          
          this.openaiService.generateResponse(result.text, sessionId).then((response) => {
            this.logger.log(`Generated response for session ${sessionId}: ${response.content}`);
            
            if (this.onOpenAIResponseCallback) {
              this.onOpenAIResponseCallback(sessionId, response);
            }

            this.synthesizeOpenAIResponse(response.content, sessionId).catch((ttsError) => {
              this.logger.error(`Error synthesizing OpenAI response for session ${sessionId}:`, ttsError);
            });
          }).catch((error) => {
            this.logger.error(`Error generating OpenAI response for session ${sessionId}:`, error);
          });
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          this.logger.debug(`No match for session ${sessionId}: ${e.result.reason}`);
        } else {
          this.logger.debug(`Recognized event with reason: ${e.result.reason}, text: "${e.result.text}"`);
        }
      } catch (error) {
        this.logger.error(`Error in recognized event for session ${sessionId}:`, error);
      }
    };

    recognizer.canceled = (s, e) => {
      try {
        this.logger.error(`Recognition canceled for session ${sessionId}: ${e.errorDetails}`);
        session.isActive = false;
        
        this.recognizers.delete(sessionId);
      } catch (error) {
        this.logger.error(`Error in canceled event for session ${sessionId}:`, error);
      }
    };

    recognizer.sessionStopped = (s, e) => {
      try {
        this.logger.log(`Session stopped: ${sessionId}`);
        session.isActive = false;
      } catch (error) {
        this.logger.error(`Error in sessionStopped event for session ${sessionId}:`, error);
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => {
        this.logger.log(`Continuous recognition started for session ${sessionId}`);
      },
      (error) => {
        this.logger.error(`Failed to start continuous recognition for session ${sessionId}:`, error);
        session.isActive = false;
      }
    );
  }

  private async synthesizeOpenAIResponse(text: string, sessionId: string): Promise<void> {
    try {
      const ttsSessionId = `${sessionId}_tts_${Date.now()}`;
      
      this.ttsService.setOnAudioChunkCallback((ttsSessionId, chunk) => {
        if (this.onTTSAudioChunkCallback) {
          this.onTTSAudioChunkCallback(sessionId, chunk);
        }
      });

      this.ttsService.setOnVisemeDataCallback((ttsSessionId, visemeData) => {
        if (this.onVisemeDataCallback) {
          this.onVisemeDataCallback(sessionId, visemeData);
        }
      });

      this.ttsService.setOnSynthesisCompleteCallback((ttsSessionId) => {
        if (this.onTTSSynthesisCompleteCallback) {
          this.onTTSSynthesisCompleteCallback(sessionId);
        }
      });

      await this.ttsService.synthesizeText(text, ttsSessionId, {
        voice: 'en-US-AriaNeural',
        language: 'en-US',
        rate: 1.0,
        pitch: 0,
      });

      this.logger.log(`Started TTS synthesis for OpenAI response in session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to synthesize OpenAI response for session ${sessionId}:`, error);
      throw error;
    }
  }

  private extractConfidence(result: sdk.SpeechRecognitionResult): number {
    try {
      const jsonResult = result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
      if (jsonResult) {
        const parsed = JSON.parse(jsonResult);
        return parsed.Confidence || 0;
      }
    } catch (error) {
      this.logger.debug('Failed to extract confidence from result:', error);
    }
    return 0;
  }
}
