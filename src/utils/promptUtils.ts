import { Prompt, TapPrompt } from '../types/game';
import { getFeintConfig } from '../data/opponents';

// ============================================================================
// PROMPT UTILITIES
// ============================================================================

export const generatePrompt = (): Prompt => {
  const promptTypes: ('swipe' | 'tap')[] = ['swipe', 'tap'];
  const type = promptTypes[Math.floor(Math.random() * promptTypes.length)];

  if (type === 'tap') {
    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'tap',
      startTime: Date.now(),
      duration: 3000,
      isActive: true,
      isCompleted: false,
    };
  } else {
    const directions: ('left' | 'right' | 'up' | 'down')[] = ['left', 'right', 'up', 'down'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'swipe',
      direction,
      startTime: Date.now(),
      duration: 3000,
      isActive: true,
      isCompleted: false,
    };
  }
};

export const generateTapPrompts = (opponentConfig: any, currentRound: number): TapPrompt[] => {
  const numPrompts = Math.floor(Math.random() * 3) + 1; // 1-3 prompts
  const prompts: TapPrompt[] = [];
  const usedPositions = new Set<number>();

  const feintConfig = getFeintConfig(opponentConfig, currentRound);
  
  // Ensure we always have at least 1 real prompt
  const minRealPrompts = 1;
  const maxFeintsAllowed = Math.max(0, numPrompts - minRealPrompts);
  
  console.log('🎯 Feint Config:', {
    enabled: feintConfig.enabled,
    probability: feintConfig.probability,
    maxFeints: feintConfig.maxFeints,
    round: currentRound,
    opponent: opponentConfig.name
  });

  if (!feintConfig.enabled) {
    console.log('🎯 Feints disabled - generating normal prompts');
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
        duration: 3000,
        isActive: true,
        isCompleted: false,
        isFeint: false,
      });
    }
    return prompts;
  }

  const maxFeints = Math.min(feintConfig.maxFeints, maxFeintsAllowed);
  const shouldIncludeFeints = Math.random() < feintConfig.probability;
  const numFeints = shouldIncludeFeints ? Math.floor(Math.random() * maxFeints) + 1 : 0;
  const feintIndices = new Set<number>();

  console.log('🎯 Feint Generation:', {
    numPrompts,
    minRealPrompts,
    maxFeintsAllowed,
    maxFeints,
    probability: feintConfig.probability,
    shouldIncludeFeints,
    numFeints
  });

  // Randomly select which prompt indices will be feints
  // Ensure we don't make ALL prompts feints
  for (let i = 0; i < numFeints; i++) {
    let index: number;
    do {
      index = Math.floor(Math.random() * numPrompts);
    } while (feintIndices.has(index));
    feintIndices.add(index);
  }

  console.log('🎯 Feint Indices:', Array.from(feintIndices));

  for (let i = 0; i < numPrompts; i++) {
    let position: number;
    do {
      position = Math.floor(Math.random() * 9);
    } while (usedPositions.has(position));

    usedPositions.add(position);

    const isFeint = feintIndices.has(i);

    console.log(`🎯 Prompt ${i}: Position ${position}, Feint: ${isFeint}`);

    prompts.push({
      id: `tap_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      gridPosition: position,
      startTime: Date.now(),
      duration: 3000,
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