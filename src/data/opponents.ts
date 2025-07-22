export interface OpponentConfig {
  id: string;
  name: string;
  level: number;
  hp: number;
  damage: {
    perfect: number;
    good: number;
    superCombo: number;
  };
  reactionTime: {
    perfect: number; // Time window for perfect hits (ms)
    good: number;    // Time window for good hits (ms)
  };
  promptInterval: {
    min: number; // Minimum time between prompts (ms)
    max: number; // Maximum time between prompts (ms)
  };
  feints: {
    enabled: boolean; // Whether feints are enabled for this opponent
    probability: number; // Probability of feints appearing (0.0 to 1.0)
    maxFeints: number; // Maximum number of feints per prompt set (1-3)
  };
  timingPrompts: {
    enabled: boolean; // Whether timing prompts are enabled for this opponent
    probability: number; // Probability of timing prompts appearing (0.0 to 1.0)
    maxPrompts: number; // Maximum number of timing prompts per set (1-3)
    duration: {
      min: number; // Minimum duration for timing prompts (ms) - how long the ring takes to shrink
      max: number; // Maximum duration for timing prompts (ms)
    };
    perfectWindowDuration: number; // Duration of perfect timing window (ms) - when ring aligns with circle
    goodWindowDuration: number; // Duration of good timing window on each side (ms) - acceptable early/late range
    staggerDelay: number; // Delay between timing prompts spawning (ms) - for multi-prompt sets
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  rounds: number; // Number of rounds in this level
  roundHPGoals: number[]; // HP thresholds for each round (when opponent HP reaches this, round ends)
  roundPromptIntervals?: {
    [roundNumber: number]: {
      min: number;
      max: number;
    };
  }; // Optional per-round prompt intervals (overrides default)
  roundFeints?: {
    [roundNumber: number]: {
      enabled: boolean;
      probability: number;
      maxFeints: number;
    };
  }; // Optional per-round feint settings (overrides default)
  roundTimingPrompts?: {
    [roundNumber: number]: {
      enabled: boolean;
      probability: number;
      maxPrompts: number;
      duration: {
        min: number;
        max: number;
      };
      perfectWindowDuration: number;
      goodWindowDuration: number;
      staggerDelay: number;
    };
  }; // Optional per-round timing prompt settings (overrides default)
}

export const opponents: OpponentConfig[] = [

  // Level 1 - The Beginning
  {
    id: 'opponent_1',
    name: 'Street Brawler',
    level: 1,
    hp: 2000,
    damage: {
      perfect: 40,
      good: 20,
      superCombo: 120,
    },
    reactionTime: {
      perfect: 1200, // 1.2 seconds for perfect
      good: 2500,    // 2.5 seconds for good
    },
    promptInterval: {
      min: 1800, // 1.8 seconds minimum
      max: 2200, // 2.2 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.1,
      maxFeints: 2,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.1,
      maxPrompts: 2,
      duration: {
        min: 2500,
        max: 3500,
      },
      perfectWindowDuration: 400, // Longer perfect window
      goodWindowDuration: 600, // More lenient good window
      staggerDelay: 1000, // Very long stagger for better gameplay
    },
    difficulty: 'easy',
    description: 'A local street fighter with basic skills. Good for beginners.',
    rounds: 3,
    roundHPGoals: [1400, 700, 0], // Round 1 ends at 1400 HP, Round 2 ends at 700 HP, Round 3 ends at 0 HP
  },

  // Level 2 - First Blood
  {
    id: 'opponent_2',
    name: 'Gym Rat',
    level: 2,
    hp: 900,
    damage: {
      perfect: 45,
      good: 22,
      superCombo: 135,
    },
    reactionTime: {
      perfect: 1100,
      good: 2300,
    },
    promptInterval: {
      min: 1700, // 1.7 seconds minimum
      max: 2100, // 2.1 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.2,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.2,
      maxPrompts: 3,
      duration: {
        min: 1500,
        max: 2000,
      },
      perfectWindowDuration: 1300,
      goodWindowDuration: 1100,
      staggerDelay: 5000, // Very long stagger for better gameplay
    },
    difficulty: 'easy',
    description: 'A fitness enthusiast who hits harder than expected.',
    rounds: 1,
    roundHPGoals: [225], // Round 1 ends when HP reaches 225 (675 damage dealt)
  },

  // Level 3 - Rising Star
  {
    id: 'opponent_3',
    name: 'Amateur Boxer',
    level: 3,
    hp: 1000,
    damage: {
      perfect: 50,
      good: 25,
      superCombo: 150,
    },
    reactionTime: {
      perfect: 1000,
      good: 2000,
    },
    promptInterval: {
      min: 1600, // 1.6 seconds minimum
      max: 2000, // 2.0 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.15,
      maxFeints: 2,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.15,
      maxPrompts: 2,
      duration: {
        min: 1200,
        max: 1700,
      },
      perfectWindowDuration: 1100,
      goodWindowDuration: 900,
      staggerDelay: 1200,
    },
    difficulty: 'easy',
    description: 'A trained amateur with proper technique.',
    rounds: 2,
    roundHPGoals: [500, 0], // Round 1 ends at 500 HP, Round 2 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1500, max: 1900 }, // Round 2 is slightly faster
    },
  },

  // Level 4 - The Challenge
  {
    id: 'opponent_4',
    name: 'Club Champion',
    level: 4,
    hp: 1100,
    damage: {
      perfect: 55,
      good: 27,
      superCombo: 165,
    },
    reactionTime: {
      perfect: 900,
      good: 1800,
    },
    promptInterval: {
      min: 1500, // 1.5 seconds minimum
      max: 1900, // 1.9 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.2,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.2,
      maxPrompts: 3,
      duration: {
        min: 1400,
        max: 1900,
      },
      perfectWindowDuration: 1000,
      goodWindowDuration: 400, // More lenient good window
      staggerDelay: 1400,
    },
    difficulty: 'medium',
    description: 'A local boxing club champion with experience.',
    rounds: 2,
    roundHPGoals: [550, 0], // Round 1 ends at 550 HP, Round 2 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1400, max: 1800 }, // Round 2 is faster
    },
  },

  // Level 5 - Midnight Brawl
  {
    id: 'opponent_5',
    name: 'Underground Fighter',
    level: 5,
    hp: 1200,
    damage: {
      perfect: 60,
      good: 30,
      superCombo: 180,
    },
    reactionTime: {
      perfect: 800,
      good: 1600,
    },
    promptInterval: {
      min: 1400, // 1.4 seconds minimum
      max: 1800, // 1.8 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.25,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.25,
      maxPrompts: 3,
      duration: {
        min: 1300,
        max: 1800,
      },
      perfectWindowDuration: 900,
      goodWindowDuration: 400, // More lenient good window
      staggerDelay: 1600,
    },
    difficulty: 'medium',
    description: 'A dangerous underground fighter with no rules.',
    rounds: 2,
    roundHPGoals: [600, 0], // Round 1 ends at 600 HP, Round 2 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1300, max: 1700 }, // Round 2 is faster
    },
  },

  // Level 6 - Champion's Path
  {
    id: 'opponent_6',
    name: 'Regional Champ',
    level: 6,
    hp: 1300,
    damage: {
      perfect: 65,
      good: 32,
      superCombo: 195,
    },
    reactionTime: {
      perfect: 700,
      good: 1400,
    },
    promptInterval: {
      min: 1300, // 1.3 seconds minimum
      max: 1700, // 1.7 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.3,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.3,
      maxPrompts: 3,
      duration: {
        min: 1200,
        max: 1700,
      },
      perfectWindowDuration: 800,
      goodWindowDuration: 400, // More lenient good window
      staggerDelay: 1800,
    },
    difficulty: 'medium',
    description: 'A regional champion with a solid record.',
    rounds: 3,
    roundHPGoals: [867, 433, 0], // Round 1 ends at 867 HP, Round 2 ends at 433 HP, Round 3 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1200, max: 1600 }, // Round 2 is faster
      3: { min: 1100, max: 1500 }, // Round 3 is fastest
    },
    roundFeints: {
      2: { enabled: true, probability: 0.4, maxFeints: 3 }, // Round 2: More feints
      3: { enabled: true, probability: 0.5, maxFeints: 3 }, // Round 3: Most feints
    },
    roundTimingPrompts: {
      2: { 
        enabled: true, 
        probability: 0.4, 
        maxPrompts: 3,
        duration: { min: 1100, max: 1600 },
        perfectWindowDuration: 700,
        goodWindowDuration: 500,
        staggerDelay: 2000,
      }, // Round 2: More timing prompts
      3: { 
        enabled: true, 
        probability: 0.5, 
        maxPrompts: 3,
        duration: { min: 1000, max: 1500 },
        perfectWindowDuration: 600,
        goodWindowDuration: 400,
        staggerDelay: 2200,
      }, // Round 3: Most timing prompts
    },
  },

  // Level 7 - Dark Arena
  {
    id: 'opponent_7',
    name: 'Shadow Boxer',
    level: 7,
    hp: 1400,
    damage: {
      perfect: 70,
      good: 35,
      superCombo: 210,
    },
    reactionTime: {
      perfect: 600,
      good: 1200,
    },
    promptInterval: {
      min: 1200, // 1.2 seconds minimum
      max: 1600, // 1.6 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.35,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.35,
      maxPrompts: 3,
      duration: {
        min: 1100,
        max: 1600,
      },
      perfectWindowDuration: 700,
      goodWindowDuration: 500,
      staggerDelay: 2400,
    },
    difficulty: 'hard',
    description: 'A mysterious fighter with unpredictable moves.',
    rounds: 3,
    roundHPGoals: [933, 467, 0], // Round 1 ends at 933 HP, Round 2 ends at 467 HP, Round 3 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1100, max: 1500 }, // Round 2 is faster
      3: { min: 1000, max: 1400 }, // Round 3 is fastest
    },
    roundFeints: {
      2: { enabled: true, probability: 0.45, maxFeints: 3 }, // Round 2: More feints
      3: { enabled: true, probability: 0.6, maxFeints: 3 }, // Round 3: Most feints
    },
    roundTimingPrompts: {
      2: { 
        enabled: true, 
        probability: 0.5, 
        maxPrompts: 3,
        duration: { min: 1000, max: 1500 },
        perfectWindowDuration: 600,
        goodWindowDuration: 400,
        staggerDelay: 2600,
      }, // Round 2: More timing prompts
      3: { 
        enabled: true, 
        probability: 0.65, 
        maxPrompts: 3,
        duration: { min: 900, max: 1400 },
        perfectWindowDuration: 500,
        goodWindowDuration: 300,
        staggerDelay: 2800,
      }, // Round 3: Most timing prompts
    },
  },

  // Level 8 - Final Countdown
  {
    id: 'opponent_8',
    name: 'Elite Contender',
    level: 8,
    hp: 1500,
    damage: {
      perfect: 75,
      good: 37,
      superCombo: 225,
    },
    reactionTime: {
      perfect: 500,
      good: 1000,
    },
    promptInterval: {
      min: 1100, // 1.1 seconds minimum
      max: 1500, // 1.5 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.4,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.4,
      maxPrompts: 3,
      duration: {
        min: 1000,
        max: 1500,
      },
      perfectWindowDuration: 600,
      goodWindowDuration: 400,
      staggerDelay: 3000,
    },
    difficulty: 'hard',
    description: 'An elite fighter with championship aspirations.',
    rounds: 3,
    roundHPGoals: [1000, 500, 0], // Round 1 ends at 1000 HP, Round 2 ends at 500 HP, Round 3 ends at 0 HP
    roundPromptIntervals: {
      2: { min: 1000, max: 1400 }, // Round 2 is faster
      3: { min: 900, max: 1300 }, // Round 3 is fastest
    },
    roundTimingPrompts: {
      2: { 
        enabled: true, 
        probability: 0.55, 
        maxPrompts: 3,
        duration: { min: 900, max: 1400 },
        perfectWindowDuration: 500,
        goodWindowDuration: 300,
        staggerDelay: 3200,
      }, // Round 2: More timing prompts
      3: { 
        enabled: true, 
        probability: 0.7, 
        maxPrompts: 3,
        duration: { min: 800, max: 1300 },
        perfectWindowDuration: 400,
        goodWindowDuration: 200,
        staggerDelay: 3400,
      }, // Round 3: Most timing prompts
    },
  },

  // Level 9 - Legend's Trial
  {
    id: 'opponent_9',
    name: 'Legendary Warrior',
    level: 9,
    hp: 1600,
    damage: {
      perfect: 80,
      good: 40,
      superCombo: 240,
    },
    reactionTime: {
      perfect: 400,
      good: 800,
    },
    promptInterval: {
      min: 1000, // 1.0 seconds minimum
      max: 1400, // 1.4 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.45,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.45,
      maxPrompts: 3,
      duration: {
        min: 900,
        max: 1400,
      },
      perfectWindowDuration: 500,
      goodWindowDuration: 300,
      staggerDelay: 3600,
    },
    difficulty: 'expert',
    description: 'A legendary fighter with decades of experience.',
    rounds: 4,
    roundHPGoals: [1200, 800, 400, 0], // 4 rounds with decreasing HP thresholds
    roundPromptIntervals: {
      2: { min: 900, max: 1300 }, // Round 2 is faster
      3: { min: 800, max: 1200 }, // Round 3 is faster
      4: { min: 700, max: 1100 }, // Round 4 is fastest
    },
    roundTimingPrompts: {
      2: { 
        enabled: true, 
        probability: 0.6, 
        maxPrompts: 3,
        duration: { min: 800, max: 1300 },
        perfectWindowDuration: 400,
        goodWindowDuration: 200,
        staggerDelay: 3800,
      }, // Round 2: More timing prompts
      3: { 
        enabled: true, 
        probability: 0.75, 
        maxPrompts: 3,
        duration: { min: 700, max: 1200 },
        perfectWindowDuration: 300,
        goodWindowDuration: 150,
        staggerDelay: 4000,
      }, // Round 3: More timing prompts
      4: { 
        enabled: true, 
        probability: 0.9, 
        maxPrompts: 3,
        duration: { min: 600, max: 1100 },
        perfectWindowDuration: 250,
        goodWindowDuration: 100,
        staggerDelay: 4200,
      }, // Round 4: Most timing prompts
    },
  },

  // Level 10 - Ultimate Showdown
  {
    id: 'opponent_10',
    name: 'The Undefeated',
    level: 10,
    hp: 1800,
    damage: {
      perfect: 85,
      good: 42,
      superCombo: 255,
    },
    reactionTime: {
      perfect: 300,
      good: 600,
    },
    promptInterval: {
      min: 900, // 0.9 seconds minimum
      max: 1300, // 1.3 seconds maximum
    },
    feints: {
      enabled: true,
      probability: 0.5,
      maxFeints: 3,
    },
    timingPrompts: {
      enabled: true,
      probability: 0.5,
      maxPrompts: 3,
      duration: {
        min: 800,
        max: 1300,
      },
      perfectWindowDuration: 400,
      goodWindowDuration: 200,
      staggerDelay: 4400,
    },
    difficulty: 'expert',
    description: 'The ultimate challenge - an undefeated champion.',
    rounds: 4,
    roundHPGoals: [1350, 900, 450, 0], // 4 rounds with decreasing HP thresholds
    roundPromptIntervals: {
      2: { min: 800, max: 1200 }, // Round 2 is faster
      3: { min: 700, max: 1100 }, // Round 3 is faster
      4: { min: 600, max: 1000 }, // Round 4 is fastest
    },
    roundTimingPrompts: {
      2: { 
        enabled: true, 
        probability: 0.65, 
        maxPrompts: 3,
        duration: { min: 700, max: 1200 },
        perfectWindowDuration: 300,
        goodWindowDuration: 150,
        staggerDelay: 4600,
      }, // Round 2: More timing prompts
      3: { 
        enabled: true, 
        probability: 0.8, 
        maxPrompts: 3,
        duration: { min: 600, max: 1100 },
        perfectWindowDuration: 200,
        goodWindowDuration: 100,
        staggerDelay: 4800,
      }, // Round 3: More timing prompts
      4: { 
        enabled: true, 
        probability: 0.95, 
        maxPrompts: 3,
        duration: { min: 500, max: 1000 },
        perfectWindowDuration: 150,
        goodWindowDuration: 75,
        staggerDelay: 5000,
      }, // Round 4: Most timing prompts
    },
  },
];

