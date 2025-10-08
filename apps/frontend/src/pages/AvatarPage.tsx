import { Box } from '@chakra-ui/react';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Avatar } from '../components/common/Avatar';
import { RecordButton } from '../components/common/RecordButton';
import { ChatDisplay } from '../components/common/ChatDisplay';

export const AvatarPage = () => {
  return (
    <Box h="100vh" w="100vw" position="relative">
      <Canvas camera={{ position: [0, 1.4, -0.8] }}>
        <ambientLight intensity={0.65} />
        <spotLight position={[0, 2, -1]} intensity={0.4} />
        <Suspense fallback={null}>
          <Avatar />
        </Suspense>
        <OrbitControls
          target={[0, 1.2, 0]}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>

      <ChatDisplay />
      <RecordButton />
    </Box>
  )
}
