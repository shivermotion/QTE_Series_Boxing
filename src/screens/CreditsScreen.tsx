import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
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
    { type: 'title', text: 'QTE SERIES BOXING', size: 32 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'GAME DEVELOPMENT', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Lead Developer', size: 18 },
    { type: 'name', text: '[Your Name]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Game Design', size: 18 },
    { type: 'name', text: '[Designer Name]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'UI/UX Design', size: 18 },
    { type: 'name', text: '[UI Designer Name]', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'ART & VISUALS', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Character Design', size: 18 },
    { type: 'name', text: '[Artist Name]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Background Art', size: 18 },
    { type: 'name', text: '[Background Artist]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Animation', size: 18 },
    { type: 'name', text: '[Animator Name]', size: 16 },
    { type: 'spacer', text: '', size: 20 },
    { type: 'section', text: 'AUDIO & MUSIC', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'credit', text: 'Music Composition', size: 18 },
    { type: 'name', text: '[Composer Name]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'credit', text: 'Sound Effects', size: 18 },
    { type: 'name', text: '[Sound Designer]', size: 16 },
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
    { type: 'name', text: '[Special Thanks Name 1]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: '[Special Thanks Name 2]', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: '[Special Thanks Name 3]', size: 16 },
    { type: 'spacer', text: '', size: 30 },
    { type: 'section', text: 'INSPIRED BY', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'Sega AM2 Classics', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Retro Gaming Era', size: 16 },
    { type: 'spacer', text: '', size: 30 },
    { type: 'section', text: 'TECHNOLOGIES', size: 24 },
    { type: 'spacer', text: '', size: 10 },
    { type: 'name', text: 'React Native', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Expo', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'React Native Reanimated', size: 16 },
    { type: 'spacer', text: '', size: 5 },
    { type: 'name', text: 'Expo AV', size: 16 },
    { type: 'spacer', text: '', size: 30 },
    { type: 'section', text: '© 2024 QTE SERIES', size: 20 },
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
    // Start with background and thank you message fade in
    backgroundOpacity.value = withTiming(1, { duration: 2000 });
    thankYouOpacity.value = withTiming(1, { duration: 2000 }, finished => {
      if (finished) {
        // After background fades in, start the scroll animation
        scrollY.value = withTiming(
          -screenHeight * 2, // Scroll up beyond the screen
          { duration: 30000 }, // 30 seconds duration
          finished => {
            if (finished) {
              runOnJS(handleScrollComplete)();
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
      {/* Background Image */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <ImageBackground
          source={require('../../assets/main_menu/boxer-credits.jpg')}
          style={styles.backgroundImage}
          resizeMode="contain"
        >
          {/* Thank You Message (behind credits) */}
          <Animated.View style={[styles.thankYouContainer, thankYouAnimatedStyle]}>
            <Text style={styles.thankYouText}>Thank You For Playing</Text>
          </Animated.View>

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
        </ImageBackground>
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
    backgroundColor: '#1a1a2e',
  },
  backgroundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 0, 255, 0.8)',
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
    backgroundColor: 'rgba(0, 255, 255, 0.8)',
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
  thankYouContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  thankYouText: {
    color: '#ffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default CreditsScreen;
