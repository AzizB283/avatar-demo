import React, { useRef, useEffect, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useVoice } from "@/hook/useVoice";

// const visemeToMorphMap = {
//   0: "viseme_sil", // Silence
//   1: "viseme_PP", // æ, ə, ʌ (mapped to bilabial sounds)
//   2: "viseme_aa", // ɑ
//   3: "viseme_O", // ɔ
//   4: "viseme_E", // ɛ, ʊ
//   5: "viseme_U", // ɝ
//   6: "viseme_I", // j, i, ɪ
//   7: "viseme_U", // w, u
//   8: "viseme_O", // o
//   9: "viseme_aa", // aʊ
//   10: "viseme_O", // ɔɪ
//   11: "viseme_I", // aɪ
//   12: "viseme_PP", // h (approximated with bilabial)
//   13: "viseme_RR", // ɹ
//   14: "viseme_nn", // l (approximated with alveolar sounds)
//   15: "viseme_SS", // s, z
//   16: "viseme_CH", // ʃ, tʃ, dʒ, ʒ
//   17: "viseme_TH", // ð
//   18: "viseme_FF", // f, v
//   19: "viseme_DD", // d, t, n, θ (alveolar sounds)
//   20: "viseme_kk", // k, g, ŋ (velar sounds)
//   21: "viseme_PP", // p, b, m
// };

const visemeToMorphMap = {
  0: "viseme_sil", // Silence
  1: "viseme_aa", // AA, AE, AH, AW
  2: "viseme_O", // AO
  3: "viseme_E", // EH, ER
  4: "viseme_E", // EY, AY
  5: "viseme_I", // IH, IX, IY
  6: "viseme_O", // UW, UH, U
  7: "viseme_O", // OW
  8: "viseme_aa", // AW
  9: "viseme_O", // OY
  10: "viseme_aa", // AY
  11: "viseme_RR", // H, R
  12: "viseme_nn", // L
  13: "viseme_SS", // S, Z
  14: "viseme_CH", // SH, CH, JH
  15: "viseme_TH", // TH, DH
  16: "viseme_FF", // F, V
  17: "viseme_DD", // D, T, N
  18: "viseme_kk", // K, G, NG
  19: "viseme_PP", // P, B, M
};
const phonemeToMorphTarget = {
  A: "mouthOpen",
  E: "mouthWide",
  O: "mouthRound",
  // Add more phoneme mappings
};

