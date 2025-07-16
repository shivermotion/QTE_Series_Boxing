import { useState, useRef, useEffect } from 'react';
import { GameState, Prompt, TapPrompt, HitQuality } from '../types/game';
import { getOpponentConfig, getRoundHPGoal, getRandomPromptInterval } from '../data/opponents';
import { generatePrompt, generateTapPrompts, generateSuperComboSequence } from '../utils/promptUtils';
import { triggerHaptic } from '../utils/hapticUtils';
import { createParticles, createFeedbackText } from '../utils/visualEffects';

// ============================================================================
// GAME LOGIC HOOK
// ============================================================================

export const useGameLogic = (selectedLevel: number, onMiss?: () => void, onSuccess?: () => void, onScreenShake?: () => void) => {
  const opponentConfig = getOpponentConfig(selectedLevel);

  // Game state
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

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [activeTapPrompts, setActiveTapPrompts] = useState<TapPrompt[]>([]);
  const [superComboSequence, setSuperComboSequence] = useState<Prompt[]>([]);
  const [superComboIndex, setSuperComboIndex] = useState(0);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [promptInterval, setPromptInterval] = useState(getRandomPromptInterval(opponentConfig, 1));

  // UI state
  const [isGameOver, setIsGameOver] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<any[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showMissAnimation, setShowMissAnimation] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Pre-round state
  const [isPreRound, setIsPreRound] = useState(true);
  const [preRoundText, setPreRoundText] = useState('');

  // Input state
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Refs
  const particleIdCounter = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const powerDecayRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // PROMPT SPAWNING
  // ============================================================================

  const spawnPrompt = () => {
    if (gameState.isSuperComboActive) return;

    const prompt = generatePrompt();

    if (prompt.type === 'tap') {
      const tapPrompts = generateTapPrompts(opponentConfig, gameState.currentRound);
      setActiveTapPrompts(tapPrompts);
      setCurrentPrompt(prompt);
    } else {
      setCurrentPrompt(prompt);
      setActiveTapPrompts([]);
    }
  };

  // ============================================================================
  // INPUT PROCESSING
  // ============================================================================

  const processInput = (
    inputType: 'tap' | 'swipe' | 'hold-and-flick',
    direction?: 'left' | 'right' | 'up' | 'down'
  ) => {
    if (!currentPrompt || !currentPrompt.isActive) return;

    const now = Date.now();
    const timeDiff = now - currentPrompt.startTime;

    const isCorrectInput =
      currentPrompt.type === inputType &&
      (inputType === 'tap' || currentPrompt.direction === direction);

    if (isCorrectInput && timeDiff <= currentPrompt.duration) {
      let hitQuality: HitQuality = 'miss';
      let points = 0;
      let damage = 0;
      let powerGain = 0;

      if (timeDiff <= opponentConfig.reactionTime.perfect) {
        hitQuality = 'perfect';
        points = 100;
        damage = opponentConfig.damage.perfect;
        powerGain = 10;
        triggerHaptic('success');
        if (onSuccess) onSuccess();
      } else if (timeDiff <= opponentConfig.reactionTime.good) {
        hitQuality = 'good';
        points = 50;
        damage = opponentConfig.damage.good;
        powerGain = 5;
        triggerHaptic('success');
        if (onSuccess) onSuccess();
      }

      if (hitQuality !== 'miss') {
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          opponentHP: Math.max(0, prev.opponentHP - damage),
          powerMeter: Math.min(100, prev.powerMeter + powerGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));

        if (gameState.opponentHP - damage <= gameState.roundHPGoal) {
          completeRound();
        }

        if (gameState.opponentHP - damage <= 0) {
          completeLevel();
        }
      }
    } else {
      handleMiss();
    }

    setCurrentPrompt(null);
  };

  // ============================================================================
  // TAP PROMPT HANDLING
  // ============================================================================

  const processTapPrompt = (gridPosition: number) => {
    const tapPrompt = activeTapPrompts.find(
      prompt => prompt.gridPosition === gridPosition && prompt.isActive && !prompt.isCompleted
    );

    if (!tapPrompt) {
      handleMiss();
      return;
    }

    // Handle feint taps
    if (tapPrompt.isFeint) {
      console.log('🎯 FEINT TAPPED! Position:', gridPosition, 'This will cause a miss!');
      handleMiss();
      clearAllPrompts();
      return;
    }

    const now = Date.now();
    const timeDiff = now - tapPrompt.startTime;

    if (timeDiff > tapPrompt.duration) {
      handleMiss();
      clearAllPrompts();
      return;
    }

    // Mark this prompt as completed
    const updatedPrompts = activeTapPrompts.map(prompt =>
      prompt.id === tapPrompt.id ? { ...prompt, isCompleted: true } : prompt
    );
    setActiveTapPrompts(updatedPrompts);

    // Check if all real prompts are completed (feints don't need to be completed)
    const remainingRealPrompts = updatedPrompts.filter(p => !p.isFeint && p.isActive && !p.isCompleted);
    
    if (remainingRealPrompts.length === 0) {
      handleTapPromptCompletion(updatedPrompts, now);
    }
  };

  const handleTapPromptCompletion = (completedPrompts: TapPrompt[], completionTime: number) => {
    const realPrompts = completedPrompts.filter(p => !p.isFeint);
    const totalRealPrompts = realPrompts.length;
    const completedRealPrompts = completedPrompts.filter(p => p.isCompleted && !p.isFeint);
    const successfulTaps = completedRealPrompts.length;

    console.log('🎯 Tap Prompt Completion:', {
      totalPrompts: completedPrompts.length,
      totalRealPrompts,
      completedRealPrompts: completedRealPrompts.length,
      successfulTaps,
    });

    if (successfulTaps === totalRealPrompts) {
      console.log('🎯 SUCCESS! All real prompts completed');
      const overallTimeElapsed = completionTime - completedPrompts[0].startTime;

      let hitQuality: HitQuality = 'miss';
      let points = 0;
      let damage = 0;
      let powerGain = 0;

      if (overallTimeElapsed <= opponentConfig.reactionTime.perfect) {
        hitQuality = 'perfect';
        points = 100 * totalRealPrompts;
        damage = 50 * totalRealPrompts;
        powerGain = 10 * totalRealPrompts;
      } else if (overallTimeElapsed <= opponentConfig.reactionTime.good) {
        hitQuality = 'good';
        points = 50 * totalRealPrompts;
        damage = 25 * totalRealPrompts;
        powerGain = 5 * totalRealPrompts;
      }

      if (hitQuality !== 'miss') {
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          opponentHP: Math.max(0, prev.opponentHP - damage),
          powerMeter: Math.min(100, prev.powerMeter + powerGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));

        triggerHaptic('success');
        if (onSuccess) onSuccess();

        if (gameState.opponentHP - damage <= gameState.roundHPGoal) {
          completeRound();
        }

        if (gameState.opponentHP - damage <= 0) {
          completeLevel();
        }
      } else {
        console.log('🎯 MISS! Not all real prompts completed');
        handleMiss();
      }
    } else {
      console.log('🎯 MISS! Not all real prompts completed');
      handleMiss();
    }

    console.log('🎯 Clearing prompts after completion');
    clearAllPrompts();
  };

  const clearAllPrompts = () => {
    setActiveTapPrompts([]);
    setCurrentPrompt(null);
  };

  // ============================================================================
  // GAME STATE MANAGEMENT
  // ============================================================================

  const handleMiss = () => {
    console.log('🎯 MISS HANDLED - clearing all prompts and stopping timers');
    
    // Clear all prompts immediately to prevent further auto-miss triggers
    clearAllPrompts();
    
    setGameState(prev => ({
      ...prev,
      lives: prev.lives - 1,
      avatarState: 'failure',
    }));

    triggerHaptic('error');
    if (onMiss) onMiss();
    if (onScreenShake) onScreenShake();
    setShowMissAnimation(true);
    setIsInCooldown(true);

    setTimeout(() => {
      setShowMissAnimation(false);
      setIsInCooldown(false);
    }, 2500);

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
      isPaused: true,
    }));

    const newInterval = getRandomPromptInterval(opponentConfig, nextRound);
    setPromptInterval(newInterval);

    setPreRoundText(`ROUND ${nextRound}`);
    setIsPreRound(true);

    triggerHaptic('success');
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
  };

  // ============================================================================
  // SUPER COMBO HANDLING
  // ============================================================================

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

      if (superComboIndex + 1 >= superComboSequence.length) {
        setGameState(prev => ({
          ...prev,
          score: prev.score + 500,
          opponentHP: Math.max(0, prev.opponentHP - opponentConfig.damage.superCombo),
          isSuperComboActive: false,
        }));

        setSuperComboSequence([]);
        setSuperComboIndex(0);
        triggerHaptic('heavy');
      }
    } else {
      setGameState(prev => ({
        ...prev,
        isSuperComboActive: false,
        powerMeter: Math.max(0, prev.powerMeter - 50),
      }));

      setSuperComboSequence([]);
      setSuperComboIndex(0);
      triggerHaptic('error');
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-miss timer for ALL prompts (tap, swipe, super combo)
  useEffect(() => {
    if (
      gameState.isPaused ||
      isGameOver ||
      isPreRound ||
      isInCooldown
    )
      return;

    const checkExpiredPrompts = () => {
      const now = Date.now();

      // Check tap prompts
      if (activeTapPrompts.length > 0) {
        const promptStartTime = activeTapPrompts[0].startTime;
        const overallTimeElapsed = now - promptStartTime;
        const hasRealPrompts = activeTapPrompts.some(
          p => !p.isFeint && p.isActive && !p.isCompleted
        );

        if (hasRealPrompts && overallTimeElapsed > activeTapPrompts[0].duration) {
          console.log('🎯 Auto-miss: Tap prompts expired');
          if (!isInCooldown) {
            handleMiss();
          }
          return;
        }
      }

      // Check swipe prompts
      if (
        currentPrompt &&
        currentPrompt.isActive &&
        !currentPrompt.isCompleted &&
        currentPrompt.type === 'swipe'
      ) {
        const timeElapsed = now - currentPrompt.startTime;
        if (timeElapsed > currentPrompt.duration) {
          console.log('🎯 Auto-miss: Swipe prompt expired');
          if (!isInCooldown) {
            handleMiss();
          }
          return;
        }
      }

      // Check super combo prompts
      if (
        gameState.isSuperComboActive &&
        superComboSequence[superComboIndex]
      ) {
        const currentSuperPrompt = superComboSequence[superComboIndex];
        if (currentSuperPrompt.isActive && !currentSuperPrompt.isCompleted) {
          const timeElapsed = now - currentSuperPrompt.startTime;
          if (timeElapsed > currentSuperPrompt.duration) {
            console.log('🎯 Auto-miss: Super combo prompt expired');
            if (!isInCooldown) {
              handleMiss();
            }
            setGameState(prev => ({ ...prev, isSuperComboActive: false }));
            setSuperComboSequence([]);
            setSuperComboIndex(0);
            return;
          }
        }
      }
    };

    const expiredPromptTimer = setInterval(checkExpiredPrompts, 100);

    return () => {
      clearInterval(expiredPromptTimer);
    };
  }, [
    activeTapPrompts,
    currentPrompt,
    superComboSequence,
    superComboIndex,
    gameState.isPaused,
    gameState.isSuperComboActive,
    isGameOver,
    isPreRound,
    isInCooldown,
  ]);

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

  // Set initial pre-round text
  useEffect(() => {
    if (isPreRound && !preRoundText) {
      const roundText = `ROUND ${gameState.currentRound}`;
      console.log('🎬 GameLogic: Setting initial pre-round text:', roundText);
      setPreRoundText(roundText);
    }
  }, [isPreRound, preRoundText, gameState.currentRound]);

  return {
    // State
    gameState,
    setGameState,
    currentPrompt,
    setCurrentPrompt,
    activeTapPrompts,
    setActiveTapPrompts,
    superComboSequence,
    setSuperComboSequence,
    superComboIndex,
    setSuperComboIndex,
    lastPromptTime,
    setLastPromptTime,
    promptInterval,
    setPromptInterval,
    isGameOver,
    setIsGameOver,
    particles,
    setParticles,
    feedbackTexts,
    setFeedbackTexts,
    isBlinking,
    setIsBlinking,
    showMissAnimation,
    setShowMissAnimation,
    isInCooldown,
    setIsInCooldown,
    isPreRound,
    setIsPreRound,
    preRoundText,
    setPreRoundText,
    lastTapTime,
    setLastTapTime,
    tapCount,
    setTapCount,

    // Refs
    particleIdCounter,
    gameLoopRef,
    powerDecayRef,

    // Functions
    spawnPrompt,
    processInput,
    processTapPrompt,
    handleMiss,
    completeRound,
    completeLevel,
    activateSuperCombo,
    processSuperComboInput,
    clearAllPrompts,
  };
}; 