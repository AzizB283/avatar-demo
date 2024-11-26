import React, { useEffect, useRef, useState } from "react";
import { useVoice } from "@/hook/useVoice";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import bg from "../public/bg.png";
import axios from "axios";
require("dotenv").config();

let azureKey = process.env.NEXT_PUBLIC_AZURE_KEY;
let azureRegion = process.env.NEXT_PUBLIC_AZURE_REGION;
let azureEndpoint = process.env.NEXT_PUBLIC_AZURE_ENDPOINT;
let azureAvatarName = process.env.NEXT_PUBLIC_AVATAR_NAME;
let avatarStyle = process.env.NEXT_PUBLIC_AVATAR_STYLE;
let avatarVoice = process.env.NEXT_PUBLIC_AVATAR_VOICE;
let avatarBg = process.env.NEXT_PUBLIC_AVATAR_BG;

let iceURL = "turn:relay.communication.microsoft.com:3478";
let icePassword = "tFOrY+BH+zzA98wVaJGAuD5ojDo=";
let iceUsername =
  "BQAANucL2QAB20IoJ3hkQntsw22xCw40OOVHt0b6bacAAAAQAxC6Y2laD2dOgrYx1Zk1SkZ9TZO0/Wa+GyHWN7kf9WA/y5CUeWo=";

console.log("azure key", azureKey);
console.log("bgggg", avatarBg);

const createWebRTCConnection = (
  iceServerUrl,
  iceServerUsername,
  iceServerCredential
) => {
  var peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [iceServerUrl],
        username: iceServerUsername,
        credential: iceServerCredential,
      },
    ],
  });

  return peerConnection;
};

async function getAvatarRelayToken() {
  const url = azureEndpoint;

  try {
    const response = await axios.get(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey,
      },
    });

    // Log or return the token
    console.log("Relay Token:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching relay token:",
      error.response?.data || error.message
    );
  }
}

const createAvatarSynthesizer = () => {
  // Configuring Speech SDK for Speech Synthesis
  // Speech configuration
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    azureKey,
    azureRegion
  );

  speechConfig.speechSynthesisVoiceName = avatarVoice;

  // Configuring Avatar Video Format
  const videoFormat = new SpeechSDK.AvatarVideoFormat();
  let videoCropTopLeftX = 600;
  let videoCropBottomRightX = 1320;
  videoFormat.setCropRange(
    new SpeechSDK.Coordinate(videoCropTopLeftX, 50),
    new SpeechSDK.Coordinate(videoCropBottomRightX, 1080)
  );

  // Avatar Configuration
  const talkingAvatarCharacter = azureAvatarName;
  const talkingAvatarStyle = avatarStyle;
  const avatarConfig = new SpeechSDK.AvatarConfig(
    talkingAvatarCharacter,
    talkingAvatarStyle,
    videoFormat
  );

  // Creating Avatar Synthesizer
  let avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(
    speechConfig,
    avatarConfig
  );

  // Handling Avatar Events
  avatarSynthesizer.avatarEventReceived = function (s, e) {
    var offsetMessage =
      ", offset from session start: " + e.offset / 10000 + "ms.";
    if (e.offset === 0) {
      offsetMessage = "";
    }
    console.log(
      "[" +
        new Date().toISOString() +
        "] Event received: " +
        e.description +
        offsetMessage
    );
  };

  return avatarSynthesizer;
};

