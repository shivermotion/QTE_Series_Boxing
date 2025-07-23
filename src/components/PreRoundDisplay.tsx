import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Text as SkiaText,
  LinearGradient,
  vec,
  Group,
  Blur,
  Shadow,
} from '@shopify/react-native-skia';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================================
// PRE-ROUND DISPLAY COMPONENT
// ============================================================================

interface PreRoundDisplayProps {
  isPreRound: boolean;
  preRoundText: string;
  onPreRoundComplete: () => void;
}

const PreRoundDisplay: React.FC<PreRoundDisplayProps> = ({
  isPreRound,
  preRoundText,
  onPreRoundComplete,
}) => {
  // State for dynamic text changes
  const [displayText, setDisplayText] = React.useState(preRoundText);

  // Reanimated values for pre-round animations
  const preRoundScale = useSharedValue(0);
  const preRoundOpacity = useSharedValue(0);
  const preRoundRotation = useSharedValue(0);
  const preRoundBlur = useSharedValue(10);
  const flashOpacity = useSharedValue(0);

  const preRoundAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: preRoundScale.value }, { rotate: `${preRoundRotation.value}deg` }],
      opacity: preRoundOpacity.value,
    };
  });

  const flashAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: flashOpacity.value,
    };
  });

  const startPreRoundSequence = (roundNumber?: number) => {
    try {
      // Reset all animation values
      preRoundScale.value = 0;
      preRoundOpacity.value = 0;
      preRoundRotation.value = 0;
      preRoundBlur.value = 10;
      flashOpacity.value = 0;

      // Set initial text
      runOnJS(setDisplayText)(preRoundText);

      // Epic entrance animation
      preRoundScale.value = withSequence(
        withSpring(1.5, { damping: 8, stiffness: 100 }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
      );

      preRoundOpacity.value = withTiming(1, { duration: 300 });

      preRoundRotation.value = withSequence(
        withTiming(360, { duration: 500, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      );

      preRoundBlur.value = withTiming(0, { duration: 400 });

      // Flash effect
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );

      // Transition to "GET READY!"
      setTimeout(() => {
        try {
          runOnJS(setDisplayText)('GET READY!');
          preRoundScale.value = 0;
          preRoundRotation.value = -180;

          preRoundScale.value = withSequence(
            withSpring(1.8, { damping: 6, stiffness: 120 }),
            withTiming(1.2, { duration: 300 })
          );

          preRoundRotation.value = withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.cubic),
          });

          flashOpacity.value = withSequence(
            withTiming(0.6, { duration: 150 }),
            withTiming(0, { duration: 250 })
          );
        } catch (error) {
          console.log('🎬 ERROR in PreRoundDisplay GET READY transition:', error);
          runOnJS(onPreRoundComplete)();
        }
      }, 1500);

      // Transition to "FIGHT!"
      setTimeout(() => {
        try {
          runOnJS(setDisplayText)('FIGHT!');
          preRoundScale.value = 0;
          preRoundRotation.value = 0;

          preRoundScale.value = withSequence(
            withSpring(2.5, { damping: 4, stiffness: 150 }),
            withDelay(500, withTiming(0, { duration: 300 }))
          );

          preRoundOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withDelay(500, withTiming(0, { duration: 300 }))
          );

          flashOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 500 })
          );

          // End pre-round and start game
          setTimeout(() => {
            try {
              runOnJS(onPreRoundComplete)();
            } catch (error) {
              console.log('🎬 ERROR in PreRoundDisplay completion:', error);
            }
          }, 1000);
        } catch (error) {
          console.log('🎬 ERROR in PreRoundDisplay FIGHT transition:', error);
          runOnJS(onPreRoundComplete)();
        }
      }, 3000);
    } catch (error) {
      console.log('🎬 ERROR in PreRoundDisplay startPreRoundSequence:', error);
      // Fallback: immediately complete pre-round
      runOnJS(onPreRoundComplete)();
    }
  };

  // Start pre-round sequence when component mounts
  React.useEffect(() => {
    if (isPreRound) {
      try {
        console.log('🎬 PreRoundDisplay: Starting pre-round with text:', preRoundText);
        // Initialize display text with the prop value
        setDisplayText(preRoundText);
        startPreRoundSequence(1);
      } catch (error) {
        console.log('🎬 ERROR in PreRoundDisplay useEffect:', error);
        // Fallback: immediately complete pre-round
        onPreRoundComplete();
      }
    }
  }, [isPreRound, preRoundText]);

  if (!isPreRound) return null;

  return (
    <View style={styles.preRoundOverlay}>
      {/* Flash effect background */}
      <Animated.View style={[styles.flashBackground, flashAnimatedStyle]} />

      {/* Main text with Skia */}
      <Animated.View style={[styles.preRoundTextContainer, preRoundAnimatedStyle]}>
        {/* Fallback text - always show this to prevent crashes */}
        <Text style={styles.preRoundText}>{displayText}</Text>

        {/* Skia canvas - wrapped in try-catch */}
        {(() => {
          try {
            return (
              <Canvas style={styles.skiaCanvas}>
                <Group>
                  {/* Gradient background */}
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 200)}
                    colors={['#FFD700', '#FF6B00', '#FF0000']}
                  />

                  {/* Shadow effect */}
                  <SkiaText
                    x={screenWidth / 2}
                    y={100}
                    text={displayText}
                    font={null}
                    color="rgba(0,0,0,0.5)"
                    style="fill"
                  >
                    <Shadow dx={4} dy={4} blur={10} color="rgba(0,0,0,0.8)" />
                  </SkiaText>

                  {/* Main text with blur */}
                  <SkiaText
                    x={screenWidth / 2}
                    y={100}
                    text={displayText}
                    font={null}
                    color="#FFFFFF"
                    style="fill"
                  >
                    <Blur blur={preRoundBlur} />
                  </SkiaText>
                </Group>
              </Canvas>
            );
          } catch (error) {
            console.log('🎬 ERROR rendering Skia canvas:', error);
            return null; // Fallback to just the Text component
          }
        })()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  preRoundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  flashBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  preRoundTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skiaCanvas: {
    width: screenWidth,
    height: 200,
    position: 'absolute',
  },
  preRoundText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});

export default PreRoundDisplay;
