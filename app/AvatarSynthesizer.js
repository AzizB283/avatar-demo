export const createAvatarSynthesizer = () => {
  // Configuring Speech SDK for Speech Synthesis
  const speechSynthesisConfig = SpeechSDK.SpeechConfig.fromSubscription(
    cogSvcSubKey,
    cogSvcRegion
  );
  speechSynthesisConfig.speechSynthesisVoiceName = voiceName;

  // Configuring Avatar Video Format
  const videoFormat = new SpeechSDK.AvatarVideoFormat();
  let videoCropTopLeftX = 600;
  let videoCropBottomRightX = 1320;
  videoFormat.setCropRange(
    new SpeechSDK.Coordinate(videoCropTopLeftX, 50),
    new SpeechSDK.Coordinate(videoCropBottomRightX, 1080)
  );

  // Avatar Configuration
  const talkingAvatarCharacter = avatarCharacter;
  const talkingAvatarStyle = avatarStyle;
  const avatarConfig = new SpeechSDK.AvatarConfig(
    talkingAvatarCharacter,
    talkingAvatarStyle,
    videoFormat
  );
  avatarConfig.backgroundColor = avatarBackgroundColor;

  // Creating Avatar Synthesizer
  let avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(
    speechSynthesisConfig,
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
