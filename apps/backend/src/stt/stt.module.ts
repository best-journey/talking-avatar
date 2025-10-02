import { Module } from '@nestjs/common';
import { SttController } from './stt.controller';
import { SttService } from './stt.service';
import { SttGateway } from './stt.gateway';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  controllers: [SttController],
  providers: [SttService, SttGateway],
  exports: [SttService],
})
export class SttModule {}
