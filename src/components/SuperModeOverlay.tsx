import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SuperModeOverlayProps {
  isActive: boolean;
  onVideoEnd?: () => void;
}

const SuperModeOverlay: React.FC<SuperModeOverlayProps> = ({ isActive, onVideoEnd }) => {
  const videoRef = useRef<Video>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef<boolean>(false);

  // Handle super mode start
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      console.log('🎬 Super mode starting - setting up 5-second timer');
      hasStartedRef.current = true;

      // Start video
      if (videoRef.current) {
        videoRef.current.playAsync();
      }

      // Set 5-second timer
      timerRef.current = setTimeout(() => {
        console.log('🎬 5-second timer completed - ending super mode');
        hasStartedRef.current = false;
        if (onVideoEnd) {
          onVideoEnd();
        }
      }, 5000);
    }
  }, [isActive, onVideoEnd]);

  // Handle super mode end
  useEffect(() => {
    if (!isActive && hasStartedRef.current) {
      console.log('🎬 Super mode ending - cleaning up');
      hasStartedRef.current = false;

      // Stop video
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Video
        ref={videoRef}
        source={require('../../assets/video/speedlines.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        isMuted={false}
        onPlaybackStatusUpdate={status => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('🎬 Speed lines video looped');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
});

export default SuperModeOverlay;
