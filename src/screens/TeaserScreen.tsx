import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';

interface TeaserScreenProps {
  onComplete: () => void;
}

const TeaserScreen: React.FC<TeaserScreenProps> = ({ onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const crowdCheerRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Load and play crowd cheer sound
    const loadAndPlayCrowdCheer = async () => {
      try {
        const crowdCheer = new Audio.Sound();
        await crowdCheer.loadAsync(require('../../assets/main_menu/crowd_cheer.mp3'));
        await crowdCheer.setVolumeAsync(0.7);
        await crowdCheer.playAsync();
        crowdCheerRef.current = crowdCheer;
      } catch (error) {
        console.log('Error loading crowd cheer sound:', error);
      }
    };

    loadAndPlayCrowdCheer();

    // After 4 seconds, fade to white and fade out audio
    const timer = setTimeout(async () => {
      // Fade out the crowd cheer sound
      if (crowdCheerRef.current) {
        try {
          await crowdCheerRef.current.fadeOutAsync(1000);
        } catch (error) {
          console.log('Error fading out crowd cheer:', error);
        }
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // After fade completes, transition to next screen
        onComplete();
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      // Cleanup audio
      if (crowdCheerRef.current) {
        crowdCheerRef.current.unloadAsync();
      }
    };
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
