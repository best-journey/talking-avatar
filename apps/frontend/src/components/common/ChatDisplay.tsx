import { Box, Text, FlexProps, Flex, useBreakpointValue } from '@chakra-ui/react';
import { FC } from 'react';
import { useSttContext } from '../../contexts/SttContext';

export const ChatDisplay: FC<FlexProps> = (props) => {
  const { chatMessages } = useSttContext();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayMessages = isMobile ? chatMessages.slice(-6) : chatMessages;

  return (
    <Flex
      position="fixed"
      zIndex={10}
      inset={0}
      direction="column-reverse"
      overflowY="auto"
      {...props}
    >
      <Flex
        p={4}
        mt="auto"
        direction="column"
        align="flex-end"
        gap={2}
      >
        {displayMessages.map((message) => (
          <Box
            key={message.id}
            maxW="320px"
            bg={message.role === 'user' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
            color={message.role === 'user' ? 'white' : 'gray.800'}
            p={{ base: 2, md: 3 }}
            rounded={message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
            shadow="0 2px 8px rgba(0,0,0,0.15)"
            border={message.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.2)'}
            opacity={0.8}
          >
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              wordBreak="break-word"
            >
              {message.content}
            </Text>
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              textAlign="right"
            >
              {formatTime(message.timestamp)}
            </Text>
          </Box>
        ))}
      </Flex>
    </Flex>
  );
};
