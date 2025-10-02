import { VRM, VRMHumanBoneName, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useEffect, useRef, useState } from 'react';
import { Object3D } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const Avatar = () => {
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
    Extra: { value: 0, min: 0, max: 1 }
  })
  const { scene, camera } = useThree()
  const [gltf, setGltf] = useState<GLTF>()
  const [progress, setProgress] = useState<number>(0)
  const avatar = useRef<VRM>(null)
  const [bonesStore, setBones] = useState<{ [part: string]: Object3D | null }>({})

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

    if (avatar.current) {
      avatar.current.update(delta)
      const blinkDelay = 10
      const blinkFrequency = 3
      if (avatar.current.expressionManager) {
        if (Math.round(t * blinkFrequency) % blinkDelay === 0) {
          avatar.current.expressionManager.setValue('blink', 1 - Math.abs(Math.sin(t * blinkFrequency * Math.PI)))
        }
        avatar.current.expressionManager.setValue('neutral', controls.Neutral)
        avatar.current.expressionManager.setValue('angry', controls.Angry)
        avatar.current.expressionManager.setValue('relaxed', controls.Relaxed)
        avatar.current.expressionManager.setValue('happy', controls.Happy)
        avatar.current.expressionManager.setValue('sad', controls.Sad)
        avatar.current.expressionManager.setValue('Surprised', controls.Surprised)
        avatar.current.expressionManager.setValue('Extra', controls.Extra)
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
