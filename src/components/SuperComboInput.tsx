import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { findSuperMoveByCombo, SuperMove } from '../data/superMoves';

interface SuperComboInputProps {
  isActive: boolean;
  onComboComplete: (superMove: SuperMove | null) => void;
  onComboProgress: (currentCombo: string[]) => void;
}

const SuperComboInput: React.FC<SuperComboInputProps> = ({
  isActive,
  onComboComplete,
  onComboProgress,
}) => {
  const [currentCombo, setCurrentCombo] = useState<('up' | 'down' | 'left' | 'right')[]>([]);
  const [comboDisplay, setComboDisplay] = useState<string[]>([]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Reset combo when super mode starts
  useEffect(() => {
    if (isActive) {
      setCurrentCombo([]);
      setComboDisplay([]);
      onComboProgress([]);
    }
  }, [isActive]);

  const addToCombo = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isActive) return;

    const newCombo = [...currentCombo, direction];
    setCurrentCombo(newCombo);

    // Update display
    const directionSymbols = {
      up: '↑',
      down: '↓',
      left: '←',
      right: '→',
    };
    const newDisplay = [...comboDisplay, directionSymbols[direction]];
    setComboDisplay(newDisplay);

    onComboProgress(newDisplay);

    // Check if combo is complete (3 swipes)
    if (newCombo.length === 3) {
      const superMove = findSuperMoveByCombo(newCombo);
      onComboComplete(superMove);

      // Reset for next combo
      setTimeout(() => {
        setCurrentCombo([]);
        setComboDisplay([]);
        onComboProgress([]);
      }, 1000);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: event => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Determine swipe direction based on distance and velocity
      const minDistance = 50;
      const minVelocity = 500;

      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (Math.abs(translationX) > minDistance && Math.abs(velocityX) > minVelocity) {
          if (translationX > 0) {
            runOnJS(addToCombo)('right');
          } else {
            runOnJS(addToCombo)('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(translationY) > minDistance && Math.abs(velocityY) > minVelocity) {
          if (translationY > 0) {
            runOnJS(addToCombo)('down');
          } else {
            runOnJS(addToCombo)('up');
          }
        }
      }

      // Reset position
      translateX.value = 0;
      translateY.value = 0;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  if (!isActive) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.comboDisplay}>
          <Text style={styles.comboTitle}>SUPER COMBO INPUT</Text>
          <View style={styles.comboArrows}>
            {comboDisplay.map((arrow, index) => (
              <Text key={index} style={styles.arrow}>
                {arrow}
              </Text>
            ))}
            {[...Array(3 - comboDisplay.length)].map((_, index) => (
              <Text key={`empty-${index}`} style={styles.emptyArrow}>
                ?
              </Text>
            ))}
          </View>
          <Text style={styles.instruction}>Swipe in any direction to input your combo</Text>
        </View>

        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.gestureArea, animatedStyle]}>
            <View style={styles.gestureIndicator} />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboDisplay: {
    alignItems: 'center',
    marginBottom: 100,
  },
  comboTitle: {
    color: '#ffff00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  comboArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  arrow: {
    color: '#00ff00',
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: 10,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  emptyArrow: {
    color: '#666666',
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  instruction: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  gestureArea: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#ffff00',
  },
});

export default SuperComboInput;
