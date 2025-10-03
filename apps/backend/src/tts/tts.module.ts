import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TTSService } from './tts.service';

@Module({
  imports: [ConfigModule],
  providers: [TTSService],
  exports: [TTSService],
})
export class TTSModule {}