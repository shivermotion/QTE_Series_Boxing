import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import { useTransition } from '../contexts/TransitionContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TapToStartScreenProps {
  onComplete: () => void;
}

const TapToStartScreen: React.FC<TapToStartScreenProps> = ({ onComplete }) => {
  const { getEffectiveVolume } = useAudio();
  const { startTransition } = useTransition();

  // Fade-in animation for the entire screen
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fadeInComplete, setFadeInComplete] = React.useState(false);

  // Animated opacity for flashing Tap to Start
  const tapToStartOpacity = useRef(new Animated.Value(1)).current;

  const bellSoundRef = React.useRef<Audio.Sound | null>(null);

  // Start fade-in animation when component mounts
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setFadeInComplete(true);
    });
  }, [fadeAnim]);

  React.useEffect(() => {
    // Only load audio after fade-in is complete
    if (!fadeInComplete) return;

    // Preload bell sound
    const loadBell = async () => {
      try {
        const bell = new Audio.Sound();
        await bell.loadAsync(require('../../assets/audio/boxing_bell_1.mp3'));
        bellSoundRef.current = bell;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error preloading bell sound:', e);
      }
    };
    loadBell();

    return () => {
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync();
      }
    };
  }, [fadeInComplete, getEffectiveVolume]);

  const playBellSound = async () => {
    try {
      if (bellSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await bellSoundRef.current.setVolumeAsync(effectiveVolume);
        await bellSoundRef.current.replayAsync();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error playing bell sound:', e);
    }
  };

  // Animate Tap to Start flashing
  useEffect(() => {
    if (fadeInComplete) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tapToStartOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(tapToStartOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      tapToStartOpacity.setValue(1);
    }
  }, [fadeInComplete]);

  // Handler for tap-to-start
  const handleTapToStart = async () => {
    await playBellSound();

    startTransition(
      () => {
        onComplete();
      },
      {
        transitionImage: require('../../assets/transition_screen/paper_texture.png'),
        loadingDuration: 2000,
        wipeDuration: 800,
      }
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Grey background */}
      <View style={styles.background} />

      {/* Tap to Start Button */}
      <TouchableOpacity
        style={[
          styles.tapToStartMenuArea,
          {
            // Android-specific improvements
            ...(Platform.OS === 'android' && {
              minHeight: 400,
              paddingVertical: 60,
              backgroundColor: 'rgba(0,0,0,0.05)', // Slightly more visible on Android
            }),
          },
        ]}
        activeOpacity={0.8}
        onPress={handleTapToStart}
      >
        <Animated.Text style={[styles.tapToStartText, { opacity: tapToStartOpacity }]}>
          Tap to Start
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#808080', // Grey background
  },
  tapToStartText: {
    color: '#00ffff',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 2,
    padding: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  tapToStartMenuArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default TapToStartScreen;
