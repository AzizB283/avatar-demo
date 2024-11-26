import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Button, message } from "antd";
import "./realestate.scss";
import axios from "axios";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

let azureKey: any = process.env.NEXT_PUBLIC_AZURE_KEY;
let azureRegion: any = process.env.NEXT_PUBLIC_AZURE_REGION;
let azureEndpoint = process.env.NEXT_PUBLIC_AZURE_ENDPOINT;
let azureAvatarName: any = process.env.NEXT_PUBLIC_AVATAR_NAME;
let avatarStyle: any = process.env.NEXT_PUBLIC_AVATAR_STYLE;
let avatarVoice: any = process.env.NEXT_PUBLIC_AVATAR_VOICE;
let avatarBg: any = process.env.NEXT_PUBLIC_AVATAR_BG;

const createWebRTCConnection = (
  iceServerUrl: any,
  iceServerUsername: any,
  iceServerCredential: any
): any => {
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
  let videoCropTopLeftX = 0;
  let videoCropBottomRightX = 1920;
  videoFormat.setCropRange(
    new SpeechSDK.Coordinate(videoCropTopLeftX, 0),
    new SpeechSDK.Coordinate(videoCropBottomRightX, 1080)
  );

  // Avatar Configuration
  const talkingAvatarCharacter: any = azureAvatarName;
  const talkingAvatarStyle: any = avatarStyle;
  const avatarConfig = new SpeechSDK.AvatarConfig(
    talkingAvatarCharacter,
    talkingAvatarStyle,
    videoFormat
  );
  avatarConfig.backgroundImage = avatarBg;

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

function RealEstateAssistant() {
  const chatWindowRef: any = useRef(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [threadId, setThreadId] = useState();
  const [inputDisabled, setInputDisabled] = useState(false);
  const [avatarSynthesizer, setAvatarSynthesizer] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  // Create a ref for the connect button
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  const myAvatarVideoRef = useRef<HTMLDivElement>(null);
  const myAvatarVideoEleRef = useRef<any>(null);
  const myAvatarAudioEleRef = useRef<HTMLAudioElement>(null);

  let iceUrl: any = "turn:relay.communication.microsoft.com:3478";
  let iceCredential: any = "tFOrY+BH+zzA98wVaJGAuD5ojDo=";
  let iceUsername: any =
    "BQAANucL2QAB20IoJ3hkQntsw22xCw40OOVHt0b6bacAAAAQAxC6Y2laD2dOgrYx1Zk1SkZ9TZO0/Wa+GyHWN7kf9WA/y5CUeWo=";

  /// chat base response
  const [response, setResponse] = useState("");

  const scrollToBottom = () => {
    chatWindowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const appendMessage = (role: any, text: any) => {
    setMessages((prevMessages: any) => [...prevMessages, { role, text }]);
  };

  const sendMessage = async (text: string) => {
    try {
      setLoading(true);
      const response: any = await fetch(`api/assistant`, {
        method: "POST",
        body: JSON.stringify({
          message: text,
          threadId: threadId,
        }),
      });

      // console.log("responseee", await response.json());

      const ans = await response.json();

      appendMessage("assistant", ans.text.value);
      speakSelectedText(ans.text.value);

      // const stream = AssistantStream.fromReadableStream(response.body);
      // handleReadableStream(stream);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    } finally {
      setInputDisabled(false);
      setLoading(false);
    }
  };

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userQuery.trim() == "") {
        message.error("Please enter the message");
        return;
      }

      setInputDisabled(true);
      sendMessage(userQuery);
      setMessages((prevMessages: any) => [
        ...prevMessages,
        { role: "user", text: userQuery },
      ]);
      setUserQuery("");
      scrollToBottom();
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // create new thread
  const createThread = async () => {
    try {
      setInputDisabled(true);
      const response = await axios.get(`api/assistant/thread`);

      console.log("responsee", response.data.thread);
      setThreadId(response.data.thread.id);
      setInputDisabled(false);
    } catch (error) {
      console.log("error", error);
      setInputDisabled(false);
    }
  };

  useEffect(() => {
    createThread();
    // startSession();
  }, []);

  console.log("messages", messages);

  // const makeBackgroundTransparent = (timestamp: number) => {
  //   console.log(
  //     "coming inside this",
  //     timestamp,
  //     previousAnimationFrameTimestamp
  //   );

  //   if (timestamp - previousAnimationFrameTimestamp > 30) {
  //     const video: any = document.getElementById("video");
  //     const tmpCanvas = tmpCanvasRef.current;
  //     const canvas = canvasRef.current;

  //     if (video && tmpCanvas && canvas) {
  //       const tmpContext = tmpCanvas.getContext("2d", {
  //         willReadFrequently: true,
  //       });
  //       const canvasContext = canvas.getContext("2d");

  //       if (tmpContext && canvasContext) {
  //         tmpContext.drawImage(
  //           video,
  //           0,
  //           0,
  //           video.videoWidth,
  //           video.videoHeight
  //         );

  //         if (video.videoWidth > 0) {
  //           const frame = tmpContext.getImageData(
  //             0,
  //             0,
  //             video.videoWidth,
  //             video.videoHeight
  //           );

  //           for (let i = 0; i < frame.data.length / 4; i++) {
  //             const r = frame.data[i * 4];
  //             const g = frame.data[i * 4 + 1];
  //             const b = frame.data[i * 4 + 2];

  //             if (g - 150 > r + b) {
  //               // Set alpha to 0 for green-screen-like areas
  //               frame.data[i * 4 + 3] = 0;
  //             } else if (g + g > r + b) {
  //               const adjustment = (g - (r + b) / 2) / 3;
  //               frame.data[i * 4] += adjustment; // Adjust red
  //               frame.data[i * 4 + 1] -= adjustment * 2; // Adjust green
  //               frame.data[i * 4 + 2] += adjustment; // Adjust blue
  //               frame.data[i * 4 + 3] = Math.max(0, 255 - adjustment * 4); // Smooth alpha
  //             }
  //           }

  //           canvasContext.putImageData(frame, 0, 0);
  //         }
  //       }
  //     }

  //     previousAnimationFrameTimestamp = timestamp;
  //   }

  //   window.requestAnimationFrame(makeBackgroundTransparent);
  // };

  const handleOnTrack = (event: any) => {
    console.log("#### Printing handle onTrack ", event);

    // Update UI elements
    console.log("Printing event.track.kind ", event.track.kind);
    if (event.track.kind === "video") {
      const mediaPlayer: any = myAvatarVideoEleRef.current;
      mediaPlayer.id = event.track.kind;
      mediaPlayer.srcObject = event.streams[0];
      mediaPlayer.autoplay = true;
      mediaPlayer.playsInline = true;
      // myAvatarVideoEleRef.current = mediaPlayer;
      mediaPlayer.addEventListener("play", () => {
        window.requestAnimationFrame(() => {});
      });
    } else {
      // Mute the audio player to make sure it can auto play, will unmute it when speaking
      // Refer to https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
      //const mediaPlayer = myAvatarVideoEleRef.current;
      // mediaPlayer.muted = true;

      const audioPlayer: any = myAvatarAudioEleRef.current;
      audioPlayer.srcObject = event.streams[0];
      audioPlayer.autoplay = true;
      audioPlayer.playsInline = true;
      audioPlayer.muted = true;
    }
  };

  const speakSelectedText = (ans: string) => {
    //Start speaking the text
    const audioPlayer: any = myAvatarAudioEleRef.current;
    console.log("Audio muted status ", audioPlayer.muted);
    audioPlayer.muted = false;
    console.log("Audio muted status ", audioPlayer.muted);
    avatarSynthesizer
      .speakTextAsync(ans)
      .then((result: any) => {
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
      .catch((error: any) => {
        console.log(error);
        avatarSynthesizer.close();
      });
  };

  const startSession = () => {
    let peerConnection = createWebRTCConnection(
      iceUrl,
      iceUsername,
      iceCredential
    );
    console.log("Peer connection ", peerConnection);
    peerConnection.ontrack = handleOnTrack;
    peerConnection.addTransceiver("video", { direction: "sendrecv" });
    peerConnection.addTransceiver("audio", { direction: "sendrecv" });

    let avatarSynthesizer: any = createAvatarSynthesizer();
    setAvatarSynthesizer(avatarSynthesizer);
    peerConnection.oniceconnectionstatechange = () => {
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
      .then(() => {
        console.log("[" + new Date().toISOString() + "] Avatar started.");
        setConnected(true);
      })
      .catch((error: any) => {
        console.log(
          "[" +
            new Date().toISOString() +
            "] Avatar failed to start. Error: " +
            error
        );
      });
  };

  const stopSession = () => {
    console.log("coming in stop session");

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

  useEffect(() => {
    const initSession = async () => {
      try {
        // Request user permissions for camera and microphone
        await navigator.mediaDevices.getUserMedia({ audio: true });
        startSession();
      } catch (error) {
        console.error("Failed to get media permissions:", error);
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopSession();
    };
  }, []);

  return (
    <>
      <div className="parent-container">
        <div id="myAvatarVideo" className="myVideoDiv" ref={myAvatarVideoRef}>
          <video
            className="myAvatarVideoElement"
            ref={myAvatarVideoEleRef}
          ></video>

          <audio ref={myAvatarAudioEleRef}></audio>
        </div>
        <div className="chat-wrapper">
          <div className={`messages-section`}>
            <div className={`conversation-container`} ref={chatWindowRef}>
              {messages.map((message: any, index: any) => {
                if (message.role == "assistant")
                  return (
                    <React.Fragment key={index}>
                      <div className="assistant-message-container">
                        <div
                          className="assistant-message"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: message.text,
                          }}
                        ></div>
                      </div>
                    </React.Fragment>
                  );
                else
                  return (
                    <div className="user-message-container">
                      <div className="user-message" key={index}>
                        {message.text}
                      </div>
                    </div>
                  );
              })}

              {loading && (
                <div className="assistant-message-container">
                  <div className="assistant-message">
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                </div>
              )}
              {response && (
                <div className="assistant-message-container">
                  <div
                    className="assistant-message"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: response.concat("<b> |</b>"),
                    }}
                  />
                </div>
              )}
            </div>

            <div className="chat-question">
              <input
                type="text"
                placeholder="Enter your message"
                onKeyDown={getReply}
                onChange={(event) => {
                  setUserQuery(event.target.value);
                }}
                value={userQuery}
                disabled={inputDisabled}
              />
              <button
                className="icon"
                onClick={() => getReply("click")}
                disabled={loading ? true : false}
              >
                {/* <Image src={MicrophoneIcon} alt="send-chat-icon" /> */}
                Talk with Tina
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* )} */}
    </>
  );
}

export default RealEstateAssistant;
