import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface CooldownDisplayProps {
  isCooldown: boolean;
  cooldownTime: number;
  cooldownText: string;
}

const CooldownDisplay: React.FC<CooldownDisplayProps> = ({
  isCooldown,
  cooldownTime,
  cooldownText,
}) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCooldown) {
      // Start blinking animation
      const blinkSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      // Start scale animation for countdown
      const scaleSequence = Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      blinkSequence.start();
      scaleSequence.start();

      return () => {
        blinkSequence.stop();
        scaleSequence.stop();
      };
    } else {
      blinkAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [isCooldown, cooldownTime, blinkAnim, scaleAnim]);

  if (!isCooldown) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.cooldownText,
            {
              opacity: blinkAnim,
            },
          ]}
        >
          {cooldownText}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.countdownText,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {cooldownTime}
        </Animated.Text>
      </View>
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
    zIndex: 500,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    alignItems: 'center',
  },
  cooldownText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff8800',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    marginBottom: 20,
    letterSpacing: 2,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 4,
  },
});

export default CooldownDisplay;
