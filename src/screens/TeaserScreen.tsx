import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface TeaserScreenProps {
  onComplete: () => void;
}

const TeaserScreen: React.FC<TeaserScreenProps> = ({ onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // After 4 seconds, fade to white
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // After fade completes, transition to next screen
        onComplete();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onComplete]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
        <Video
          source={require('../../assets/video/teaser.mp4')}
          style={styles.video}
          shouldPlay={true}
          isLooping={false}
          isMuted={true}
          resizeMode={ResizeMode.COVER}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default TeaserScreen;
