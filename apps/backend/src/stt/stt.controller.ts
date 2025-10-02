import { Controller, Post, Get, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SttService } from './stt.service';
import { StartRecognitionDto } from './dto/start-recognition.dto';
import { AudioChunkDto } from './dto/audio-chunk.dto';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post('start')
  async startRecognition(@Body() startRecognitionDto: StartRecognitionDto) {
    try {
      const sessionId = startRecognitionDto.sessionId || `session_${Date.now()}`;
      const session = await this.sttService.startRecognition(sessionId, startRecognitionDto);
      return {
        success: true,
        session,
        message: 'Recognition started successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to start recognition',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('audio/:sessionId')
  async processAudioChunk(
    @Param('sessionId') sessionId: string,
    @Body() audioChunkDto: AudioChunkDto,
  ) {
    try {
      await this.sttService.processAudioChunk(sessionId, audioChunkDto.audioData);
      return {
        success: true,
        message: 'Audio chunk processed successfully',
        sessionId,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process audio chunk',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('stop/:sessionId')
  async stopRecognition(@Param('sessionId') sessionId: string) {
    try {
      const results = await this.sttService.stopRecognition(sessionId);
      return {
        success: true,
        sessionId,
        results,
        message: 'Recognition stopped successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to stop recognition',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    try {
      const session = this.sttService.getSession(sessionId);
      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: 'Session not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        session,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get session',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions')
  async getAllSessions() {
    try {
      const sessions = this.sttService.getAllSessions();
      return {
        success: true,
        sessions,
        count: sessions.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get sessions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