// Helper function to get opponent config by level
export const getOpponentConfig = (level: number): OpponentConfig => {
  const opponent = opponents.find(opp => opp.level === level);
  if (!opponent) {
    // Fallback to level 1 if level not found
    return opponents[0];
  }
  return opponent;
};

// Helper function to get round HP goal for a specific round
export const getRoundHPGoal = (opponentConfig: OpponentConfig, roundNumber: number): number => {
  if (roundNumber <= 0 || roundNumber > opponentConfig.rounds) {
    return 0; // Invalid round
  }
  return opponentConfig.roundHPGoals[roundNumber - 1] || 0;
};

// Helper function to get prompt interval range for a specific round
export const getPromptIntervalRange = (opponentConfig: OpponentConfig, roundNumber: number): { min: number; max: number } => {
  // Check if there's a specific interval for this round
  if (opponentConfig.roundPromptIntervals && opponentConfig.roundPromptIntervals[roundNumber]) {
    return opponentConfig.roundPromptIntervals[roundNumber];
  }
  
  // Fall back to default interval
  return opponentConfig.promptInterval;
};

// Helper function to get a random prompt interval for a specific round
export const getRandomPromptInterval = (opponentConfig: OpponentConfig, roundNumber: number): number => {
  const range = getPromptIntervalRange(opponentConfig, roundNumber);
  return Math.random() * (range.max - range.min) + range.min;
};

