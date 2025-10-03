import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface VisemeData {
  id: number;
  offset: number;
  animation: string;
}

export interface TTSAudioChunk {
  audioData: ArrayBuffer;
  duration: number;
}

export interface TTSSession {
  id: string;
  text: string;
  voice: string;
  language: string;
  startTime: Date;
  isActive: boolean;
  audioChunks: TTSAudioChunk[];
  visemeData: VisemeData[];
}

@Injectable()
export class TTSService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TTSService.name);
  private readonly sessions = new Map<string, TTSSession>();
  private readonly synthesizers = new Map<string, sdk.SpeechSynthesizer>();
  
  private speechConfig: sdk.SpeechConfig;
  private isInitialized = false;
  private onAudioChunkCallback?: (sessionId: string, chunk: TTSAudioChunk) => void;
  private onVisemeDataCallback?: (sessionId: string, visemeData: VisemeData[]) => void;
  private onSynthesisCompleteCallback?: (sessionId: string) => void;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const speechKey = this.configService.get<string>('AZURE_SPEECH_KEY');
      const speechRegion = this.configService.get<string>('AZURE_SPEECH_REGION');

      if (!speechKey || !speechRegion) {
        this.logger.warn('Azure Speech Service credentials not configured. TTS functionality will be limited.');
        return;
      }

      this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
      this.speechConfig.speechSynthesisLanguage = 'en-US';
      this.speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural';
      
      this.speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_SynthVoice, 'true');
      this.speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_SynthOutputFormat, 
        sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3.toString());
      
      this.logger.log(`TTS config initialized with voice: ${this.speechConfig.speechSynthesisVoiceName}`);
      
      this.isInitialized = true;
      this.logger.log('Azure Speech Service TTS initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Azure Speech Service TTS:', error);
      this.isInitialized = false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up TTS service...');
    
    for (const [sessionId, synthesizer] of this.synthesizers) {
      try {
        synthesizer.close();
        this.logger.log(`Cleaned up synthesizer for session: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Error cleaning up synthesizer for session ${sessionId}:`, error);
      }
    }
    
    this.synthesizers.clear();
    this.sessions.clear();
    this.logger.log('TTS service cleanup completed');
  }

  async synthesizeText(
    text: string, 
    sessionId: string, 
    options: {
      voice?: string;
      language?: string;
      rate?: number;
      pitch?: number;
    } = {}
  ): Promise<TTSSession> {
    try {
      if (!this.isInitialized || !this.speechConfig) {
        throw new Error('Azure Speech Service TTS not properly initialized. Please check your configuration.');
      }

      if (this.sessions.has(sessionId)) {
        this.logger.warn(`TTS Session ${sessionId} already exists. Stopping previous session.`);
        await this.stopSynthesis(sessionId);
      }

      const voice = options.voice || 'en-US-AriaNeural';
      const language = options.language || 'en-US';
      
      const sessionSpeechConfig = sdk.SpeechConfig.fromSubscription(
        this.configService.get<string>('AZURE_SPEECH_KEY'),
        this.configService.get<string>('AZURE_SPEECH_REGION')
      );
      sessionSpeechConfig.speechSynthesisVoiceName = voice;
      sessionSpeechConfig.speechSynthesisLanguage = language;
      sessionSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_SynthVoice, 'true');
      sessionSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_SynthOutputFormat, 
        sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3.toString());

      const pushStream = sdk.AudioOutputStream.createPullStream();
      const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStream);
      const synthesizer = new sdk.SpeechSynthesizer(sessionSpeechConfig, audioConfig);
      
      this.logger.log(`Created synthesizer for session ${sessionId} with voice: ${voice}`);
      
      this.synthesizers.set(sessionId, synthesizer);
      
      const session: TTSSession = {
        id: sessionId,
        text: text,
        voice: voice,
        language: language,
        startTime: new Date(),
        isActive: true,
        audioChunks: [],
        visemeData: [],
      };
      
      this.sessions.set(sessionId, session);

      this.setupSynthesizerEvents(synthesizer, sessionId, pushStream);

      const ssml = this.createSSML(text, options);
      synthesizer.speakSsmlAsync(ssml);

      this.logger.log(`Started TTS synthesis for session: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to start TTS synthesis for session ${sessionId}:`, error);
      throw error;
    }
  }

  async stopSynthesis(sessionId: string): Promise<TTSSession | undefined> {
    try {
      const session = this.sessions.get(sessionId);
      const synthesizer = this.synthesizers.get(sessionId);

      if (!session) {
        this.logger.warn(`TTS Session ${sessionId} not found`);
        return undefined;
      }

      if (synthesizer) {
        synthesizer.close();
        this.synthesizers.delete(sessionId);
      }
      
      session.isActive = false;
      
      this.logger.log(`Stopped TTS synthesis session: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error(`Error stopping TTS synthesis for session ${sessionId}:`, error);
      
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.synthesizers.delete(sessionId);
      }
      
      throw error;
    }
  }

  getSession(sessionId: string): TTSSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): TTSSession[] {
    return Array.from(this.sessions.values());
  }

  setOnAudioChunkCallback(callback: (sessionId: string, chunk: TTSAudioChunk) => void): void {
    this.onAudioChunkCallback = callback;
  }

  setOnVisemeDataCallback(callback: (sessionId: string, visemeData: VisemeData[]) => void): void {
    this.onVisemeDataCallback = callback;
  }

  setOnSynthesisCompleteCallback(callback: (sessionId: string) => void): void {
    this.onSynthesisCompleteCallback = callback;
  }

  private setupSynthesizerEvents(
    synthesizer: sdk.SpeechSynthesizer, 
    sessionId: string, 
    pushStream: sdk.PushAudioOutputStream
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error(`TTS Session ${sessionId} not found when setting up events`);
      return;
    }

    synthesizer.synthesizing = (s, e) => {
      try {
        this.logger.debug(`TTS Synthesizing event for session ${sessionId}, audio data length: ${e.result.audioData.byteLength}`);
        
        if (e.result.audioData.byteLength > 0) {
          const chunk: TTSAudioChunk = {
            audioData: e.result.audioData,
            duration: e.result.audioDuration,
          };
          
          session.audioChunks.push(chunk);
          
          if (this.onAudioChunkCallback) {
            this.onAudioChunkCallback(sessionId, chunk);
          }
        }
      } catch (error) {
        this.logger.error(`Error in TTS synthesizing event for session ${sessionId}:`, error);
      }
    };

    synthesizer.synthesisCompleted = (s, e) => {
      try {
        this.logger.debug(`TTS Synthesized event for session ${sessionId}, reason: ${e.result.reason}`);
        
        if (e.result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          this.logger.log(`TTS synthesis completed for session ${sessionId}`);
          
          if (this.onSynthesisCompleteCallback) {
            this.onSynthesisCompleteCallback(sessionId);
          }
        } else if (e.result.reason === sdk.ResultReason.Canceled) {
          const cancellationDetails = sdk.CancellationDetails.fromResult(e.result);
          this.logger.error(`TTS synthesis canceled for session ${sessionId}: ${cancellationDetails.reason}`);
          if (cancellationDetails.reason === sdk.CancellationReason.Error) {
            this.logger.error(`TTS synthesis error details: ${cancellationDetails.errorDetails}`);
          }
        }
      } catch (error) {
        this.logger.error(`Error in TTS synthesized event for session ${sessionId}:`, error);
      }
    };

    synthesizer.visemeReceived = (s, e) => {
      try {
        this.logger.debug(`TTS Viseme received for session ${sessionId}: ${e.animation}`);
        
        const visemeData: VisemeData = {
          id: e.visemeId,
          offset: e.audioOffset,
          animation: e.animation,
        };
        
        session.visemeData.push(visemeData);
        
        if (this.onVisemeDataCallback) {
          this.onVisemeDataCallback(sessionId, [visemeData]);
        }
      } catch (error) {
        this.logger.error(`Error in TTS viseme event for session ${sessionId}:`, error);
      }
    };
  }

  private createSSML(text: string, options: {
    voice?: string;
    language?: string;
    rate?: number;
    pitch?: number;
  }): string {
    const voice = options.voice || 'en-US-AriaNeural';
    const language = options.language || 'en-US';
    const rate = options.rate || 1.0;
    const pitch = options.pitch || 0;

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch > 0 ? '+' : ''}${pitch}%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
  }
}