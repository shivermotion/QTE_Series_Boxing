import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useAudio } from '../contexts/AudioContext';

interface CreditsScreenProps {
  onBackToMenu: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBackToMenu }) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAudio();

  const scrollY = useSharedValue(screenHeight);
  const backgroundOpacity = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);
  const isComplete = useRef(false);

  const creditsData = [
    { type: 'title', text: 'Pocket Knockout', size: 32 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'Executive Producer', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'Fraz Jamil', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'Director', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 20 },

    { type: 'section', text: 'GAME DEVELOPMENT', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Lead Developer', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Game Design', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'UI/UX Design', size: 18 },
    { type: 'name', text: 'Becky Bergman', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'ART & VISUALS', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Character Design', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Background Art', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Animation', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'AUDIO & MUSIC', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Music Design', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Sound Effects', size: 18 },
    { type: 'name', text: 'Jason Day', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'TECHNICAL', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Backend Development', size: 18 },
    { type: 'name', text: '[Backend Developer]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Quality Assurance', size: 18 },
    { type: 'name', text: '[QA Tester Name]', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'SPECIAL THANKS', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'Verc James', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Stefan Pitka', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Darko Mijic', size: 16 },
    { type: 'spacer', text: '', size: 30 },
    { type: 'name', text: 'Dan Nguyen', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Brian Jeffreys', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Hamzah Shakeel', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Roshan Pardiwala', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Chris Garcia', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Richard Calleros', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Fraz Jamil', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Becky Bergman', size: 16 },
    { type: 'spacer', text: '', size: 5 },

    { type: 'section', text: 'INSPIRED BY', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'QTE Title from Shenmue', size: 16 },
    { type: 'spacer', text: '', size: 5 },

    { type: 'spacer', text: '', size: 30 },
    { type: 'section', text: 'TECHNOLOGIES', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'React Native', size: 16 },
    { type: 'spacer', text: '', size: 5 },

    { type: 'section', text: '© 2024 Nexrage Studios LLC.', size: 20 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'All Rights Reserved', size: 16 },
    { type: 'spacer', text: '', size: 50 },
  ];

  const handleScrollComplete = () => {
    isComplete.current = true;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scrollY.value }],
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  const thankYouAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: thankYouOpacity.value,
    };
  });

  useEffect(() => {
    // Start with background fade in
    backgroundOpacity.value = withTiming(1, { duration: 2000 }, finished => {
      if (finished) {
        // After background fades in, start the scroll animation
        scrollY.value = withTiming(
          -screenHeight * 2, // Scroll up beyond the screen
          { duration: 30000 }, // 30 seconds duration
          finished => {
            if (finished) {
              // After credits finish scrolling, fade in black overlay and thank you message
              thankYouOpacity.value = withTiming(1, { duration: 2000 }, finished => {
                if (finished) {
                  runOnJS(handleScrollComplete)();
                }
              });
            }
          }
        );
      }
    });
  }, []);

  const getTextStyle = (item: any) => {
    switch (item.type) {
      case 'title':
        return [styles.title, { fontSize: item.size }];
      case 'section':
        return [styles.section, { fontSize: item.size }];
      case 'credit':
        return [styles.credit, { fontSize: item.size }];
      case 'name':
        return [styles.name, { fontSize: item.size }];
      case 'spacer':
        return [styles.spacer, { height: item.size }];
      default:
        return [styles.name, { fontSize: item.size }];
    }
  };

  const getViewStyle = (item: any) => {
    if (item.type === 'spacer') {
      return [styles.spacer, { height: item.size }];
    }
    return styles.creditItem;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background Video */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <Video
          source={require('../../assets/video/shadow_boxing.mp4')}
          style={styles.backgroundVideo}
          shouldPlay={true}
          isLooping={true}
          isMuted={true}
          resizeMode={ResizeMode.CONTAIN}
        />

        {/* Credits Content */}
        <View style={styles.creditsContainer}>
          <Animated.View style={[styles.creditsContent, animatedStyle]}>
            {creditsData.map((item, index) => (
              <View key={index} style={getViewStyle(item)}>
                {item.type !== 'spacer' && <Text style={getTextStyle(item)}>{item.text}</Text>}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Black overlay that fades in */}
        <Animated.View style={[styles.blackOverlay, thankYouAnimatedStyle]} />

        {/* Thank You Message (fades in at center) */}
        <Animated.View style={[styles.thankYouContainer, thankYouAnimatedStyle]}>
          <Text style={styles.thankYouText}>Thank You For Playing</Text>
        </Animated.View>
      </Animated.View>

      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 20 }]}
        onPress={onBackToMenu}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Tap to Return Button (appears when scroll is complete) */}
      {isComplete.current && (
        <TouchableOpacity
          style={[styles.returnButton, { bottom: insets.bottom + 20 }]}
          onPress={onBackToMenu}
        >
          <Text style={styles.returnButtonText}>Tap to Return</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  creditsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  creditsContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  section: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  credit: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  name: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  spacer: {
    width: '100%',
  },
  creditItem: {
    width: '100%',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  returnButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  blackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 5,
  },
  thankYouContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thankYouText: {
    width: '100%',
    color: '#ffff',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
});

export default CreditsScreen;
