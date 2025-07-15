import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';
import { getOpponentConfig, getRoundHPGoal, getRandomPromptInterval } from '../data/opponents';
import GameOverScreen from './GameOverScreen';
import LottiePrompt from '../components/LottiePrompt';
import TapGrid from '../components/TapGrid';
import TestArrow from '../components/TestArrow';
// LottiePrompt component replaces text-based input prompts with animated Lottie files
// Currently falls back to emoji-based prompts when Lottie files are not available
import {
  Canvas,
  Text as SkiaText,
  useFont,
  Skia,
  LinearGradient,
  vec,
  Group,
  Blur,
  Shadow,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

// Avatar images
import neutralImg from '../../assets/avatar/neutral.jpg';
import shockedImg from '../../assets/avatar/shocked.jpg';
import revvedImg from '../../assets/avatar/revved.jpg';
import eyesClosedImg from '../../assets/avatar/eyes_closed.jpg';
import elatedImg from '../../assets/avatar/elated.jpg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GameScreenProps {
  gameMode: 'arcade' | 'endless';
  selectedLevel?: number;
  onBackToMenu: () => void;
  debugMode: boolean;
}

interface Prompt {
  id: string;
  type: 'tap' | 'swipe' | 'hold-and-flick';
  direction?: 'left' | 'right' | 'up' | 'down';
  startTime: number;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface TapPrompt {
  id: string;
  gridPosition: number; // 0-8 for 3x3 grid (0=top-left, 8=bottom-right)
  startTime: number;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface GameState {
  score: number;
  lives: number;
  opponentHP: number;
  currentRound: number;
  roundHPGoal: number;
  powerMeter: number;
  isSuperComboActive: boolean;
  avatarState: 'idle' | 'success' | 'failure' | 'perfect';
  isPaused: boolean;
  gameTime: number;
  level: number;
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

interface TouchState {
  startY: number;
  startX: number;
  startTime: number;
  isHolding: boolean;
  holdStartTime: number;
}

const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  selectedLevel = 1,
  onBackToMenu,
  debugMode,
}) => {
  const { getEffectiveVolume, stopMainTheme, startMainTheme } = useAudio();

  // Get opponent configuration for current level
  const opponentConfig = getOpponentConfig(selectedLevel);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    opponentHP: opponentConfig.hp,
    currentRound: 1,
    roundHPGoal: getRoundHPGoal(opponentConfig, 1),
    powerMeter: 0,
    isSuperComboActive: false,
    avatarState: 'idle',
    isPaused: false,
    gameTime: 0,
    level: selectedLevel,
  });

  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [activeTapPrompts, setActiveTapPrompts] = useState<TapPrompt[]>([]);
  const [superComboSequence, setSuperComboSequence] = useState<Prompt[]>([]);
  const [superComboIndex, setSuperComboIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<FeedbackText[]>([]);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [promptInterval, setPromptInterval] = useState(getRandomPromptInterval(opponentConfig, 1));

  // Hold-and-flick state (disabled for arrow testing)
  // const [isHolding, setIsHolding] = useState(false);
  // const [holdStartTime, setHoldStartTime] = useState(0);
  // const [holdProgress, setHoldProgress] = useState(0);
  // const [holdDirection, setHoldDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  // Double-tap detection
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Pre-round state
  const [isPreRound, setIsPreRound] = useState(true);
  const [preRoundText, setPreRoundText] = useState('');
  const [showMissAnimation, setShowMissAnimation] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Reanimated values for pre-round animations
  const preRoundScale = useSharedValue(0);
  const preRoundOpacity = useSharedValue(0);
  const preRoundRotation = useSharedValue(0);
  const preRoundBlur = useSharedValue(10);
  const flashOpacity = useSharedValue(0);

  const particleIdCounter = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerDecayRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const screenShakeAnim = useSharedValue(0);
  const powerMeterAnim = useSharedValue(0);
  const avatarScaleAnim = useSharedValue(1);
  const promptScaleAnim = useSharedValue(1);
  const holdCircleAnim = useSharedValue(0);
  const holdProgressAnim = useSharedValue(0);
  const missXScaleAnim = useSharedValue(0);
  const missXOpacityAnim = useSharedValue(0);

  // Animated styles
  const screenShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenShakeAnim.value }],
  }));

  const avatarScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScaleAnim.value }],
  }));

  const promptScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: promptScaleAnim.value }],
  }));

  const holdCircleStyle = useAnimatedStyle(() => ({
    opacity: holdCircleAnim.value,
  }));

  const holdProgressStyle = useAnimatedStyle(() => ({
    width: `${holdProgressAnim.value * 100}%`,
  }));

  const powerMeterStyle = useAnimatedStyle(() => ({
    width: `${powerMeterAnim.value}%`,
  }));

  const missXStyle = useAnimatedStyle(() => ({
    transform: [{ scale: missXScaleAnim.value }],
    opacity: missXOpacityAnim.value,
  }));

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);
  const powerUpSound = useRef<Audio.Sound | null>(null);
  const qteSuccessSound = useRef<Audio.Sound | null>(null);
  const qteFailureSound = useRef<Audio.Sound | null>(null);
  const boxingBell2Sound = useRef<Audio.Sound | null>(null);
  const boxingBell1Sound = useRef<Audio.Sound | null>(null);

  // Restart main theme when leaving game
  useEffect(() => {
    return () => {
      // Restart main theme when component unmounts (returning to menu)
      startMainTheme();
      console.log('🎵 Restarted main theme for menu transition');
    };
  }, []); // Empty dependency array - only run on unmount

  // Start pre-round sequence on mount
  useEffect(() => {
    console.log('🎬 Pre-round useEffect triggered');
    // Start pre-round sequence when entering game
    setIsPreRound(true);
    setGameState(prev => ({ ...prev, isPaused: true }));
    startPreRoundSequence(1);
  }, []);

  // Stop main theme immediately when entering game (before pre-round)
  useEffect(() => {
    const stopMainThemeImmediately = async () => {
      try {
        await stopMainTheme();
        console.log('🎵 Stopped main theme immediately for game transition');
      } catch (error) {
        console.log('Audio transition error:', error);
      }
    };

    // Stop main theme right away when component mounts
    stopMainThemeImmediately();
  }, []); // Run only once on mount

  // Helper function with timeout (like AudioDebugScreen)
  async function loadWithTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
    let timeout: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`Timeout loading ${name}`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
  }

  const loadAudio = async () => {
    console.log('🎵 loadAudio function called!');
    try {
      console.log('🎵 Starting audio loading...');

      // Audio file mapping (static requires)
      const audioFiles: Record<string, any> = {
        qte_success: require('../../assets/audio/qte_success.mp3'),
        qte_failure: require('../../assets/audio/qte_failure.mp3'),
        boxing_bell_2: require('../../assets/audio/boxing_bell_2.mp3'),
        boxing_bell_1: require('../../assets/audio/boxing_bell_1.mp3'),
      };

      // Helper to try loading a sound with timeout
      const tryLoad = async (label: string, ref: React.MutableRefObject<Audio.Sound | null>) => {
        console.log(`🎵 Loading ${label}...`);
        const mod = audioFiles[label];
        if (!mod) {
          console.log(`❌ Audio file for ${label} not found in mapping.`);
          return;
        }
        try {
          const { sound } = await loadWithTimeout(Audio.Sound.createAsync(mod), 10000, label);
          ref.current = sound;
          console.log(`✅ ${label} sound loaded`);
        } catch (error) {
          console.log(`❌ Audio loading error (${label}):`, error);
        }
      };

      // Load QTE sounds and boxing bells
      await tryLoad('qte_success', qteSuccessSound);
      await tryLoad('qte_failure', qteFailureSound);
      await tryLoad('boxing_bell_2', boxingBell2Sound);
      await tryLoad('boxing_bell_1', boxingBell1Sound);

      console.log('🎵 QTE Audio loading complete!');
    } catch (error) {
      console.log('Audio loading error:', error);
      if (error instanceof Error) {
        console.log('Error details:', error.message);
      }
    }
  };

  // Load audio in useEffect (like AudioDebugScreen)
  useEffect(() => {
    console.log('🎵 Audio loading useEffect triggered');
    // Load audio without blocking the game start
    loadAudio().catch(error => {
      console.log('🎵 Audio loading failed:', error);
    });
    return () => {
      console.log('🎵 Audio unloading on cleanup');
      unloadAudio();
    };
  }, []);

  const unloadAudio = async () => {
    if (hitSound.current) await hitSound.current.unloadAsync();
    if (missSound.current) await missSound.current.unloadAsync();
    if (comboSound.current) await comboSound.current.unloadAsync();
    if (powerUpSound.current) await powerUpSound.current.unloadAsync();
    if (qteSuccessSound.current) await qteSuccessSound.current.unloadAsync();
    if (qteFailureSound.current) await qteFailureSound.current.unloadAsync();
    if (boxingBell2Sound.current) await boxingBell2Sound.current.unloadAsync();
    if (boxingBell1Sound.current) await boxingBell1Sound.current.unloadAsync();
  };

  const playSound = async (soundRef: React.MutableRefObject<Audio.Sound | null>) => {
    try {
      if (soundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        console.log(`🔊 Playing sound with volume: ${effectiveVolume}`);

        // Check if audio is enabled
        if (effectiveVolume === 0) {
          console.log('🔇 Audio is muted - skipping sound playback');
          return;
        }

        await soundRef.current.setVolumeAsync(effectiveVolume);
        await soundRef.current.replayAsync();
        console.log('✅ Sound played successfully');
      } else {
        console.log('❌ Sound ref is null - audio not loaded');
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
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
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    } catch (error) {
      console.log('Haptic error:', error);
    }
  };

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
    screenShakeAnim.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animateAvatar = () => {
    avatarScaleAnim.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };

  const animateMissX = () => {
    // Reset animations
    missXScaleAnim.value = 0;
    missXOpacityAnim.value = 0;

    // Animate X appearing with scale and opacity
    missXScaleAnim.value = withTiming(1, { duration: 300 });
    missXOpacityAnim.value = withTiming(1, { duration: 200 });
  };

  // const animatePrompt = () => {
  //   promptScaleAnim.value = withSequence(
  //     withTiming(1.3, { duration: 100 }),
  //     withTiming(1, { duration: 100 })
  //   );
  // };

  const generatePrompt = (): Prompt => {
    // Generate both swipe and tap prompts
    const promptTypes: ('swipe' | 'tap')[] = ['swipe', 'tap'];
    const type = promptTypes[Math.floor(Math.random() * promptTypes.length)];

    if (type === 'tap') {
      // For tap prompts, we'll handle them separately in the tap system
      return {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'tap',
        startTime: Date.now(),
        duration: 3000, // 3 second window for testing
        isActive: true,
        isCompleted: false,
      };
    } else {
      // Swipe prompts
      const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];
      const direction = directions[Math.floor(Math.random() * directions.length)];

      return {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'swipe',
        direction,
        startTime: Date.now(),
        duration: 3000, // 3 second window for testing
        isActive: true,
        isCompleted: false,
      };
    }
  };

  const generateSuperComboSequence = (): Prompt[] => {
    const sequence: Prompt[] = [];
    const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];

    for (let i = 0; i < 4; i++) {
      const direction = directions[Math.floor(Math.random() * directions.length)];

      sequence.push({
        id: `super_${i}_${Date.now()}`,
        type: 'swipe',
        direction,
        startTime: Date.now() + i * 1000, // 1s intervals
        duration: 800,
        isActive: false,
        isCompleted: false,
      });
    }

    return sequence;
  };

  const generateTapPrompts = (): TapPrompt[] => {
    const numPrompts = Math.floor(Math.random() * 3) + 1; // 1-3 prompts
    const prompts: TapPrompt[] = [];
    const usedPositions = new Set<number>();

    for (let i = 0; i < numPrompts; i++) {
      let position: number;
      do {
        position = Math.floor(Math.random() * 9); // 0-8 for 3x3 grid
      } while (usedPositions.has(position));

      usedPositions.add(position);

      prompts.push({
        id: `tap_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        gridPosition: position,
        startTime: Date.now(),
        duration: 3000, // 3 second window
        isActive: true,
        isCompleted: false,
      });
    }

    return prompts;
  };

  const spawnPrompt = () => {
    if (gameState.isSuperComboActive) return;

    const prompt = generatePrompt();
    console.log(`🎯 SPAWNING NEW PROMPT: ${prompt.type} ${prompt.direction || ''}`);
    console.log(`🎯 Prompt details:`, prompt);

    if (prompt.type === 'tap') {
      // Generate tap prompts for the 3x3 grid
      const tapPrompts = generateTapPrompts();
      console.log(`🎯 SPAWNING TAP PROMPTS:`, tapPrompts);
      setActiveTapPrompts(tapPrompts);
      setCurrentPrompt(null); // Clear current prompt for tap mode
    } else {
      // Handle swipe prompts as before
      setCurrentPrompt(prompt);
      setActiveTapPrompts([]); // Clear any active tap prompts
    }
  };

  const processInput = (
    inputType: 'tap' | 'swipe' | 'hold-and-flick',
    direction?: 'left' | 'right' | 'up' | 'down'
  ) => {
    console.log(`🎮 Processing input: ${inputType} ${direction || ''}`);

    if (!currentPrompt || !currentPrompt.isActive) {
      console.log('❌ No active prompt to process');
      return;
    }

    const now = Date.now();
    const timeDiff = now - currentPrompt.startTime;

    console.log(`⏱️ Time diff: ${timeDiff}ms (max: ${currentPrompt.duration}ms)`);
    console.log(`🎯 Expected: ${currentPrompt.type} ${currentPrompt.direction || ''}`);

    // Check if input matches prompt
    const isCorrectInput =
      currentPrompt.type === inputType &&
      (inputType === 'tap' || currentPrompt.direction === direction);

    console.log(`✅ Input correct: ${isCorrectInput}`);

    if (isCorrectInput && timeDiff <= currentPrompt.duration) {
      // Determine hit quality based on opponent's reaction time settings
      let hitQuality: 'perfect' | 'good' | 'miss' = 'miss';
      let points = 0;
      let damage = 0;
      let powerGain = 0;

      if (timeDiff <= opponentConfig.reactionTime.perfect) {
        hitQuality = 'perfect';
        points = 100;
        damage = opponentConfig.damage.perfect;
        powerGain = 10;
        console.log(`🏆 PERFECT HIT! +100 points, ${damage} damage`);
        triggerHaptic('success');
        playSound(qteSuccessSound);
      } else if (timeDiff <= opponentConfig.reactionTime.good) {
        hitQuality = 'good';
        points = 50;
        damage = opponentConfig.damage.good;
        powerGain = 5;
        console.log(`👍 GOOD HIT! +50 points, ${damage} damage`);
        triggerHaptic('success');
        playSound(qteSuccessSound);
      }

      if (hitQuality !== 'miss') {
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          opponentHP: Math.max(0, prev.opponentHP - damage),
          powerMeter: Math.min(100, prev.powerMeter + powerGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));

        animateAvatar();

        // Check if round is complete
        if (gameState.opponentHP - damage <= gameState.roundHPGoal) {
          completeRound();
        }

        // Check if level is complete
        if (gameState.opponentHP - damage <= 0) {
          completeLevel();
        }
      }
    } else {
      // Miss
      console.log('❌ MISS! Wrong input or too slow');
      handleMiss();
    }

    // Clear current prompt
    console.log('🗑️ Clearing current prompt');
    setCurrentPrompt(null);
  };

  const handleMiss = () => {
    setGameState(prev => ({
      ...prev,
      lives: prev.lives - 1,
      avatarState: 'failure',
    }));

    triggerHaptic('error');
    playSound(qteFailureSound);
    screenShake();
    animateAvatar();

    // Show big X animation and start cooldown period
    setShowMissAnimation(true);
    setIsInCooldown(true);
    animateMissX();

    // Cooldown period: 2.5 seconds total
    // - 2 seconds for X animation
    // - 0.5 seconds additional buffer for player to process
    setTimeout(() => {
      setShowMissAnimation(false);
      setIsInCooldown(false);
      console.log('🔄 Miss cooldown period ended - resuming normal gameplay');
    }, 2500);

    // Check for game over
    if (gameState.lives <= 1) {
      setTimeout(() => setIsGameOver(true), 1000);
    }
  };

  const completeRound = () => {
    const nextRound = gameState.currentRound + 1;

    setGameState(prev => ({
      ...prev,
      currentRound: nextRound,
      roundHPGoal: getRoundHPGoal(opponentConfig, nextRound),
      isPaused: true, // Pause game during pre-round
    }));

    // Generate new random prompt interval for next round
    const newInterval = getRandomPromptInterval(opponentConfig, nextRound);
    setPromptInterval(newInterval);

    triggerHaptic('success');
    createFeedbackText('ROUND COMPLETE!', screenWidth / 2, screenHeight * 0.3, '#00ffff');

    // Start pre-round sequence for next round
    setTimeout(() => {
      setIsPreRound(true);
      startPreRoundSequence(nextRound);
    }, 1000);
  };

  const startPreRoundSequence = (roundNumber?: number) => {
    'worklet';

    const currentRoundNumber = roundNumber || gameState.currentRound;

    // Reset all animation values
    preRoundScale.value = 0;
    preRoundOpacity.value = 0;
    preRoundRotation.value = 0;
    preRoundBlur.value = 10;
    flashOpacity.value = 0;

    // Round number animation
    runOnJS(setPreRoundText)(`ROUND ${currentRoundNumber}`);

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

    // Particle explosion
    // particleScale.value = withSequence(
    //   withDelay(200, withSpring(1.2, { damping: 8 })),
    //   withTiming(0, { duration: 400 })
    // );

    // Transition to "GET READY!"
    setTimeout(() => {
      runOnJS(setPreRoundText)('GET READY!');

      // Reset and animate again
      preRoundScale.value = 0;
      preRoundRotation.value = -180;

      preRoundScale.value = withSequence(
        withSpring(1.8, { damping: 6, stiffness: 120 }),
        withTiming(1.2, { duration: 300 })
      );

      preRoundRotation.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });

      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 150 }),
        withTiming(0, { duration: 250 })
      );

      // particleScale.value = withSequence(
      //   withSpring(1, { damping: 10 }),
      //   withTiming(0, { duration: 300 })
      // );
    }, 1500);

    // Transition to "FIGHT!"
    setTimeout(() => {
      runOnJS(setPreRoundText)('FIGHT!');

      // Epic final animation
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
        runOnJS(setIsPreRound)(false);
        runOnJS(setGameState)(prev => ({ ...prev, isPaused: false }));
      }, 1000);
    }, 3000);
  };

  const completeLevel = () => {
    const nextLevel = gameState.level + 1;
    const nextOpponentConfig = getOpponentConfig(nextLevel);

    setGameState(prev => ({
      ...prev,
      level: nextLevel,
      opponentHP: nextOpponentConfig.hp,
      currentRound: 1,
      roundHPGoal: getRoundHPGoal(nextOpponentConfig, 1),
      powerMeter: 0,
    }));

    triggerHaptic('heavy');
    createFeedbackText('LEVEL COMPLETE!', screenWidth / 2, screenHeight * 0.3, '#ff00ff');
  };

  const activateSuperCombo = () => {
    if (gameState.powerMeter < 100) return;

    const sequence = generateSuperComboSequence();
    setSuperComboSequence(sequence);
    setSuperComboIndex(0);
    setGameState(prev => ({
      ...prev,
      isSuperComboActive: true,
      powerMeter: 0,
    }));

    triggerHaptic('heavy');
    playSound(powerUpSound);
    createFeedbackText('SUPER COMBO!', screenWidth / 2, screenHeight * 0.2, '#ff00ff');

    // Start super combo sequence
    setTimeout(() => {
      setSuperComboSequence(prev => {
        const newSeq = [...prev];
        if (newSeq[0]) newSeq[0].isActive = true;
        return newSeq;
      });
    }, 1000);
  };

  const processSuperComboInput = (
    inputType: 'swipe',
    direction?: 'left' | 'right' | 'up' | 'down'
  ) => {
    const currentSuperPrompt = superComboSequence[superComboIndex];
    if (!currentSuperPrompt || !currentSuperPrompt.isActive) return;

    const now = Date.now();
    const timeDiff = now - currentSuperPrompt.startTime;

    const isCorrectInput = currentSuperPrompt.direction === direction;

    if (isCorrectInput && timeDiff <= currentSuperPrompt.duration) {
      // Success
      setSuperComboIndex(prev => prev + 1);
      setSuperComboSequence(prev => {
        const newSeq = [...prev];
        newSeq[superComboIndex].isCompleted = true;
        newSeq[superComboIndex].isActive = false;
        if (newSeq[superComboIndex + 1]) {
          newSeq[superComboIndex + 1].isActive = true;
        }
        return newSeq;
      });

      triggerHaptic('success');
      playSound(comboSound);
      createParticles(screenWidth / 2, screenHeight * 0.4, '#ff00ff', 10);

      // Check if super combo is complete
      if (superComboIndex + 1 >= superComboSequence.length) {
        // Super combo successful
        setGameState(prev => ({
          ...prev,
          score: prev.score + 500,
          opponentHP: Math.max(0, prev.opponentHP - opponentConfig.damage.superCombo),
          isSuperComboActive: false,
        }));

        setSuperComboSequence([]);
        setSuperComboIndex(0);
        triggerHaptic('heavy');
        createFeedbackText('SUPER COMBO HIT!', screenWidth / 2, screenHeight * 0.3, '#ff00ff');
      }
    } else {
      // Super combo failed
      setGameState(prev => ({
        ...prev,
        isSuperComboActive: false,
        powerMeter: Math.max(0, prev.powerMeter - 50),
      }));

      setSuperComboSequence([]);
      setSuperComboIndex(0);
      triggerHaptic('error');
      createFeedbackText('COMBO FAILED!', screenWidth / 2, screenHeight * 0.3, '#ff0000');
    }
  };

  // Power meter decay
  useEffect(() => {
    if (gameState.powerMeter > 0 && !gameState.isSuperComboActive) {
      powerDecayRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          powerMeter: Math.max(0, prev.powerMeter - 1),
        }));
      }, 1000);
    } else {
      if (powerDecayRef.current) {
        clearInterval(powerDecayRef.current);
      }
    }

    return () => {
      if (powerDecayRef.current) {
        clearInterval(powerDecayRef.current);
      }
    };
  }, [gameState.powerMeter, gameState.isSuperComboActive]);

  // Avatar blinking effect
  useEffect(() => {
    if (gameState.avatarState === 'idle') {
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 3000 + Math.random() * 2000);

      return () => clearInterval(blinkInterval);
    } else {
      setIsBlinking(false);
    }
  }, [gameState.avatarState]);

  // Game loop
  useEffect(() => {
    if (gameState.isPaused || isGameOver || isPreRound) return;

    const gameLoop = () => {
      const now = Date.now();

      // Spawn new prompts
      if (
        !currentPrompt &&
        !gameState.isSuperComboActive &&
        (now - lastPromptTime > promptInterval || lastPromptTime === 0) &&
        !isPreRound &&
        !isInCooldown
      ) {
        spawnPrompt();
        setLastPromptTime(now);
      }

      // Generate new random prompt interval for current round
      const newInterval = getRandomPromptInterval(opponentConfig, gameState.currentRound);
      setPromptInterval(newInterval);

      // Update game time (commented out to prevent infinite re-renders)
      // setGameState(prev => ({
      //   ...prev,
      //   gameTime: prev.gameTime + 16, // ~60 FPS
      // }));

      // Reset avatar state after animation (commented out to prevent re-renders)
      // if (gameState.avatarState !== 'idle') {
      //   setTimeout(() => {
      //     setGameState(prev => ({ ...prev, avatarState: 'idle' }));
      //   }, 1000);
      // }
    };

    gameLoopRef.current = setInterval(gameLoop, 16);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [
    currentPrompt,
    gameState.isPaused,
    isGameOver,
    isPreRound,
    lastPromptTime,
    promptInterval,
    gameState.score,
    gameState.isSuperComboActive,
    isInCooldown,
  ]);

  // Particle and feedback text cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setParticles(prev => prev.filter(p => p.life > 0).map(p => ({ ...p, life: p.life - 0.02 })));
      setFeedbackTexts(prev =>
        prev.filter(f => f.life > 0).map(f => ({ ...f, life: f.life - 0.02 }))
      );
    }, 16);

    return () => clearInterval(cleanupInterval);
  }, []);

  const handleTap = () => {
    console.log('🎯 TAP DETECTED in interactive area');
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Check for double-tap (within 300ms)
    if (timeSinceLastTap < 300) {
      console.log('🔄 DOUBLE-TAP detected');
      // Double-tap detected
      if (gameState.powerMeter >= 100 && !gameState.isSuperComboActive) {
        console.log('💥 ACTIVATING SUPER COMBO via double-tap');
        triggerHaptic('heavy');
        activateSuperCombo();
      } else {
        triggerHaptic('warning');
      }
      setTapCount(0);
      setLastTapTime(0);
    } else {
      console.log('👆 SINGLE TAP detected');
      // Single tap
      setTapCount(1);
      setLastTapTime(now);
      triggerHaptic('light');

      // Process normal tap input (only for super combo now)
      if (gameState.isSuperComboActive) {
        console.log('⚡ Processing tap as swipe up for super combo');
        processSuperComboInput('swipe', 'up'); // Use swipe up for tap in super combo
      } else {
        console.log('ℹ️ Tap ignored - no active super combo');
      }
    }
  };

  const handleGridTap = (gridPosition: number) => {
    console.log(`👆 GRID TAP DETECTED at position: ${gridPosition}`);

    // Find the tap prompt at this position
    const tapPrompt = activeTapPrompts.find(
      prompt => prompt.gridPosition === gridPosition && prompt.isActive && !prompt.isCompleted
    );

    if (tapPrompt) {
      console.log(`✅ TAP PROMPT FOUND:`, tapPrompt);

      const now = Date.now();
      const timeDiff = now - tapPrompt.startTime;

      console.log(`⏱️ Time diff: ${timeDiff}ms (max: ${tapPrompt.duration}ms)`);

      if (timeDiff <= tapPrompt.duration) {
        // Mark this tap prompt as completed
        setActiveTapPrompts(prev =>
          prev.map(prompt =>
            prompt.id === tapPrompt.id ? { ...prompt, isCompleted: true } : prompt
          )
        );

        // Check if all tap prompts are completed
        const updatedPrompts = activeTapPrompts.map(prompt =>
          prompt.id === tapPrompt.id ? { ...prompt, isCompleted: true } : prompt
        );

        const remainingPrompts = updatedPrompts.filter(p => p.isActive && !p.isCompleted);

        console.log(`🎯 Tap completed. Remaining prompts: ${remainingPrompts.length}`);

        if (remainingPrompts.length === 0) {
          console.log('🎯 ALL TAP PROMPTS COMPLETED - PROCESSING FINAL SUCCESS');

          // Calculate overall success based on all completed taps
          const completedPrompts = updatedPrompts.filter(p => p.isCompleted);
          const totalPrompts = activeTapPrompts.length;
          const successfulTaps = completedPrompts.length;

          console.log(`📊 Final stats: ${successfulTaps}/${totalPrompts} taps completed`);

          // Determine overall hit quality based on completion
          let hitQuality: 'perfect' | 'good' | 'miss' = 'miss';
          let points = 0;
          let damage = 0;
          let powerGain = 0;

          if (successfulTaps === totalPrompts) {
            // All taps completed successfully
            const avgTimeDiff =
              completedPrompts.reduce((sum, p) => {
                const timeDiff = now - p.startTime;
                return sum + timeDiff;
              }, 0) / successfulTaps;

            if (avgTimeDiff <= 1000) {
              hitQuality = 'perfect';
              points = 100 * totalPrompts; // Bonus for multiple taps
              damage = 50 * totalPrompts;
              powerGain = 10 * totalPrompts;
              console.log('🏆 PERFECT MULTI-TAP! +' + points + ' points');
              triggerHaptic('heavy');
              playSound(qteSuccessSound);
            } else if (avgTimeDiff <= 2000) {
              hitQuality = 'good';
              points = 50 * totalPrompts;
              damage = 25 * totalPrompts;
              powerGain = 5 * totalPrompts;
              console.log('👍 GOOD MULTI-TAP! +' + points + ' points');
              triggerHaptic('medium');
              playSound(qteSuccessSound);
            }
          }

          if (hitQuality !== 'miss') {
            setGameState(prev => ({
              ...prev,
              score: prev.score + points,
              opponentHP: Math.max(0, prev.opponentHP - damage),
              powerMeter: Math.min(100, prev.powerMeter + powerGain),
              avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
            }));

            animateAvatar();

            // Check if round is complete
            if (gameState.opponentHP - damage <= gameState.roundHPGoal) {
              completeRound();
            }

            // Check if level is complete
            if (gameState.opponentHP - damage <= 0) {
              completeLevel();
            }
          } else {
            console.log('❌ MULTI-TAP FAILED - Some taps were too late');
            handleMiss();
          }

          // Clear all tap prompts
          setActiveTapPrompts([]);
        } else {
          // Individual tap was successful, but more taps needed
          console.log(`✅ Individual tap successful. ${remainingPrompts.length} more taps needed.`);
          triggerHaptic('medium');
        }
      } else {
        console.log('❌ TAP TOO LATE');
        handleMiss();
        // Clear all tap prompts on failure
        setActiveTapPrompts([]);
      }
    } else {
      console.log('❌ NO TAP PROMPT AT THIS POSITION');
      handleMiss();
      // Clear all tap prompts on failure
      setActiveTapPrompts([]);
    }
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    console.log(`🔄 SWIPE DETECTED: ${direction.toUpperCase()}`);

    if (gameState.isSuperComboActive) {
      console.log('⚡ Processing swipe for super combo');
      processSuperComboInput('swipe', direction);
    } else {
      console.log('🎯 Processing swipe for normal prompt');
      processInput('swipe', direction);
    }
  };

  // const handleHoldStart = () => {
  //   if (currentPrompt?.type === 'hold-and-flick') {
  //     setIsHolding(true);
  //     setHoldStartTime(Date.now());
  //     setHoldProgress(0);
  //     setHoldDirection(currentPrompt.direction || null);

  //     // Start hold animation
  //     holdCircleAnim.value = withTiming(1, { duration: 1000 });

  //     // Start progress animation
  //     holdProgressAnim.value = withTiming(1, { duration: 1000 });
  //   }
  // };

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

  // const handleHoldEnd = () => {
  //   if (isHolding && holdDirection) {
  //     const holdDuration = Date.now() - holdStartTime;
  //     if (holdDuration >= 1000) {
  //       // Successful hold-and-flick
  //       processInput('hold-and-flick', holdDirection);
  //       triggerHaptic('heavy');
  //     } else {
  //       // Failed hold - too short
  //       handleMiss();
  //     }

  //     // Reset hold state
  //     setIsHolding(false);
  //     setHoldProgress(0);
  //     setHoldDirection(null);

  //     // Reset animations
  //     holdCircleAnim.value = withTiming(0, { duration: 200 });

  //     holdProgressAnim.value = withTiming(0, { duration: 200 });
  //   }
  // };

  const getAvatarImage = (state: 'idle' | 'success' | 'failure' | 'perfect') => {
    if (isBlinking) return eyesClosedImg;

    switch (state) {
      case 'success':
        return elatedImg;
      case 'failure':
        return shockedImg;
      case 'perfect':
        return revvedImg;
      default:
        return neutralImg;
    }
  };

  // Note: getPromptIcon and getPromptColor functions have been removed
  // as they are no longer needed with Lottie animations

  if (isGameOver) {
    return (
      <GameOverScreen
        finalScore={gameState.score}
        gameMode={gameMode}
        onRestart={() => {
          const restartOpponentConfig = getOpponentConfig(selectedLevel);
          setGameState({
            score: 0,
            lives: 3,
            opponentHP: restartOpponentConfig.hp,
            currentRound: 1,
            roundHPGoal: getRoundHPGoal(restartOpponentConfig, 1),
            powerMeter: 0,
            isSuperComboActive: false,
            avatarState: 'idle',
            isPaused: false,
            gameTime: 0,
            level: selectedLevel,
          });
          setIsGameOver(false);
          setCurrentPrompt(null);
          setSuperComboSequence([]);
          setSuperComboIndex(0);
        }}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[styles.container, screenShakeStyle]}>
        {/* Top HUD - Opponent */}
        <View style={styles.topHud}>
          <View style={styles.opponentRow}>
            <View style={styles.opponentContainer}>
              <View style={styles.opponentTopRow}>
                <Text style={styles.opponentLabel}>OPPONENT</Text>
                <View style={styles.gameInfoInline}>
                  <Text style={styles.roundTextInline}>ROUND {gameState.currentRound}</Text>
                  <Text style={styles.levelTextInline}>LEVEL {gameState.level}</Text>
                </View>
              </View>
              <View style={styles.hpBar}>
                <View
                  style={[
                    styles.hpFill,
                    { width: `${(gameState.opponentHP / opponentConfig.hp) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <View style={styles.avatarContainer}>
              <Animated.Image
                source={getAvatarImage(gameState.avatarState)}
                style={[styles.avatar, avatarScaleStyle]}
              />
            </View>
          </View>
        </View>

        {/* Opponent 3D Model Area - Above Interactive Zone */}
        <View style={styles.opponentModelArea}>
          <View style={styles.modelPlaceholder}>
            <Text style={styles.modelPlaceholderText}>OPPONENT 3D MODEL</Text>
            <Text style={styles.modelPlaceholderSubtext}>Will be placed here</Text>
          </View>
        </View>

        {/* Player 3D Model Area - Below Interactive Zone */}
        <View style={styles.playerModelArea}>
          <View style={styles.modelPlaceholder}>
            <Text style={styles.modelPlaceholderText}>PLAYER 3D MODEL</Text>
            <Text style={styles.modelPlaceholderSubtext}>Will be placed here</Text>
          </View>
        </View>

        {/* Bottom HUD - Player */}
        <View style={styles.bottomHud}>
          <View style={styles.playerRow}>
            <View style={styles.playerAvatarContainer}>
              <Animated.Image
                source={getAvatarImage(gameState.avatarState)}
                style={[styles.avatar, avatarScaleStyle]}
              />
            </View>
            <View style={styles.playerContainer}>
              <View style={styles.playerTopRow}>
                <Text style={styles.playerLabel}>PLAYER</Text>
                <View style={styles.playerStatsInline}>
                  <Text style={styles.scoreTextInline}>{gameState.score}</Text>
                  <View style={styles.livesBar}>
                    {[1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.lifeSegment,
                          { backgroundColor: i <= gameState.lives ? '#00ff00' : '#333' },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.powerBar}>
                <Animated.View
                  style={[
                    styles.powerFill,
                    {
                      width: `${gameState.powerMeter}%`,
                    },
                    powerMeterStyle,
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Input Area - Centered */}
        <View style={styles.inputArea}>
          {/* Prompt Area - Inside Input Area */}
          <View style={styles.promptArea}>
            {currentPrompt && currentPrompt.isActive && currentPrompt.type === 'tap' && (
              <LottiePrompt
                type={currentPrompt.type}
                direction={currentPrompt.direction}
                isActive={currentPrompt.isActive}
              />
            )}

            {gameState.isSuperComboActive && superComboSequence[superComboIndex] && (
              <View style={styles.superComboContainer}>
                <Text style={styles.superComboLabel}>SUPER COMBO!</Text>
                <TestArrow
                  direction={superComboSequence[superComboIndex].direction!}
                  isActive={superComboSequence[superComboIndex].isActive}
                />
              </View>
            )}
          </View>

          {/* Test Arrow Area - Outside Input Area for better visibility */}
          {currentPrompt && currentPrompt.isActive && currentPrompt.type === 'swipe' && (
            <>
              <TestArrow direction={currentPrompt.direction!} isActive={currentPrompt.isActive} />
            </>
          )}

          {/* Tap Grid Area - For 3x3 tap prompts */}
          {activeTapPrompts.length > 0 && (
            <View style={styles.tapGridArea}>
              <TapGrid activeTapPrompts={activeTapPrompts} onGridTap={handleGridTap} />
            </View>
          )}

          {/* Swipe gesture handler - only active when there's a swipe prompt and no tap prompts */}
          {currentPrompt && currentPrompt.type === 'swipe' && activeTapPrompts.length === 0 && (
            <PanGestureHandler
              onGestureEvent={event => {
                const { translationX, translationY, state } = event.nativeEvent;

                if (state === State.BEGAN) {
                  console.log('👆 Gesture began');
                } else if (state === State.END) {
                  console.log('👋 Gesture ended');
                }
              }}
              onBegan={() => {
                console.log('🎯 PAN GESTURE BEGAN - Touch detected!');
              }}
              onFailed={() => {
                console.log('❌ PAN GESTURE FAILED - Touch not recognized as pan');
              }}
              onHandlerStateChange={event => {
                const { state, translationX, translationY } = event.nativeEvent;

                if (state === State.END) {
                  // Determine swipe direction based on translation
                  const minSwipeDistance = 50; // Minimum distance for a swipe
                  const absX = Math.abs(translationX);
                  const absY = Math.abs(translationY);

                  if (absX > absY && absX > minSwipeDistance) {
                    // Horizontal swipe
                    if (translationX > 0) {
                      console.log('🔄 SWIPE GESTURE DETECTED: RIGHT');
                      handleSwipe('right');
                    } else {
                      console.log('🔄 SWIPE GESTURE DETECTED: LEFT');
                      handleSwipe('left');
                    }
                  } else if (absY > absX && absY > minSwipeDistance) {
                    // Vertical swipe
                    if (translationY > 0) {
                      console.log('🔄 SWIPE GESTURE DETECTED: DOWN');
                      handleSwipe('down');
                    } else {
                      console.log('🔄 SWIPE GESTURE DETECTED: UP');
                      handleSwipe('up');
                    }
                  }
                }
              }}
              activeOffsetX={[-10, 10]}
              activeOffsetY={[-10, 10]}
            >
              <View style={styles.inputAreaGestureHandler}>
                {/* Visual indicator of gesture handler area */}
                <View style={styles.gestureAreaIndicator}>
                  <Text style={styles.gestureAreaText}>GESTURE AREA</Text>
                </View>

                {/* This invisible view covers the entire input area for swipe detection */}
                <TouchableOpacity
                  style={styles.touchTestButton}
                  onPress={() => {
                    console.log('👆 TOUCH TEST BUTTON PRESSED - Area is touchable!');
                  }}
                >
                  <Text style={styles.touchTestText}>TEST</Text>
                </TouchableOpacity>
              </View>
            </PanGestureHandler>
          )}
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

        {/* Feedback Texts */}
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

        {/* Pause Button */}
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => {
            setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
            playSound(boxingBell2Sound);
          }}
        >
          <Text style={styles.pauseButtonText}>⏸️</Text>
        </TouchableOpacity>

        {/* Test Pre-Round Button */}
        <TouchableOpacity
          style={styles.testPreRoundButton}
          onPress={() => {
            setIsPreRound(true);
            setPreRoundText('ROUND 1');
            startPreRoundSequence(1);
          }}
        >
          <Text style={styles.testPreRoundButtonText}>🎬</Text>
        </TouchableOpacity>

        {/* Pause Overlay */}
        {gameState.isPaused && !isPreRound && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSED</Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => {
                setGameState(prev => ({ ...prev, isPaused: false }));
                playSound(boxingBell1Sound);
              }}
            >
              <Text style={styles.resumeButtonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={onBackToMenu}>
              <Text style={styles.quitButtonText}>QUIT TO MENU</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Miss Animation - Big X */}
        {showMissAnimation && (
          <View style={styles.missAnimationOverlay}>
            <Animated.Text style={[styles.missXText, missXStyle]}>✗</Animated.Text>
          </View>
        )}

        {/* Cooldown Indicator */}
        {isInCooldown && !showMissAnimation && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>...</Text>
          </View>
        )}

        {/* Pre-round Display */}
        {isPreRound && (
          <View style={styles.preRoundOverlay}>
            {/* Flash effect background */}
            <Animated.View style={[styles.flashBackground, flashAnimatedStyle]} />

            {/* Main text with Skia */}
            <Animated.View style={[styles.preRoundTextContainer, preRoundAnimatedStyle]}>
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
                    text={preRoundText}
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
                    text={preRoundText}
                    font={null}
                    color="#FFFFFF"
                    style="fill"
                  >
                    <Blur blur={preRoundBlur} />
                  </SkiaText>
                </Group>
              </Canvas>

              {/* Fallback text */}
              <Text style={styles.preRoundText}>{preRoundText}</Text>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  levelInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  topHud: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  playerAvatarContainer: {
    width: 64,
    height: 64,
    marginRight: 20,
  },
  topStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    marginLeft: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  opponentLabel: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hpBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 5,
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#ff0000',
  },
  hpText: {
    color: '#ff0000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livesContainer: {
    flex: 1,
  },
  livesLabel: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  powerContainer: {
    flex: 1,
  },
  powerLabel: {
    color: '#ff00ff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  powerBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 5,
  },
  powerFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
  },
  powerText: {
    color: '#ff00ff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gameInfo: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
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
  hpGoalText: {
    color: '#ffffff',
    fontSize: 12,
  },
  promptArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -200 }, { translateY: -200 }],
    zIndex: 5,
  },
  // promptContainer: {
  //   width: 120,
  //   height: 120,
  //   borderRadius: 60,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderWidth: 2,
  //   borderColor: 'rgba(255, 255, 255, 0.3)',
  //   backgroundColor: 'rgba(0, 0, 0, 0.2)',
  // },
  // Note: promptIcon and promptText styles have been removed
  // as they are no longer needed with Lottie animations
  superComboContainer: {
    alignItems: 'center',
  },
  superComboLabel: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 400,
    height: 400,
    transform: [{ translateX: -200 }, { translateY: -200 }],
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20, // Ensure it's above other elements
  },
  tapGridArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25, // Above input area but below gesture area
  },
  inputAreaGestureHandler: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 400,
    height: 400,
    zIndex: 40, // Higher than other elements to receive touch events
    // Invisible - just for gesture detection
  },
  touchTestButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 5,
    borderRadius: 5,
    zIndex: 45, // Higher than gesture handler to be clickable
  },
  touchTestText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gestureAreaIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 255, 255, 0.8)',
    padding: 5,
    borderRadius: 5,
    zIndex: 50,
  },
  gestureAreaText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  superComboButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  superComboButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tapArea: {
    width: 350,
    height: 350,
    backgroundColor: 'rgba(0, 255, 0, 0.3)', // More visible green for debugging
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.6)',
    borderRadius: 175,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 400,
    height: 400,
    zIndex: 25, // Ensure swipe areas are on top
  },
  swipeArea: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 0, 0.6)', // More visible yellow for debugging
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 0, 1.0)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeLeft: {
    left: 0,
    top: 160,
  },
  swipeRight: {
    right: 0,
    top: 160,
  },
  swipeUp: {
    top: 0,
    left: 160,
  },
  swipeDown: {
    bottom: 0,
    left: 160,
  },
  swipeAreaLabel: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 25,
  },
  tapAreaLabel: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 150,
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
  pauseButton: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 50, // Higher than swipe gesture area
  },
  pauseButtonText: {
    fontSize: 20,
  },
  testPreRoundButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 50, // Higher than swipe gesture area
  },
  testPreRoundButtonText: {
    fontSize: 20,
  },

  debugArrowFallback: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 10,
    zIndex: 100,
  },
  debugArrowText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200, // Highest z-index to cover everything
  },
  pauseText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resumeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  quitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  holdProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  holdProgressBar: {
    height: '100%',
    backgroundColor: '#ffff00',
    borderRadius: 4,
  },
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
  particleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preRoundParticle: {
    position: 'absolute',
    width: 8,
    height: 80,
    backgroundColor: '#FFD700',
    borderRadius: 4,
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
  opponentModelArea: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playerModelArea: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  modelPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#ff0000',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  modelPlaceholderText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modelPlaceholderSubtext: {
    color: '#ff6666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
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
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cooldownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default GameScreen;
