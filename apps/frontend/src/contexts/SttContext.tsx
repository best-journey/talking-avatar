import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { SttService, RecognitionResult, ChatMessage, OpenAIResponse, TTSAudioChunk, VisemeData, TTSSynthesisComplete } from '../services/sttService';

interface SttContextType {
  sttService: SttService | null;
  isConnected: boolean;
  isRecording: boolean;
  isRecognizing: boolean;
  currentSessionId: string | null;
  results: RecognitionResult[];
  chatMessages: ChatMessage[];
  visemeData: VisemeData[];
  isPlayingTTS: boolean;
  error: string | null;
  startRecognition: () => Promise<void>;
  stopRecognition: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearResults: () => void;
  clearChatMessages: () => void;
  clearError: () => void;
  playTTSAudio: () => void;
  pauseTTSAudio: () => void;
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
  const [visemeData, setVisemeData] = useState<VisemeData[]>([]);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sttService, setSttService] = useState<SttService | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer[]>([]);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

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

        service.setOnTTSAudioChunkCallback((chunk: TTSAudioChunk) => {
          handleTTSAudioChunk(chunk);
        });

        service.setOnVisemeDataCallback((visemeData: VisemeData[]) => {
          setVisemeData(prev => [...prev, ...visemeData]);
        });

        service.setOnTTSSynthesisCompleteCallback((_: TTSSynthesisComplete) => {
          console.log('TTS synthesis completed');
          setIsPlayingTTS(false);
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

  const handleTTSAudioChunk = async (chunk: TTSAudioChunk) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const binaryString = atob(chunk.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      audioBufferRef.current.push(audioBuffer);

      if (audioBufferRef.current.length === 1) {
        playTTSAudio();
      }
    } catch (error) {
      console.error('Error handling TTS audio chunk:', error);
    }
  };

  const playTTSAudio = () => {
    if (!audioContextRef.current || audioBufferRef.current.length === 0) {
      return;
    }

    setIsPlayingTTS(true);
    
    const playNextBuffer = (index: number) => {
      if (index >= audioBufferRef.current.length) {
        audioBufferRef.current = [];
        setIsPlayingTTS(false);
        return;
      }

      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBufferRef.current[index];
      source.connect(audioContextRef.current!.destination);
      
      currentAudioSourceRef.current = source;
      
      source.onended = () => {
        playNextBuffer(index + 1);
      };
      
      source.start();
    };

    playNextBuffer(0);
  };

  const pauseTTSAudio = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current = null;
    }
    setIsPlayingTTS(false);
  };

  const value: SttContextType = {
    sttService,
    isConnected,
    isRecording,
    isRecognizing,
    currentSessionId,
    results,
    chatMessages,
    visemeData,
    isPlayingTTS,
    error,
    startRecognition,
    stopRecognition,
    startRecording,
    stopRecording,
    clearResults,
    clearChatMessages,
    clearError,
    playTTSAudio,
    pauseTTSAudio,
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
