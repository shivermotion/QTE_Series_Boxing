import { Prompt, TapPrompt, TimingPrompt } from '../types/game';
import { 
  getFeintConfig, 
  getTimingPromptConfig, 
  getPromptConfig, 
  getRandomPromptDuration,
  LevelConfig 
} from '../data/gameConfig';

// ============================================================================
// PROMPT UTILITIES
// ============================================================================

export const generatePrompt = (levelConfig: LevelConfig, currentRound: number = 1): Prompt => {
  // Get level configuration for this round
  const feintConfig = getFeintConfig(levelConfig, currentRound);
  const timingConfig = getTimingPromptConfig(levelConfig, currentRound);
  
  // Build available prompt types based on level configuration
  const availablePromptTypes: ('swipe' | 'tap' | 'timing')[] = ['swipe']; // Swipe is always available
  
  // Add tap prompts if feints are enabled (even if no feints, tap prompts are still available)
  if (feintConfig.enabled || levelConfig.feints.enabled) {
    availablePromptTypes.push('tap');
  }
  
  // Add timing prompts if they are enabled
  if (timingConfig.enabled) {
    availablePromptTypes.push('timing');
  }
  
  console.log('🎯 Available prompt types for level:', availablePromptTypes);
  
  // Select random prompt type from available types
  const type = availablePromptTypes[Math.floor(Math.random() * availablePromptTypes.length)];

  if (type === 'tap') {
    const duration = getRandomPromptDuration(levelConfig, 'tap', currentRound);
    console.log('🎯 Prompt generated (tap placeholder)', {
      level: levelConfig.name,
      round: currentRound,
      duration,
    });
    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'tap',
      startTime: Date.now(),
      duration,
      isActive: true,
      isCompleted: false,
    };
  } else if (type === 'timing') {
    const duration = getRandomPromptDuration(levelConfig, 'timing', currentRound);
    console.log('🎯 Prompt generated (timing placeholder)', {
      level: levelConfig.name,
      round: currentRound,
      duration,
    });
    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'timing',
      startTime: Date.now(),
      duration,
      isActive: true,
      isCompleted: false,
    };
  } else {
    const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const duration = getRandomPromptDuration(levelConfig, 'swipe', currentRound);
    console.log('🎯 Prompt generated (swipe)', {
      level: levelConfig.name,
      round: currentRound,
      duration,
    });

    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'swipe',
      direction,
      startTime: Date.now(),
      duration,
      isActive: true,
      isCompleted: false,
    };
  }
};

export const generateTimingPrompts = (levelConfig: LevelConfig, currentRound: number): TimingPrompt[] => {
  // Get timing prompt config for this round
  const timingConfig = getTimingPromptConfig(levelConfig, currentRound);
  const promptConfig = getPromptConfig(levelConfig, 'timing', currentRound);
  
  console.log('🎯 Timing Config:', {
    enabled: timingConfig.enabled,
    probability: timingConfig.probability,
    maxPrompts: timingConfig.maxPrompts,
    round: currentRound,
    opponent: levelConfig.name
  });
  
  if (!timingConfig.enabled) {
    console.log('🎯 Timing prompts disabled');
    return [];
  }

  const numPrompts = Math.floor(Math.random() * timingConfig.maxPrompts) + 1; // 1 to maxPrompts
  console.log('🎯 Generating timing prompts:', numPrompts);
  const prompts: TimingPrompt[] = [];
  const usedPositions = new Set<number>();

  for (let i = 0; i < numPrompts; i++) {
    let position: number;
    do {
      position = Math.floor(Math.random() * 9); // 0-8 for 3x3 grid
    } while (usedPositions.has(position));

    usedPositions.add(position);

    // Use timing configuration; ensure duration reflects tighter endless scaling
    const duration = getRandomPromptDuration(levelConfig, 'timing', currentRound);
    const successWindowDuration = Math.min(promptConfig.gradeThresholds.success, duration);
    const staggerDelay = timingConfig.staggerDelay;

    // Calculate the visual appearance time for this prompt
    const appearanceTime = Date.now() + i * staggerDelay;

    // Define windows near the very end of the countdown so success is tapping late.
    // Perfect window is [duration - perfect, duration]
    // Good window is immediately before perfect: [duration - (perfect + good), duration - perfect)
    const perfectWindowStart = Math.max(0, duration - successWindowDuration);
    const perfectWindowEnd = duration;

    const goodEarlyStart = Math.max(0, duration - successWindowDuration);
    const goodEarlyEnd = Math.max(0, duration - successWindowDuration);

    // No late-good beyond the end
    const goodLateStart = duration + 1;
    const goodLateEnd = duration + 1;

    prompts.push({
      id: `timing_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      gridPosition: position,
      startTime: appearanceTime, // When this prompt should appear visually
      duration,
      isActive: false, // Will be activated when it appears visually
      isCompleted: false,
      perfectWindowStart,
      perfectWindowEnd,
      goodEarlyStart,
      goodEarlyEnd,
      goodLateStart,
      goodLateEnd,
      isFeint: false, // Timing prompts don't have feints for now
    });
  }

  console.log('🎯 Final timing prompts:', prompts.length);
  console.log('🎯 Generated timing prompts:', prompts.length, prompts);
  return prompts;
};

export const generateTapPrompts = (levelConfig: LevelConfig, currentRound: number): TapPrompt[] => {
  const feintConfig = getFeintConfig(levelConfig, currentRound);
  
  console.log('🎯 Feint Config:', {
    enabled: feintConfig.enabled,
    probability: feintConfig.probability,
    maxFeints: feintConfig.maxFeints,
    tapPromptConfig: feintConfig.tapPromptConfig,
    round: currentRound,
    opponent: levelConfig.name
  });

  if (!feintConfig.enabled) {
    console.log('🎯 Feints disabled - generating normal prompts');
    // Generate 1-3 normal taps when feints are disabled
    const numPrompts = Math.floor(Math.random() * 3) + 1;
    const prompts: TapPrompt[] = [];
    const usedPositions = new Set<number>();

    for (let i = 0; i < numPrompts; i++) {
      let position: number;
      do {
        position = Math.floor(Math.random() * 9); // 0-8 for 3x3 grid
      } while (usedPositions.has(position));

      usedPositions.add(position);

      const duration = getRandomPromptDuration(levelConfig, 'tap', currentRound);
      prompts.push({
        id: `tap_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        gridPosition: position,
        startTime: Date.now(),
        duration,
        isActive: true,
        isCompleted: false,
        isFeint: false,
      });
    }
    return prompts;
  }

  // Use new precise tap prompt configuration
  const tapConfig = feintConfig.tapPromptConfig;
  if (!tapConfig) {
    console.log('🎯 No tapPromptConfig found, using legacy logic');
    // Fallback to legacy logic
    const numPrompts = Math.floor(Math.random() * 3) + 1;
    const maxFeints = Math.min(feintConfig.maxFeints, numPrompts - 1);
    const shouldIncludeFeints = Math.random() < feintConfig.probability;
    const numFeints = shouldIncludeFeints ? Math.floor(Math.random() * maxFeints) + 1 : 0;
    const numTaps = numPrompts - numFeints;
    
    return generateTapPromptsWithCounts(levelConfig, currentRound, numTaps, numFeints);
  }

  // Use new precise configuration
  const numTaps = tapConfig.minTaps + Math.floor(Math.random() * (tapConfig.maxTaps - tapConfig.minTaps + 1));
  const numFeints = tapConfig.minFeints + Math.floor(Math.random() * (tapConfig.maxFeints - tapConfig.minFeints + 1));
  
  console.log('🎯 Tap Prompt Generation:', {
    numTaps,
    numFeints,
    totalPrompts: numTaps + numFeints,
    config: tapConfig
  });

  return generateTapPromptsWithCounts(levelConfig, currentRound, numTaps, numFeints);
};

