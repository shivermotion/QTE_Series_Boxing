import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface TestArrowProps {
  direction: 'left' | 'right' | 'up' | 'down';
  isActive: boolean;
}

const TestArrow: React.FC<TestArrowProps> = ({ direction, isActive }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Initial appearance animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const getArrowSymbol = () => {
    switch (direction) {
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getArrowColor = () => {
    switch (direction) {
      case 'left':
        return '#ff6b6b'; // Red
      case 'right':
        return '#4ecdc4'; // Teal
      case 'up':
        return '#45b7d1'; // Blue
      case 'down':
        return '#96ceb4'; // Green
      default:
        return '#ffffff';
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.arrowSymbol,
          {
            color: getArrowColor(),
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            opacity: opacityAnim,
          },
        ]}
      >
        {getArrowSymbol()}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  arrowSymbol: {
    fontSize: 200,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
  },
});

export default TestArrow;
