import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateResponseDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
