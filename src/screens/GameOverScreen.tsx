import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Font from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../contexts/AudioContext';
import {
  FilamentView,
  DefaultLight,
  Model,
  Animator,
  Camera,
  FilamentScene,
} from 'react-native-filament';
import IdleGLB from '../../assets/models/hero_animations_2/Animation_Idle_10_withSkin.glb';
import KnockDownGLB from '../../assets/models/hero_animations_2/Animation_Knock_Down_withSkin.glb';
import DeadGLB from '../../assets/models/hero_animations_2/Animation_Dead_withSkin.glb';

const { width: screenWidth } = Dimensions.get('window');

interface GameOverScreenProps {
  finalScore: number;
  gameMode: 'arcade' | 'endless';
  onRestart: () => void;
  onBackToMenu: () => void;
  onContinueWithGem: () => void;
  gemsAvailable?: number;
  audioRefs?: any;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  finalScore,
  gameMode,
  onRestart,
  onBackToMenu,
  onContinueWithGem,
  gemsAvailable = 3, // Default gems for now
  audioRefs,
}) => {
  const insets = useSafeAreaInsets();
  const { getEffectiveVolume } = useAudio();
  const [countdown, setCountdown] = useState(10);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'quit' | 'restart' | 'continue' | null>(
    null
  );
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [modelSource, setModelSource] = useState<any>(IdleGLB);
  const [modelKey, setModelKey] = useState<number>(0);
  const [sceneKey, setSceneKey] = useState<number>(0);
  const [modelTranslate, setModelTranslate] = useState<[number, number, number]>([0, -1.5, 0]);
  const [hasPlayedKO, setHasPlayedKO] = useState<boolean>(false);

  const countdownAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const gameOverAnim = useRef(new Animated.Value(0)).current;
  const gameOverScaleAnim = useRef(new Animated.Value(0)).current;
  const screenShakeAnim = useRef(new Animated.Value(0)).current;

  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
  };

  const getGameModeText = (mode: string): string => {
    switch (mode) {
      case 'arcade':
        return 'ARCADE MODE';
      case 'endless':
        return 'ENDLESS MODE';
      default:
        return 'GAME';
    }
  };

  const getGameOverFontSize = (): number => {
    // Calculate responsive font size based on screen width
    // Account for padding and letter spacing
    const availableWidth = screenWidth - 80; // Account for padding
    const baseFontSize = Math.min(60, availableWidth / 8); // "KNOCKOUT" is 8 characters, reduced max size
    return Math.max(32, baseFontSize); // Minimum font size of 32
  };

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Load custom fonts for better text fitting
        await Font.loadAsync({
          GameOverFont: require('../../assets/fonts/boxing/BOXING.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.log('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    };
    loadFonts();
  }, []);

  // Swap model to KO sequence when game over displays (play once)
  useEffect(() => {
    if (showGameOver && !hasPlayedKO) {
      // Play knockdown, then dead idle
      setModelSource(KnockDownGLB);
      setModelKey(prev => prev + 1);
      setSceneKey(prev => prev + 1);
      setModelTranslate([-0.6, -1.5, 0]);
      const t = setTimeout(() => {
        setModelSource(DeadGLB);
        setModelKey(prev => prev + 1);
        setSceneKey(prev => prev + 1);
        setModelTranslate([0, -1.5, 0]);
      }, 1200);
      setHasPlayedKO(true);
      return () => clearTimeout(t);
    } else if (!showGameOver) {
      // While counting down, keep idle
      setModelSource(IdleGLB);
      setModelKey(prev => prev + 1);
      setSceneKey(prev => prev + 1);
      setModelTranslate([0, -1.5, 0]);
      setHasPlayedKO(false);
    }
  }, [showGameOver, hasPlayedKO]);

  // Play countdown sound based on number
  const playCountdownSound = async (number: number, audioRefs: any) => {
    try {
      let soundRef: React.MutableRefObject<Audio.Sound | null> | null = null;

      switch (number) {
        case 10:
          soundRef = audioRefs.countdownTenSound;
          break;
        case 9:
          soundRef = audioRefs.countdownNineSound;
          break;
        case 8:
          soundRef = audioRefs.countdownEightSound;
          break;
        case 7:
          soundRef = audioRefs.countdownSevenSound;
          break;
        case 6:
          soundRef = audioRefs.countdownSixSound;
          break;
        case 5:
          soundRef = audioRefs.countdownFiveSound;
          break;
        case 4:
          soundRef = audioRefs.countdownFourSound;
          break;
        case 3:
          soundRef = audioRefs.countdownThreeSound;
          break;
        case 2:
          soundRef = audioRefs.countdownTwoSound;
          break;
        case 1:
          soundRef = audioRefs.countdownOneSound;
          break;
      }

      if (soundRef?.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        if (effectiveVolume === 0) return;

        await soundRef.current.setVolumeAsync(effectiveVolume);
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing countdown sound:', error);
    }
  };

  // Play knockout sound
  const playKnockoutSound = async (audioRefs: any) => {
    try {
      if (audioRefs.knockoutSound?.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        if (effectiveVolume === 0) return;

        await audioRefs.knockoutSound.current.setVolumeAsync(effectiveVolume);
        await audioRefs.knockoutSound.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing knockout sound:', error);
    }
  };

  // Trigger haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'impact') => {
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
        case 'impact':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      console.log('Error triggering haptic:', error);
    }
  };

  // Start animations
  useEffect(() => {
    // Animate score appearing
    Animated.timing(scoreAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate buttons appearing
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsCountingDown(false);
          // Show game over animation if no option was chosen
          if (!selectedOption) {
            setShowGameOver(true);
            // Trigger game over animation
            gameOverAnim.setValue(0);
            gameOverScaleAnim.setValue(0);
            screenShakeAnim.setValue(0);

            // Start dramatic screen shake
            const shakeSequence = Animated.sequence([
              Animated.timing(screenShakeAnim, {
                toValue: 20,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: -20,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: 15,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: -15,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: -10,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: 5,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: -5,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShakeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]);

            Animated.sequence([
              Animated.timing(gameOverAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.parallel([
                Animated.timing(gameOverScaleAnim, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(gameOverAnim, {
                  toValue: 0.8,
                  duration: 200,
                  useNativeDriver: true,
                }),
                shakeSequence, // Run screen shake in parallel with the sticker effect
              ]),
              Animated.parallel([
                Animated.timing(gameOverScaleAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(gameOverAnim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]),
            ]).start();

            // Play knockout sound
            if (audioRefs) {
              playKnockoutSound(audioRefs);
            }

            // Trigger intense haptic feedback for game over
            triggerHaptic('heavy');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1500); // Set to 1500ms (1.5 seconds per number)

    return () => clearInterval(timer);
  }, [isCountingDown, selectedOption, onBackToMenu]);

  // Animate countdown number
  useEffect(() => {
    if (countdown > 0 && countdown <= 10) {
      countdownAnim.setValue(0);
      Animated.sequence([
        Animated.timing(countdownAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(countdownAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Play countdown sound
      if (audioRefs) {
        playCountdownSound(countdown, audioRefs);
      }

      // Trigger haptic feedback - stronger for lower numbers
      if (countdown <= 3) {
        triggerHaptic('heavy'); // Strong haptic for final countdown
      } else if (countdown <= 6) {
        triggerHaptic('medium'); // Medium haptic for middle countdown
      } else {
        triggerHaptic('light'); // Light haptic for early countdown
      }
    }
  }, [countdown]);

  const handleOptionSelect = (option: 'quit' | 'restart' | 'continue') => {
    setSelectedOption(option);
    setIsCountingDown(false);

    // Add delay for visual feedback
    setTimeout(() => {
      switch (option) {
        case 'quit':
          onBackToMenu();
          break;
        case 'restart':
          onRestart();
          break;
        case 'continue':
          onContinueWithGem();
          break;
      }
    }, 300);
  };

  const renderCountdownNumber = () => {
    // TODO: Replace with actual number images
    // For now, using styled text
    return (
      <Animated.Text
        style={[
          styles.countdownNumber,
          {
            transform: [{ scale: countdownAnim }],
          },
        ]}
      >
        {countdown}
      </Animated.Text>
    );
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
      {/* Background overlay */}
      <View style={styles.overlay} />

      {/* Full Screen Content */}
      <View
        style={[
          styles.fullScreenContent,
          {
            paddingTop: Math.max(20, insets.top + 20),
            paddingBottom: Math.max(10, insets.bottom + 10),
          },
        ]}
      >
        {/* Title Text - Changes based on state */}
        {!showGameOver ? (
          <Text style={styles.continueText}>CONTINUE</Text>
        ) : (
          <Animated.View
            style={[
              styles.gameOverContainer,
              {
                opacity: gameOverAnim,
                transform: [{ scale: gameOverScaleAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.gameOverText,
                {
                  fontSize: getGameOverFontSize(),
                  fontFamily: fontsLoaded ? 'GameOverFont' : undefined,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.3}
              allowFontScaling={true}
            >
              KNOCKOUT
            </Text>
          </Animated.View>
        )}

        {/* Countdown Display - Only visible during countdown */}
        {!showGameOver && <View style={styles.countdownContainer}>{renderCountdownNumber()}</View>}

        {/* 3D Character Animation */}
        <View style={styles.character3DContainer}>
          <View style={styles.character3DFrame}>
            <FilamentScene key={`go-scene-${sceneKey}`}>
              <FilamentView style={{ width: '100%', height: '100%' }}>
                <DefaultLight />
                <Model
                  key={`go-model-${modelKey}`}
                  source={modelSource}
                  translate={modelTranslate}
                  scale={[2.6, 2.6, 2.6]}
                  rotate={[0, 0, 0]}
                >
                  <Animator animationIndex={0} onAnimationsLoaded={() => {}} />
                </Model>
                <Camera />
              </FilamentView>
            </FilamentScene>
          </View>
        </View>

        {/* Score Display - Always visible */}
        <Animated.View
          style={[
            styles.scoreContainer,
            {
              opacity: scoreAnim,
              transform: [
                {
                  translateY: scoreAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>SCORE</Text>
            <Text style={styles.finalScore}>{formatScore(finalScore)}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons - Always show all three, disable top two during game over */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: !showGameOver ? buttonAnim : gameOverAnim,
              transform: [
                {
                  translateY: (!showGameOver ? buttonAnim : gameOverAnim).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              selectedOption === 'continue' && styles.selectedButton,
              showGameOver && styles.disabledButton,
            ]}
            onPress={() => handleOptionSelect('continue')}
            disabled={gemsAvailable <= 0 || showGameOver}
          >
            <Text style={[styles.buttonText, showGameOver && styles.disabledButtonText]}>
              USE GEM TO CONTINUE ({gemsAvailable})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.restartButton,
              selectedOption === 'restart' && styles.selectedButton,
              showGameOver && styles.disabledButton,
            ]}
            onPress={() => handleOptionSelect('restart')}
            disabled={showGameOver}
          >
            <Text style={[styles.buttonText, showGameOver && styles.disabledButtonText]}>
              START OVER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.quitButton,
              selectedOption === 'quit' && styles.selectedButton,
            ]}
            onPress={showGameOver ? onBackToMenu : () => handleOptionSelect('quit')}
          >
            <Text style={styles.buttonText}>{showGameOver ? 'RETURN TO MENU' : 'QUIT'}</Text>
          </TouchableOpacity>
        </Animated.View>
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
  fullScreenContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  continueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  countdownContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  countdownNumber: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    // TODO: Replace with actual number image
    // For now, this will be styled text
  },
  gameOverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20, // Add vertical padding to prevent text cutoff
    minHeight: 80, // Ensure minimum height for the text
  },
  gameOverText: {
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 12,
    letterSpacing: 2,
    flexShrink: 1,
    flexWrap: 'nowrap',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: undefined, // Let the font determine line height
    paddingVertical: 5, // Add small padding to prevent cutoff
  },
  character3DContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    minHeight: 300,
    maxHeight: '60%',
  },
  character3DFrame: {
    width: screenWidth - 60, // Full width minus safe padding
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  character3DText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  character3DSubtext: {
    color: '#ff6666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    flexWrap: 'nowrap',
  },
  modeText: {
    fontSize: 16,
    color: '#ff8800',
    marginBottom: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 2,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  buttonContainer: {
    gap: 8,
    width: '100%',
    maxWidth: 350,
  },
  button: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00ffff',
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#ffff00',
    borderColor: '#ff0000',
  },
  restartButton: {
    backgroundColor: '#00ff00',
    borderColor: '#ff00ff',
  },
  quitButton: {
    backgroundColor: '#ff0000',
    borderColor: '#ff00ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#666666',
    borderColor: '#444444',
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#cccccc',
  },
});

export default GameOverScreen;
