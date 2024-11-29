import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Button, message } from "antd";
import "./realestate.scss";
import axios from "axios";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion
} from '@heygen/streaming-avatar';


function RealEstateAssistant() {
  const chatWindowRef: any = useRef(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [threadId, setThreadId] = useState();
  const [inputDisabled, setInputDisabled] = useState(false);

  const [data, setData] = useState<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [debug, setDebug] = useState<string>();

  // Create a ref for the connect button
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<any>(null);



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

  
  console.log("messages", messages);


  const speakSelectedText = async (ans: string) => {
    console.log('speakSelectedText', ans);

     // speak({ text: text, task_type: TaskType.REPEAT })
     await avatar.current.speak({ text: ans, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC,  }).catch((e:any) => {
      setDebug(e.message);
    });
  };

  async function fetchAccessToken() {
    try {
      const response = await fetch('/api/heygen/get-access-token', {
        method: 'POST'
      });
      const token = await response.text();

      console.log('Access Token:', token);

      return token;
    } catch (error) {
      console.error('Error fetching access token:', error);
    }

    return '';
  }

  async function startSession() {
    console.log('starting session');
    
    setAvatarLoading(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e:any) => {
      console.log('Avatar started talking', e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e:any) => {
      console.log('Avatar stopped talking', e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log('Stream disconnected');
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event:any) => {
      console.log('>>>>> Stream ready:', event.detail);
      setStream(event.detail);
    });
    avatar.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (message:string) => {
      console.log('Avatar talking message:', message);
      // You can display the message in the UI
    });
    avatar.current.on(StreamingEvents.AVATAR_END_MESSAGE, (message:string) => {
      console.log('Avatar end message:', message);
      // Handle the end of the avatar's message, e.g., indicate the end of the conversation
    });
    avatar.current.on(StreamingEvents.USER_SILENCE, () => {
      console.log('User is silent');
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: 'Wayne_20240711',
        knowledgeId: '', // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.FRIENDLY
        },
        
        language: '',
        disableIdleTimeout: true
        
      });

      setData(res);
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false
      });
    } catch (error) {
      console.error('Error starting avatar session:', error);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }


  useEffect(() => {
    createThread();
    startSession();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      // mediaStream.current.onloadedmetadata = () => {
      //   mediaStream.current!.play();
      //   setDebug('Playing');
      // };
    }
  }, [mediaStream, stream]);



  return (
    <>
      <div className="parent-container">
        {/* <div id="myAvatarVideo" className="myVideoDiv" ref={myAvatarVideoRef}> */}
        {avatarLoading && <div>Loading...</div>}
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: '50%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              >
                <track kind='captions' />
              </video>

          {/* <audio ref={myAvatarAudioEleRef}></audio> */}
        {/* </div> */}
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
                    <div className="user-message-container" key={index}>
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
