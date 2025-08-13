import { useState, useRef, useEffect, useMemo } from 'react';
import { GameState, Prompt, TapPrompt, TimingPrompt, HitQuality } from '../types/game';
import { 
  getLevelConfig, 
  getRoundHPGoal, 
  getRandomPromptInterval,
  getPromptConfig,
  buildEndlessLevelConfig,
} from '../data/gameConfig';
import { generatePrompt, generateTapPrompts, generateTimingPrompts, generateSuperComboSequence } from '../utils/promptUtils';
import { triggerHaptic } from '../utils/hapticUtils';
import { createParticles, createFeedbackText } from '../utils/visualEffects';
import { createPauseSafeClock, onPause as clockPause, onResume as clockResume, getElapsedSince } from '../utils/timeUtils';
import { useGame } from '../contexts/GameContext';
import { findSuperMoveByCombo, SuperMove } from '../data/superMoves';

// ============================================================================
// GAME LOGIC HOOK
// ============================================================================

export const useGameLogic = (
  selectedLevel: number,
  onMiss?: () => void,
  onSuccess?: () => void,
  onScreenShake?: () => void,
  gameMode: 'arcade' | 'endless' = 'arcade'
) => {
  const [endlessStage, setEndlessStage] = useState<number>(1);
  const levelConfig = useMemo(
    () => (gameMode === 'endless' ? buildEndlessLevelConfig(endlessStage) : getLevelConfig(selectedLevel)),
    [gameMode, endlessStage, selectedLevel]
  );

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    opponentHP: levelConfig.hp,
    currentRound: 1,
    roundHPGoal: getRoundHPGoal(levelConfig, 1),
    superMeter: 0, // Initialize super meter
    isSuperComboActive: false,
    isSuperModeActive: false, // Initialize super mode
    avatarState: 'idle',
    isPaused: false,
    gameTime: 0,
    level: selectedLevel,
  });

  // Persisted gem system handled via GameContext; remove local gems/snapshot

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [activeTapPrompts, setActiveTapPrompts] = useState<TapPrompt[]>([]);
  const [activeTimingPrompts, setActiveTimingPrompts] = useState<TimingPrompt[]>([]);
  const [superComboSequence, setSuperComboSequence] = useState<Prompt[]>([]);
  const [superComboIndex, setSuperComboIndex] = useState(0);
  const [lastPromptTime, setLastPromptTime] = useState(0);
  const [promptInterval, setPromptInterval] = useState(getRandomPromptInterval(levelConfig, 1));
  const [endlessSuccesses, setEndlessSuccesses] = useState<number>(0);

  const incrementEndlessProgress = () => {
    if (gameMode !== 'endless') return;
    setEndlessSuccesses(prev => {
      const next = prev + 1;
      if (next >= 10) {
        setEndlessStage(s => s + 1);
        return 0;
      }
      return next;
    });
  };

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
  const [preRoundText, setPreRoundText] = useState(gameMode === 'endless' ? 'ENDLESS MODE' : `ROUND 1`);
  
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

  // Pause tracking
  const pauseStartTime = useRef<number | null>(null);
  const totalPausedDuration = useRef(0);
  const lastPauseState = useRef(false);
  const pauseClockRef = useRef(createPauseSafeClock());
  const { setGems, snapshotRun, gameState: persisted, incrementStat } = useGame();
  
  // Optional: per-round save hook
  const { handleRoundComplete } = require('../hooks/useGameSave');

  // Refs
  const particleIdCounter = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // PROMPT SPAWNING
  // ============================================================================

  const spawnPrompt = () => {
    if (gameState.isSuperComboActive || gameState.isSuperModeActive) return;

    // Check if any prompts are currently active
    // For timing prompts, consider any pending (not completed) prompts as active
    const hasActivePrompts = 
      currentPrompt?.isActive || 
      activeTapPrompts.some(p => p.isActive && !p.isCompleted) ||
      activeTimingPrompts.some(p => !p.isCompleted);

    if (hasActivePrompts) return;

    // Reset pause tracking for new prompts
    totalPausedDuration.current = 0;
    pauseStartTime.current = gameState.isPaused ? Date.now() : null;

    const prompt = generatePrompt(levelConfig, gameState.currentRound);

    if (prompt.type === 'tap') {
      const tapPrompts = generateTapPrompts(levelConfig, gameState.currentRound);
      setActiveTapPrompts(tapPrompts);
      setCurrentPrompt(prompt);
      setActiveTimingPrompts([]);
    } else if (prompt.type === 'timing') {
      const timingPrompts = generateTimingPrompts(levelConfig, gameState.currentRound);
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
    // Get current paused duration if currently paused
    const timeDiff = getElapsedSince(pauseClockRef.current, currentPrompt.startTime);

    const isCorrectInput =
      currentPrompt.type === inputType &&
      (inputType === 'tap' || currentPrompt.direction === direction);

    if (isCorrectInput && timeDiff <= currentPrompt.duration) {
      let hitQuality: HitQuality = 'miss';

      // Use timingWindows for all prompt types that need timing evaluation
      if (currentPrompt.type === 'swipe' || currentPrompt.type === 'timing' || currentPrompt.type === 'tap') {
        // Get prompt configuration for the specific type
        const promptConfig = getPromptConfig(levelConfig, currentPrompt.type, gameState.currentRound);
        // Add a small grace window for swipes to avoid race conditions around expiry
        const graceMs = currentPrompt.type === 'swipe' ? 60 : 0;
        
        // Collapse into success/miss only: if within max window (good), count as success
        if (timeDiff <= promptConfig.gradeThresholds.success + graceMs) {
          hitQuality = 'success';
        } else {
          hitQuality = 'miss';
        }
      }

      if (hitQuality !== 'miss') {
        const { points, damage: inputDamage, superGain } = computeOutcome('success');
        const prevScoreSnapshot = gameState.score;
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          opponentHP: Math.max(0, prev.opponentHP - inputDamage),
          superMeter: Math.min(100, prev.superMeter + superGain),
          avatarState: 'success',
        }));
        console.log('🎯 Score update', {
          type: currentPrompt.type,
          points,
          prevScore: prevScoreSnapshot,
          nextScore: prevScoreSnapshot + points,
        });

        triggerHaptic('success');
        if (onSuccess) onSuccess();
        incrementEndlessProgress();
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
    // Get current paused duration if currently paused
    const timeDiff = getElapsedSince(pauseClockRef.current, tapPrompt.startTime);

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

    if (successfulTaps === totalRealPrompts) {
      const { points, damage, superGain } = computeOutcome('success', totalRealPrompts);
      const prevScoreSnapshot = gameState.score;
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        opponentHP: Math.max(0, prev.opponentHP - damage),
        superMeter: Math.min(100, prev.superMeter + superGain),
        avatarState: 'success',
      }));
      console.log('🎯 Score update (tap)', {
        totalRealPrompts,
        points,
        prevScore: prevScoreSnapshot,
        nextScore: prevScoreSnapshot + points,
      });

      triggerHaptic('success');
      if (onSuccess) onSuccess();
      incrementEndlessProgress();
    } else {
      handleMiss();
    }
    clearAllPrompts();
  };

  const clearAllPrompts = () => {
    setActiveTapPrompts([]);
    setActiveTimingPrompts([]);
    setCurrentPrompt(null);
    
    // Reset pause tracking for next prompts
    totalPausedDuration.current = 0;
    pauseStartTime.current = gameState.isPaused ? Date.now() : null;
  };

  // ============================================================================
  // TIMING PROMPT HANDLING
  // ============================================================================

  const processTimingPrompt = (gridPosition: number, _hitQuality?: 'perfect' | 'good') => {
    
    const timingPrompt = activeTimingPrompts.find(
      prompt => prompt.gridPosition === gridPosition && prompt.isActive && !prompt.isCompleted
    );

    if (!timingPrompt) {
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
      handleTimingPromptCompletion(updatedPrompts, Date.now());
    }
  };

  const handleTimingPromptCompletion = (completedPrompts: TimingPrompt[], completionTime: number) => {
    const totalPrompts = completedPrompts.length;
    const completedPromptsCount = completedPrompts.filter(p => p.isCompleted).length;

    if (completedPromptsCount === totalPrompts) {
      const { points, damage, superGain } = computeOutcome('success', totalPrompts);
      const prevScoreSnapshot = gameState.score;
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        opponentHP: Math.max(0, prev.opponentHP - damage),
        superMeter: Math.min(100, prev.superMeter + superGain),
        avatarState: 'success',
      }));
      console.log('🎯 Score update (timing)', {
        totalPrompts,
        points,
        prevScore: prevScoreSnapshot,
        nextScore: prevScoreSnapshot + points,
      });

      triggerHaptic('success');
      if (onSuccess) onSuccess();
      incrementEndlessProgress();
    } else {
      handleMiss();
    }
    clearAllPrompts();
  };

  // ============================================================================
  // GAME STATE MANAGEMENT
  // ============================================================================

  const handleMiss = () => {
    
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
      // Persist snapshot for continue
      snapshotRun({
        level: gameState.level,
        currentRound: gameState.currentRound,
        opponentHP: gameState.opponentHP,
        score: gameState.score,
        superMeter: gameState.superMeter,
      });
      setTimeout(() => setIsGameOver(true), 1000);
    }
  };

  const completeRound = () => {
    const nextRound = gameState.currentRound + 1;

    setGameState(prev => ({
      ...prev,
      currentRound: nextRound,
      roundHPGoal: getRoundHPGoal(levelConfig, nextRound),
      isPaused: true,
    }));
    try {
      incrementStat('roundsCompleted', 1);
      if (typeof handleRoundComplete === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useGameSave } = require('../hooks/useGameSave');
        const saver = useGameSave();
        saver.handleRoundComplete?.();
      }
    } catch {}

    const newInterval = getRandomPromptInterval(levelConfig, nextRound);
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
    setPreRoundText(gameMode === 'endless' ? 'ENDLESS MODE' : `ROUND ${gameState.currentRound}`);
    setIsPreRound(true);
  };

  const completeLevel = () => {
    if (gameMode === 'endless') {
      // Endless: advance stage, tighten overall difficulty, keep playing
      setEndlessStage(prev => prev + 1);
      // Brief cooldown between stages
      startCooldown();
      return;
    }
    // Arcade: Enter post-level
    setIsPostLevel(true);
    setGameState(prev => ({ ...prev, isPaused: true }));
    triggerHaptic('heavy');
  };

  const advanceToNextLevel = () => {
    const nextLevel = gameState.level + 1;
    const nextLevelConfig = getLevelConfig(nextLevel);

    setGameState(prev => ({
      ...prev,
      level: nextLevel,
      opponentHP: nextLevelConfig.hp,
      currentRound: 1,
      roundHPGoal: getRoundHPGoal(nextLevelConfig, 1),
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
    if ((persisted.gems ?? 0) <= 0 || !persisted.lastRunSnapshot) return false;

    setGems((prev: number) => prev - 1);
    const snap = persisted.lastRunSnapshot as NonNullable<typeof persisted.lastRunSnapshot>;
    setGameState(prev => ({
      ...prev,
      level: snap.level,
      currentRound: snap.currentRound,
      opponentHP: snap.opponentHP,
      score: snap.score,
      superMeter: snap.superMeter,
      isPaused: false,
    }));
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
    snapshotRun({
      level: gameState.level,
      currentRound: gameState.currentRound,
      opponentHP: gameState.opponentHP,
      score: gameState.score,
      superMeter: gameState.superMeter,
    });
  };

  // ============================================================================
  // SUPER COMBO HANDLING
  // ============================================================================

  const activateSuperMode = () => {
    if (gameMode === 'endless') return; // no super mode in endless
    if (gameState.superMeter < 100) return;

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
    setGameState(prev => {
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
    if (gameMode === 'endless') return;
    setSuperComboDisplay(comboDisplay);
  };

  const handleSuperComboComplete = (superMove: SuperMove | null) => {
    if (gameMode === 'endless') return;
    if (superMove) {
      
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
        // Check if this is the final round of the level
        if (gameState.currentRound >= levelConfig.rounds) {
          completeLevel();
        } else {
          completeRound();
        }
      }
    } else {
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
    if (gameMode === 'endless') return;
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
    if (gameMode === 'endless') return;
    const currentSuperPrompt = superComboSequence[superComboIndex];
    if (!currentSuperPrompt || !currentSuperPrompt.isActive) return;

    const now = Date.now();
    // Get current paused duration if currently paused
    let currentPausedDuration = totalPausedDuration.current;
    if (pauseStartTime.current) {
      currentPausedDuration += now - pauseStartTime.current;
    }
    const timeDiff = now - currentSuperPrompt.startTime - currentPausedDuration;

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
                      console.log(`🥊 DAMAGE DEALT: ${levelConfig.damage.superCombo} (super combo base damage)`);
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + 500,
          opponentHP: Math.max(0, prev.opponentHP - levelConfig.damage.superCombo),
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

  // Track pause/resume to calculate paused duration
  useEffect(() => {
    if (gameState.isPaused && !lastPauseState.current) {
      // Game just paused
      clockPause(pauseClockRef.current);
    } else if (!gameState.isPaused && lastPauseState.current) {
      // Game just resumed
      clockResume(pauseClockRef.current);
    }
    lastPauseState.current = gameState.isPaused;
  }, [gameState.isPaused]);

  // Auto-miss timer for ALL prompts (tap, swipe, super combo)
  useEffect(() => {
      if (gameState.isPaused || isGameOver || isPreRound || isCooldown || isInCooldown) return;

    const checkExpiredPrompts = () => {
      const now = Date.now();
      
      // Get current paused duration if currently paused
      let currentPausedDuration = totalPausedDuration.current;
      if (pauseStartTime.current) {
        currentPausedDuration += now - pauseStartTime.current;
      }

      // Check tap prompts
      if (activeTapPrompts.length > 0) {
        const promptStartTime = activeTapPrompts[0].startTime;
        const overallTimeElapsed = getElapsedSince(pauseClockRef.current, promptStartTime);
        const hasRealPrompts = activeTapPrompts.some(
          p => !p.isFeint && p.isActive && !p.isCompleted
        );

        if (hasRealPrompts && overallTimeElapsed > activeTapPrompts[0].duration) {
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
        const timeElapsed = getElapsedSince(pauseClockRef.current, currentPrompt.startTime);
        if (timeElapsed > currentPrompt.duration) {
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
        // Account for paused duration when checking activation time
        const updatedPrompts = activeTimingPrompts.map(prompt => {
          if (!prompt.isActive && getElapsedSince(pauseClockRef.current, prompt.startTime) >= 0) {
            return { ...prompt, isActive: true };
          }
          return prompt;
        });
        
        if (JSON.stringify(updatedPrompts) !== JSON.stringify(activeTimingPrompts)) {
          setActiveTimingPrompts(updatedPrompts);
        }

        // Check for expired timing prompts - check all active prompts
        // Since the timing prompt component handles its own pause/resume and expiration,
        // we rely on it calling onMiss when the animation completes
        // This avoids duplicate miss detection and ensures pause handling is consistent
      }

      // Check super combo prompts
      if (
        gameState.isSuperComboActive &&
        superComboSequence[superComboIndex]
      ) {
        const currentSuperPrompt = superComboSequence[superComboIndex];
        if (currentSuperPrompt.isActive && !currentSuperPrompt.isCompleted) {
          const timeElapsed = getElapsedSince(pauseClockRef.current, currentSuperPrompt.startTime);
          if (timeElapsed > currentSuperPrompt.duration) {
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

  // Prompt spawn loop - centralize in logic (remove from UI)
  useEffect(() => {
    if (gameState.isPaused || isGameOver || isPreRound || isCooldown || isInCooldown) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const hasActivePrompts =
        currentPrompt?.isActive ||
        activeTapPrompts.some(p => p.isActive && !p.isCompleted) ||
        activeTimingPrompts.some(p => !p.isCompleted);
      if (
        !hasActivePrompts &&
        !gameState.isSuperComboActive &&
        (now - lastPromptTime > promptInterval || lastPromptTime === 0)
      ) {
        spawnPrompt();
        const newInterval = (gameMode === 'endless') ? Math.max(400, promptInterval * 0.98) : getRandomPromptInterval(levelConfig, gameState.currentRound);
        console.log('🎯 Spawn tick', {
          mode: gameMode,
          stage: endlessStage,
          prevInterval: promptInterval,
          newInterval,
          deltaSinceLast: lastPromptTime === 0 ? null : now - lastPromptTime,
        });
        setLastPromptTime(now);
        // In endless mode, progressively tighten prompt interval to increase difficulty
        setPromptInterval(newInterval);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [
    currentPrompt,
    activeTapPrompts,
    activeTimingPrompts,
    gameState.isPaused,
    isGameOver,
    isPreRound,
    isCooldown,
    isInCooldown,
    gameState.isSuperComboActive,
    lastPromptTime,
    promptInterval,
  ]);

  // Outcome calculator
  // Collapse scoring to success/miss only. Any non-miss is treated as success.
  const computeOutcome = (_quality: HitQuality, multiplier: number = 1) => {
    const points = 25 * multiplier;
    const damage = levelConfig.damage.success * multiplier;
    const superGain = 10 * multiplier;
    return { points, damage, superGain };
  };



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

  // Get current total paused duration
  const getCurrentPausedDuration = () => {
    let currentPausedDuration = totalPausedDuration.current;
    if (pauseStartTime.current) {
      currentPausedDuration += Date.now() - pauseStartTime.current;
    }
    return currentPausedDuration;
  };

  return {
    endlessStage,
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
    setGems,

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
    getCurrentPausedDuration,
  };
}; 