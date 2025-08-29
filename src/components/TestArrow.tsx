import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface TestArrowProps {
  direction: 'left' | 'right' | 'up' | 'down';
  isActive: boolean;
}

const TestArrow: React.FC<TestArrowProps> = ({ direction, isActive }) => {
  // Remove scale and pulse, only use opacity for blinking
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const blinkAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isActive) {
      // Instantly show at full size
      opacityAnim.setValue(1);
      // Start fast blinking
      blinkAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimRef.current.start();
    } else {
      // Hide and stop blinking
      if (blinkAnimRef.current) blinkAnimRef.current.stop();
      opacityAnim.setValue(0);
    }
    // Cleanup on unmount
    return () => {
      if (blinkAnimRef.current) blinkAnimRef.current.stop();
    };
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
    return '#ffffff';
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
            opacity: opacityAnim,
            // No scale or pulse
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
