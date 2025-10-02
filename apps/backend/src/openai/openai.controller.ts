import { Controller, Post, Get, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService, ChatMessage, ChatSession } from './openai.service';
import { GenerateResponseDto } from './dto/generate-response.dto';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Post('generate')
  async generateResponse(@Body() generateResponseDto: GenerateResponseDto): Promise<ChatMessage> {
    try {
      const sessionId = generateResponseDto.sessionId || `session_${Date.now()}`;
      const response = await this.openaiService.generateResponse(
        generateResponseDto.text,
        sessionId
      );
      return response;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate response',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string): Promise<ChatSession> {
    try {
      const session = this.openaiService.getSession(sessionId);
      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: 'Session not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return session;
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
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const sessions = this.openaiService.getAllSessions();
      return sessions;
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

  @Delete('session/:sessionId')
  async clearSession(@Param('sessionId') sessionId: string): Promise<{ message: string }> {
    try {
      this.openaiService.clearSession(sessionId);
      return { message: `Session ${sessionId} cleared successfully` };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to clear session',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('sessions')
  async clearAllSessions(): Promise<{ message: string }> {
    try {
      this.openaiService.clearAllSessions();
      return { message: 'All sessions cleared successfully' };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to clear sessions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
