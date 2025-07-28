import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { TimingPrompt as TimingPromptType } from '../types/game';

// ============================================================================
// TIMING PROMPT COMPONENT
// ============================================================================

interface TimingPromptProps {
  prompt: TimingPromptType;
  onMiss: () => void;
  onSuccess: (hitQuality: 'perfect' | 'good') => void;
  isPaused: boolean;
  globalPausedDuration: number;
}

// Screen dimensions are no longer needed since we're positioning within the input area
const CIRCLE_SIZE = 60;
const RING_THICKNESS = 6;
const MAX_RING_DISTANCE = 80; // Maximum distance ring starts from circle
const PERFECT_WINDOW_DURATION = 300; // 300ms perfect timing window for timing prompts

// Grid layout for 3x3 grid within the 400x400 input area
const GRID_POSITIONS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
];

const INPUT_AREA_SIZE = 400; // Size of the green input area
const GRID_SIZE = 100; // Size of each grid cell
const GRID_SPACING = 20; // Spacing between grid cells

const TimingPrompt: React.FC<TimingPromptProps> = ({
  prompt,
  onMiss,
  onSuccess,
  isPaused,
  globalPausedDuration,
}) => {
  const ringDistance = useSharedValue(MAX_RING_DISTANCE);
  const ringOpacity = useSharedValue(1);
  const circleScale = useSharedValue(1);
  const hasTriggeredMiss = useRef(false);
  const hasStartedAnimation = useRef(false);
  const hasCompletedSuccessfully = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation duration based on prompt duration
  const animationDuration = prompt.duration;

  // Calculate position based on grid position within the 400x400 input area
  const gridPos = GRID_POSITIONS[prompt.gridPosition];

  // Calculate the total grid area size
  const totalGridWidth = GRID_SIZE * 3 + GRID_SPACING * 2;
  const totalGridHeight = GRID_SIZE * 3 + GRID_SPACING * 2;

  // Calculate the offset to center the grid within the input area
  const gridOffsetX = (INPUT_AREA_SIZE - totalGridWidth) / 2;
  const gridOffsetY = (INPUT_AREA_SIZE - totalGridHeight) / 2;

  // Calculate the center position within the input area
  const centerX = gridOffsetX + gridPos.x * (GRID_SIZE + GRID_SPACING) + GRID_SIZE / 2;
  const centerY = gridOffsetY + gridPos.y * (GRID_SIZE + GRID_SPACING) + GRID_SIZE / 2;

  // Handle pause/resume - cancel and restart animation
  useEffect(() => {
    if (isPaused) {
      // Game paused - cancel animation
      console.log('🎯 Timing prompt pausing animation for prompt:', prompt.gridPosition);
      cancelAnimation(ringDistance);
      cancelAnimation(circleScale);
    } else if (
      hasStartedAnimation.current &&
      !hasTriggeredMiss.current &&
      !hasCompletedSuccessfully.current
    ) {
      // Game resumed - restart animation with remaining duration
      const now = Date.now();
      const elapsedBeforePause = now - prompt.startTime - globalPausedDuration;
      const remainingDuration = animationDuration - elapsedBeforePause;

      console.log('🎯 Timing prompt resuming animation for prompt:', prompt.gridPosition, {
        now,
        promptStartTime: prompt.startTime,
        globalPausedDuration,
        elapsedBeforePause,
        remainingDuration,
        animationDuration,
        progress: elapsedBeforePause / animationDuration,
      });

      if (remainingDuration > 0) {
        // Calculate the target ring distance based on progress
        const progress = elapsedBeforePause / animationDuration;
        const currentDistance = MAX_RING_DISTANCE - (MAX_RING_DISTANCE - RING_THICKNESS) * progress;

        // Set the current ring distance and then animate to the end
        ringDistance.value = currentDistance;

        // Resume animation from current position
        ringDistance.value = withTiming(
          RING_THICKNESS,
          { duration: remainingDuration },
          finished => {
            if (finished && !hasTriggeredMiss.current && !hasCompletedSuccessfully.current) {
              console.log(
                '🎯 Timing prompt animation finished - triggering miss for prompt:',
                prompt.gridPosition
              );
              hasTriggeredMiss.current = true;
              runOnJS(onMiss)();
            }
          }
        );
      } else {
        console.log(
          '🎯 Timing prompt remaining duration <= 0, not resuming animation for prompt:',
          prompt.gridPosition
        );
        // If no remaining duration, trigger miss immediately
        if (!hasTriggeredMiss.current && !hasCompletedSuccessfully.current) {
          hasTriggeredMiss.current = true;
          runOnJS(onMiss)();
        }
      }
    }
  }, [isPaused]); // Only depend on isPaused, not globalPausedDuration

  useEffect(() => {
    // Only start animation once and only if not paused
    if (hasStartedAnimation.current || isPaused) return;
    hasStartedAnimation.current = true;

    console.log('🎯 Starting timing prompt animation for prompt:', prompt.gridPosition, {
      animationDuration,
      isPaused,
      globalPausedDuration,
      startTime: prompt.startTime,
    });

    try {
      // Start ring shrinking animation
      // The ring should shrink to align with the green border (perfect timing window)
      ringDistance.value = withTiming(
        RING_THICKNESS, // Shrink to align with the green border, not the circle edge
        { duration: animationDuration },
        finished => {
          if (finished && !hasTriggeredMiss.current && !hasCompletedSuccessfully.current) {
            // Ring has finished shrinking - auto miss (only if not already completed)
            console.log(
              '🎯 Timing prompt animation completed - triggering miss for prompt:',
              prompt.gridPosition
            );
            hasTriggeredMiss.current = true;
            runOnJS(onMiss)();
          }
        }
      );

      // Add pulse effect to circle
      circleScale.value = withTiming(1.1, { duration: 500 }, finished => {
        'worklet';
        if (finished) {
          circleScale.value = withTiming(1, { duration: 500 });
        }
      });
    } catch (error) {
      console.log('🎯 ERROR in timing prompt useEffect:', error);
      // Fallback to miss if there's an error
      hasTriggeredMiss.current = true;
      onMiss();
    }
  }, [animationDuration, onMiss, isPaused]);

  const ringStyle = useAnimatedStyle(() => {
    'worklet';
    // Simple ring style - no color changes based on timing
    return {
      position: 'absolute',
      width: CIRCLE_SIZE + ringDistance.value * 2,
      height: CIRCLE_SIZE + ringDistance.value * 2,
      borderRadius: (CIRCLE_SIZE + ringDistance.value * 2) / 2,
      borderWidth: RING_THICKNESS,
      borderColor: '#ff4444', // Consistent red color
      opacity: ringOpacity.value,
    };
  }, []);

  const circleStyle = useAnimatedStyle(() => {
    'worklet';
    // Simple circle style - no green border
    return {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: '#ff4444',
      borderWidth: 0, // No border
      transform: [{ scale: circleScale.value }],
    };
  }, []);

  const handleTap = () => {
    if (hasTriggeredMiss.current || isPaused) return;

    try {
      const now = Date.now();
      // Adjust timing calculation to account for paused duration
      const actualTimeSinceStart = now - prompt.startTime - globalPausedDuration;

      console.log('🎯 Timing prompt tapped:', {
        gridPosition: prompt.gridPosition,
        timeSinceStart: actualTimeSinceStart,
        perfectWindowStart: prompt.perfectWindowStart,
        perfectWindowEnd: prompt.perfectWindowEnd,
        goodEarlyStart: prompt.goodEarlyStart,
        goodEarlyEnd: prompt.goodEarlyEnd,
        goodLateStart: prompt.goodLateStart,
        goodLateEnd: prompt.goodLateEnd,
        ringDistance: ringDistance.value,
        globalPausedDuration,
        originalPerfectStart: prompt.perfectWindowStart,
        originalPerfectEnd: prompt.perfectWindowEnd,
        isPaused,
      });

      // Multi-tier timing window check - use original timing windows
      if (
        actualTimeSinceStart >= prompt.perfectWindowStart &&
        actualTimeSinceStart <= prompt.perfectWindowEnd
      ) {
        // Perfect timing
        console.log('🎯 PERFECT TIMING!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('perfect');
      } else if (
        actualTimeSinceStart >= prompt.goodEarlyStart &&
        actualTimeSinceStart < prompt.goodEarlyEnd
      ) {
        // Good timing (early)
        console.log('🎯 GOOD TIMING (early)!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('good');
      } else if (
        actualTimeSinceStart >= prompt.goodLateStart &&
        actualTimeSinceStart <= prompt.goodLateEnd
      ) {
        // Good timing (late)
        console.log('🎯 GOOD TIMING (late)!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('good');
      } else if (actualTimeSinceStart < prompt.goodEarlyStart) {
        // Early miss (too early)
        console.log('🎯 EARLY MISS (too early)');
        hasTriggeredMiss.current = true;
        onMiss();
      } else {
        // Late miss (too late)
        console.log('🎯 LATE MISS (too late)');
        hasTriggeredMiss.current = true;
        onMiss();
      }
    } catch (error) {
      console.log('🎯 ERROR in timing prompt handleTap:', error);
      // Fallback to miss if there's an error
      hasTriggeredMiss.current = true;
      onMiss();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { left: centerX - CIRCLE_SIZE / 2, top: centerY - CIRCLE_SIZE / 2 },
      ]}
    >
      {/* Success feedback overlay */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Text style={styles.successText}>✓</Text>
          </View>
        </View>
      )}

      <Animated.View style={[styles.ringContainer, ringStyle]}>
        <Animated.View style={[styles.circleContainer, circleStyle]} />
      </Animated.View>
      <TouchableOpacity style={styles.tapArea} onPress={handleTap} activeOpacity={0.7}>
        {/* Tap area - transparent overlay */}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapArea: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },

  successOverlay: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  successText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TimingPrompt;
