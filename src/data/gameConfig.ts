// ============================================================================
// GAME CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

export interface PromptConfig {
  duration: {
    min: number; // Minimum duration in milliseconds
    max: number; // Maximum duration in milliseconds
  };
  timingWindows: {
    perfect: number; // Perfect timing window in milliseconds
    good: number; // Good timing window in milliseconds
  };
  intervals: {
    min: number; // Minimum time between prompts
    max: number; // Maximum time between prompts
  };
}

// Rename HeroConfig to LevelConfig and heroes to levels
export interface LevelConfig {
  id: string;
  name: string;
  hp: number;
  damage: {
    perfect: number;
    good: number;
    superCombo: number;
  };
  promptConfig: {
    swipe: PromptConfig;
    tap: PromptConfig;
    timing: PromptConfig;
  };
  feints: {
    enabled: boolean;
    probability: number; // Legacy - kept for backward compatibility
    maxFeints: number; // Legacy - kept for backward compatibility
    // New precise control fields
    tapPromptConfig?: {
      minTaps: number; // Minimum number of real taps
      maxTaps: number; // Maximum number of real taps
      minFeints: number; // Minimum number of feints
      maxFeints: number; // Maximum number of feints
    };
  };
  timingPrompts: {
    enabled: boolean;
    probability: number;
    maxPrompts: number;
    staggerDelay: number;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  rounds: number;
  roundHPGoals: number[];
  roundScaling?: {
    [roundNumber: number]: {
      promptIntervals?: { min: number; max: number };
      feints?: { 
        enabled: boolean; 
        probability: number; 
        maxFeints: number;
        tapPromptConfig?: {
          minTaps: number;
          maxTaps: number;
          minFeints: number;
          maxFeints: number;
        };
      };
      timingPrompts?: { 
        enabled: boolean; 
        probability: number; 
        maxPrompts: number;
        duration?: { min: number; max: number };
        timingWindows?: { perfect: number; good: number };
        staggerDelay?: number;
      };
    };
  };
}

export const levels: LevelConfig[] = [
  // Level 1 - The Beginning (swipe only, very easy)
  {
    id: 'level_1',
    name: 'Street Brawler',
    hp: 2000,
    damage: {
      perfect: 30,
      good: 15,
      superCombo: 90,
    },
    promptConfig: {
      swipe: {
        duration: { min: 3500, max: 4000 },
        timingWindows: { perfect: 1200, good: 2000 }, // Very generous
        intervals: { min: 2200, max: 2600 }, // Slow
      },
      tap: {
        duration: { min: 3500, max: 4000 },
        timingWindows: { perfect: 3500, good: 4000 },
        intervals: { min: 2200, max: 2600 },
      },
      timing: {
        duration: { min: 3500, max: 4000 },
        timingWindows: { perfect: 1000, good: 1200 },
        intervals: { min: 2200, max: 2600 },
      },
    },
    feints: {
      enabled: false, // No feints in level 1
      probability: 0,
      maxFeints: 0,
      tapPromptConfig: {
        minTaps: 0,
        maxTaps: 0,
        minFeints: 0,
        maxFeints: 0,
      },
    },
    timingPrompts: {
      enabled: false, // No timing prompts in level 1
      probability: 0,
      maxPrompts: 0,
      staggerDelay: 2000,
    },
    difficulty: 'easy',
    description: 'A local street fighter with basic skills. Learn the basics with swipe prompts only.',
    rounds: 2,
    roundHPGoals: [1200, 0],
  },

  // Level 2 - First Blood (introduce tap prompts, no feints)
  {
    id: 'level_2',
    name: 'Gym Rat',
    hp: 2200,
    damage: {
      perfect: 40,
      good: 20,
      superCombo: 120,
    },
    promptConfig: {
      swipe: {
        duration: { min: 3000, max: 3500 },
        timingWindows: { perfect: 800, good: 1500 },
        intervals: { min: 2000, max: 2400 },
      },
      tap: {
        duration: { min: 3000, max: 3500 },
        timingWindows: { perfect: 3000, good: 3500 },
        intervals: { min: 2000, max: 2400 },
      },
      timing: {
        duration: { min: 3000, max: 3500 },
        timingWindows: { perfect: 800, good: 1000 },
        intervals: { min: 2000, max: 2400 },
      },
    },
    feints: {
      enabled: false, // No feints yet
      probability: 0,
      maxFeints: 0,
      tapPromptConfig: {
        minTaps: 2,
        maxTaps: 3,
        minFeints: 0,
        maxFeints: 0,
      },
    },
    timingPrompts: {
      enabled: false, // No timing prompts yet
      probability: 0,
      maxPrompts: 0,
      staggerDelay: 1800,
    },
    difficulty: 'easy',
    description: 'A fitness enthusiast who hits harder than expected. Learn tap prompts.',
    rounds: 2,
    roundHPGoals: [1320, 0],
  },

  // Level 3 - Rising Star (introduce timing prompts, reasonable difficulty)
  {
    id: 'level_3',
    name: 'Amateur Boxer',
    hp: 2400,
    damage: {
      perfect: 50,
      good: 25,
      superCombo: 150,
    },
    promptConfig: {
      swipe: {
        duration: { min: 2800, max: 3200 },
        timingWindows: { perfect: 700, good: 1200 },
        intervals: { min: 1800, max: 2200 },
      },
      tap: {
        duration: { min: 2800, max: 3200 },
        timingWindows: { perfect: 2800, good: 3200 },
        intervals: { min: 1800, max: 2200 },
      },
      timing: {
        duration: { min: 2500, max: 3000 },
        timingWindows: { perfect: 600, good: 800 },
        intervals: { min: 1800, max: 2200 },
      },
    },
    feints: {
      enabled: false, // Still no feints
      probability: 0,
      maxFeints: 0,
      tapPromptConfig: {
        minTaps: 2,
        maxTaps: 3,
        minFeints: 0,
        maxFeints: 0,
      },
    },
    timingPrompts: {
      enabled: true, // Introduce timing prompts
      probability: 0.3,
      maxPrompts: 3,
      staggerDelay: 1600,
    },
    difficulty: 'easy',
    description: 'A trained amateur with proper technique. Master timing prompts.',
    rounds: 2,
    roundHPGoals: [1440, 0],
  },

  // Level 4 - The Challenge (introduce feints, ramp up difficulty)
  {
    id: 'level_4',
    name: 'Club Champion',
    hp: 2600,
    damage: {
      perfect: 60,
      good: 30,
      superCombo: 180,
    },
    promptConfig: {
      swipe: {
        duration: { min: 2500, max: 3000 },
        timingWindows: { perfect: 600, good: 1000 },
        intervals: { min: 1600, max: 2000 },
      },
      tap: {
        duration: { min: 2500, max: 3000 },
        timingWindows: { perfect: 2500, good: 3000 },
        intervals: { min: 1600, max: 2000 },
      },
      timing: {
        duration: { min: 2200, max: 2700 },
        timingWindows: { perfect: 500, good: 700 },
        intervals: { min: 1600, max: 2000 },
      },
    },
    feints: {
      enabled: true, // Introduce feints
      probability: 0.2,
      maxFeints: 2,
      tapPromptConfig: {
        minTaps: 2,
        maxTaps: 3,
        minFeints: 0,
        maxFeints: 1,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.4,
      maxPrompts: 3,
      staggerDelay: 1400,
    },
    difficulty: 'medium',
    description: 'A local boxing club champion with experience. Beware of feints.',
    rounds: 3,
    roundHPGoals: [1560, 780, 0],
  },

  // Level 5 - Midnight Brawl (medium difficulty)
  {
    id: 'level_5',
    name: 'Underground Fighter',
    hp: 2800,
    damage: {
      perfect: 70,
      good: 35,
      superCombo: 210,
    },
    promptConfig: {
      swipe: {
        duration: { min: 2200, max: 2700 },
        timingWindows: { perfect: 500, good: 900 },
        intervals: { min: 1400, max: 1800 },
      },
      tap: {
        duration: { min: 2200, max: 2700 },
        timingWindows: { perfect: 2200, good: 2700 },
        intervals: { min: 1400, max: 1800 },
      },
      timing: {
        duration: { min: 2000, max: 2500 },
        timingWindows: { perfect: 400, good: 600 },
        intervals: { min: 1400, max: 1800 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.3,
      maxFeints: 2,
      tapPromptConfig: {
        minTaps: 2,
        maxTaps: 3,
        minFeints: 1,
        maxFeints: 2,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.5,
      maxPrompts: 3,
      staggerDelay: 1200,
    },
    difficulty: 'medium',
    description: 'A dangerous underground fighter with no rules.',
    rounds: 3,
    roundHPGoals: [1680, 840, 0],
  },

  // Level 6 - Champion's Path (medium-hard)
  {
    id: 'level_6',
    name: 'Regional Champ',
    hp: 3000,
    damage: {
      perfect: 80,
      good: 40,
      superCombo: 240,
    },
    promptConfig: {
      swipe: {
        duration: { min: 2000, max: 2500 },
        timingWindows: { perfect: 400, good: 800 },
        intervals: { min: 1200, max: 1600 },
      },
      tap: {
        duration: { min: 2000, max: 2500 },
        timingWindows: { perfect: 2000, good: 2500 },
        intervals: { min: 1200, max: 1600 },
      },
      timing: {
        duration: { min: 1800, max: 2200 },
        timingWindows: { perfect: 300, good: 500 },
        intervals: { min: 1200, max: 1600 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.4,
      maxFeints: 3,
      tapPromptConfig: {
        minTaps: 2,
        maxTaps: 3,
        minFeints: 1,
        maxFeints: 2,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.6,
      maxPrompts: 3,
      staggerDelay: 1000,
    },
    difficulty: 'medium',
    description: 'A regional champion with a solid record.',
    rounds: 3,
    roundHPGoals: [1800, 900, 0],
  },

  // Level 7 - Dark Arena (hard)
  {
    id: 'level_7',
    name: 'Shadow Boxer',
    hp: 3200,
    damage: {
      perfect: 90,
      good: 45,
      superCombo: 270,
    },
    promptConfig: {
      swipe: {
        duration: { min: 1800, max: 2300 },
        timingWindows: { perfect: 300, good: 600 },
        intervals: { min: 1000, max: 1400 },
      },
      tap: {
        duration: { min: 1800, max: 2300 },
        timingWindows: { perfect: 1800, good: 2300 },
        intervals: { min: 1000, max: 1400 },
      },
      timing: {
        duration: { min: 1600, max: 2000 },
        timingWindows: { perfect: 250, good: 400 },
        intervals: { min: 1000, max: 1400 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.5,
      maxFeints: 3,
      tapPromptConfig: {
        minTaps: 1,
        maxTaps: 3,
        minFeints: 1,
        maxFeints: 3,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.7,
      maxPrompts: 3,
      staggerDelay: 800,
    },
    difficulty: 'hard',
    description: 'A mysterious fighter with unpredictable moves.',
    rounds: 3,
    roundHPGoals: [1920, 960, 0],
  },

  // Level 8 - Final Countdown (hard)
  {
    id: 'level_8',
    name: 'Elite Contender',
    hp: 3400,
    damage: {
      perfect: 100,
      good: 50,
      superCombo: 300,
    },
    promptConfig: {
      swipe: {
        duration: { min: 1600, max: 2100 },
        timingWindows: { perfect: 250, good: 500 },
        intervals: { min: 800, max: 1200 },
      },
      tap: {
        duration: { min: 1600, max: 2100 },
        timingWindows: { perfect: 1600, good: 2100 },
        intervals: { min: 800, max: 1200 },
      },
      timing: {
        duration: { min: 1400, max: 1800 },
        timingWindows: { perfect: 200, good: 300 },
        intervals: { min: 800, max: 1200 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.6,
      maxFeints: 3,
      tapPromptConfig: {
        minTaps: 1,
        maxTaps: 2,
        minFeints: 2,
        maxFeints: 3,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.8,
      maxPrompts: 3,
      staggerDelay: 600,
    },
    difficulty: 'hard',
    description: 'An elite fighter with championship aspirations.',
    rounds: 3,
    roundHPGoals: [2040, 1020, 0],
  },

  // Level 9 - Legend's Trial (expert)
  {
    id: 'level_9',
    name: 'Legendary Warrior',
    hp: 3600,
    damage: {
      perfect: 110,
      good: 55,
      superCombo: 330,
    },
    promptConfig: {
      swipe: {
        duration: { min: 1400, max: 1900 },
        timingWindows: { perfect: 200, good: 400 },
        intervals: { min: 600, max: 1000 },
      },
      tap: {
        duration: { min: 1400, max: 1900 },
        timingWindows: { perfect: 1400, good: 1900 },
        intervals: { min: 600, max: 1000 },
      },
      timing: {
        duration: { min: 1200, max: 1600 },
        timingWindows: { perfect: 150, good: 250 },
        intervals: { min: 600, max: 1000 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.7,
      maxFeints: 3,
      tapPromptConfig: {
        minTaps: 1,
        maxTaps: 2,
        minFeints: 2,
        maxFeints: 3,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.9,
      maxPrompts: 3,
      staggerDelay: 400,
    },
    difficulty: 'expert',
    description: 'A legendary fighter with decades of experience.',
    rounds: 4,
    roundHPGoals: [2160, 1440, 720, 0],
  },

  // Level 10 - The Undefeated (extremely hard)
  {
    id: 'level_10',
    name: 'The Undefeated',
    hp: 4000, // Maximum HP
    damage: {
      perfect: 120,
      good: 60,
      superCombo: 360,
    },
    promptConfig: {
      swipe: {
        duration: { min: 100, max: 1500 },
        timingWindows: { perfect: 150, good: 300 }, // Extremely tight
        intervals: { min: 400, max: 800 }, // Very fast
      },
      tap: {
        duration: { min: 1200, max: 2000 },
        timingWindows: { perfect: 1200, good: 1700 },
        intervals: { min: 400, max: 800 },
      },
      timing: {
        duration: { min: 1000, max: 1400 },
        timingWindows: { perfect: 100, good: 150 }, // Nearly impossible
        intervals: { min: 400, max: 800 },
      },
    },
    feints: {
      enabled: true,
      probability: 0.8, // Very high feint probability
      maxFeints: 3,
      tapPromptConfig: {
        minTaps: 1,
        maxTaps: 6,
        minFeints: 1,
        maxFeints: 6,
      },
    },
    timingPrompts: {
      enabled: true,
      probability: 0.95, // Nearly every set
      maxPrompts: 5,
      staggerDelay: 200,
    },
    difficulty: 'expert',
    description: 'The ultimate challenge - an undefeated champion with inhuman reflexes. Nearly impossible to beat.',
    rounds: 4,
    roundHPGoals: [2400, 1600, 800, 0],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getLevelConfig = (level: number): LevelConfig => {
  const lvl = levels.find(l => l.id === `hero_${level}` || l.id === `level_${level}`);
  if (!lvl) {
    return levels[0];
  }
  return lvl;
};

export const getPromptConfig = (levelConfig: LevelConfig, promptType: 'swipe' | 'tap' | 'timing', roundNumber: number = 1): PromptConfig => {
  const baseConfig = levelConfig.promptConfig[promptType];
  const roundScaling = levelConfig.roundScaling?.[roundNumber];
  if (roundScaling?.timingPrompts && promptType === 'timing') {
    return {
      duration: roundScaling.timingPrompts.duration || baseConfig.duration,
      timingWindows: roundScaling.timingPrompts.timingWindows || baseConfig.timingWindows,
      intervals: roundScaling.promptIntervals || baseConfig.intervals,
    };
  }
  return {
    ...baseConfig,
    intervals: roundScaling?.promptIntervals || baseConfig.intervals,
  };
};

export const getFeintConfig = (levelConfig: LevelConfig, roundNumber: number = 1) => {
  const roundScaling = levelConfig.roundScaling?.[roundNumber];
  const baseConfig = roundScaling?.feints || levelConfig.feints;
  
  return {
    enabled: baseConfig.enabled,
    probability: baseConfig.probability,
    maxFeints: baseConfig.maxFeints,
    tapPromptConfig: baseConfig.tapPromptConfig,
  };
};

export const getTimingPromptConfig = (levelConfig: LevelConfig, roundNumber: number = 1) => {
  const baseConfig = levelConfig.timingPrompts;
  const roundScaling = levelConfig.roundScaling?.[roundNumber];
  if (roundScaling?.timingPrompts) {
    return {
      ...baseConfig,
      ...roundScaling.timingPrompts,
    };
  }
  return baseConfig;
};

export const getRandomPromptInterval = (levelConfig: LevelConfig, roundNumber: number = 1): number => {
  const config = getPromptConfig(levelConfig, 'swipe', roundNumber);
  return Math.random() * (config.intervals.max - config.intervals.min) + config.intervals.min;
};

export const getRandomPromptDuration = (levelConfig: LevelConfig, promptType: 'swipe' | 'tap' | 'timing', roundNumber: number = 1): number => {
  const config = getPromptConfig(levelConfig, promptType, roundNumber);
  return Math.random() * (config.duration.max - config.duration.min) + config.duration.min;
};

export const getRoundHPGoal = (levelConfig: LevelConfig, roundNumber: number): number => {
  if (roundNumber <= 0 || roundNumber > levelConfig.rounds) {
    return 0;
  }
  return levelConfig.roundHPGoals[roundNumber - 1] || 0;
}; 