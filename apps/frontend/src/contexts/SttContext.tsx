import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SttService, RecognitionResult, ChatMessage, OpenAIResponse } from '../services/sttService';

interface SttContextType {
  isConnected: boolean;
  isRecording: boolean;
  isRecognizing: boolean;
  currentSessionId: string | null;
  results: RecognitionResult[];
  chatMessages: ChatMessage[];
  error: string | null;
  startRecognition: () => Promise<void>;
  stopRecognition: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearResults: () => void;
  clearChatMessages: () => void;
  clearError: () => void;
}

const SttContext = createContext<SttContextType | undefined>(undefined);

interface SttProviderProps {
  children: ReactNode;
  apiUrl?: string;
}

export function SttProvider({ children, apiUrl }: SttProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sttService, setSttService] = useState<SttService | null>(null);

  useEffect(() => {
    const initializeStt = async () => {
      try {
        const service = new SttService(apiUrl);
        setSttService(service);
        
        service.setOnRecognitionResultCallback((result: RecognitionResult) => {
          setResults(prev => [...prev, result]);
          
          if (result.isFinal && result.text.trim()) {
            const userMessage: ChatMessage = {
              id: result.id,
              role: 'user',
              content: result.text,
              timestamp: result.timestamp,
              sessionId: result.sessionId,
            };
            setChatMessages(prev => [...prev, userMessage]);
          }
        });

        service.setOnOpenAIResponseCallback((response: OpenAIResponse) => {
          setChatMessages(prev => [...prev, response.response]);
        });

        service.onRecognitionError((error: any) => {
          setError(error.message || 'Recognition error occurred');
          setIsRecognizing(false);
        });

        service.onAudioChunkReceived((data: any) => {
          console.log('Audio chunk received:', data);
        });

        await service.connect();
        setIsConnected(true);
        console.log('STT service connected successfully');
      } catch (err) {
        console.error('Failed to initialize STT service:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to STT service');
      }
    };

    initializeStt();

    return () => {
      if (sttService) {
        sttService.removeAllListeners();
        sttService.disconnect();
      }
    };
  }, [apiUrl]);

  const startRecognition = async () => {
    if (!sttService || !isConnected) {
      throw new Error('STT service not connected');
    }

    try {
      setError(null);
      setIsRecognizing(true);
      const sessionId = await sttService.startRecognition({
        language: 'en-US',
        audioFormat: 'pcm',
      });
      setCurrentSessionId(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
      setIsRecognizing(false);
    }
  };

  const stopRecognition = async () => {
    if (!sttService || !currentSessionId) {
      throw new Error('No active recognition session');
    }

    try {
      setError(null);
      const finalResults = await sttService.stopRecognition();
      if (finalResults) {
        setResults(prev => [...prev, ...finalResults]);
      }
      setIsRecognizing(false);
      setCurrentSessionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recognition');
      setIsRecognizing(false);
    }
  };

  const startRecording = async () => {
    if (!sttService) {
      throw new Error('STT service not available');
    }

    try {
      setError(null);
      await sttService.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (sttService) {
      sttService.stopRecording();
      setIsRecording(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const clearChatMessages = () => {
    setChatMessages([]);
  };

  const clearError = () => {
    setError(null);
  };

  const value: SttContextType = {
    isConnected,
    isRecording,
    isRecognizing,
    currentSessionId,
    results,
    chatMessages,
    error,
    startRecognition,
    stopRecognition,
    startRecording,
    stopRecording,
    clearResults,
    clearChatMessages,
    clearError,
  };

  return (
    <SttContext.Provider value={value}>
      {children}
    </SttContext.Provider>
  );
}

export function useSttContext(): SttContextType {
  const context = useContext(SttContext);
  if (context === undefined) {
    throw new Error('useSttContext must be used within a SttProvider');
  }
  return context;
}
