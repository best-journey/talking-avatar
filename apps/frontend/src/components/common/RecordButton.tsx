import { IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';

export const RecordButton = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    // Here you would typically start/stop actual voice recording
    console.log(isRecording ? 'Stopping recording...' : 'Starting recording...');
  };

  return (
    <IconButton
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      size="lg"
      colorScheme="red"
      variant={isRecording ? 'solid' : 'outline'}
      position="absolute"
      bottom="20px"
      right="20px"
      zIndex={10}
      onClick={handleRecordToggle}
      bg={isRecording ? 'red.500' : 'white'}
      color={isRecording ? 'white' : 'red.500'}
      borderColor="red.500"
      borderWidth="2px"
      _hover={{
        bg: isRecording ? 'red.600' : 'red.50',
        transform: 'scale(1.05)',
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.2s"
      boxShadow="lg"
      borderRadius="50%"
      width="60px"
      height="60px"
    >
      {isRecording ? <FaStop /> : <FaMicrophone />}
    </IconButton>
  )
}
