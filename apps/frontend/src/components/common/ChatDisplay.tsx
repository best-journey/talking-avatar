import React, { useRef, useEffect } from 'react';
import { Box, Text, VStack, HStack, Avatar, Badge } from '@chakra-ui/react';
import { useSttContext } from '../../contexts/SttContext';

interface ChatDisplayProps {
  className?: string;
}

export const ChatDisplay: React.FC<ChatDisplayProps> = ({ className = '' }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { chatMessages } = useSttContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box
      className={`chat-display ${className}`}
      position="absolute"
      left="20px"
      top="20px"
      width="350px"
      height="500px"
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Box
        bg="blue.500"
        color="white"
        p={3}
        borderRadius="lg 0 0 0"
        fontWeight="bold"
        fontSize="sm"
      >
        <HStack justify="space-between">
          <Text>Chat Assistant</Text>
          <Badge colorScheme="green" variant="solid">
            {chatMessages.length} messages
          </Badge>
        </HStack>
      </Box>

      <Box
        flex="1"
        overflowY="auto"
        p={3}
        bg="gray.50"
      >
        <VStack gap={3} align="stretch">
          {chatMessages.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500" fontSize="sm">
                Start speaking to begin a conversation
              </Text>
            </Box>
          ) : (
            chatMessages.map((message) => (
              <HStack
                key={message.id}
                align="flex-start"
                gap={2}
                justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                {message.role === 'assistant' && (
                  <Avatar.Root
                    size="sm"
                    bg="blue.500"
                    color="white"
                  >
                    <Avatar.Image src="https://github.com/shadcn.png" />
                    <Avatar.Fallback>AI Assistant</Avatar.Fallback>
                  </Avatar.Root>
                )}
                
                <Box
                  maxW="80%"
                  bg={message.role === 'user' ? 'blue.500' : 'white'}
                  color={message.role === 'user' ? 'white' : 'black'}
                  p={2}
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text fontSize="sm" wordBreak="break-word">
                    {message.content}
                  </Text>
                  <Text
                    fontSize="xs"
                    opacity={0.7}
                    mt={1}
                    textAlign="right"
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </Box>

                {message.role === 'user' && (
                  <Avatar.Root
                    size="sm"
                    bg="green.500"
                    color="white"
                  >
                    <Avatar.Image src="https://github.com/shadcn.png" />
                    <Avatar.Fallback>You</Avatar.Fallback>
                  </Avatar.Root>
                )}
              </HStack>
            ))
          )}

          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box
        bg="gray.100"
        p={2}
        borderTop="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="xs" color="gray.600" textAlign="center">
          Powered by OpenAI GPT-3.5
        </Text>
      </Box>
    </Box>
  );
};
