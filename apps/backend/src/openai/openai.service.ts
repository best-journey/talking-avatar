import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private isInitialized = false;
  private readonly sessions = new Map<string, ChatSession>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';

      if (!apiKey) {
        this.logger.warn('OpenAI API key not configured. Chat functionality will be limited.');
        return;
      }

      this.openai = new OpenAI({
        apiKey: apiKey,
      });

      this.isInitialized = true;
      this.logger.log(`OpenAI service initialized with model: ${model}`);
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI service:', error);
      this.isInitialized = false;
    }
  }

  async generateResponse(text: string, sessionId: string): Promise<ChatMessage> {
    if (!this.isInitialized || !this.openai) {
      throw new Error('OpenAI service not properly initialized. Please check your configuration.');
    }

    try {
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.sessions.set(sessionId, session);
      }

      const userMessage: ChatMessage = {
        id: `${sessionId}-user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
        sessionId,
      };
      session.messages.push(userMessage);

      const messages = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      const assistantMessage: ChatMessage = {
        id: `${sessionId}-assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        sessionId,
      };
      session.messages.push(assistantMessage);
      session.updatedAt = new Date();

      this.logger.log(`Generated response for session ${sessionId}: ${assistantContent.substring(0, 100)}...`);
      return assistantMessage;
    } catch (error) {
      this.logger.error(`Error generating response for session ${sessionId}:`, error);
      throw error;
    }
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.logger.log(`Cleared session: ${sessionId}`);
  }

  clearAllSessions(): void {
    this.sessions.clear();
    this.logger.log('Cleared all chat sessions');
  }
}
