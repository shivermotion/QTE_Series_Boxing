import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';

interface PostLevelScreenProps {
  level: number;
  score: number;
  onChooseLevel: () => void;
  onReturnToMenu: () => void;
}

// Screen dimensions available if needed for future use

const PostLevelScreen: React.FC<PostLevelScreenProps> = ({
  level,
  score,
  onChooseLevel,
  onReturnToMenu,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, textSlideAnim]);

  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Background overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.levelCompleteText}>LEVEL {level} COMPLETE!</Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>{formatScore(score)}</Text>
          </View>

          <Text style={styles.congratsText}>Congratulations! You've defeated your opponent!</Text>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.nextLevelButton]}
            onPress={onChooseLevel}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Choose Level</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.menuButton]}
            onPress={onReturnToMenu}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
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
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  levelCompleteText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00ff00',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    marginBottom: 40,
    letterSpacing: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  congratsText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 140,
    alignItems: 'center',
  },
  nextLevelButton: {
    backgroundColor: '#00ff00',
    borderColor: '#ffffff',
  },
  menuButton: {
    backgroundColor: '#ff4444',
    borderColor: '#ffffff',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default PostLevelScreen;
