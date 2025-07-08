import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode, Audio } from 'expo-av';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const videoRef = useRef<Video>(null);
  const [videoFinished, setVideoFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const glitchSoundRef = useRef<Audio.Sound | null>(null);

  // Load and play glitch sound
  useEffect(() => {
    const loadAndPlayGlitch = async () => {
      try {
        const glitch = new Audio.Sound();
        await glitch.loadAsync(require('../../assets/splash_screen/glitch.mp3'));
        await glitch.playAsync();
        glitchSoundRef.current = glitch;
      } catch (e) {
        console.log('Error loading/playing glitch sound:', e);
      }
    };

    loadAndPlayGlitch();

    return () => {
      if (glitchSoundRef.current) {
        glitchSoundRef.current.stopAsync();
        glitchSoundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (videoFinished) {
      // Fade out video immediately, then linger on black screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // After fade out, linger for 5 seconds on black screen
        const timer = setTimeout(() => {
          onFinish();
        }, 5000);

        return () => clearTimeout(timer);
      });
    }
  }, [videoFinished, fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Video
        ref={videoRef}
        source={require('../../assets/splash_screen/Nexrage_Glitch.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setVideoFinished(true);
          }
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
