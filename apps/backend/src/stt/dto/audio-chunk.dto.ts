import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AudioChunkDto {
  @IsString()
  @IsNotEmpty()
  audioData: ArrayBuffer;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  chunkId?: string;
}
