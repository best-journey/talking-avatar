import { io, Socket } from 'socket.io-client';

export interface RecognitionResult {
  id: string;
  text: string;
  confidence: number;
  offset: number;
  duration: number;
  sessionId: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface RecognitionSession {
  id: string;
  language: string;
  audioFormat: string;
  startTime: Date;
  isActive: boolean;
  results: RecognitionResult[];
}

export interface SttConfig {
  language?: string;
  audioFormat?: string;
  sessionId?: string;
}

export class SttService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentSessionId: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private chunkId = 0;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;

  constructor(private apiUrl: string = 'http://localhost:3000') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(`${this.apiUrl}/stt`, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to STT service');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Disconnected from STT service');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.stopRecording();
  }

  async startRecognition(config: SttConfig = {}): Promise<string> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to STT service');
    }

    const sessionId = config.sessionId || `session_${Date.now()}`;
    this.currentSessionId = sessionId;

    return new Promise((resolve, reject) => {
      this.socket!.emit('start_recognition', {
        language: config.language || 'en-US',
        audioFormat: config.audioFormat || 'pcm',
        sessionId,
      });

      this.socket!.once('recognition_started', (data) => {
        console.log('Recognition started:', data);
        resolve(data.sessionId);
      });

      this.socket!.once('recognition_error', (error) => {
        console.error('Recognition start error:', error);
        reject(new Error(error.message));
      });
    });
  }

  async startRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      await audioContext.audioWorklet.addModule("/audio-processor.js");

      const source = audioContext.createMediaStreamSource(this.audioStream);
      const workletNode = new AudioWorkletNode(audioContext, "pcm-worklet");

      workletNode.port.onmessage = (event) => {
        const pcm = new Uint8Array(event.data);
        this.sendAudioChunk(pcm.buffer);
      }
      
      source.connect(workletNode)
      workletNode.connect(audioContext.destination)
      
      this.audioContext = audioContext;
      this.workletNode = workletNode;
      
      console.log('Recording started with raw PCM audio');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.workletNode) {
      this.workletNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    this.mediaRecorder = null;
    console.log('Recording stopped');
  }

  async stopRecognition(): Promise<RecognitionResult[]> {
    if (!this.isConnected || !this.socket || !this.currentSessionId) {
      throw new Error('No active recognition session');
    }

    this.stopRecording();

    return new Promise((resolve, reject) => {
      this.socket!.emit('stop_recognition', {
        sessionId: this.currentSessionId,
      });

      this.socket!.once('recognition_stopped', (data) => {
        console.log('Recognition stopped:', data);
        this.currentSessionId = null;
        resolve(data.results);
      });

      this.socket!.once('recognition_error', (error) => {
        console.error('Recognition stop error:', error);
        reject(new Error(error.message));
      });
    });
  }

  private async sendAudioChunk(audioData: string): Promise<void> {
    if (!this.isConnected || !this.socket || !this.currentSessionId) {
      return;
    }

    try {
      this.socket!.emit('audio_chunk', {
        audioData: audioData,
        sessionId: this.currentSessionId,
        chunkId: this.chunkId++,
      });
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  }

  onRecognitionResult(callback: (result: RecognitionResult) => void): void {
    if (this.socket) {
      this.socket.on('recognition_result', callback);
    }
  }

  onRecognitionError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('recognition_error', callback);
    }
  }

  onAudioChunkReceived(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('audio_chunk_received', callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
