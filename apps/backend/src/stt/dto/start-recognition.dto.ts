import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum AudioFormat {
  PCM = 'pcm',
  WAV = 'wav',
  MP3 = 'mp3',
  FLAC = 'flac',
}

export enum Language {
  EN_US = 'en-US',
  EN_GB = 'en-GB',
  ES_ES = 'es-ES',
  FR_FR = 'fr-FR',
  DE_DE = 'de-DE',
  IT_IT = 'it-IT',
  PT_BR = 'pt-BR',
  RU_RU = 'ru-RU',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  ZH_CN = 'zh-CN',
}

export class StartRecognitionDto {
  @IsOptional()
  @IsEnum(AudioFormat)
  audioFormat?: AudioFormat = AudioFormat.PCM;

  @IsOptional()
  @IsEnum(Language)
  language?: Language = Language.EN_US;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
