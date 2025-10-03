import { VRM, VRMExpressionPresetName, VRMHumanBoneName, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useRef, useState } from 'react';
import { Object3D } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useSttContext } from '../../contexts/SttContext';
import { VisemeData } from '../../services/sttService';

interface AnimationData {
  preset: VRMExpressionPresetName | null;
  weight: number;
  startTime: number;
  duration: number;
  startValues: Record<VRMExpressionPresetName, number>;
}

const VISEME_TO_VRM: Record<number, [VRMExpressionPresetName | null, number]> = {
  0:  [null, 0],                         // silence/rest
  21: [null, 0],                         // P/B/M (closed)
  2:  [VRMExpressionPresetName.Aa, 1.0], // AA
  11: [VRMExpressionPresetName.Aa, 0.9], // AY
  9:  [VRMExpressionPresetName.Aa, 0.8], // AW
  6:  [VRMExpressionPresetName.Ih, 0.9], // IY/IH
  15: [VRMExpressionPresetName.Ih, 0.6], // S/Z
  16: [VRMExpressionPresetName.Ih, 0.6], // SH/CH/JH
  17: [VRMExpressionPresetName.Ih, 0.5], // TH/DH
  4:  [VRMExpressionPresetName.Ee, 0.8], // EH/EY
  1:  [VRMExpressionPresetName.Ee, 0.6], // AE/AH
  18: [VRMExpressionPresetName.Ee, 0.6], // F/V
  7:  [VRMExpressionPresetName.Ou, 0.8], // W/UW (pucker)
  8:  [VRMExpressionPresetName.Oh, 0.9], // OW
  3:  [VRMExpressionPresetName.Oh, 0.9], // AO
  10: [VRMExpressionPresetName.Oh, 0.8], // OY
  13: [VRMExpressionPresetName.Oh, 0.4], // R
  14: [VRMExpressionPresetName.Ee, 0.5], // L
  19: [VRMExpressionPresetName.Ih, 0.5], // D/T/N
  20: [VRMExpressionPresetName.Oh, 0.6], // K/G/NG
};

const VOWELS = [
  VRMExpressionPresetName.Aa,
  VRMExpressionPresetName.Ih,
  VRMExpressionPresetName.Ou,
  VRMExpressionPresetName.Ee,
  VRMExpressionPresetName.Oh,
];

function createAnimationDataFromVisemes(
  events: VisemeData[],
  startTime: number,
  crossfadeMs = 100
): AnimationData[] {
  const sorted = [...events].sort((a, b) => a.offset - b.offset);
  const animations: AnimationData[] = [];

  for (const ev of sorted) {
    const ms = ev.offset / 10_000; // ticks -> ms
    const [preset, weight] = VISEME_TO_VRM[ev.id] ?? [null, 0];
    const animationStartTime = startTime + ms;

    animations.push({
      preset,
      weight,
      startTime: animationStartTime,
      duration: crossfadeMs,
      startValues: {} as Record<VRMExpressionPresetName, number>, // Will be filled when animation starts
    });
  }

  return animations;
}

