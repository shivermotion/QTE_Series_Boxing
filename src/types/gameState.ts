export interface GameState {
  // Player progress
  currentLevel: number;
  highestLevelUnlocked: number;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  gems: number; // Persisted gems for continues
  lastRunSnapshot: {
    level: number;
    currentRound: number;
    opponentHP: number;
    score: number;
    superMeter: number;
  } | null;
  
  // Settings
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    audioEnabled: boolean;
  };
  
  // Game statistics
  statistics: {
    totalPunches: number;
    totalBlocks: number;
    totalDodges: number;
    bestCombo: number;
    fastestWin: number; // in seconds
    totalPlayTime: number; // in seconds
    roundsCompleted: number;
    continuesUsed: number;
  };
  
  // Achievements and unlocks
  achievements: string[];
  unlockedCharacters: string[];
  
  // Session data
  lastSaved: string | null;
  gameVersion: string;
}

export interface SaveEvent {
  type: 'level_complete' | 'score_update' | 'achievement_unlocked' | 'settings_change' | 'autosave' | 'manual';
  timestamp: string;
  data?: any;
}

export const initialGameState: GameState = {
  currentLevel: 1,
  highestLevelUnlocked: 1,
  totalScore: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gems: 3,
  lastRunSnapshot: null,
  
  audioSettings: {
    masterVolume: 1.0,
    musicVolume: 0.8,
    sfxVolume: 0.9,
    audioEnabled: true,
  },
  
  statistics: {
    totalPunches: 0,
    totalBlocks: 0,
    totalDodges: 0,
    bestCombo: 0,
    fastestWin: 0,
    totalPlayTime: 0,
    roundsCompleted: 0,
    continuesUsed: 0,
  },
  
  achievements: [],
  unlockedCharacters: ['hero'],
  
  lastSaved: null,
  gameVersion: '1.0.0',
}; 