import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, ActivityIndicator, Image } from 'react-native';

interface TransitionScreenProps {
  onComplete: () => void;
  transitionImage?: any; // Optional image behind spinner (unused now)
  loadingDuration?: number; // Duration to show the spinner (ms)
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({
  onComplete,
  transitionImage,
  loadingDuration = 2000,
}) => {
  // Spinner animations
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const spinnerScale = useRef(new Animated.Value(0.5)).current;
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
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

    const timer = setTimeout(() => {
      setShowSpinner(false);
      onComplete();
    }, loadingDuration);

    return () => clearTimeout(timer);
  }, [loadingDuration, onComplete, spinnerOpacity, spinnerScale]);

  return (
    <View style={styles.container}>
      {/* White background */}
      <View style={styles.whiteBackground} />

      {/* Paper texture overlay */}
      <Image
        source={require('../../assets/transition_screen/paper_texture.png')}
        style={styles.paperTexture}
        resizeMode="cover"
      />

      {/* Spinner */}
      {showSpinner && (
        <Animated.View
          style={{
            opacity: spinnerOpacity,
            transform: [{ scale: spinnerScale }],
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <ActivityIndicator size="large" color="#000000" style={styles.spinner} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  spinner: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
  },
});

export default TransitionScreen;
