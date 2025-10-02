export interface RecognitionResult {
  id: string;
  text: string;
  confidence: number;
  offset: number;
  duration: number;
  sessionId: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface RecognitionError {
  code: string;
  message: string;
  sessionId: string;
  timestamp: Date;
}

export interface RecognitionSession {
  id: string;
  language: string;
  audioFormat: string;
  startTime: Date;
  isActive: boolean;
  results: RecognitionResult[];
}
