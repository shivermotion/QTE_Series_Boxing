import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../contexts/AudioContext';
import GameOverScreen from './GameOverScreen';
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
  const { getEffectiveVolume } = useAudio();

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    opponentHP: 1000,
    currentRound: 1,
    roundHPGoal: 750,
    powerMeter: 0,
    isSuperComboActive: false,
    avatarState: 'idle',
    isPaused: false,
    gameTime: 0,
    level: selectedLevel,
  });

  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [superComboSequence, setSuperComboSequence] = useState<Prompt[]>([]);
  const [superComboIndex, setSuperComboIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<FeedbackText[]>([]);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [promptInterval, setPromptInterval] = useState(1500); // 1.5s initial interval

  // Hold-and-flick state
  const [isHolding, setIsHolding] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdDirection, setHoldDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  // Double-tap detection
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Pre-round state
  const [isPreRound, setIsPreRound] = useState(true);
  const [preRoundText, setPreRoundText] = useState('');

  // Reanimated values for pre-round animations
  const preRoundScale = useSharedValue(0);
  const preRoundOpacity = useSharedValue(0);
  const preRoundRotation = useSharedValue(0);
  const preRoundBlur = useSharedValue(10);
  const flashOpacity = useSharedValue(0);
  const particleScale = useSharedValue(0);

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

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);
  const powerUpSound = useRef<Audio.Sound | null>(null);

  // Load audio
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  // Start pre-round sequence on mount
  useEffect(() => {
    startPreRoundSequence();
  }, []);

  const loadAudio = async () => {
    try {
      const { sound: hit } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      hitSound.current = hit;

      const { sound: miss } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      missSound.current = miss;

      const { sound: combo } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      comboSound.current = combo;

      const { sound: powerUp } = await Audio.Sound.createAsync(
        require('../../assets/audio/hit.mp3')
      );
      powerUpSound.current = powerUp;
    } catch (error) {
      console.log('Audio loading error:', error);
    }
  };

  const unloadAudio = async () => {
    if (hitSound.current) await hitSound.current.unloadAsync();
    if (missSound.current) await missSound.current.unloadAsync();
    if (comboSound.current) await comboSound.current.unloadAsync();
    if (powerUpSound.current) await powerUpSound.current.unloadAsync();
  };

  const playSound = async (soundRef: React.MutableRefObject<Audio.Sound | null>) => {
    try {
      if (soundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await soundRef.current.setVolumeAsync(effectiveVolume);
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
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

  const animatePrompt = () => {
    promptScaleAnim.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const generatePrompt = (): Prompt => {
    const types: ('tap' | 'swipe' | 'hold-and-flick')[] = ['tap', 'swipe', 'hold-and-flick'];
    const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];

    const type = types[Math.floor(Math.random() * types.length)];
    const direction =
      type !== 'tap' ? directions[Math.floor(Math.random() * directions.length)] : undefined;

    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      direction,
      startTime: Date.now(),
      duration: 600, // 600ms window
      isActive: true,
      isCompleted: false,
    };
  };

  const generateSuperComboSequence = (): Prompt[] => {
    const sequence: Prompt[] = [];
    const types: ('tap' | 'swipe')[] = ['tap', 'swipe'];
    const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];

    for (let i = 0; i < 4; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const direction =
        type === 'swipe' ? directions[Math.floor(Math.random() * directions.length)] : undefined;

      sequence.push({
        id: `super_${i}_${Date.now()}`,
        type,
        direction,
        startTime: Date.now() + i * 1000, // 1s intervals
        duration: 800,
        isActive: false,
        isCompleted: false,
      });
    }

    return sequence;
  };

  const spawnPrompt = () => {
    if (gameState.isSuperComboActive) return;

    const prompt = generatePrompt();
    setCurrentPrompt(prompt);
    animatePrompt();
  };

  const processInput = (
    inputType: 'tap' | 'swipe' | 'hold-and-flick',
    direction?: 'left' | 'right' | 'up' | 'down'
  ) => {
    if (!currentPrompt || !currentPrompt.isActive) return;

    const now = Date.now();
    const timeDiff = now - currentPrompt.startTime;

    // Check if input matches prompt
    const isCorrectInput =
      currentPrompt.type === inputType &&
      (inputType === 'tap' || currentPrompt.direction === direction);

    if (isCorrectInput && timeDiff <= currentPrompt.duration) {
      // Determine hit quality
      let hitQuality: 'perfect' | 'good' | 'miss' = 'miss';
      let points = 0;
      let damage = 0;
      let powerGain = 0;

      if (timeDiff <= 200) {
        hitQuality = 'perfect';
        points = 100;
        damage = 50;
        powerGain = 10;
        triggerHaptic('heavy');
        playSound(hitSound);
        createParticles(screenWidth / 2, screenHeight * 0.4, '#00ff00', 12);
        createFeedbackText('PERFECT!', screenWidth / 2, screenHeight * 0.5, '#00ff00');
      } else if (timeDiff <= 400) {
        hitQuality = 'good';
        points = 50;
        damage = 25;
        powerGain = 5;
        triggerHaptic('medium');
        playSound(hitSound);
        createParticles(screenWidth / 2, screenHeight * 0.4, '#ffff00', 8);
        createFeedbackText('GOOD!', screenWidth / 2, screenHeight * 0.5, '#ffff00');
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
      handleMiss();
    }

    // Clear current prompt
    setCurrentPrompt(null);
  };

  const handleMiss = () => {
    setGameState(prev => ({
      ...prev,
      lives: prev.lives - 1,
      avatarState: 'failure',
    }));

    triggerHaptic('light');
    playSound(missSound);
    screenShake();
    createParticles(screenWidth / 2, screenHeight * 0.4, '#ff0000', 16);
    createFeedbackText('MISS!', screenWidth / 2, screenHeight * 0.5, '#ff0000');
    animateAvatar();

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
      roundHPGoal: Math.max(0, prev.roundHPGoal - 250),
      isPaused: true, // Pause game during pre-round
    }));

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
    particleScale.value = 0;

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
    particleScale.value = withSequence(
      withDelay(200, withSpring(1.2, { damping: 8 })),
      withTiming(0, { duration: 400 })
    );

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

      particleScale.value = withSequence(
        withSpring(1, { damping: 10 }),
        withTiming(0, { duration: 300 })
      );
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

      particleScale.value = withSequence(
        withSpring(2, { damping: 6 }),
        withTiming(0, { duration: 600 })
      );

      // End pre-round and start game
      setTimeout(() => {
        runOnJS(setIsPreRound)(false);
        runOnJS(setGameState)(prev => ({ ...prev, isPaused: false }));
      }, 1000);
    }, 3000);
  };

  const completeLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      opponentHP: 1000,
      currentRound: 1,
      roundHPGoal: 750,
      powerMeter: 0,
    }));

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
    inputType: 'tap' | 'swipe',
    direction?: 'left' | 'right' | 'up' | 'down'
  ) => {
    const currentSuperPrompt = superComboSequence[superComboIndex];
    if (!currentSuperPrompt || !currentSuperPrompt.isActive) return;

    const now = Date.now();
    const timeDiff = now - currentSuperPrompt.startTime;

    const isCorrectInput =
      currentSuperPrompt.type === inputType &&
      (inputType === 'tap' || currentSuperPrompt.direction === direction);

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

      playSound(comboSound);
      createParticles(screenWidth / 2, screenHeight * 0.4, '#ff00ff', 10);

      // Check if super combo is complete
      if (superComboIndex + 1 >= superComboSequence.length) {
        // Super combo successful
        setGameState(prev => ({
          ...prev,
          score: prev.score + 500,
          opponentHP: Math.max(0, prev.opponentHP - 150),
          isSuperComboActive: false,
        }));

        setSuperComboSequence([]);
        setSuperComboIndex(0);
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
        now - lastPromptTime > promptInterval &&
        !isPreRound
      ) {
        spawnPrompt();
        setLastPromptTime(now);
      }

      // Update prompt timing based on score
      const newInterval = Math.max(1000, 1500 - Math.floor(gameState.score / 1000) * 100);
      setPromptInterval(newInterval);

      // Update game time
      setGameState(prev => ({
        ...prev,
        gameTime: prev.gameTime + 16, // ~60 FPS
      }));

      // Reset avatar state after animation
      if (gameState.avatarState !== 'idle') {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, avatarState: 'idle' }));
        }, 1000);
      }
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
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Check for double-tap (within 300ms)
    if (timeSinceLastTap < 300) {
      // Double-tap detected
      if (gameState.powerMeter >= 100 && !gameState.isSuperComboActive) {
        activateSuperCombo();
      }
      setTapCount(0);
      setLastTapTime(0);
    } else {
      // Single tap
      setTapCount(1);
      setLastTapTime(now);

      // Process normal tap input
      if (gameState.isSuperComboActive) {
        processSuperComboInput('tap');
      } else {
        processInput('tap');
      }
    }
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameState.isSuperComboActive) {
      processSuperComboInput('swipe', direction);
    } else {
      processInput('swipe', direction);
    }
  };

  const handleHoldStart = () => {
    if (currentPrompt?.type === 'hold-and-flick') {
      setIsHolding(true);
      setHoldStartTime(Date.now());
      setHoldProgress(0);
      setHoldDirection(currentPrompt.direction || null);

      // Start hold animation
      holdCircleAnim.value = withTiming(1, { duration: 1000 });

      // Start progress animation
      holdProgressAnim.value = withTiming(1, { duration: 1000 });
    }
  };

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

  const particleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: particleScale.value }],
    };
  });

  const handleHoldEnd = () => {
    if (isHolding && holdDirection) {
      const holdDuration = Date.now() - holdStartTime;
      if (holdDuration >= 1000) {
        // Successful hold-and-flick
        processInput('hold-and-flick', holdDirection);
        triggerHaptic('heavy');
      } else {
        // Failed hold - too short
        handleMiss();
      }

      // Reset hold state
      setIsHolding(false);
      setHoldProgress(0);
      setHoldDirection(null);

      // Reset animations
      holdCircleAnim.value = withTiming(0, { duration: 200 });

      holdProgressAnim.value = withTiming(0, { duration: 200 });
    }
  };

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

  const getPromptIcon = (prompt: Prompt) => {
    switch (prompt.type) {
      case 'tap':
        return '👊';
      case 'swipe':
        switch (prompt.direction) {
          case 'left':
            return '⬅️';
          case 'right':
            return '➡️';
          case 'up':
            return '⬆️';
          case 'down':
            return '⬇️';
          default:
            return '➡️';
        }
      case 'hold-and-flick':
        return isHolding ? '💥' : '⭕';
      default:
        return '❓';
    }
  };

  const getPromptColor = (prompt: Prompt) => {
    switch (prompt.type) {
      case 'tap':
        return '#ff0000';
      case 'swipe':
        switch (prompt.direction) {
          case 'left':
            return '#ff8800';
          case 'right':
            return '#00ff00';
          case 'up':
            return '#0088ff';
          case 'down':
            return '#ff00ff';
          default:
            return '#ffffff';
        }
      case 'hold-and-flick':
        return '#ffff00';
      default:
        return '#ffffff';
    }
  };

  if (isGameOver) {
    return (
      <GameOverScreen
        finalScore={gameState.score}
        gameMode={gameMode}
        onRestart={() => {
          setGameState({
            score: 0,
            lives: 3,
            opponentHP: 1000,
            currentRound: 1,
            roundHPGoal: 750,
            powerMeter: 0,
            isSuperComboActive: false,
            avatarState: 'idle',
            isPaused: false,
            gameTime: 0,
            level: 1,
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
                  style={[styles.hpFill, { width: `${(gameState.opponentHP / 1000) * 100}%` }]}
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

        {/* Prompt Area */}
        <View style={styles.promptArea}>
          {currentPrompt && currentPrompt.isActive && (
            <Animated.View
              style={[
                styles.promptContainer,
                {
                  backgroundColor: getPromptColor(currentPrompt),
                },
                promptScaleStyle,
              ]}
            >
              <Text style={styles.promptIcon}>{getPromptIcon(currentPrompt)}</Text>
              <Text style={styles.promptText}>
                {currentPrompt.type === 'tap'
                  ? 'TAP!'
                  : currentPrompt.type === 'swipe'
                  ? `SWIPE ${currentPrompt.direction?.toUpperCase()}!`
                  : `HOLD & FLICK ${currentPrompt.direction?.toUpperCase()}!`}
              </Text>

              {/* Hold-and-flick progress indicator */}
              {currentPrompt.type === 'hold-and-flick' && (
                <View style={styles.holdProgressContainer}>
                  <Animated.View style={[styles.holdProgressBar, holdProgressStyle]} />
                </View>
              )}
            </Animated.View>
          )}

          {gameState.isSuperComboActive && superComboSequence[superComboIndex] && (
            <View style={styles.superComboContainer}>
              <Text style={styles.superComboLabel}>SUPER COMBO!</Text>
              <Animated.View
                style={[
                  styles.promptContainer,
                  {
                    backgroundColor: getPromptColor(superComboSequence[superComboIndex]),
                  },
                  promptScaleStyle,
                ]}
              >
                <Text style={styles.promptIcon}>
                  {getPromptIcon(superComboSequence[superComboIndex])}
                </Text>
                <Text style={styles.promptText}>
                  {superComboSequence[superComboIndex].type === 'tap'
                    ? 'TAP!'
                    : `SWIPE ${superComboSequence[superComboIndex].direction?.toUpperCase()}!`}
                </Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <PanGestureHandler
            onGestureEvent={event => {
              if (currentPrompt?.type === 'hold-and-flick') {
                if (event.nativeEvent.state === State.BEGAN) {
                  handleHoldStart();
                } else if (event.nativeEvent.state === State.END) {
                  handleHoldEnd();
                }
              }
            }}
          >
            <TouchableOpacity style={styles.tapArea} onPress={handleTap} activeOpacity={0.7} />
          </PanGestureHandler>

          {/* Swipe areas */}
          <View style={styles.swipeAreas}>
            <TouchableOpacity
              style={[styles.swipeArea, styles.swipeLeft]}
              onPress={() => handleSwipe('left')}
              activeOpacity={0.7}
            />
            <TouchableOpacity
              style={[styles.swipeArea, styles.swipeRight]}
              onPress={() => handleSwipe('right')}
              activeOpacity={0.7}
            />
            <TouchableOpacity
              style={[styles.swipeArea, styles.swipeUp]}
              onPress={() => handleSwipe('up')}
              activeOpacity={0.7}
            />
            <TouchableOpacity
              style={[styles.swipeArea, styles.swipeDown]}
              onPress={() => handleSwipe('down')}
              activeOpacity={0.7}
            />
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
          onPress={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
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
              onPress={() => setGameState(prev => ({ ...prev, isPaused: false }))}
            >
              <Text style={styles.resumeButtonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={onBackToMenu}>
              <Text style={styles.quitButtonText}>QUIT TO MENU</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pre-round Display */}
        {isPreRound && (
          <View style={styles.preRoundOverlay}>
            {/* Flash effect background */}
            <Animated.View style={[styles.flashBackground, flashAnimatedStyle]} />

            {/* Particle effects */}
            <Animated.View style={[styles.particleContainer, particleAnimatedStyle]}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.preRoundParticle,
                    {
                      transform: [{ rotate: `${i * 45}deg` }, { translateY: -100 }],
                    },
                  ]}
                />
              ))}
            </Animated.View>

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
    top: '45%',
    left: 20,
    right: 20,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  promptContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  promptIcon: {
    fontSize: 48,
  },
  promptText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
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
    bottom: 120,
    left: 20,
    right: 20,
    borderWidth: 2,
    borderColor: '#00ff00',
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
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  swipeAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swipeArea: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
  },
  swipeLeft: {
    left: 0,
    top: 50,
  },
  swipeRight: {
    right: 0,
    top: 50,
  },
  swipeUp: {
    top: 0,
    left: 50,
  },
  swipeDown: {
    bottom: 0,
    left: 50,
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
  },
  testPreRoundButtonText: {
    fontSize: 20,
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
});

export default GameScreen;
