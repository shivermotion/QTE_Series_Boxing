import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated as RNAnimated,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
// @ts-ignore: Skia version may not export these in some setups
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CutsceneImage {
  image: any;
  transition?: string;
  params?: any;
}

interface CutsceneScreenProps {
  images: CutsceneImage[];
  onFinish: () => void;
  autoAdvanceDelay?: number; // ms per image
}

// --- Transition Components ---

const FadeTransition: React.FC<{
  visible: boolean;
  duration?: number;
  children: React.ReactNode;
}> = ({ visible, duration = 800, children }) => {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration });
  }, [visible, duration]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
};

const SlideLeftTransition: React.FC<{
  visible: boolean;
  duration?: number;
  children: React.ReactNode;
}> = ({ visible, duration = 800, children }) => {
  const translateX = useSharedValue(visible ? screenWidth : 0);
  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : -screenWidth, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
};

const ZoomInTransition: React.FC<{
  visible: boolean;
  duration?: number;
  children: React.ReactNode;
}> = ({ visible, duration = 800, children }) => {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withTiming(visible ? 1 : 0.7, { duration });
    opacity.value = withTiming(visible ? 1 : 0, { duration });
  }, [visible, duration]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
};

const transitionRegistry: Record<string, React.FC<any>> = {
  fade: FadeTransition,
  slideLeft: SlideLeftTransition,
  zoomIn: ZoomInTransition,
};

// --- Main CutsceneScreen ---

const SKIP_HOLD_DURATION = 900; // ms
const SKIP_METER_RADIUS = 18;
const SKIP_METER_STROKE = 4;

const CutsceneScreen: React.FC<CutsceneScreenProps> = ({
  images,
  onFinish,
  autoAdvanceDelay = 2200,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipping, setSkipping] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const skipHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const skipHoldActive = useRef(false);

  // Skip meter progress (0 to 1)
  const skipProgress = useSharedValue(0);
  const [skipProgressSkia, setSkipProgressSkia] = useState(0);
  const skipAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (skipAnimationRef.current) {
        clearInterval(skipAnimationRef.current);
      }
    };
  }, []);

  // Fade in on mount
  useEffect(() => {
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  // Auto-advance logic
  useEffect(() => {
    if (skipping) return;
    if (currentIndex >= images.length) return;
    const timer = setTimeout(() => {
      if (currentIndex < images.length - 1) {
        setCurrentIndex(idx => idx + 1);
      } else {
        handleFinish();
      }
    }, autoAdvanceDelay);
    return () => clearTimeout(timer);
  }, [currentIndex, skipping, images.length, autoAdvanceDelay]);

  // Fade out and finish
  const handleFinish = () => {
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  // Tap and hold skip logic
  const handleSkipPressIn = () => {
    skipHoldActive.current = true;
    setSkipProgressSkia(0);

    // Start smooth animation for skip meter
    const startTime = Date.now();
    skipAnimationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SKIP_HOLD_DURATION, 1);
      setSkipProgressSkia(progress);

      if (progress >= 1 && skipHoldActive.current) {
        setSkipping(true);
        handleFinish();
      }
    }, 16); // ~60fps
  };

  const handleSkipPressOut = () => {
    skipHoldActive.current = false;
    setSkipProgressSkia(0);

    // Clear the animation interval
    if (skipAnimationRef.current) {
      clearInterval(skipAnimationRef.current);
      skipAnimationRef.current = null;
    }

    if (skipHoldTimeout.current) clearTimeout(skipHoldTimeout.current);
  };

  // --- Render current image with transition ---
  const current = images[Math.min(currentIndex, images.length - 1)];
  const Transition =
    (current && current.transition && transitionRegistry[current.transition]) || FadeTransition;
  const params = (current && current.params) || {};

  // Skip meter arc calculation (manual, not useComputedValue)
  const getSkipMeterArc = () => {
    const startAngle = -90;
    const sweep = 360 * skipProgressSkia;
    const r = SKIP_METER_RADIUS;
    const cx = r + SKIP_METER_STROKE;
    const cy = r + SKIP_METER_STROKE;
    const path = Skia.Path.Make();
    path.addArc({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, startAngle, sweep);
    return path;
  };

  return (
    <RNAnimated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Transition visible={true} {...params}>
        <Image source={current.image} style={styles.image} resizeMode="cover" />
      </Transition>
      <TouchableOpacity
        style={styles.skipButton}
        onPressIn={handleSkipPressIn}
        onPressOut={handleSkipPressOut}
        activeOpacity={0.7}
      >
        <View style={styles.skipButtonInner}>
          <Text style={styles.skipButtonText}>Hold to skip</Text>
          <Canvas style={styles.skipMeterCanvas}>
            <Group>
              {/* Background circle */}
              <Circle
                cx={SKIP_METER_RADIUS + SKIP_METER_STROKE}
                cy={SKIP_METER_RADIUS + SKIP_METER_STROKE}
                r={SKIP_METER_RADIUS}
                color="#333"
                style="stroke"
                strokeWidth={SKIP_METER_STROKE}
              />
              {/* Foreground progress arc */}
              <Path
                path={getSkipMeterArc()}
                color="#fff"
                style="stroke"
                strokeWidth={SKIP_METER_STROKE}
                strokeCap="round"
              />
            </Group>
          </Canvas>
        </View>
      </TouchableOpacity>
    </RNAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  skipButton: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    zIndex: 101,
  },
  skipButtonInner: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 140,
  },
  skipButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
    marginRight: 8,
  },
  skipMeterCanvas: {
    width: SKIP_METER_RADIUS * 2 + SKIP_METER_STROKE * 2,
    height: SKIP_METER_RADIUS * 2 + SKIP_METER_STROKE * 2,
  },
});

export default CutsceneScreen;
