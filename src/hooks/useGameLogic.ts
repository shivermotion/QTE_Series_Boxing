import { useState, useRef, useEffect } from 'react';
import { GameState, Prompt, TapPrompt, TimingPrompt, HitQuality } from '../types/game';
import { getOpponentConfig, getRoundHPGoal, getRandomPromptInterval } from '../data/opponents';
import { generatePrompt, generateTapPrompts, generateTimingPrompts, generateSuperComboSequence } from '../utils/promptUtils';
import { triggerHaptic } from '../utils/hapticUtils';
import { createParticles, createFeedbackText } from '../utils/visualEffects';
import { findSuperMoveByCombo, SuperMove } from '../data/superMoves';

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
    superMeter: 0, // Initialize super meter
    isSuperComboActive: false,
    isSuperModeActive: false, // Initialize super mode
    avatarState: 'idle',
    isPaused: false,
    gameTime: 0,
    level: selectedLevel,
  });

  // Gem system
  const [gems, setGems] = useState(3); // Default 3 gems
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null);

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [activeTapPrompts, setActiveTapPrompts] = useState<TapPrompt[]>([]);
  const [activeTimingPrompts, setActiveTimingPrompts] = useState<TimingPrompt[]>([]);
  const [superComboSequence, setSuperComboSequence] = useState<Prompt[]>([]);
  const [superComboIndex, setSuperComboIndex] = useState(0);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [promptInterval, setPromptInterval] = useState(getRandomPromptInterval(opponentConfig, 1));

  // UI state
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPostLevel, setIsPostLevel] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<any[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showMissAnimation, setShowMissAnimation] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Pre-round state
  const [isPreRound, setIsPreRound] = useState(true);
  const [preRoundText, setPreRoundText] = useState(`ROUND 1`);
  
  // Cooldown state
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(5);
  const [cooldownText, setCooldownText] = useState('COOL DOWN');

  // Super combo state
  const [currentSuperCombo, setCurrentSuperCombo] = useState<('up' | 'down' | 'left' | 'right')[]>([]);
  const [superComboDisplay, setSuperComboDisplay] = useState<string[]>([]);

  // Input state
  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapCount, setTapCount] = useState(0);

  // Refs
  const particleIdCounter = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // PROMPT SPAWNING
  // ============================================================================

  const spawnPrompt = () => {
    if (gameState.isSuperComboActive || gameState.isSuperModeActive) return;

    // Check if any prompts are currently active
    const hasActivePrompts = 
      currentPrompt?.isActive || 
      activeTapPrompts.some(p => p.isActive && !p.isCompleted) ||
      activeTimingPrompts.some(p => p.isActive && !p.isCompleted);

    if (hasActivePrompts) {
      console.log('🎯 Skipping prompt spawn - active prompts exist');
      return;
    }

    const prompt = generatePrompt(opponentConfig);
    console.log('🎯 Spawning prompt type:', prompt.type);

    if (prompt.type === 'tap') {
      const tapPrompts = generateTapPrompts(opponentConfig, gameState.currentRound);
      setActiveTapPrompts(tapPrompts);
      setCurrentPrompt(prompt);
      setActiveTimingPrompts([]);
    } else if (prompt.type === 'timing') {
      const timingPrompts = generateTimingPrompts(opponentConfig, gameState.currentRound);
      console.log('🎯 Generated timing prompts:', timingPrompts.length, timingPrompts);
      setActiveTimingPrompts(timingPrompts);
      setCurrentPrompt(null);
      setActiveTapPrompts([]);
    } else {
      setCurrentPrompt(prompt);
      setActiveTapPrompts([]);
      setActiveTimingPrompts([]);
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
        // Calculate super meter gain based on hit quality
        const superMeterGain = hitQuality === 'perfect' ? 15 : 10;
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          // Don't deal damage to opponent - fill super meter instead
          superMeter: Math.min(100, prev.superMeter + superMeterGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));
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
    // Safety check: ensure we have valid prompts
    if (!completedPrompts || completedPrompts.length === 0) {
      console.log('🎯 ERROR: No completed prompts provided to handleTapPromptCompletion');
      handleMiss();
      return;
    }

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
      
      // Safety check: ensure we have valid prompts with startTime
      let overallTimeElapsed: number;
      if (completedPrompts.length === 0 || !completedPrompts[0]?.startTime) {
        console.log('🎯 ERROR: Invalid completedPrompts array, defaulting to good timing');
        overallTimeElapsed = 1000; // Default to good timing
      } else {
        overallTimeElapsed = completionTime - completedPrompts[0].startTime;
      }

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
        // Calculate super meter gain based on hit quality and number of prompts
        const superMeterGain = hitQuality === 'perfect' ? 15 * totalRealPrompts : 10 * totalRealPrompts;
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          // Don't deal damage to opponent - fill super meter instead
          superMeter: Math.min(100, prev.superMeter + superMeterGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));

        triggerHaptic('success');
        if (onSuccess) onSuccess();
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
    setActiveTimingPrompts([]);
    setCurrentPrompt(null);
  };

  // ============================================================================
  // TIMING PROMPT HANDLING
  // ============================================================================

  const processTimingPrompt = (gridPosition: number, hitQuality: 'perfect' | 'good') => {
    console.log('🎯 Processing timing prompt:', { gridPosition, hitQuality });
    
    const timingPrompt = activeTimingPrompts.find(
      prompt => prompt.gridPosition === gridPosition && prompt.isActive && !prompt.isCompleted
    );

    if (!timingPrompt) {
      console.log('🎯 No active timing prompt found for position:', gridPosition);
      handleMiss();
      return;
    }

    // Mark this prompt as completed
    const updatedPrompts = activeTimingPrompts.map(prompt =>
      prompt.id === timingPrompt.id ? { ...prompt, isCompleted: true } : prompt
    );
    setActiveTimingPrompts(updatedPrompts);

    // Check if all timing prompts are completed (including inactive ones)
    const remainingPrompts = updatedPrompts.filter(p => !p.isCompleted);
    
    if (remainingPrompts.length === 0) {
      handleTimingPromptCompletion(updatedPrompts, Date.now(), hitQuality);
    }
  };

  const handleTimingPromptCompletion = (completedPrompts: TimingPrompt[], completionTime: number, lastHitQuality: 'perfect' | 'good') => {
    const totalPrompts = completedPrompts.length;
    const completedPromptsCount = completedPrompts.filter(p => p.isCompleted).length;

    console.log('🎯 Timing Prompt Completion:', {
      completedPrompts: completedPromptsCount,
      lastHitQuality,
      totalPrompts,
    });

    if (completedPromptsCount === totalPrompts) {
      console.log('🎯 SUCCESS! All timing prompts completed');

      let points = 0;
      let damage = 0;
      let powerGain = 0;

      // Use the last hit quality for overall scoring (timing prompts have their own multi-tier timing)
      if (lastHitQuality === 'perfect') {
        points = 100 * totalPrompts;
        damage = opponentConfig.damage.perfect * totalPrompts;
        powerGain = 10 * totalPrompts;
      } else if (lastHitQuality === 'good') {
        points = 50 * totalPrompts;
        damage = opponentConfig.damage.good * totalPrompts;
        powerGain = 5 * totalPrompts;
      }

      // Calculate super meter gain based on hit quality and number of prompts
      const superMeterGain = lastHitQuality === 'perfect' ? 15 * totalPrompts : 10 * totalPrompts;
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        // Don't deal damage to opponent - fill super meter instead
        superMeter: Math.min(100, prev.superMeter + superMeterGain),
        avatarState: lastHitQuality === 'perfect' ? 'perfect' : 'success',
      }));

      triggerHaptic('success');
      if (onSuccess) onSuccess();
    } else {
      console.log('🎯 MISS! Not all timing prompts completed');
      handleMiss();
    }

    console.log('🎯 Clearing timing prompts after completion');
    clearAllPrompts();
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
      // Save the current game state for potential gem continue
      saveGameState();
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

    // Start cooldown instead of immediately showing pre-round
    setIsCooldown(true);
    setCooldownTime(5);
    setCooldownText('COOL DOWN');
    setIsPreRound(false);

    triggerHaptic('success');
  };

  const startCooldown = () => {
    setIsCooldown(true);
    setCooldownTime(5);
    setCooldownText('COOL DOWN');
    setIsPreRound(false);
  };

  const endCooldown = () => {
    setIsCooldown(false);
    setPreRoundText(`ROUND ${gameState.currentRound}`);
    setIsPreRound(true);
  };

  const completeLevel = () => {
    // Enter post-level state instead of immediately advancing
    setIsPostLevel(true);
    setGameState(prev => ({
      ...prev,
      isPaused: true, // Pause the game during post-level
    }));
    
    triggerHaptic('heavy');
  };

  const advanceToNextLevel = () => {
    const nextLevel = gameState.level + 1;
    const nextOpponentConfig = getOpponentConfig(nextLevel);

    setGameState(prev => ({
      ...prev,
      level: nextLevel,
      opponentHP: nextOpponentConfig.hp,
      currentRound: 1,
      roundHPGoal: getRoundHPGoal(nextOpponentConfig, 1),
      powerMeter: 0,
      isPaused: false, // Resume the game
    }));

    setIsPostLevel(false);
    triggerHaptic('heavy');
  };

  const returnToMenu = () => {
    setIsPostLevel(false);
    // Additional cleanup if needed
  };

  const continueWithGem = () => {
    if (gems <= 0 || !savedGameState) return false;
    
    // Use a gem
    setGems(prev => prev - 1);
    
    // Restore the saved game state
    setGameState(savedGameState);
    setIsGameOver(false);
    setCurrentPrompt(null);
    setActiveTapPrompts([]);
    setActiveTimingPrompts([]);
    setSuperComboSequence([]);
    setSuperComboIndex(0);
    
    // Start cooldown before resuming
    startCooldown();
    
    return true;
  };

  const saveGameState = () => {
    setSavedGameState(gameState);
  };

  // ============================================================================
  // SUPER COMBO HANDLING
  // ============================================================================

  const activateSuperMode = () => {
    if (gameState.superMeter < 100) return;

    console.log('🚀 ACTIVATING SUPER MODE!');
    
    setGameState(prev => ({
      ...prev,
      isSuperModeActive: true,
      superMeter: 0, // Reset super meter
    }));

    triggerHaptic('heavy');
    
    // Stop normal prompt spawning during super mode
    clearAllPrompts();
    
    // Super mode duration is now controlled by the video length
    // The video component will call onVideoEnd when it finishes
  };

  const endSuperMode = () => {
    console.log('🚀 SUPER MODE ENDING - setting isSuperModeActive to false');
    setGameState(prev => {
      console.log('🚀 Previous state isSuperModeActive:', prev.isSuperModeActive);
      return {
        ...prev,
        isSuperModeActive: false,
      };
    });
    
    // Reset super combo state
    setCurrentSuperCombo([]);
    setSuperComboDisplay([]);
  };

  const handleSuperComboProgress = (comboDisplay: string[]) => {
    setSuperComboDisplay(comboDisplay);
  };

  const handleSuperComboComplete = (superMove: SuperMove | null) => {
    if (superMove) {
      console.log('🥊 SUPER COMBO EXECUTED:', superMove.name, 'Damage:', superMove.damage);
      
      // Deal massive damage to opponent
      setGameState(prev => ({
        ...prev,
        opponentHP: Math.max(0, prev.opponentHP - superMove.damage),
      }));

      // Create visual feedback
      const feedbackText = createFeedbackText(superMove.name, 400, 300, '#ffff00');
      setFeedbackTexts(prev => [...prev, feedbackText]);
      const newParticles = createParticles(400, 300, '#ffff00', 15, particleIdCounter);
      setParticles(prev => [...prev, ...newParticles]);
      
      // Trigger haptic feedback
      triggerHaptic('heavy');
      
      // Check if opponent is defeated
      if (gameState.opponentHP - superMove.damage <= 0) {
        completeRound();
      }
    } else {
      console.log('❌ Invalid super combo - no damage dealt');
      const feedbackText = createFeedbackText('MISS!', 400, 300, '#ff0000');
      setFeedbackTexts(prev => [...prev, feedbackText]);
      triggerHaptic('medium');
    }
    
    // End super mode after combo
    setTimeout(() => {
      endSuperMode();
    }, 1000);
  };

  const activateSuperCombo = () => {
    const sequence = generateSuperComboSequence();
    setSuperComboSequence(sequence);
    setSuperComboIndex(0);
    setGameState(prev => ({
      ...prev,
      isSuperComboActive: true,
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
      isCooldown ||
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

      // Check timing prompts
      if (activeTimingPrompts.length > 0) {
        const now = Date.now();
        
        // Activate timing prompts when they reach their appearance time
        const updatedPrompts = activeTimingPrompts.map(prompt => {
          if (!prompt.isActive && now >= prompt.startTime) {
            console.log('🎯 Timing prompt appearing:', prompt.gridPosition, 'at time:', now);
            return { ...prompt, isActive: true };
          }
          return prompt;
        });
        
        if (JSON.stringify(updatedPrompts) !== JSON.stringify(activeTimingPrompts)) {
          console.log('🎯 Updating timing prompts:', updatedPrompts.map(p => ({ active: p.isActive, completed: p.isCompleted, pos: p.gridPosition })));
          setActiveTimingPrompts(updatedPrompts);
        }

        // Check for expired timing prompts - check all active prompts
        const activePrompts = updatedPrompts.filter(p => p.isActive && !p.isCompleted);
        for (const activePrompt of activePrompts) {
          const timeElapsed = now - activePrompt.startTime;
          if (timeElapsed > activePrompt.duration) {
            console.log('🎯 Auto-miss: Timing prompt expired');
            if (!isInCooldown) {
              handleMiss();
            }
            return;
          }
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
    activeTimingPrompts,
  ]);



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

  // Cooldown countdown effect
  useEffect(() => {
    if (isCooldown && cooldownTime > 0) {
      const countdownTimer = setTimeout(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(countdownTimer);
    } else if (isCooldown && cooldownTime === 0) {
      // Cooldown finished, start pre-round
      endCooldown();
    }
  }, [isCooldown, cooldownTime]);



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
    isPostLevel,
    setIsPostLevel,
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
    isCooldown,
    setIsCooldown,
    cooldownTime,
    setCooldownTime,
    cooldownText,
    setCooldownText,
    lastTapTime,
    setLastTapTime,
    tapCount,
    setTapCount,
    activeTimingPrompts,
    setActiveTimingPrompts,
    gems,
    setGems,
    savedGameState,

    // Refs
    particleIdCounter,
    gameLoopRef,

    // Functions
    spawnPrompt,
    processInput,
    processTapPrompt,
    processTimingPrompt,
    handleMiss,
    completeRound,
    startCooldown,
    endCooldown,
    completeLevel,
    advanceToNextLevel,
    returnToMenu,
    continueWithGem,
    saveGameState,
    activateSuperMode,
    endSuperMode,
    activateSuperCombo,
    processSuperComboInput,
    handleSuperComboProgress,
    handleSuperComboComplete,
    clearAllPrompts,
  };
}; 