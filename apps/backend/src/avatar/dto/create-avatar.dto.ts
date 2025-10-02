import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateAvatarDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  voiceSettings?: {
    pitch: number;
    speed: number;
    volume: number;
  };
}