export const Avatar = () => {
  const { sttService } = useSttContext();

  const { ...controls } = useControls({
    Head: { value: 0, min: -0.4, max: 0.4 },
    leftArm: { value: 0, min: -0.4, max: 0.4 },
    rightArm: { value: 0, min: -0.4, max: 0.4 },
    Neutral: { value: 0, min: 0, max: 1 },
    Angry: { value: 0, min: 0, max: 1 },
    Relaxed: { value: 0, min: 0, max: 1 },
    Happy: { value: 0, min: 0, max: 1 },
    Sad: { value: 0, min: 0, max: 1 },
    Surprised: { value: 0, min: 0, max: 1 },
    Extra: { value: 0, min: 0, max: 1 },
  })
  const { scene, camera } = useThree()
  const [gltf, setGltf] = useState<GLTF>()
  const [progress, setProgress] = useState<number>(0)
  const avatar = useRef<VRM>(null)
  const [bonesStore, setBones] = useState<{ [part: string]: Object3D | null }>({})
  const animationQueue = useRef<AnimationData[]>([])
  const lastVisemeTime = useRef<number>(0)

  const handleVisemeData = (visemeData: VisemeData[]) => {
    if (avatar.current && visemeData.length > 0) {
      const currentTime = performance.now();
      const animations = createAnimationDataFromVisemes(visemeData, currentTime);
      
      animationQueue.current.push(...animations);
      lastVisemeTime.current = currentTime;
    }
  }

  useEffect(() => {
    if (sttService) {
      sttService.setOnVisemeDataCallback(handleVisemeData);
    }
  }, [sttService])

  useEffect(() => {
    if (!gltf) {
      const loader = new GLTFLoader()
      loader.register((parser: any) => {
        return new VRMLoaderPlugin(parser)
      })

      loader.load(
        '/three-vrm-girl.vrm',
        (gltf: any) => {
          setGltf(gltf)
          const vrm: VRM = gltf.userData.vrm
          avatar.current = vrm
          vrm.lookAt!.target = camera

          vrm.humanoid!.getNormalizedBoneNode(VRMHumanBoneName.Hips)!.rotation.y = Math.PI

          const bones = {
            head: vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head),
            neck: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Neck),
            hips: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Hips),
            spine: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.Spine),
            upperChest: vrm.humanoid.getRawBoneNode(VRMHumanBoneName.UpperChest),
            leftArm: vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm),
            rightArm: vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm)
          }

          setBones(bones)
        },
        (xhr: any) => {
          setProgress((xhr.loaded / xhr.total) * 100)
        },
        (error: any) => {
          console.error('Error loading VRM model:', error)
        }
      )
    }
  }, [scene, gltf, camera])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const currentTime = performance.now()

    if (avatar.current) {
      avatar.current.update(delta)
      
      if (avatar.current.expressionManager) {
        const em = avatar.current.expressionManager;
        const queue = animationQueue.current;
        
        for (let i = queue.length - 1; i >= 0; i--) {
          const animation = queue[i];
          
          if (currentTime >= animation.startTime) {
            if (Object.keys(animation.startValues).length === 0) {
              animation.startValues = Object.fromEntries(
                VOWELS.map(p => [p, em.getValue(p) ?? 0])
              ) as Record<VRMExpressionPresetName, number>;
            }
            
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(1, elapsed / animation.duration);
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            for (const vowel of VOWELS) {
              const target = (animation.preset === vowel) ? animation.weight : 0;
              const startValue = animation.startValues[vowel] ?? 0;
              const currentValue = startValue + (target - startValue) * ease;
              em.setValue(vowel, currentValue);
            }
            
            if (progress >= 1) {
              queue.splice(i, 1);
            }
          }
        }
        
        const blinkDelay = 10
        const blinkFrequency = 3
        if (Math.round(t * blinkFrequency) % blinkDelay === 0) {
          em.setValue('blink', 1 - Math.abs(Math.sin(t * blinkFrequency * Math.PI)))
        }
        
        em.setValue('neutral', controls.Neutral)
        em.setValue('angry', controls.Angry)
        em.setValue('relaxed', controls.Relaxed)
        em.setValue('happy', controls.Happy)
        em.setValue('sad', controls.Sad)
        em.setValue('Surprised', controls.Surprised)
        em.setValue('Extra', controls.Extra)
      }
    }
    if (bonesStore.neck) {
      bonesStore.neck.rotation.y = (Math.PI / 100) * Math.sin((t / 4) * Math.PI)
    }

    if (bonesStore.upperChest) {
      bonesStore.upperChest.rotation.y = (Math.PI / 600) * Math.sin((t / 8) * Math.PI)
      bonesStore.spine!.position.y = (Math.PI / 400) * Math.sin((t / 2) * Math.PI)
      bonesStore.spine!.position.z = (Math.PI / 600) * Math.sin((t / 2) * Math.PI)
    }
    if (bonesStore.head) {
      bonesStore.head.rotation.y = controls.Head * Math.PI
    }

    if (bonesStore.leftArm) {
      bonesStore.leftArm.rotation.z = controls.leftArm * Math.PI
    }
    if (bonesStore.rightArm) {
      bonesStore.rightArm.rotation.z = controls.rightArm * Math.PI
    }
  })
  return (
    <>
      {gltf ? (
        <>
          <primitive object={gltf.scene} />
        </>
      ) : (
        <Html center>{progress} % loaded</Html>
      )}
    </>
  )
}
