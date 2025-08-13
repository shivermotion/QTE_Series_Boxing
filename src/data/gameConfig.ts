// ============================================================================
// GAME CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

export interface PromptConfig {
  timeLimit: {
    min: number; // Minimum time limit in milliseconds
    max: number; // Maximum time limit in milliseconds
  };
  gradeThresholds: {
    perfect: number; // Perfect grade threshold in milliseconds
    good: number; // Good grade threshold in milliseconds
  };
  spawnDelay: {
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
    success: number; // Damage for successful inputs that aren't perfect or good
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
        gradeThresholds?: { perfect: number; good: number };
        staggerDelay?: number;
      };
    };
  };
  difficultyScalar?: number; // Derived scalar for difficulty-based adjustments
}

export const levels: LevelConfig[] = [
  // ============================================================================
  // LEVEL 1 - THE BEGINNING (SWIPE ONLY, VERY EASY)
  // ============================================================================
  {
    id: 'level_1',
    name: 'Street Brawler',
    hp: 2000,
    damage: {
      perfect: 30,
      good: 15,
      success: 10,
      superCombo: 90,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 3500, max: 4000 },
        gradeThresholds: { perfect: 1200, good: 2000 }, // Very generous
        spawnDelay: { min: 2200, max: 2600 }, // Slow
      },
      tap: {
        timeLimit: { min: 3500, max: 4000 },
        gradeThresholds: { perfect: 3500, good: 4000 },
        spawnDelay: { min: 2200, max: 2600 },
      },
      timing: {
        timeLimit: { min: 3500, max: 4000 },
        gradeThresholds: { perfect: 1000, good: 1200 },
        spawnDelay: { min: 2200, max: 2600 },
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

  // ============================================================================
  // LEVEL 2 - FIRST BLOOD (INTRODUCE TAP PROMPTS, NO FEINTS)
  // ============================================================================
  {
    id: 'level_2',
    name: 'Gym Rat',
    hp: 2200,
    damage: {
      perfect: 40,
      good: 20,
      success: 15,
      superCombo: 120,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 3000, max: 3500 },
        gradeThresholds: { perfect: 800, good: 1500 },
        spawnDelay: { min: 2000, max: 2400 },
      },
      tap: {
        timeLimit: { min: 3000, max: 3500 },
        gradeThresholds: { perfect: 3000, good: 3500 },
        spawnDelay: { min: 2000, max: 2400 },
      },
      timing: {
        timeLimit: { min: 3000, max: 3500 },
        gradeThresholds: { perfect: 800, good: 1000 },
        spawnDelay: { min: 2000, max: 2400 },
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

  // ============================================================================
  // LEVEL 3 - RISING STAR (INTRODUCE TIMING PROMPTS, REASONABLE DIFFICULTY)
  // ============================================================================
  {
    id: 'level_3',
    name: 'Amateur Boxer',
    hp: 2400,
    damage: {
      perfect: 50,
      good: 25,
      success: 20,
      superCombo: 150,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 2800, max: 3200 },
        gradeThresholds: { perfect: 700, good: 1200 },
        spawnDelay: { min: 1800, max: 2200 },
      },
      tap: {
        timeLimit: { min: 2800, max: 3200 },
        gradeThresholds: { perfect: 2800, good: 3200 },
        spawnDelay: { min: 1800, max: 2200 },
      },
      timing: {
        timeLimit: { min: 2500, max: 3000 },
        gradeThresholds: { perfect: 600, good: 800 },
        spawnDelay: { min: 1800, max: 2200 },
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

  // ============================================================================
  // LEVEL 4 - THE CHALLENGE (INTRODUCE FEINTS, RAMP UP DIFFICULTY)
  // ============================================================================
  {
    id: 'level_4',
    name: 'Club Champion',
    hp: 2600,
    damage: {
      perfect: 60,
      good: 30,
      success: 25,
      superCombo: 180,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 2500, max: 3000 },
        gradeThresholds: { perfect: 600, good: 1000 },
        spawnDelay: { min: 1600, max: 2000 },
      },
      tap: {
        timeLimit: { min: 2500, max: 3000 },
        gradeThresholds: { perfect: 2500, good: 3000 },
        spawnDelay: { min: 1600, max: 2000 },
      },
      timing: {
        timeLimit: { min: 2200, max: 2700 },
        gradeThresholds: { perfect: 500, good: 700 },
        spawnDelay: { min: 1600, max: 2000 },
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

  // ============================================================================
  // LEVEL 5 - MIDNIGHT BRAWL (MEDIUM DIFFICULTY)
  // ============================================================================
  {
    id: 'level_5',
    name: 'Underground Fighter',
    hp: 2800,
    damage: {
      perfect: 70,
      good: 35,
      success: 30,
      superCombo: 210,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 2200, max: 2700 },
        gradeThresholds: { perfect: 500, good: 900 },
        spawnDelay: { min: 1400, max: 1800 },
      },
      tap: {
        timeLimit: { min: 2200, max: 2700 },
        gradeThresholds: { perfect: 2200, good: 2700 },
        spawnDelay: { min: 1400, max: 1800 },
      },
      timing: {
        timeLimit: { min: 2000, max: 2500 },
        gradeThresholds: { perfect: 400, good: 600 },
        spawnDelay: { min: 1400, max: 1800 },
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

  // ============================================================================
  // LEVEL 6 - CHAMPION'S PATH (MEDIUM-HARD)
  // ============================================================================
  {
    id: 'level_6',
    name: 'Regional Champ',
    hp: 3000,
    damage: {
      perfect: 80,
      good: 40,
      success: 35,
      superCombo: 240,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 2000, max: 2500 },
        gradeThresholds: { perfect: 400, good: 800 },
        spawnDelay: { min: 1200, max: 1600 },
      },
      tap: {
        timeLimit: { min: 2000, max: 2500 },
        gradeThresholds: { perfect: 2000, good: 2500 },
        spawnDelay: { min: 1200, max: 1600 },
      },
      timing: {
        timeLimit: { min: 1800, max: 2200 },
        gradeThresholds: { perfect: 300, good: 500 },
        spawnDelay: { min: 1200, max: 1600 },
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

  // ============================================================================
  // LEVEL 7 - DARK ARENA (HARD)
  // ============================================================================
  {
    id: 'level_7',
    name: 'Shadow Boxer',
    hp: 3200,
    damage: {
      perfect: 90,
      good: 45,
      success: 40,
      superCombo: 270,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 1800, max: 2300 },
        gradeThresholds: { perfect: 300, good: 600 },
        spawnDelay: { min: 1000, max: 1400 },
      },
      tap: {
        timeLimit: { min: 1800, max: 2300 },
        gradeThresholds: { perfect: 1800, good: 2300 },
        spawnDelay: { min: 1000, max: 1400 },
      },
      timing: {
        timeLimit: { min: 1600, max: 2000 },
        gradeThresholds: { perfect: 250, good: 400 },
        spawnDelay: { min: 1000, max: 1400 },
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

  // ============================================================================
  // LEVEL 8 - FINAL COUNTDOWN (HARD)
  // ============================================================================
  {
    id: 'level_8',
    name: 'Elite Contender',
    hp: 3400,
    damage: {
      perfect: 100,
      good: 50,
      success: 45,
      superCombo: 300,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 1600, max: 2100 },
        gradeThresholds: { perfect: 250, good: 500 },
        spawnDelay: { min: 800, max: 1200 },
      },
      tap: {
        timeLimit: { min: 1600, max: 2100 },
        gradeThresholds: { perfect: 1600, good: 2100 },
        spawnDelay: { min: 800, max: 1200 },
      },
      timing: {
        timeLimit: { min: 1400, max: 1800 },
        gradeThresholds: { perfect: 200, good: 300 },
        spawnDelay: { min: 800, max: 1200 },
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

  // ============================================================================
  // LEVEL 9 - LEGEND'S TRIAL (EXPERT)
  // ============================================================================
  {
    id: 'level_9',
    name: 'Legendary Warrior',
    hp: 3600,
    damage: {
      perfect: 110,
      good: 55,
      success: 50,
      superCombo: 330,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 1400, max: 1900 },
        gradeThresholds: { perfect: 200, good: 400 },
        spawnDelay: { min: 600, max: 1000 },
      },
      tap: {
        timeLimit: { min: 1400, max: 1900 },
        gradeThresholds: { perfect: 1400, good: 1900 },
        spawnDelay: { min: 600, max: 1000 },
      },
      timing: {
        timeLimit: { min: 1200, max: 1600 },
        gradeThresholds: { perfect: 150, good: 250 },
        spawnDelay: { min: 600, max: 1000 },
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

  // ============================================================================
  // LEVEL 10 - THE UNDEFEATED (EXTREMELY HARD)
  // ============================================================================
  {
    id: 'level_10',
    name: 'The Undefeated',
    hp: 4000, // Maximum HP
    damage: {
      perfect: 120,
      good: 60,
      success: 55,
      superCombo: 360,
    },
    promptConfig: {
      swipe: {
        timeLimit: { min: 1000, max: 1500 },
        gradeThresholds: { perfect: 150, good: 300 }, // Extremely tight
        spawnDelay: { min: 400, max: 800 }, // Very fast
      },
      tap: {
        timeLimit: { min: 1200, max: 2000 },
        gradeThresholds: { perfect: 1200, good: 1700 },
        spawnDelay: { min: 400, max: 800 },
      },
      timing: {
        timeLimit: { min: 1000, max: 1400 },
        gradeThresholds: { perfect: 100, good: 150 }, // Nearly impossible
        spawnDelay: { min: 400, max: 800 },
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
      timeLimit: roundScaling.timingPrompts.duration || baseConfig.timeLimit,
      gradeThresholds: roundScaling.timingPrompts.gradeThresholds || baseConfig.gradeThresholds,
      spawnDelay: roundScaling.promptIntervals || baseConfig.spawnDelay,
    };
  }
  return {
    ...baseConfig,
    spawnDelay: roundScaling?.promptIntervals || baseConfig.spawnDelay,
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
  const base = Math.random() * (config.spawnDelay.max - config.spawnDelay.min) + config.spawnDelay.min;
  const scalar = getDifficultyScalar(levelConfig);
  return Math.max(300, base * scalar);
};

export const getRandomPromptDuration = (levelConfig: LevelConfig, promptType: 'swipe' | 'tap' | 'timing', roundNumber: number = 1): number => {
  const config = getPromptConfig(levelConfig, promptType, roundNumber);
  const base = Math.random() * (config.timeLimit.max - config.timeLimit.min) + config.timeLimit.min;
  const scalar = getDifficultyScalar(levelConfig);
  return Math.max(500, base * scalar);
};

export const getRoundHPGoal = (levelConfig: LevelConfig, roundNumber: number): number => {
  if (roundNumber <= 0 || roundNumber > levelConfig.rounds) {
    return 0;
  }
  return levelConfig.roundHPGoals[roundNumber - 1] || 0;
}; 

// Difficulty scaling helpers
export const getDifficultyScalar = (levelConfig: LevelConfig): number => {
  switch (levelConfig.difficulty) {
    case 'easy':
      return 1.1; // slightly easier (longer durations, longer intervals)
    case 'medium':
      return 1.0; // baseline
    case 'hard':
      return 0.9; // slightly harder (shorter)
    case 'expert':
      return 0.8; // hardest
    default:
      return 1.0;
  }
};

// ============================================================================
// ENDLESS MODE CONFIG
// ============================================================================

export const buildEndlessLevelConfig = (stage: number): LevelConfig => {
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  // General scaling for spawn intervals and swipe/tap durations
  const scaleGeneral = clamp(Math.pow(0.96, Math.max(0, stage - 1)), 0.55, 1);
  // More aggressive scaling for timing duration to speed up circle shrink
  const scaleTiming = clamp(Math.pow(0.92, Math.max(0, stage - 1)), 0.45, 1);

  // Swipe timings – aggressively tighten toward sub-second reaction windows over stages
  const scaleSwipe = clamp(Math.pow(0.90, Math.max(0, stage - 1)), 0.20, 1); // floor ~20%
  // Base window ~1200–1500ms, trending toward ~240–300ms at floor
  const swipeTime = { min: Math.round(1200 * scaleSwipe), max: Math.round(1500 * scaleSwipe) };
  // Success window (used by logic) – shrink toward ~250ms floor
  const swipeGoodMs = clamp(Math.round(600 * scaleSwipe), 250, 1200);
  const swipeGrades = { perfect: swipeGoodMs, good: swipeGoodMs };
  const swipeSpawn = { min: Math.round(1800 * scaleGeneral), max: Math.round(2200 * scaleGeneral) };

  // Tap timings – more lenient than swipe because sets may include multiple taps
  const scaleTap = clamp(Math.pow(0.95, Math.max(0, stage - 1)), 0.5, 1); // gentler tightening, floor ~50%
  // Keep overall tap time generous; never below ~1600–2000ms
  const tapTime = {
    min: Math.max(1600, Math.round(2200 * scaleTap)),
    max: Math.max(2000, Math.round(2600 * scaleTap)),
  };
  // Success window – keep a high floor (~1000ms). Start around ~1400ms and tighten slowly.
  const tapGoodMs = clamp(Math.round(1400 * scaleTap), 1000, 1600);
  const tapGrades = { perfect: tapGoodMs, good: tapGoodMs };
  const tapSpawn = { min: Math.round(1800 * scaleGeneral), max: Math.round(2200 * scaleGeneral) };

  // Timing prompts – success window starts above average, then shrinks with stage
  const timingTime = { min: Math.round(1800 * scaleTiming), max: Math.round(2200 * scaleTiming) };
  // Start with a success window above average reaction (~250ms), then shrink per stage
  const timingPerfectMs = clamp(Math.round(280 * scaleTiming), 100, 320);
  const timingGoodMs = clamp(Math.round(420 * scaleTiming), 160, 480);
  const timingGrades = { perfect: timingPerfectMs, good: timingGoodMs };
  const timingSpawn = { min: Math.round(2000 * scaleGeneral), max: Math.round(2400 * scaleGeneral) };

  // Unlock logic by stage
  const timingEnabled = stage >= 4;
  const feintsEnabled = stage >= 2;

  // Feint intensity scales with stage
  const feintProbability = clamp(0.1 + (stage - 2) * 0.1, 0, 0.8);
  const feintMax = clamp(1 + Math.floor((stage - 2) / 2), 0, 3);
  const tapsMin = clamp(1 + Math.floor(stage / 3), 1, 3);
  const tapsMax = clamp(2 + Math.floor(stage / 2), 1, 5);
  const feintsMin = feintsEnabled ? clamp(Math.floor((stage - 2) / 3), 0, 3) : 0;
  const feintsMax = feintsEnabled ? feintMax : 0;

  // Timing prompt intensity
  const timingProbability = timingEnabled ? clamp(0.2 + (stage - 4) * 0.1, 0.2, 0.9) : 0;
  const timingMaxPrompts = timingEnabled ? clamp(1 + Math.floor(stage / 3), 1, 4) : 0;
  const timingStagger = clamp(1800 - (stage - 1) * 100, 400, 1800);

  return {
    id: `endless_stage_${stage}`,
    name: `Endless Stage ${stage}`,
    hp: 1, // not used in endless
    damage: {
      perfect: 0,
      good: 0,
      success: 0,
      superCombo: 0,
    },
    promptConfig: {
      swipe: { timeLimit: swipeTime, gradeThresholds: swipeGrades, spawnDelay: swipeSpawn },
      tap: { timeLimit: tapTime, gradeThresholds: tapGrades, spawnDelay: tapSpawn },
      timing: { timeLimit: timingTime, gradeThresholds: timingGrades, spawnDelay: timingSpawn },
    },
    feints: {
      enabled: feintsEnabled,
      probability: feintProbability,
      maxFeints: feintMax,
      tapPromptConfig: feintsEnabled
        ? { minTaps: tapsMin, maxTaps: tapsMax, minFeints: feintsMin, maxFeints: feintsMax }
        : { minTaps: 1, maxTaps: 3, minFeints: 0, maxFeints: 0 },
    },
    timingPrompts: {
      enabled: timingEnabled,
      probability: timingProbability,
      maxPrompts: timingMaxPrompts,
      staggerDelay: timingStagger,
    },
    difficulty: 'easy',
    description: 'Endless mode dynamic configuration',
    rounds: 1,
    roundHPGoals: [0],
  };
}