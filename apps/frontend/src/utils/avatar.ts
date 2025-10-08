import * as THREE from 'three';
import { Group, Object3DEventMap } from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

const mixamoVRMRigMap = {
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  mixamorigLeftHandThumb1: "leftThumbMetacarpal",
  mixamorigLeftHandThumb2: "leftThumbProximal",
  mixamorigLeftHandThumb3: "leftThumbDistal",
  mixamorigLeftHandIndex1: "leftIndexProximal",
  mixamorigLeftHandIndex2: "leftIndexIntermediate",
  mixamorigLeftHandIndex3: "leftIndexDistal",
  mixamorigLeftHandMiddle1: "leftMiddleProximal",
  mixamorigLeftHandMiddle2: "leftMiddleIntermediate",
  mixamorigLeftHandMiddle3: "leftMiddleDistal",
  mixamorigLeftHandRing1: "leftRingProximal",
  mixamorigLeftHandRing2: "leftRingIntermediate",
  mixamorigLeftHandRing3: "leftRingDistal",
  mixamorigLeftHandPinky1: "leftLittleProximal",
  mixamorigLeftHandPinky2: "leftLittleIntermediate",
  mixamorigLeftHandPinky3: "leftLittleDistal",
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  mixamorigRightHandPinky1: "rightLittleProximal",
  mixamorigRightHandPinky2: "rightLittleIntermediate",
  mixamorigRightHandPinky3: "rightLittleDistal",
  mixamorigRightHandRing1: "rightRingProximal",
  mixamorigRightHandRing2: "rightRingIntermediate",
  mixamorigRightHandRing3: "rightRingDistal",
  mixamorigRightHandMiddle1: "rightMiddleProximal",
  mixamorigRightHandMiddle2: "rightMiddleIntermediate",
  mixamorigRightHandMiddle3: "rightMiddleDistal",
  mixamorigRightHandIndex1: "rightIndexProximal",
  mixamorigRightHandIndex2: "rightIndexIntermediate",
  mixamorigRightHandIndex3: "rightIndexDistal",
  mixamorigRightHandThumb1: "rightThumbMetacarpal",
  mixamorigRightHandThumb2: "rightThumbProximal",
  mixamorigRightHandThumb3: "rightThumbDistal",
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
};

export function convertFbxToVrmAnimation(animationGlb: Group<Object3DEventMap>, characterGlb: VRM) {
  const clip = animationGlb.animations[0];
  const asset = animationGlb;
  const vrm = characterGlb;

  const tracks: THREE.KeyframeTrack[] = [];

  if (asset.getObjectByName("mixamorigHips")) {

    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const _quatA = new THREE.Quaternion();
    const _quatB = new THREE.Quaternion();
    const _vec3 = new THREE.Vector3();

    // Adjust with reference to hips height.
    const motionHipsHeight = asset.getObjectByName("mixamorigHips")?.position.y;
    if (!motionHipsHeight) {
      throw new Error("Motion Hips Height not found");
    }
    const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode("hips")?.getWorldPosition(_vec3).y;
    if (!vrmHipsY) {
      throw new Error("VRM Hips Y not found");
    }
    const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
    const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
    const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

    clip.tracks.forEach((track: THREE.KeyframeTrack) => {
      const trackSplitted = track.name.split(".");
      const mixamoRigName = trackSplitted[0] as keyof typeof mixamoVRMRigMap;
      if (mixamoRigName == mixamoVRMRigMap.mixamorigHead) {
        return;
      }
      const vrmBoneName = mixamoVRMRigMap[mixamoRigName] as VRMHumanBoneName;
      const vrmNormalizedNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
      const vrmNormalizedNodeName = vrmNormalizedNode?.name;
      const vrmRawNode = vrm.humanoid.getRawBoneNode(vrmBoneName);
      const vrmRawNodeName = vrmRawNode?.name;
      const mixamoRigNode = asset.getObjectByName(mixamoRigName);

      if (vrmNormalizedNodeName != null) {
        const propertyName = trackSplitted[1];

        // Store rotations of rest-pose.
        mixamoRigNode?.getWorldQuaternion(restRotationInverse).invert();
        mixamoRigNode?.parent?.getWorldQuaternion(parentRestWorldRotation);

        if (track instanceof THREE.QuaternionKeyframeTrack) {

          const newTrackValues = new Float32Array(track.values.length);

          // Retarget rotation of mixamoRig to NormalizedBone.
          for (let i = 0; i < track.values.length; i += 4) {

            _quatA.fromArray(track.values, i);

            // World rotation when resting of parent * Track rotation * Inverse of world rotation when resting
            _quatA
              .premultiply(parentRestWorldRotation)
              .multiply(restRotationInverse);

            // Get VRMHumanoidRig
            // @ts-ignore
            const hr = vrm.humanoid._normalizedHumanBones;
            const parentWorldRotation = hr._parentWorldRotations[vrmBoneName];
            const invParentWorldRotation = _quatB.copy(parentWorldRotation).invert();
            const boneRotation = hr._boneRotations[vrmBoneName];

            _quatA
              .multiply(parentWorldRotation)
              .premultiply(invParentWorldRotation)
              .multiply(boneRotation);

            // Copy into the new array (to not mess up the original).
            _quatA.toArray(newTrackValues, i);
          }

          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${vrmRawNodeName}.${propertyName}`,
              track.times,
              newTrackValues.map((v, i) =>
                vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
              )
            )
          );

        } else if (track instanceof THREE.VectorKeyframeTrack) {

          const value = track.values.map(
            (v, i) =>
              (vrm.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
              hipsPositionScale
          );
          tracks.push(
            new THREE.VectorKeyframeTrack(
              `${vrmRawNodeName}.${propertyName}`,
              track.times,
              value
            )
          );
        }
      }
    });
  }

  return new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
}
