import React, { useRef, useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
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
      maxWidth="400px"
      zIndex={10}
    >
      {chatMessages.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Text color="gray.500" fontSize="sm" opacity={0.7}>
            Start speaking to begin a conversation
          </Text>
        </Box>
      ) : (
        chatMessages.map((message) => (
          <Flex
            key={message.id}
            align="flex-start"
            gap={2}
            justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
            mb={3}
            px={2}
          >
            <Box
              maxW="85%"
              bg={message.role === 'user' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
              color={message.role === 'user' ? 'white' : 'gray.800'}
              p={3}
              borderRadius={message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
              boxShadow="0 2px 8px rgba(0,0,0,0.15)"
              backdropFilter="blur(10px)"
              border={message.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.2)'}
              fontSize="sm"
              wordBreak="break-word"
              lineHeight="1.4"
              opacity={0.8}
            >
              <Text fontSize="sm" wordBreak="break-word">
                {message.content}
              </Text>
              <Text
                fontSize="xs"
                opacity={0.6}
                mt={1}
                textAlign="right"
              >
                {formatTime(message.timestamp)}
              </Text>
            </Box>
          </Flex>
        ))
      )}

      <div ref={messagesEndRef} />
    </Box>
  );
};
