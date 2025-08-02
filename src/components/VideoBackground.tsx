import React from 'react';
import { StyleSheet, Dimensions, Image } from 'react-native';
import { Video } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoBackgroundProps {
  source: any;
  isGif?: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ source, isGif = false }) => {
  if (isGif) {
    return <Image source={source} style={styles.video} resizeMode="cover" />;
  }

  return (
    <Video
      source={source}
      style={styles.video}
      resizeMode="cover"
      shouldPlay={true}
      isLooping={true}
      isMuted={true}
      useNativeControls={false}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 0, // Behind all other content
  },
});

export default VideoBackground;