export function NewAvatar(props) {
  const [audio, setAudio] = useState(null);
  const group = useRef();
  const [visemeMap, setVisemeMap] = useState(null);
  const mouthMorphRef = useRef([]);
  const [lipSync, setLipSync] = useState(null);
  // const lastVisemeTime = useRef(0);
  // const currentViseme = useRef(null);
  const { nodes, materials, scene } = useGLTF(
    "/models/667cf9eca357b441c2088fa7.glb"
  );
  const { voiceData, setVoiceData } = useVoice();

  // const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");
  // const { animations: greetingAnimation } = useFBX(
  //   "/animations/Standing Greeting.fbx"
  // );
  // const { animations: angryAnimation } = useFBX(
  //   "/animations/Angry Gesture.fbx"
  // );

  // idleAnimation[0].name = "Idle";
  // greetingAnimation[0].name = "Greeting";
  // angryAnimation[0].name = "Angry";

  // const [animation, setAnimation] = useState("Idle");

  // const { actions } = useAnimations(
  //   [idleAnimation[0], angryAnimation[0], greetingAnimation[0]],
  //   group
  // );

  // useEffect(() => {
  //   actions[animation].reset().fadeIn(0.5).play();
  //   return () => actions[animation]?.fadeOut(0.5);
  // }, [animation]);

  console.log("voicedata", voiceData);

  // Check if mouthCues are present in voiceData
  const mouthCues = voiceData?.lipSync?.mouthCues || [];

  // // Initialize morph targets for the mouth
  useEffect(() => {
    mouthMorphRef.current = nodes?.Wolf3D_Avatar?.morphTargetInfluences;
  }, [nodes]);

  const morphTargets = nodes?.Wolf3D_Avatar?.morphTargetDictionary;
  const morphInfluences = nodes?.Wolf3D_Avatar?.morphTargetInfluences;

  useEffect(() => {
    if (voiceData?.tts?.type === "Buffer" && voiceData.tts.data) {
      console.log("coming inside this");

      const { lipSync } = voiceData;

      setLipSync(lipSync);

      const audioBlob = new Blob([new Uint8Array(voiceData.tts.data)], {
        type: "audio/wav",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);
      setVisemeMap(voiceData.lipSync);
      newAudio.play();
    }
  }, [voiceData]);

  //  perfect lerphmorphtarget function-------------------
  const lerpMorphTarget = (morphTargetName, targetValue, speed = 0.1) => {
    const morphIndex = morphTargets[morphTargetName];
    if (morphIndex !== undefined) {
      morphInfluences[morphIndex] +=
        (targetValue - morphInfluences[morphIndex]) * speed;
    }
  };

  // perfect running useframe------------------------
  useFrame(() => {
    if (!audio || !lipSync) return;

    const currentTime = audio.currentTime * 1000; // Convert to milliseconds

    // Find the active viseme for the current playback time
    const activeViseme = lipSync.find(
      (viseme, index) =>
        viseme.audioOffset <= currentTime &&
        (index === lipSync.length - 1 ||
          lipSync[index + 1].audioOffset > currentTime)
    );

    // Reset all morph targets gradually
    Object.keys(visemeToMorphMap).forEach((id) => {
      const morphTargetName = visemeToMorphMap[id];
      if (morphTargetName) lerpMorphTarget(morphTargetName, 0, 0.1);
    });

    // Apply the active viseme morph target
    if (activeViseme) {
      const morphTargetName = visemeToMorphMap[activeViseme.visemeId];

      if (morphTargetName) {
        lerpMorphTarget(morphTargetName, 1, 0.3); // Apply influence
      }
    }
  });

  console.log("nodesss", nodes);

  return (
    <group {...props} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Avatar"
        geometry={nodes?.Wolf3D_Avatar?.geometry}
        material={materials?.Wolf3D_Avatar}
        skeleton={nodes?.Wolf3D_Avatar?.skeleton}
        morphTargetDictionary={nodes?.Wolf3D_Avatar?.morphTargetDictionary}
        morphTargetInfluences={nodes?.Wolf3D_Avatar?.morphTargetInfluences}
      />
      {/* <skinnedMesh
        geometry={nodes?.Wolf3D_Body?.geometry}
        material={materials?.Wolf3D_Body}
        skeleton={nodes?.Wolf3D_Body?.skeleton}
      />
      <skinnedMesh
        geometry={nodes?.Wolf3D_Outfit_Bottom?.geometry}
        material={materials?.Wolf3D_Outfit_Bottom}
        skeleton={nodes?.Wolf3D_Outfit_Bottom?.skeleton}
      />
      <skinnedMesh
        geometry={nodes?.Wolf3D_Outfit_Footwear?.geometry}
        material={materials?.Wolf3D_Outfit_Footwear}
        skeleton={nodes?.Wolf3D_Outfit_Footwear?.skeleton}
      />
      <skinnedMesh
        geometry={nodes?.Wolf3D_Outfit_Top?.geometry}
        material={materials?.Wolf3D_Outfit_Top}
        skeleton={nodes?.Wolf3D_Outfit_Top?.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes?.EyeLeft?.geometry}
        material={materials?.Wolf3D_Eye}
        skeleton={nodes?.EyeLeft?.skeleton}
        morphTargetDictionary={nodes?.EyeLeft?.morphTargetDictionary}
        morphTargetInfluences={nodes?.EyeLeft?.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes?.EyeRight?.geometry}
        material={materials?.Wolf3D_Eye}
        skeleton={nodes?.EyeRight?.skeleton}
        morphTargetDictionary={nodes?.EyeRight?.morphTargetDictionary}
        morphTargetInfluences={nodes?.EyeRight?.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Hair"
        geometry={nodes?.Wolf3D_Hair?.geometry}
        material={materials?.Wolf3D_Skin}
        skeleton={nodes?.Wolf3D_Hair?.skeleton}
        morphTargetDictionary={nodes?.Wolf3D_Hair?.morphTargetDictionary}
        morphTargetInfluences={nodes?.Wolf3D_Hair?.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes?.Wolf3D_Head?.geometry}
        material={materials?.Wolf3D_Skin}
        skeleton={nodes?.Wolf3D_Head?.skeleton}
        morphTargetDictionary={nodes?.Wolf3D_Head?.morphTargetDictionary}
        morphTargetInfluences={nodes?.Wolf3D_Head?.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes?.Wolf3D_Teeth?.geometry}
        material={materials?.Wolf3D_Teeth}
        skeleton={nodes?.Wolf3D_Teeth?.skeleton}
        morphTargetDictionary={nodes?.Wolf3D_Teeth?.morphTargetDictionary}
        morphTargetInfluences={nodes?.Wolf3D_Teeth?.morphTargetInfluences}
      /> */}
    </group>
  );
}
useGLTF.preload("/models/667cf9eca357b441c2088fa7.glb");