// Helper function to get feint configuration for a specific round
export const getFeintConfig = (opponentConfig: OpponentConfig, roundNumber: number): {
  enabled: boolean;
  probability: number;
  maxFeints: number;
} => {
  // Check if there's a specific feint config for this round
  if (opponentConfig.roundFeints && opponentConfig.roundFeints[roundNumber]) {
    return opponentConfig.roundFeints[roundNumber];
  }
  
  // Fall back to default feint config
  return opponentConfig.feints;
};

// Helper function to get timing prompt configuration for a specific round
export const getTimingPromptConfig = (opponentConfig: OpponentConfig, roundNumber: number): {
  enabled: boolean;
  probability: number;
  maxPrompts: number;
  duration: {
    min: number;
    max: number;
  };
  perfectWindowDuration: number;
  goodWindowDuration: number;
  staggerDelay: number;
} => {
  // Check if there's a specific timing prompt config for this round
  if (opponentConfig.roundTimingPrompts && opponentConfig.roundTimingPrompts[roundNumber]) {
    return opponentConfig.roundTimingPrompts[roundNumber];
  }
  
  // Fall back to default timing prompt config
  return opponentConfig.timingPrompts;
};

// Helper function to get all opponents
export const getAllOpponents = (): OpponentConfig[] => {
  return opponents;
};

// Helper function to get opponents by difficulty
export const getOpponentsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): OpponentConfig[] => {
  return opponents.filter(opp => opp.difficulty === difficulty);
}; 