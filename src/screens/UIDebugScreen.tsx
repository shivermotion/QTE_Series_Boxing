import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';
import LottiePrompt from '../components/LottiePrompt';
import TapGrid from '../components/TapGrid';
import TestArrow from '../components/TestArrow';

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
  const { stopMainTheme } = useAudio();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<FeedbackText[]>([]);
  const [avatarState, setAvatarState] = useState<'idle' | 'success' | 'failure' | 'perfect'>(
    'idle'
  );
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [opponentHP, setOpponentHP] = useState(1000);
  const [currentRound, setCurrentRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [superMeter, setSuperMeter] = useState(0);
  const [isSuperComboActive, setIsSuperComboActive] = useState(false);
  const [showPreRound, setShowPreRound] = useState(false);
  const [preRoundText, setPreRoundText] = useState('ROUND 1');
  const [isPaused, setIsPaused] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<{
    type: 'tap' | 'swipe';
    direction?: 'left' | 'right' | 'up' | 'down';
    isActive: boolean;
  } | null>(null);
  const [testArrowDirection, setTestArrowDirection] = useState<
    'left' | 'right' | 'up' | 'down' | null
  >(null);
  const [activeTapPrompts, setActiveTapPrompts] = useState<
    {
      id: string;
      gridPosition: number;
      isActive: boolean;
      startTime: number;
      duration: number;
      isCompleted: boolean;
      isFeint: boolean;
    }[]
  >([]);
  const [showMissAnimation, setShowMissAnimation] = useState(false);

  // Animation for breathing glow effect
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Stop main theme when component mounts
  useEffect(() => {
    stopMainTheme();
  }, [stopMainTheme]);

  // Breathing glow animation
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  // Animation refs
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;
  const missXScaleAnim = useRef(new Animated.Value(0)).current;
  const missXOpacityAnim = useRef(new Animated.Value(0)).current;
  const particleIdCounter = useRef(0);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    console.log(`Creating ${count} particles with color ${color} at (${x}, ${y})`);
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
    console.log(`Creating feedback text: "${text}" with color ${color} at (${x}, ${y})`);
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
      // Initial strong shake to the right
      Animated.timing(screenShakeAnim, {
        toValue: 20,
        duration: 60,
        useNativeDriver: true,
      }),
      // Hang at right apex
      Animated.delay(60),
      // Spring back to the left
      Animated.timing(screenShakeAnim, {
        toValue: -25,
        duration: 55,
        useNativeDriver: true,
      }),
      // Hang at left apex
      Animated.delay(50),
      // Bounce back to the right
      Animated.timing(screenShakeAnim, {
        toValue: 18,
        duration: 50,
        useNativeDriver: true,
      }),
      // Hang at right apex
      Animated.delay(40),
      // Bounce to the left
      Animated.timing(screenShakeAnim, {
        toValue: -15,
        duration: 45,
        useNativeDriver: true,
      }),
      // Hang at left apex
      Animated.delay(30),
      // Bounce to the right
      Animated.timing(screenShakeAnim, {
        toValue: 10,
        duration: 40,
        useNativeDriver: true,
      }),
      // Hang at right apex
      Animated.delay(20),
      // Bounce to the left
      Animated.timing(screenShakeAnim, {
        toValue: -6,
        duration: 35,
        useNativeDriver: true,
      }),
      // Hang at left apex
      Animated.delay(15),
      // Final settle to center
      Animated.timing(screenShakeAnim, {
        toValue: 0,
        duration: 30,
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

  const animateMissX = () => {
    // Reset animations
    missXScaleAnim.setValue(0);
    missXOpacityAnim.setValue(0);

    // Animate X appearing with scale and opacity
    Animated.parallel([
      Animated.timing(missXScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(missXOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.log('Haptic error:', error);
    }
  };

  const testHit = () => {
    setAvatarState('success');
    setScore(prev => prev + 100);
    setOpponentHP(prev => Math.max(0, prev - 50));
    setSuperMeter(prev => Math.min(100, prev + 10));
    animateAvatar();
    triggerHaptic('medium');
    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const testMiss = () => {
    console.log('testMiss function called');
    // Clear any existing particles and feedback texts
    setParticles([]);
    setFeedbackTexts([]);

    setAvatarState('failure');
    setLives(prev => Math.max(0, prev - 1));
    screenShake();
    triggerHaptic('light');

    // Show big X animation
    setShowMissAnimation(true);
    animateMissX();

    // Hide X animation after 2 seconds
    setTimeout(() => {
      setShowMissAnimation(false);
    }, 2000);

    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const testPowerHit = () => {
    setAvatarState('perfect');
    setScore(prev => prev + 300);
    setOpponentHP(prev => Math.max(0, prev - 150));
    setSuperMeter(100);
    animateAvatar();
    triggerHaptic('heavy');
    createParticles(screenWidth / 2, screenHeight * 0.2, '#00ff00', 8);
    createFeedbackText('PERFECT!', screenWidth / 2, screenHeight * 0.3, '#00ff00');
    createParticles(screenWidth / 2, screenHeight * 0.2, '#ff00ff', 16);
    createFeedbackText('POWER!', screenWidth / 2, screenHeight * 0.4, '#ff00ff');
    setTimeout(() => setAvatarState('idle'), 1000);
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setOpponentHP(1000);
    setCurrentRound(1);
    setLevel(1);
    setSuperMeter(0);
    setIsSuperComboActive(false);
    setAvatarState('idle');
    setParticles([]);
    setFeedbackTexts([]);
  };

  const clearEffects = () => {
    setParticles([]);
    setFeedbackTexts([]);
  };

  const testHaptics = (type: 'light' | 'medium' | 'heavy') => {
    triggerHaptic(type);
    createFeedbackText(type.toUpperCase(), screenWidth / 2, screenHeight * 0.3, '#ffff00');
  };

  const testPreRound = () => {
    setShowPreRound(true);
    setPreRoundText('ROUND 1');
    triggerHaptic('heavy');
    setTimeout(() => {
      setPreRoundText('GET READY!');
      triggerHaptic('medium');
      setTimeout(() => {
        setPreRoundText('FIGHT!');
        triggerHaptic('medium');
        setTimeout(() => {
          setShowPreRound(false);
        }, 1000);
      }, 1500);
    }, 1500);
  };

  const testSuperCombo = () => {
    if (superMeter >= 100) {
      setSuperMeter(0);
      triggerHaptic('heavy');
      createFeedbackText('SUPER COMBO!', screenWidth / 2, screenHeight * 0.2, '#ff00ff');
      createParticles(screenWidth / 2, screenHeight * 0.2, '#ff00ff', 20);
    } else {
      triggerHaptic('light');
      createFeedbackText('NOT ENOUGH POWER!', screenWidth / 2, screenHeight * 0.3, '#ff8800');
    }
  };

  const testLottieSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    setTestArrowDirection(direction);
    setCurrentPrompt(null);
    setActiveTapPrompts([]);

    // No auto-clear - animation will loop until another is triggered
  };

  const testLottieTap = () => {
    setCurrentPrompt({
      type: 'tap',
      isActive: true,
    });
    setActiveTapPrompts([]);

    // No auto-clear - animation will loop until another is triggered
  };

  const testLottieTapGrid = () => {
    // Generate 1-3 random tap prompts
    const numPrompts = Math.floor(Math.random() * 3) + 1;
    const prompts = [];
    const usedPositions = new Set<number>();

    for (let i = 0; i < numPrompts; i++) {
      let position: number;
      do {
        position = Math.floor(Math.random() * 9); // 0-8 for 3x3 grid
      } while (usedPositions.has(position));

      usedPositions.add(position);
      prompts.push({
        id: `tap_${Date.now()}_${i}`,
        gridPosition: position,
        isActive: true,
        startTime: Date.now(),
        duration: 5000,
        isCompleted: false,
        isFeint: false,
      });
    }

    setActiveTapPrompts(prompts);
    setCurrentPrompt(null);

    // No auto-clear - animation will loop until another is triggered
  };

  const clearLottieAnimations = () => {
    setCurrentPrompt(null);
    setActiveTapPrompts([]);
    setTestArrowDirection(null);
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

      {/* Game UI Display - Simulating GameScreen Layout */}
      <View style={styles.gameUIDisplay}>
        {/* Top HUD - Opponent */}
        <View style={styles.topHud}>
          <View style={styles.opponentRow}>
            <View style={styles.opponentContainer}>
              <View style={styles.opponentTopRow}>
                <Text style={styles.opponentLabel}>OPPONENT</Text>
                <View style={styles.gameInfoInline}>
                  <Text style={styles.roundTextInline}>ROUND {currentRound}</Text>
                  <Text style={styles.levelTextInline}>LEVEL {level}</Text>
                </View>
              </View>
              <View style={styles.hpBar}>
                <LinearGradient
                  colors={['#ef4444', '#dc2626']} // Light red to dark red gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.hpFill,
                    {
                      width: `${(opponentHP / 1000) * 100}%`,
                      alignSelf: 'flex-end', // Anchor to right side
                    },
                  ]}
                />
                <View
                  style={[
                    styles.hpBorder,
                    {
                      width: `${(opponentHP / 1000) * 100}%`,
                      alignSelf: 'flex-end', // Anchor to right side
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.avatarContainer}>
              <Animated.Image
                source={require('../../assets/avatar/neutral.jpg')}
                style={[styles.avatar, { transform: [{ scale: avatarScaleAnim }] }]}
              />
            </View>
          </View>
        </View>

        {/* Bottom HUD - Player */}
        <View style={styles.bottomHud}>
          <View style={styles.playerRow}>
            <TouchableOpacity
              style={styles.playerAvatarContainer}
              onPress={() => {
                if (superMeter >= 100) {
                  setSuperMeter(0);
                  triggerHaptic('heavy');
                  createFeedbackText('SUPER!', screenWidth / 2, screenHeight * 0.2, '#ffff00');
                }
              }}
              activeOpacity={0.8}
            >
              <Animated.Image
                source={require('../../assets/avatar/neutral.jpg')}
                style={[
                  styles.avatar,
                  {
                    transform: [{ scale: avatarScaleAnim }],
                    borderWidth: 3,
                    borderColor: superMeter >= 100 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 32,
                  },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.playerContainer}>
              <View style={styles.playerTopRow}>
                <Text style={styles.playerLabel}>PLAYER</Text>
                <View style={styles.playerStatsInline}>
                  <Text style={styles.scoreTextInline}>{score}</Text>
                  <View style={styles.livesBar}>
                    {[1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.lifeSegment,
                          { backgroundColor: i <= lives ? '#00ff00' : '#333' },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.superMeterContainer}>
                <View style={styles.superMeterBar}>
                  {/* Glow effect underneath the meter - only left, top, bottom edges animate */}
                  <Animated.View
                    style={[
                      styles.superMeterGlow,
                      {
                        width: `${Math.max(superMeter, 5)}%`,
                        opacity: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                        transform: [
                          {
                            scaleX: glowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1.0, 1.05],
                            }),
                          },
                          {
                            scaleY: glowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1.0, 1.1],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <LinearGradient
                    colors={['#1e3a8a', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.superMeterFill, { width: `${superMeter}%` }]}
                  />
                  <Animated.View
                    style={[
                      styles.superMeterBorder,
                      {
                        width: `${Math.max(superMeter, 5)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

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

        {/* Lottie Animation Area */}
        <View style={styles.lottieArea}>
          {currentPrompt && currentPrompt.isActive && (
            <LottiePrompt
              type={currentPrompt.type}
              direction={currentPrompt.direction}
              isActive={currentPrompt.isActive}
            />
          )}
        </View>

        {/* Test Arrow Area */}
        {testArrowDirection && <TestArrow direction={testArrowDirection} isActive={true} />}

        {/* Tap Grid Area */}
        {activeTapPrompts.length > 0 && (
          <View style={styles.tapGridArea}>
            <TapGrid activeTapPrompts={activeTapPrompts} onGridTap={() => {}} />
          </View>
        )}

        {/* Miss Animation - Big X */}
        {showMissAnimation && (
          <View style={styles.missAnimationOverlay}>
            <Animated.Text
              style={[
                styles.missXText,
                {
                  transform: [{ scale: missXScaleAnim }],
                  opacity: missXOpacityAnim,
                },
              ]}
            >
              ✗
            </Animated.Text>
          </View>
        )}

        {/* Pre-round Overlay */}
        {showPreRound && (
          <View style={styles.preRoundOverlay}>
            <Text style={styles.preRoundText}>{preRoundText}</Text>
          </View>
        )}
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

          <TouchableOpacity style={[styles.testButton, styles.resetButton]} onPress={resetGame}>
            <Text style={styles.testButtonText}>Reset Game</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.clearButton]} onPress={clearEffects}>
            <Text style={styles.testButtonText}>Clear Effects</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testSuperCombo}>
            <Text style={styles.testButtonText}>Test Super Combo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              setSuperMeter(prev => Math.min(100, prev + 25));
              triggerHaptic('medium');
            }}
          >
            <Text style={styles.testButtonText}>Fill Super Meter (+25)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              setSuperMeter(50); // Set to 50% to see the glow effect clearly
              triggerHaptic('medium');
            }}
          >
            <Text style={styles.testButtonText}>Set Super Meter to 50%</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testPreRound}>
            <Text style={styles.testButtonText}>Test Pre-Round</Text>
          </TouchableOpacity>
        </View>

        {/* Game Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Controls</Text>

          <TouchableOpacity
            style={[styles.toggleButton, isPaused && styles.toggleButtonActive]}
            onPress={() => setIsPaused(!isPaused)}
          >
            <Text style={styles.toggleButtonText}>{isPaused ? 'Resume Game' : 'Pause Game'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, isSuperComboActive && styles.toggleButtonActive]}
            onPress={() => setIsSuperComboActive(!isSuperComboActive)}
          >
            <Text style={styles.toggleButtonText}>
              {isSuperComboActive ? 'Deactivate Super Combo' : 'Activate Super Combo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lottie Animation Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lottie Animations</Text>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieTap()}>
            <Text style={styles.lottieButtonText}>Test Tap Animation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieSwipe('left')}>
            <Text style={styles.lottieButtonText}>Test Swipe Left</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieSwipe('right')}>
            <Text style={styles.lottieButtonText}>Test Swipe Right</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieSwipe('up')}>
            <Text style={styles.lottieButtonText}>Test Swipe Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieSwipe('down')}>
            <Text style={styles.lottieButtonText}>Test Swipe Down</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lottieButton} onPress={() => testLottieTapGrid()}>
            <Text style={styles.lottieButtonText}>Test Tap Grid (1-3 taps)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lottieButton, styles.clearButton]}
            onPress={clearLottieAnimations}
          >
            <Text style={styles.lottieButtonText}>Stop All Animations</Text>
          </TouchableOpacity>
        </View>

        {/* Haptic Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haptic Testing</Text>

          <TouchableOpacity style={styles.hapticButton} onPress={() => testHaptics('light')}>
            <Text style={styles.hapticButtonText}>Light Impact</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hapticButton} onPress={() => testHaptics('medium')}>
            <Text style={styles.hapticButtonText}>Medium Impact</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.hapticButton} onPress={() => testHaptics('heavy')}>
            <Text style={styles.hapticButtonText}>Heavy Impact</Text>
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
            <Text style={styles.stateLabel}>Opponent HP:</Text>
            <Text style={styles.stateValue}>{opponentHP}</Text>
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
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Super Meter:</Text>
            <Text style={styles.stateValue}>{superMeter}%</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Current Round:</Text>
            <Text style={styles.stateValue}>{currentRound}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Level:</Text>
            <Text style={styles.stateValue}>{level}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Super Combo Active:</Text>
            <Text style={styles.stateValue}>{isSuperComboActive ? 'YES' : 'NO'}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Game Paused:</Text>
            <Text style={styles.stateValue}>{isPaused ? 'YES' : 'NO'}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Pre-Round Active:</Text>
            <Text style={styles.stateValue}>{showPreRound ? 'YES' : 'NO'}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Current Prompt:</Text>
            <Text style={styles.stateValue}>
              {currentPrompt ? `${currentPrompt.type} ${currentPrompt.direction || ''}` : 'NONE'}
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Test Arrow Direction:</Text>
            <Text style={styles.stateValue}>
              {testArrowDirection ? testArrowDirection.toUpperCase() : 'NONE'}
            </Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Active Tap Prompts:</Text>
            <Text style={styles.stateValue}>{activeTapPrompts.length}</Text>
          </View>
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Miss Animation Active:</Text>
            <Text style={styles.stateValue}>{showMissAnimation ? 'YES' : 'NO'}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            • Test hit/miss actions with haptic feedback{'\n'}• Test all Lottie animations (tap,
            swipe, grid) - animations loop until stopped
            {'\n'}• Test haptic feedback types{'\n'}• Test super combo and pre-round sequences
            {'\n'}• Monitor game state and particle effects{'\n'}• Toggle game controls (pause,
            super combo)
            {'\n'}• Use "Stop All Animations" to clear looping animations
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
    paddingTop: 60,
    paddingBottom: 15,
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
    height: screenHeight * 0.6,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#333',
    margin: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  topHud: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opponentContainer: {
    flex: 1,
  },
  opponentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  opponentLabel: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gameInfoInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundTextInline: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  levelTextInline: {
    color: '#ffffff',
    fontSize: 12,
  },
  hpBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 5,
    transform: [{ skewX: '20deg' }],
  },
  hpFill: {
    height: '100%',
  },
  hpBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    marginLeft: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHud: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerAvatarContainer: {
    width: 64,
    height: 64,
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerContainer: {
    flex: 1,
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  playerLabel: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerStatsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTextInline: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  livesBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  lifeSegment: {
    width: 20,
    height: 20,
    marginHorizontal: 2,
    borderRadius: 10,
  },
  superMeterContainer: {
    marginTop: 5,
  },
  superMeterBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 3,
    marginVertical: 5,
    transform: [{ skewX: '20deg' }],
  },
  superMeterFill: {
    height: '100%',
  },
  superMeterGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    height: 24, // Fixed height instead of calc
    backgroundColor: '#ffffff',
    borderRadius: 5,
    opacity: 0.6,
  },
  superMeterBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 3,
  },
  superButton: {
    backgroundColor: '#ffff00',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
  },
  superButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lottieArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    zIndex: 5,
    width: 300,
    height: 300,
  },
  tapGridArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: 300,
    height: 300,
  },
  missAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  missXText: {
    fontSize: 200,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#ffffff',
  },

  comboDisplay: {
    position: 'absolute',
    top: 80,
    left: screenWidth / 2 - 50,
    alignItems: 'center',
  },
  gameInfoContainer: {
    position: 'absolute',
    top: 100,
    left: screenWidth / 2 - 50,
    alignItems: 'center',
  },
  roundText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 14,
  },
  powerMeterContainer: {
    position: 'absolute',
    top: 140,
    left: screenWidth / 2 - 75,
    alignItems: 'center',
  },
  powerMeterLabel: {
    color: '#ff00ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  powerMeterBar: {
    width: 150,
    height: 15,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
  },
  powerMeterFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
    borderRadius: 8,
  },
  powerMeterText: {
    color: '#ff00ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  preRoundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  preRoundText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
    paddingBottom: 20,
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
  hapticButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00aa00',
  },
  hapticButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lottieButton: {
    backgroundColor: '#ff8800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffaa00',
  },
  lottieButtonText: {
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