function htmlEncode(text) {
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };

  return String(text).replace(/[&<>"'\/]/g, (match) => entityMap[match]);
}

function MicrosoftAvatar() {
  const { voiceData, setVoiceData } = useVoice();
  // const videoEleRef = useRef(null);
  // const videoRef = useRef(null);
  // const audioRef = useRef(null);
  // const avatarSynthesizerRef = useRef(null);
  // const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const [isAvatarStarted, setIsAvatarStarted] = useState(true);
  const [speakDisabled, setSpeakDisabled] = useState(true); // Button state
  // const [ssml, setSsml] = useState(""); // Store generated SSML
  const [speech, setSpeech] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const myAvatarVideoRef = useRef();
  const myAvatarVideoEleRef = useRef();
  const myAvatarAudioEleRef = useRef();
  const [mySpeechText, setMySpeechText] = useState("");

  useEffect(() => {
    if (voiceData) {
      const setupAvatar = async () => {
        // if (!avatarSynthesizerRef.current) {
        //   console.error("Avatar synthesizer is not initialized.");
        //   return;
        // }

        try {
          if (voiceData) {
            // const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='en-US-AvaMultilingualNeural'><mstts:ttsembedding speakerProfileId=''><mstts:leadingsilence-exact value='0'/>${htmlEncode(
            //   voiceData.completion
            // )}</mstts:ttsembedding></voice></speak>`;
            //     const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
            //   <voice name='${avatarVoice}'>
            //     <mstts:ttsembedding speakerProfileId=''>
            //       <mstts:leadingsilence-exact value='0'/>
            //       ${htmlEncode(voiceData.completion)}
            //     </mstts:ttsembedding>
            //   </voice>
            // </speak>`;

            // const synthesisResult =
            //   await avatarSynthesizerRef.current.speakSsmlAsync(ssml);
            // if (
            //   synthesisResult.reason !==
            //   SpeechSDK.ResultReason.SynthesizingAudioCompleted
            // ) {
            //   console.error(
            //     "Speech synthesis failed:",
            //     synthesisResult.errorDetails
            //   );
            // }
            // setSsml(ssml);
            setSpeech(voiceData.completion);
            speakSelectedText(voiceData.completion);
            setSpeakDisabled(false);
          }
        } catch (error) {
          console.error("Error setting up avatar:", error);
        }
      };
      setupAvatar();
    }
  }, [voiceData]);

  const handleSpeak = async () => {
    setSpeakDisabled(true);
    try {
      //Start speaking the text
      const audioPlayer = audioRef.current;
      console.log("Audio muted status ", audioPlayer.muted);
      audioPlayer.muted = false;
      console.log("Audio muted status ", audioPlayer.muted);

      // const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
      //     <voice name='${avatarVoice}'>
      //       <mstts:ttsembedding speakerProfileId=''>
      //         <mstts:leadingsilence-exact value='0'/>
      //         ${htmlEncode(speech)}
      //       </mstts:ttsembedding>
      //     </voice>
      //   </speak>`;

      // const result = await avatarSynthesizerRef.current.speakSsmlAsync(ssml);
      // if (result.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
      //   console.error("Speech synthesis failed:", result.errorDetails);
      // }

      avatarSynthesizer
        .speakTextAsync(speech)
        .then((result) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            console.log("Speech and avatar synthesized to video stream.");
          } else {
            console.log("Unable to speak. Result ID: " + result.resultId);
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              let cancellationDetails =
                SpeechSDK.CancellationDetails.fromResult(result);
              console.log(cancellationDetails.reason);
              if (
                cancellationDetails.reason ===
                SpeechSDK.CancellationReason.Error
              ) {
                console.log(cancellationDetails.errorDetails);
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
          avatarSynthesizer.close();
        });
    } catch (error) {
      console.error("Error during speech synthesis:", error);
    } finally {
      setSpeakDisabled(false);
    }
  };

  const stopSpeaking = () => {
    avatarSynthesizer
      .stopSpeakingAsync()
      .then(() => {
        console.log(
          "[" + new Date().toISOString() + "] Stop speaking request sent."
        );
      })
      .catch();
  };

  const stopSession = () => {
    try {
      //Stop speaking
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          console.log(
            "[" + new Date().toISOString() + "] Stop speaking request sent."
          );
          // Close the synthesizer
          avatarSynthesizer.close();
        })
        .catch();
    } catch (e) {}
  };

  const speakSelectedText = (text) => {
    //Start speaking the text
    const audioPlayer = myAvatarAudioEleRef.current;
    console.log("Audio muted status ", audioPlayer.muted);
    audioPlayer.muted = false;
    console.log("Audio muted status ", audioPlayer.muted);
    avatarSynthesizer
      .speakTextAsync(text)
      .then((result) => {
        if (
          result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
        ) {
          console.log("Speech and avatar synthesized to video stream.");
        } else {
          console.log("Unable to speak. Result ID: " + result.resultId);
          if (result.reason === SpeechSDK.ResultReason.Canceled) {
            let cancellationDetails =
              SpeechSDK.CancellationDetails.fromResult(result);
            console.log(cancellationDetails.reason);
            if (
              cancellationDetails.reason === SpeechSDK.CancellationReason.Error
            ) {
              console.log(cancellationDetails.errorDetails);
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
        avatarSynthesizer.close();
      });
  };

  const handleOnTrack = (event) => {
    console.log("#### Printing handle onTrack ", event);

    // Update UI elements
    console.log("Printing event.track.kind ", event.track.kind);
    if (event.track.kind === "video") {
      const mediaPlayer = myAvatarVideoEleRef.current;
      mediaPlayer.id = event.track.kind;
      mediaPlayer.srcObject = event.streams[0];
      mediaPlayer.autoplay = true;
      mediaPlayer.playsInline = true;
      mediaPlayer.addEventListener("play", () => {
        window.requestAnimationFrame(() => {});
      });
    } else {
      // Mute the audio player to make sure it can auto play, will unmute it when speaking
      // Refer to https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
      //const mediaPlayer = myAvatarVideoEleRef.current;
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.srcObject = event.streams[0];
      audioPlayer.autoplay = true;
      audioPlayer.playsInline = true;
      audioPlayer.muted = true;
    }
  };

  const startSession = () => {
    setIsAvatarStarted(false);
    setLoading(true);
    let peerConnection = createWebRTCConnection(
      iceURL,
      iceUsername,
      icePassword
    );
    console.log("Peer connection ", peerConnection);
    peerConnection.ontrack = handleOnTrack;
    peerConnection.addTransceiver("video", { direction: "sendrecv" });
    peerConnection.addTransceiver("audio", { direction: "sendrecv" });

    let avatarSynthesizer = createAvatarSynthesizer();
    setAvatarSynthesizer(avatarSynthesizer);
    peerConnection.oniceconnectionstatechange = (e) => {
      console.log("WebRTC status: " + peerConnection.iceConnectionState);

      if (peerConnection.iceConnectionState === "connected") {
        console.log("Connected to Azure Avatar service");
      }

      if (
        peerConnection.iceConnectionState === "disconnected" ||
        peerConnection.iceConnectionState === "failed"
      ) {
        console.log("Azure Avatar service Disconnected");
      }
    };

    avatarSynthesizer
      .startAvatarAsync(peerConnection)
      .then((r) => {
        console.log("[" + new Date().toISOString() + "] Avatar started.");
      })
      .catch((error) => {
        console.log(
          "[" +
            new Date().toISOString() +
            "] Avatar failed to start. Error: " +
            error
        );
      });

    setIsAvatarStarted(true);
    setLoading(false);
  };

  console.log("loading", loading);

  return (
    <>
      <div className="myButtonGroup d-flex justify-content-around">
        <button className="btn btn-success" onClick={startSession}>
          Connect
        </button>
        <button className="btn btn-danger" onClick={stopSession}>
          Disconnect
        </button>
      </div>
      {loading && <div>....Loading</div>}

      <div id="myAvatarVideo" className="myVideoDiv" ref={myAvatarVideoRef}>
        <video
          className="myAvatarVideoElement"
          ref={myAvatarVideoEleRef}
        ></video>

        <audio ref={myAvatarAudioEleRef}></audio>
      </div>

      {/* <div className="myButtonGroup d-flex justify-content-around">
        <button
          className="btn btn-success"
          onClick={speakSelectedText}
          disabled={speakDisabled}
        >
          Speak
        </button>
        <button className="btn btn-warning" onClick={stopSpeaking}>
          Stop
        </button>
      </div> */}
    </>
  );
}

export default MicrosoftAvatar;
