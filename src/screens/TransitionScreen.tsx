import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TransitionScreenProps {
  onTransitionComplete: () => void;
  transitionImage?: any; // Image source for the transition
  loadingDuration?: number; // Duration to show the spinner (ms)
  wipeDuration?: number; // Duration of the wipe animation (ms)
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({
  onTransitionComplete,
  transitionImage,
  loadingDuration = 2000,
  wipeDuration = 800,
}) => {
  // Animation values
  const wipeAnim = useRef(new Animated.Value(0)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const spinnerScale = useRef(new Animated.Value(0.5)).current;

  // State
  const [showSpinner, setShowSpinner] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    startTransition();
  }, []);

  const startTransition = () => {
    // Step 1: Wipe in from right to center
    Animated.timing(wipeAnim, {
      toValue: 1,
      duration: wipeDuration,
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Mark initial wipe as complete
      const initialWipeCompleteHandler = (global as any).__initialWipeCompleteHandler;
      if (initialWipeCompleteHandler) {
        initialWipeCompleteHandler();
      }

      // Step 3: Show spinner when wipe reaches center
      setShowSpinner(true);
      showSpinnerAnimation();

      // Step 4: Trigger target screen mounting (after wipe is complete, with a small delay)
      setTimeout(() => {
        const mountTargetHandler = (global as any).__mountTargetHandler;
        if (mountTargetHandler) {
          mountTargetHandler();
        }
      }, 100); // Small delay to ensure wipe is fully complete

      // Step 5: Wait for loading duration, then hide spinner
      setTimeout(() => {
        hideSpinnerAnimation();
        setTimeout(() => {
          // Step 6: Wipe out to left
          Animated.timing(wipeAnim, {
            toValue: 2,
            duration: wipeDuration,
            useNativeDriver: true,
          }).start(() => {
            // Step 7: Transition complete
            setIsTransitioning(false);
            // Call the global completion handler
            const completionHandler = (global as any).__transitionCompleteHandler;
            if (completionHandler) {
              completionHandler();
            }
            onTransitionComplete();
          });
        }, 300); // Small delay after spinner hides
      }, loadingDuration);
    });
  };

  const showSpinnerAnimation = () => {
    Animated.parallel([
      Animated.timing(spinnerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(spinnerScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSpinnerAnimation = () => {
    Animated.parallel([
      Animated.timing(spinnerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(spinnerScale, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSpinner(false);
    });
  };

  // Calculate wipe position
  const getWipePosition = () => {
    return wipeAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [screenWidth, 0, -screenWidth],
    });
  };

  // Calculate wipe opacity for smooth transition
  const getWipeOpacity = () => {
    return wipeAnim.interpolate({
      inputRange: [0, 0.1, 1.9, 2],
      outputRange: [0, 1, 1, 0],
    });
  };

  if (!isTransitioning) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Transition Image with Wipe Effect */}
      <Animated.View
        style={[
          styles.transitionImageContainer,
          {
            transform: [{ translateX: getWipePosition() }],
            opacity: getWipeOpacity(),
          },
        ]}
      >
        {/* White background */}
        <View style={styles.whiteBackground} />

        {transitionImage ? (
          <Animated.Image
            source={transitionImage}
            style={styles.transitionImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#ff00ff', '#00ffff', '#ff8800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.transitionImage}
          />
        )}
      </Animated.View>

      {/* Spinning Activity Indicator */}
      {showSpinner && (
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              opacity: spinnerOpacity,
              transform: [{ scale: spinnerScale }],
            },
          ]}
        >
          <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        </Animated.View>
      )}
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
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  transitionImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  whiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  transitionImage: {
    width: '100%',
    height: '100%',
  },
  spinnerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  spinner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 20,
  },
});

export default TransitionScreen;