// Helper function to generate tap prompts with exact counts
const generateTapPromptsWithCounts = (levelConfig: LevelConfig, currentRound: number, numTaps: number, numFeints: number): TapPrompt[] => {
  const totalPrompts = numTaps + numFeints;
  const prompts: TapPrompt[] = [];
  const durations: number[] = [];
  const usedPositions = new Set<number>();

  // Create array of prompt types (taps and feints)
  const promptTypes: boolean[] = [];
  for (let i = 0; i < numTaps; i++) {
    promptTypes.push(false); // false = real tap
  }
  for (let i = 0; i < numFeints; i++) {
    promptTypes.push(true); // true = feint
  }

  // Shuffle the array to randomize positions
  for (let i = promptTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [promptTypes[i], promptTypes[j]] = [promptTypes[j], promptTypes[i]];
  }

  console.log('🎯 Prompt Types (after shuffle):', promptTypes.map(t => t ? 'feint' : 'tap'));

  // Generate prompts based on shuffled types
  for (let i = 0; i < totalPrompts; i++) {
    let position: number;
    do {
      position = Math.floor(Math.random() * 9);
    } while (usedPositions.has(position));

    usedPositions.add(position);

    const isFeint = promptTypes[i];
    const duration = getRandomPromptDuration(levelConfig, 'tap', currentRound);
    durations.push(duration);

    console.log(`🎯 Prompt ${i}: Position ${position}, Feint: ${isFeint}`);

    prompts.push({
      id: `tap_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      gridPosition: position,
      startTime: Date.now(),
      duration,
      isActive: true,
      isCompleted: false,
      isFeint: isFeint,
    });
  }

  console.log('🎯 Final Prompts:', prompts.map(p => ({ pos: p.gridPosition, feint: p.isFeint })));
  
  // Validation: Ensure we have at least one real prompt
  const realPrompts = prompts.filter(p => !p.isFeint);
  if (realPrompts.length === 0) {
    console.log('🎯 WARNING: No real prompts generated! Converting last prompt to real.');
    prompts[prompts.length - 1].isFeint = false;
  }
  
  console.log('🎯 Final Prompts (validated):', prompts.map(p => ({ pos: p.gridPosition, feint: p.isFeint })));
  if (durations.length > 0) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    console.log('🎯 Tap prompt durations (ms):', durations, 'avg=', Math.round(avg));
  }
  return prompts;
};

export const generateSuperComboSequence = (): Prompt[] => {
  const sequence: Prompt[] = [];
  const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];

  for (let i = 0; i < 4; i++) {
    const direction = directions[Math.floor(Math.random() * directions.length)];

    sequence.push({
      id: `super_${i}_${Date.now()}`,
      type: 'swipe',
      direction,
      startTime: Date.now() + i * 1000,
      duration: 800,
      isActive: false,
      isCompleted: false,
    });
  }

  return sequence;
}; 