import { useState, useRef, useEffect } from 'react';
import { GameState, Prompt, TapPrompt, TimingPrompt, HitQuality } from '../types/game';
import { 
  getLevelConfig, 
  getRoundHPGoal, 
  getRandomPromptInterval,
  getPromptConfig 
} from '../data/gameConfig';
import { generatePrompt, generateTapPrompts, generateTimingPrompts, generateSuperComboSequence } from '../utils/promptUtils';
import { triggerHaptic } from '../utils/hapticUtils';
import { createParticles, createFeedbackText } from '../utils/visualEffects';
import { findSuperMoveByCombo, SuperMove } from '../data/superMoves';

// ============================================================================
// GAME LOGIC HOOK
// ============================================================================

export const useGameLogic = (selectedLevel: number, onMiss?: () => void, onSuccess?: () => void, onScreenShake?: () => void) => {
  const levelConfig = getLevelConfig(selectedLevel);

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
  const [promptInterval, setPromptInterval] = useState(getRandomPromptInterval(levelConfig, 1));

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

  // Pause tracking
  const pauseStartTime = useRef<number | null>(null);
  const totalPausedDuration = useRef(0);
  const lastPauseState = useRef(false);

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

    // Reset pause tracking for new prompts
    totalPausedDuration.current = 0;
    pauseStartTime.current = gameState.isPaused ? Date.now() : null;

    const prompt = generatePrompt(levelConfig, gameState.currentRound);
    console.log('🎯 Spawning prompt type:', prompt.type);

    if (prompt.type === 'tap') {
      const tapPrompts = generateTapPrompts(levelConfig, gameState.currentRound);
      setActiveTapPrompts(tapPrompts);
      setCurrentPrompt(prompt);
      setActiveTimingPrompts([]);
    } else if (prompt.type === 'timing') {
      const timingPrompts = generateTimingPrompts(levelConfig, gameState.currentRound);
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
    // Get current paused duration if currently paused
    let currentPausedDuration = totalPausedDuration.current;
    if (pauseStartTime.current) {
      currentPausedDuration += now - pauseStartTime.current;
    }
    const timeDiff = now - currentPrompt.startTime - currentPausedDuration;

    const isCorrectInput =
      currentPrompt.type === inputType &&
      (inputType === 'tap' || currentPrompt.direction === direction);

    if (isCorrectInput && timeDiff <= currentPrompt.duration) {
      let hitQuality: HitQuality = 'miss';
      let points = 0;
      let damage = 0;
      let powerGain = 0;

      // Use timingWindows for all prompt types that need timing evaluation
      if (currentPrompt.type === 'swipe' || currentPrompt.type === 'timing' || currentPrompt.type === 'tap') {
        // Get prompt configuration for the specific type
        const promptConfig = getPromptConfig(levelConfig, currentPrompt.type, gameState.currentRound);
        
        if (timeDiff <= promptConfig.gradeThresholds.perfect) {
          hitQuality = 'perfect';
          points = 100;
          damage = levelConfig.damage.perfect;
          powerGain = 10;
        } else if (timeDiff <= promptConfig.gradeThresholds.good) {
          hitQuality = 'good';
          points = 50;
          damage = levelConfig.damage.good;
          powerGain = 5;
        } else {
          // If completed within prompt duration but outside timing windows, still count as success
          hitQuality = 'success';
          points = 25; // Reduced points for slow completion
          damage = levelConfig.damage.success;
          powerGain = 3;
        }
      }

      if (hitQuality !== 'miss') {
        // Calculate super meter gain based on hit quality
        const superMeterGain = hitQuality === 'perfect' ? 15 : 10;
        
        // Use configurable damage values from level config
        const inputDamage = hitQuality === 'perfect' ? levelConfig.damage.perfect : 
                           hitQuality === 'good' ? levelConfig.damage.good : 
                           levelConfig.damage.success;
        
        console.log(`🥊 DAMAGE DEALT: ${inputDamage} (${hitQuality} ${currentPrompt.type} prompt)`);
        
        setGameState(prev => ({
          ...prev,
          score: prev.score + points,
          opponentHP: Math.max(0, prev.opponentHP - inputDamage),
          superMeter: Math.min(100, prev.superMeter + superMeterGain),
          avatarState: hitQuality === 'perfect' ? 'perfect' : 'success',
        }));

        triggerHaptic('success');
        if (onSuccess) onSuccess();
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
    let currentPausedDuration = totalPausedDuration.current;
    if (pauseStartTime.current) {
      currentPausedDuration += now - pauseStartTime.current;
    }
    const timeDiff = now - tapPrompt.startTime - currentPausedDuration;

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
      
      // For tap prompts, success is determined by completing all prompts within their duration
      // We don't use opponent reaction time windows for tap prompts - those are for timing prompts
      const hitQuality: HitQuality = 'good'; // Tap prompts are always 'good' if completed
      const points = 50 * totalRealPrompts;
      const damage = levelConfig.damage.good * totalRealPrompts;
      const powerGain = 5 * totalRealPrompts;

      // Calculate super meter gain
      const superMeterGain = 10 * totalRealPrompts;
      
      // Use configurable damage values from level config
      const tapDamage = levelConfig.damage.good * totalRealPrompts;
      
      console.log(`🥊 DAMAGE DEALT: ${tapDamage} (${hitQuality} tap prompt - ${totalRealPrompts} prompts completed)`);
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        opponentHP: Math.max(0, prev.opponentHP - tapDamage),
        superMeter: Math.min(100, prev.superMeter + superMeterGain),
        avatarState: 'success',
      }));

      triggerHaptic('success');
      if (onSuccess) onSuccess();
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
    
    // Reset pause tracking for next prompts
    totalPausedDuration.current = 0;
    pauseStartTime.current = gameState.isPaused ? Date.now() : null;
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
        damage = levelConfig.damage.perfect * totalPrompts;
        powerGain = 10 * totalPrompts;
      } else if (lastHitQuality === 'good') {
        points = 50 * totalPrompts;
        damage = levelConfig.damage.good * totalPrompts;
        powerGain = 5 * totalPrompts;
      }

      // Calculate super meter gain based on hit quality and number of prompts
      const superMeterGain = lastHitQuality === 'perfect' ? 15 * totalPrompts : 10 * totalPrompts;
      
      // Use configurable damage values from level config
      const timingDamage = lastHitQuality === 'perfect' ? 
                          levelConfig.damage.perfect * totalPrompts : 
                          levelConfig.damage.good * totalPrompts;
      
      console.log(`🥊 DAMAGE DEALT: ${timingDamage} (${lastHitQuality} timing prompt - ${totalPrompts} prompts completed)`);
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        opponentHP: Math.max(0, prev.opponentHP - timingDamage),
        superMeter: Math.min(100, prev.superMeter + superMeterGain),
        avatarState: lastHitQuality === 'perfect' ? 'perfect' : 'success',
      }));

      console.log('🎯 Triggering haptic feedback and onSuccess callback');
      triggerHaptic('success');
      if (onSuccess) {
        console.log('🎯 Calling onSuccess callback');
        onSuccess();
      } else {
        console.log('🎯 onSuccess callback is undefined');
      }
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
      roundHPGoal: getRoundHPGoal(levelConfig, nextRound),
      isPaused: true,
    }));

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
      console.log(`🥊 DAMAGE DEALT: ${superMove.damage} (${superMove.name} super move)`);
      
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
      pauseStartTime.current = Date.now();
      console.log('🎮 Game paused at:', pauseStartTime.current);
    } else if (!gameState.isPaused && lastPauseState.current) {
      // Game just resumed
      if (pauseStartTime.current) {
        const pauseDuration = Date.now() - pauseStartTime.current;
        totalPausedDuration.current += pauseDuration;
        console.log('🎮 Game resumed, pause duration:', pauseDuration, 'total paused:', totalPausedDuration.current);
      }
      pauseStartTime.current = null;
    }
    lastPauseState.current = gameState.isPaused;
  }, [gameState.isPaused]);

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
      
      // Get current paused duration if currently paused
      let currentPausedDuration = totalPausedDuration.current;
      if (pauseStartTime.current) {
        currentPausedDuration += now - pauseStartTime.current;
      }

      // Check tap prompts
      if (activeTapPrompts.length > 0) {
        const promptStartTime = activeTapPrompts[0].startTime;
        const overallTimeElapsed = now - promptStartTime - currentPausedDuration;
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
        const timeElapsed = now - currentPrompt.startTime - currentPausedDuration;
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
        // Account for paused duration when checking activation time
        const updatedPrompts = activeTimingPrompts.map(prompt => {
          if (!prompt.isActive && now >= prompt.startTime + currentPausedDuration) {
            console.log('🎯 Timing prompt appearing:', prompt.gridPosition, 'at time:', now, 'adjusted startTime:', prompt.startTime + currentPausedDuration);
            return { ...prompt, isActive: true };
          }
          return prompt;
        });
        
        if (JSON.stringify(updatedPrompts) !== JSON.stringify(activeTimingPrompts)) {
          console.log('🎯 Updating timing prompts:', updatedPrompts.map(p => ({ active: p.isActive, completed: p.isCompleted, pos: p.gridPosition })));
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
          const timeElapsed = now - currentSuperPrompt.startTime - currentPausedDuration;
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

  // Get current total paused duration
  const getCurrentPausedDuration = () => {
    let currentPausedDuration = totalPausedDuration.current;
    if (pauseStartTime.current) {
      currentPausedDuration += Date.now() - pauseStartTime.current;
    }
    return currentPausedDuration;
  };

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
    getCurrentPausedDuration,
  };
}; 