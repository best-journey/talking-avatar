import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MinLength, Min, Max } from 'class-validator';

export class CreateAvatarDto {
  @ApiProperty({ example: 'My Talking Avatar' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'A friendly avatar that can talk', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ 
    example: { pitch: 1.0, speed: 1.0, volume: 0.8 },
    required: false,
    description: 'Voice settings for the avatar'
  })
  @IsOptional()
  voiceSettings?: {
    pitch: number;
    speed: number;
    volume: number;
  };
}
