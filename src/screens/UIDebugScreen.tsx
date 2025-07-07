import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UIDebugScreenProps {
  onBackToMenu: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FeedbackText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

const UIDebugScreen: React.FC<UIDebugScreenProps> = ({ onBackToMenu }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<FeedbackText[]>([]);
  const [avatarState, setAvatarState] = useState<'idle' | 'success' | 'failure'>('idle');
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showHitZones, setShowHitZones] = useState(false);
  const [showTargets, setShowTargets] = useState(false);

  // Animation refs
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;
  const particleIdCounter = useRef(0);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < count; i++) {
      particleIdCounter.current += 1;
      newParticles.push({
        id: `particle_${timestamp}_${particleIdCounter.current}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createFeedbackText = (text: string, x: number, y: number, color: string) => {
    const feedback: FeedbackText = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      x,
      y,
      color,
      life: 1,
      maxLife: 1,
    };
    setFeedbackTexts(prev => [...prev, feedback]);
  };

  const screenShake = () => {
    Animated.sequence([
      Animated.timing(screenShakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCombo = () => {
    Animated.sequence([
      Animated.timing(comboScaleAnim, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(comboScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateAvatar = () => {
    Animated.sequence([
      Animated.timing(avatarScaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const testHit = () => {
    setAvatarState('success');
    setCombo(prev => prev + 1);
    setScore(prev => prev + 100);
    animateAvatar();
    if (combo >= 4) animateCombo();
    createParticles(screenWidth / 2, screenHeight * 0.2, '#00ff00', 8);
    createFeedbackText('PERFECT!', screenWidth / 2, screenHeight * 0.3, '#00ff00');
    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const testMiss = () => {
    setAvatarState('failure');
    setCombo(0);
    setLives(prev => Math.max(0, prev - 1));
    screenShake();
    createParticles(screenWidth / 2, screenHeight * 0.2, '#ff0000', 12);
    createFeedbackText('MISS!', screenWidth / 2, screenHeight * 0.3, '#ff0000');
    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const testPowerHit = () => {
    setAvatarState('success');
    setCombo(prev => prev + 1);
    setScore(prev => prev + 300);
    animateAvatar();
    if (combo >= 4) animateCombo();
    createParticles(screenWidth / 2, screenHeight * 0.2, '#00ff00', 8);
    createFeedbackText('PERFECT!', screenWidth / 2, screenHeight * 0.3, '#00ff00');
    createParticles(screenWidth / 2, screenHeight * 0.2, '#ff00ff', 16);
    createFeedbackText('POWER!', screenWidth / 2, screenHeight * 0.4, '#ff00ff');
    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const resetGame = () => {
    setCombo(0);
    setScore(0);
    setLives(3);
    setAvatarState('idle');
    setParticles([]);
    setFeedbackTexts([]);
  };

  const clearEffects = () => {
    setParticles([]);
    setFeedbackTexts([]);
  };

  const getAvatarColor = (): string => {
    switch (avatarState) {
      case 'success':
        return '#00ff00';
      case 'failure':
        return '#ff0000';
      default:
        return '#ffff00';
    }
  };

  const getLaneX = (lane: 'left' | 'center' | 'right'): number => {
    switch (lane) {
      case 'left':
        return screenWidth / 6;
      case 'center':
        return screenWidth / 2;
      case 'right':
        return (5 * screenWidth) / 6;
      default:
        return screenWidth / 2;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: screenShakeAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToMenu}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>UI Debug</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Game UI Display */}
      <View style={styles.gameUIDisplay}>
        <View style={styles.gameUI}>
          <Text style={styles.scoreText}>Score: {score.toString().padStart(6, '0')}</Text>
          <Text style={styles.livesText}>Lives: {lives}</Text>
        </View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatar,
            {
              backgroundColor: getAvatarColor(),
              transform: [{ scale: avatarScaleAnim }],
            },
          ]}
        />

        {/* Hit Zone */}
        {showHitZones && <View style={styles.hitZone} />}

        {/* Combo Display */}
        <Animated.View
          style={[
            styles.comboDisplay,
            {
              transform: [{ scale: comboScaleAnim }],
            },
          ]}
        >
          <Text style={styles.comboText}>Combo: {combo}</Text>
        </Animated.View>

        {/* Sample Targets */}
        {showTargets && (
          <>
            <View
              style={[
                styles.target,
                {
                  left: getLaneX('left') - 32,
                  top: screenHeight * 0.2 - 32,
                  backgroundColor: '#ff8800',
                  borderColor: '#ffaa00',
                },
              ]}
            />
            <View
              style={[
                styles.target,
                {
                  left: getLaneX('center') - 32,
                  top: screenHeight * 0.2 - 32,
                  backgroundColor: '#ff00ff',
                  borderColor: '#ffffff',
                },
              ]}
            />
            <View
              style={[
                styles.target,
                {
                  left: getLaneX('right') - 32,
                  top: screenHeight * 0.2 - 32,
                  backgroundColor: '#ff8800',
                  borderColor: '#ffaa00',
                },
              ]}
            />
          </>
        )}

        {/* Particles */}
        {particles.map(particle => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                opacity: particle.life,
              },
            ]}
          />
        ))}

        {/* Feedback Text */}
        {feedbackTexts.map(feedback => (
          <Text
            key={feedback.id}
            style={[
              styles.feedbackText,
              {
                left: feedback.x,
                top: feedback.y,
                color: feedback.color,
                opacity: feedback.life,
              },
            ]}
          >
            {feedback.text}
          </Text>
        ))}
      </View>

      {/* Control Panel */}
      <ScrollView style={styles.controlPanel}>
        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>

          <TouchableOpacity style={styles.testButton} onPress={testHit}>
            <Text style={styles.testButtonText}>Test Hit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testMiss}>
            <Text style={styles.testButtonText}>Test Miss</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testPowerHit}>
            <Text style={styles.testButtonText}>Test Power Hit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={screenShake}>
            <Text style={styles.testButtonText}>Test Screen Shake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.resetButton]} onPress={resetGame}>
            <Text style={styles.testButtonText}>Reset Game</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.clearButton]} onPress={clearEffects}>
            <Text style={styles.testButtonText}>Clear Effects</Text>
          </TouchableOpacity>
        </View>

        {/* Visual Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Elements</Text>

          <TouchableOpacity
            style={[styles.toggleButton, showHitZones && styles.toggleButtonActive]}
            onPress={() => setShowHitZones(!showHitZones)}
          >
            <Text style={styles.toggleButtonText}>
              {showHitZones ? 'Hide Hit Zones' : 'Show Hit Zones'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, showTargets && styles.toggleButtonActive]}
            onPress={() => setShowTargets(!showTargets)}
          >
            <Text style={styles.toggleButtonText}>
              {showTargets ? 'Hide Targets' : 'Show Targets'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game State</Text>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Avatar State:</Text>
            <Text style={styles.stateValue}>{avatarState.toUpperCase()}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Combo:</Text>
            <Text style={styles.stateValue}>{combo}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Score:</Text>
            <Text style={styles.stateValue}>{score}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Lives:</Text>
            <Text style={styles.stateValue}>{lives}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Particles:</Text>
            <Text style={styles.stateValue}>{particles.length}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Feedback Texts:</Text>
            <Text style={styles.stateValue}>{feedbackTexts.length}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            • Use test buttons to trigger different game events{'\n'}• Toggle visual elements on/off
            {'\n'}• Watch particles and feedback text animations{'\n'}• Monitor game state changes
            {'\n'}• Test screen shake and avatar animations{'\n'}• Reset to clear all effects
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
  },
  backButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  gameUIDisplay: {
    height: screenHeight * 0.4,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#333',
    margin: 10,
    borderRadius: 8,
  },
  gameUI: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scoreText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  livesText: {
    color: '#ff8800',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    position: 'absolute',
    top: 20,
    left: screenWidth / 2 - 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  hitZone: {
    position: 'absolute',
    top: screenHeight * 0.15,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00ffff',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ffff00',
  },
  comboDisplay: {
    position: 'absolute',
    top: 80,
    left: screenWidth / 2 - 50,
    alignItems: 'center',
  },
  comboText: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  target: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedbackText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlPanel: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#ff8800',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  resetButton: {
    backgroundColor: '#ff0000',
    borderColor: '#ffff00',
  },
  clearButton: {
    backgroundColor: '#666666',
    borderColor: '#ffffff',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
  },
  toggleButtonActive: {
    backgroundColor: '#00ff00',
    borderColor: '#ff00ff',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stateLabel: {
    color: 'white',
    fontSize: 16,
  },
  stateValue: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default UIDebugScreen;
