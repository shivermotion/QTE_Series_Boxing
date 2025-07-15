import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottiePromptProps {
  type: 'tap' | 'swipe' | 'hold-and-flick';
  direction?: 'left' | 'right' | 'up' | 'down';
  isActive: boolean;
}

const LottiePrompt: React.FC<LottiePromptProps> = ({ type, direction, isActive }) => {
  const lottieRef = useRef<LottieView>(null);

  // Animation control methods
  const playAnimation = () => {
    lottieRef.current?.play();
  };

  const pauseAnimation = () => {
    lottieRef.current?.pause();
  };

  const resetAnimation = () => {
    lottieRef.current?.reset();
  };

  // Control animation based on isActive prop
  useEffect(() => {
    if (isActive) {
      console.log(`🎬 LottiePrompt activated - type: ${type}, direction: ${direction}`);
      // Small delay to ensure component is mounted
      setTimeout(() => {
        playAnimation();
      }, 100);
    } else {
      pauseAnimation();
    }
  }, [isActive, type, direction]);

  const getLottieSource = () => {
    try {
      switch (type) {
        case 'tap':
          return 'https://invalid-url-for-testing/tap-animation.lottie';
        case 'swipe':
          // All swipe directions use the same arrow.lottie file
          return require('../../assets/lottie/arrow.lottie');
        case 'hold-and-flick':
          return 'https://invalid-url-for-testing/hold-flick.lottie';
        default:
          return 'https://invalid-url-for-testing/tap-animation.lottie';
      }
    } catch (error) {
      console.log('❌ Error loading Lottie source:', error);
      return null;
    }
  };

  const getArrowRotation = () => {
    switch (direction) {
      case 'left':
        return '90deg'; // Rotate 90deg for left (from up)
      case 'right':
        return '270deg'; // Rotate 270deg for right (from up)
      case 'up':
        return '180deg'; // Rotate 180deg for up (from up)
      case 'down':
        return '0deg'; // Default arrow points down
      default:
        return '0deg';
    }
  };

  const getFallbackIcon = () => {
    switch (type) {
      case 'tap':
        return '👊';
      case 'swipe':
        switch (direction) {
          case 'left':
            return '⬅️';
          case 'right':
            return '➡️';
          case 'up':
            return '⬆️';
          case 'down':
            return '⬇️';
          default:
            return '➡️';
        }
      case 'hold-and-flick':
        return '⭕';
      default:
        return '❓';
    }
  };

  if (!isActive) {
    console.log('🚫 LottiePrompt not active, returning null');
    return null;
  }

  // Try to show Lottie animation, fallback to emoji if it fails
  const lottieSource = getLottieSource();

  return (
    <View style={styles.container}>
      {lottieSource && (
        <LottieView
          ref={lottieRef}
          source={lottieSource}
          loop
          autoPlay={false} // We control this manually with useEffect
          speed={1.2}
          style={[
            styles.lottieAnimation,
            type === 'swipe' && { transform: [{ rotate: getArrowRotation() }] },
          ]}
          onAnimationFailure={error => {
            console.log('❌ Lottie animation failed:', error);
          }}
        />
      )}

      {/* Fallback display - shown ONLY when Lottie fails */}
      {!lottieSource && (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackIcon}>{getFallbackIcon()}</Text>
          <Text style={styles.fallbackText}>
            {type === 'tap'
              ? 'TAP!'
              : type === 'swipe'
              ? `SWIPE ${direction?.toUpperCase()}!`
              : `HOLD & FLICK ${direction?.toUpperCase()}!`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 400,
    height: 400,
  },
  fallbackIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Very light red to show fallback
  },
  fallbackIndicator: {
    color: '#ff0000',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default LottiePrompt;
