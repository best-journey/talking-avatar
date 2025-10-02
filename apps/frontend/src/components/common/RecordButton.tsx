import { IconButton, Box, Text, VStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { useSttContext } from '../../contexts/SttContext';
import { toaster } from '../ui/toaster';

export const RecordButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    isConnected,
    isRecording,
    isRecognizing,
    results,
    error,
    startRecognition,
    stopRecognition,
    startRecording,
    stopRecording,
    clearError,
  } = useSttContext();

  useEffect(() => {
    if (error) {
      toaster.error({
        title: 'STT Error',
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (isConnected) {
      toaster.success({
        title: 'STT Connected',
        description: 'Speech-to-text service is ready',
      });
    }
  }, [isConnected]);

  const handleRecordToggle = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (isRecording) {
        stopRecording();
        await stopRecognition();
        toaster.info({
          title: 'Recording Stopped',
          description: `Captured ${results.length} recognition results`,
        });
      } else {
        await startRecognition();
        await startRecording();
        toaster.success({
          title: 'Recording Started',
          description: 'Speak clearly into your microphone',
        });
      }
    } catch (err) {
      toaster.error({
        title: 'Recording Error',
        description: err instanceof Error ? err.message : 'Failed to toggle recording',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isActive = isRecording || isRecognizing;

  return (
    <Box position="absolute" bottom="20px" right="20px" zIndex={10}>
      <VStack gap={2} align="center">
        <Box
          bg={isConnected ? 'green.500' : 'red.500'}
          color="white"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
          fontWeight="bold"
        >
          {isConnected ? 'STT Connected' : 'STT Disconnected'}
        </Box>

        {results.length > 0 && (
          <Box
            bg="blue.500"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
          >
            {results.length} results
          </Box>
        )}

        <IconButton
          aria-label={isActive ? 'Stop recording' : 'Start recording'}
          size="lg"
          colorScheme="red"
          variant={isActive ? 'solid' : 'outline'}
          onClick={handleRecordToggle}
          loading={isProcessing}
          disabled={!isConnected}
          bg={isActive ? 'red.500' : 'white'}
          color={isActive ? 'white' : 'red.500'}
          borderColor="red.500"
          borderWidth="2px"
          _hover={{
            bg: isActive ? 'red.600' : 'red.50',
            transform: 'scale(1.05)',
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none',
          }}
          transition="all 0.2s"
          boxShadow="lg"
          borderRadius="50%"
          width="60px"
          height="60px"
        >
          {isActive ? <FaStop /> : <FaMicrophone />}
        </IconButton>

        <Text fontSize="xs" color="gray.600" textAlign="center" maxW="100px">
          {isProcessing ? 'Processing...' : 
           isActive ? 'Recording...' : 
           isConnected ? 'Click to record' : 'Connecting...'}
        </Text>
      </VStack>
    </Box>
  );
};
