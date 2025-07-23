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

const TimingPrompt: React.FC<TimingPromptProps> = ({ prompt, onMiss, onSuccess }) => {
  const ringDistance = useSharedValue(MAX_RING_DISTANCE);
  const ringOpacity = useSharedValue(1);
  const circleScale = useSharedValue(1);
  const hasTriggeredMiss = useRef(false);
  const hasStartedAnimation = useRef(false);
  const hasCompletedSuccessfully = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation duration based on prompt duration
  const animationDuration = prompt.duration;

  // Calculate perfect timing window
  const perfectWindowStart = prompt.perfectWindowStart;
  const perfectWindowEnd = prompt.perfectWindowEnd;

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

  useEffect(() => {
    // Only start animation once
    if (hasStartedAnimation.current) return;
    hasStartedAnimation.current = true;

    try {
      // Start ring shrinking animation
      // The ring should shrink to align with the green border (perfect timing window)
      ringDistance.value = withTiming(
        RING_THICKNESS, // Shrink to align with the green border, not the circle edge
        { duration: animationDuration },
        finished => {
          if (finished && !hasTriggeredMiss.current && !hasCompletedSuccessfully.current) {
            // Ring has finished shrinking - auto miss (only if not already completed)
            hasTriggeredMiss.current = true;
            runOnJS(onMiss)();
          }
        }
      );

      // Add pulse effect to circle
      circleScale.value = withTiming(1.1, { duration: 500 }, () => {
        circleScale.value = withTiming(1, { duration: 500 });
      });
    } catch (error) {
      console.log('🎯 ERROR in timing prompt useEffect:', error);
      // Fallback to miss if there's an error
      hasTriggeredMiss.current = true;
      onMiss();
    }
  }, [animationDuration, onMiss]);

  const ringStyle = useAnimatedStyle(() => {
    // Simple time-based color logic
    const now = Date.now();
    const timeSinceStart = now - prompt.startTime;

    // Determine color based on timing windows
    let borderColor = '#ff4444'; // Default red (miss)

    if (timeSinceStart >= prompt.goodEarlyStart && timeSinceStart <= prompt.goodLateEnd) {
      // In good timing window
      if (
        timeSinceStart >= prompt.perfectWindowStart &&
        timeSinceStart <= prompt.perfectWindowEnd
      ) {
        borderColor = '#00ff00'; // Perfect timing (green)
      } else {
        borderColor = '#ffff00'; // Good timing (yellow)
      }
    }

    return {
      position: 'absolute',
      width: CIRCLE_SIZE + ringDistance.value * 2,
      height: CIRCLE_SIZE + ringDistance.value * 2,
      borderRadius: (CIRCLE_SIZE + ringDistance.value * 2) / 2,
      borderWidth: RING_THICKNESS,
      borderColor: borderColor,
      opacity: ringOpacity.value,
    };
  }, []);

  const circleStyle = useAnimatedStyle(() => {
    // Simple time-based perfect zone detection
    const now = Date.now();
    const timeSinceStart = now - prompt.startTime;

    const isInPerfectZone =
      timeSinceStart >= prompt.perfectWindowStart && timeSinceStart <= prompt.perfectWindowEnd;
    const borderColor = isInPerfectZone ? '#00ff00' : '#00aa00'; // Brighter green when in perfect zone

    return {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: '#ff4444',
      borderWidth: RING_THICKNESS,
      borderColor: borderColor,
      shadowColor: isInPerfectZone ? '#00ff00' : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isInPerfectZone ? 0.8 : 0,
      shadowRadius: 8,
      transform: [{ scale: circleScale.value }],
    };
  }, []);

  const handleTap = () => {
    if (hasTriggeredMiss.current) return;

    try {
      const now = Date.now();
      const timeSinceStart = now - prompt.startTime;

      // Simple time-based perfect zone detection
      const isInPerfectZone =
        timeSinceStart >= prompt.perfectWindowStart && timeSinceStart <= prompt.perfectWindowEnd;

      console.log('🎯 Timing prompt tapped:', {
        gridPosition: prompt.gridPosition,
        timeSinceStart,
        perfectWindowStart: prompt.perfectWindowStart,
        perfectWindowEnd: prompt.perfectWindowEnd,
        goodEarlyStart: prompt.goodEarlyStart,
        goodEarlyEnd: prompt.goodEarlyEnd,
        goodLateStart: prompt.goodLateStart,
        goodLateEnd: prompt.goodLateEnd,
        ringDistance: ringDistance.value,
        isInPerfectZone,
      });

      // Multi-tier timing window check
      if (
        timeSinceStart >= prompt.perfectWindowStart &&
        timeSinceStart <= prompt.perfectWindowEnd
      ) {
        // Perfect timing
        console.log('🎯 PERFECT TIMING!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('perfect');
      } else if (timeSinceStart >= prompt.goodEarlyStart && timeSinceStart < prompt.goodEarlyEnd) {
        // Good timing (early)
        console.log('🎯 GOOD TIMING (early)!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('good');
      } else if (timeSinceStart >= prompt.goodLateStart && timeSinceStart <= prompt.goodLateEnd) {
        // Good timing (late)
        console.log('🎯 GOOD TIMING (late)!');
        hasTriggeredMiss.current = true;
        hasCompletedSuccessfully.current = true; // Mark as completed successfully
        cancelAnimation(ringDistance); // Stop the ring animation
        setShowSuccess(true); // Show success feedback
        onSuccess('good');
      } else if (timeSinceStart < prompt.goodEarlyStart) {
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
