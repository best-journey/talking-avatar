import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SttService } from './stt.service';
import { StartRecognitionDto } from './dto/start-recognition.dto';
import { AudioChunkDto } from './dto/audio-chunk.dto';
import { RecognitionResult, RecognitionError } from './entities/recognition-result.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/stt',
})
export class SttGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SttGateway.name);
  private readonly clientSessions = new Map<string, string>();

  constructor(private readonly sttService: SttService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const sessionId = this.clientSessions.get(client.id);
    if (sessionId) {
      this.stopRecognition(client, sessionId);
      this.clientSessions.delete(client.id);
    }
  }

  @SubscribeMessage('start_recognition')
  async handleStartRecognition(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StartRecognitionDto,
  ) {
    try {
      const sessionId = data.sessionId || `session_${client.id}_${Date.now()}`;
      
      this.clientSessions.set(client.id, sessionId);
      
      const session = await this.sttService.startRecognition(sessionId, data);
      
      client.emit('recognition_started', {
        sessionId: session.id,
        message: 'Recognition started successfully',
      });
      
      this.logger.log(`Started recognition for client ${client.id}, session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error starting recognition for client ${client.id}:`, error);
      client.emit('recognition_error', {
        code: 'START_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AudioChunkDto,
  ) {
    try {
      const sessionId = this.clientSessions.get(client.id) || data.sessionId;
      
      if (!sessionId) {
        throw new Error('No active session found');
      }

      await this.sttService.processAudioChunk(sessionId, data.audioData);
      
      client.emit('audio_chunk_received', {
        chunkId: data.chunkId,
        sessionId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error processing audio chunk for client ${client.id}:`, error);
      client.emit('recognition_error', {
        code: 'AUDIO_CHUNK_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('stop_recognition')
  async handleStopRecognition(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId?: string },
  ) {
    try {
      const sessionId = this.clientSessions.get(client.id) || data.sessionId;
      
      if (!sessionId) {
        throw new Error('No active session found');
      }

      const results = await this.sttService.stopRecognition(sessionId);
      
      client.emit('recognition_stopped', {
        sessionId,
        results,
        message: 'Recognition stopped successfully',
      });
      
      this.clientSessions.delete(client.id);
      
      this.logger.log(`Stopped recognition for client ${client.id}, session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error stopping recognition for client ${client.id}:`, error);
      client.emit('recognition_error', {
        code: 'STOP_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('get_session_status')
  async handleGetSessionStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId?: string },
  ) {
    try {
      const sessionId = this.clientSessions.get(client.id) || data.sessionId;
      
      if (!sessionId) {
        throw new Error('No active session found');
      }

      const session = this.sttService.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      client.emit('session_status', {
        sessionId,
        session,
      });
    } catch (error) {
      this.logger.error(`Error getting session status for client ${client.id}:`, error);
      client.emit('recognition_error', {
        code: 'STATUS_ERROR',
        message: error.message,
      });
    }
  }

  emitRecognitionResult(clientId: string, result: RecognitionResult) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit('recognition_result', result);
    }
  }

  emitRecognitionError(clientId: string, error: RecognitionError) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit('recognition_error', error);
    }
  }

  private async stopRecognition(client: Socket, sessionId: string) {
    try {
      await this.sttService.stopRecognition(sessionId);
    } catch (error) {
      this.logger.error(`Error cleaning up session ${sessionId}:`, error);
    }
  }
}
