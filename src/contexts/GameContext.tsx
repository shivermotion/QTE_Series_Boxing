import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { GameState, initialGameState, SaveEvent } from '../types/gameState';
import { saveManager } from '../utils/saveManager';

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;

  // State update methods
  updateGameState: (updates: Partial<GameState>) => void;
  updateAudioSettings: (settings: Partial<GameState['audioSettings']>) => void;
  updateStatistics: (stats: Partial<GameState['statistics']>) => void;

  // Game event methods
  completeLevel: (level: number, score: number) => void;
  addScore: (points: number) => void;
  unlockAchievement: (achievementId: string) => void;
  unlockCharacter: (characterId: string) => void;
  incrementStat: (statKey: keyof GameState['statistics'], amount?: number) => void;

  // Save management
  saveGame: (eventType?: SaveEvent['type']) => Promise<boolean>;
  loadGame: () => Promise<void>;
  clearGameData: () => Promise<boolean>;
  hasSaveData: () => boolean;
  getLastSaveTime: () => string | null;

  // Save events history
  getSaveEvents: () => SaveEvent[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced save function for autosaving
  const debouncedSave = useRef(
    debounce(async (state: GameState) => {
      await saveManager.saveGameState(state, 'autosave');
    }, 5000) // Save every 5 seconds after last change
  ).current;

  // Load game state on mount
  useEffect(() => {
    loadGame();
  }, []);

  // Autosave whenever gameState changes
  useEffect(() => {
    if (!isLoading && gameState) {
      debouncedSave(gameState);
    }

    // Cleanup to prevent memory leaks
    return () => debouncedSave.cancel();
  }, [gameState, isLoading, debouncedSave]);

  const loadGame = async () => {
    try {
      setIsLoading(true);
      const loadedState = await saveManager.loadGameState();
      setGameState(loadedState);
    } catch (error) {
      console.error('Failed to load game:', error);
      setGameState(initialGameState);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  const updateAudioSettings = useCallback(
    (settings: Partial<GameState['audioSettings']>) => {
      setGameState(prevState => ({
        ...prevState,
        audioSettings: {
          ...prevState.audioSettings,
          ...settings,
        },
      }));

      // Save immediately for settings changes
      setTimeout(() => {
        saveManager.saveImmediately(gameState, 'settings_change');
      }, 0);
    },
    [gameState]
  );

  const updateStatistics = useCallback((stats: Partial<GameState['statistics']>) => {
    setGameState(prevState => ({
      ...prevState,
      statistics: {
        ...prevState.statistics,
        ...stats,
      },
    }));
  }, []);

  const completeLevel = useCallback(async (level: number, score: number) => {
    setGameState(prevState => {
      const newState = {
        ...prevState,
        currentLevel: level + 1,
        highestLevelUnlocked: Math.max(prevState.highestLevelUnlocked, level + 1),
        totalScore: prevState.totalScore + score,
        gamesPlayed: prevState.gamesPlayed + 1,
        gamesWon: prevState.gamesWon + 1,
      };

      // Save immediately for level completion
      setTimeout(() => {
        saveManager.saveImmediately(newState, 'level_complete');
      }, 0);

      return newState;
    });
  }, []);

  const addScore = useCallback(
    (points: number) => {
      setGameState(prevState => ({
        ...prevState,
        totalScore: prevState.totalScore + points,
      }));

      // Save immediately for score updates
      setTimeout(() => {
        saveManager.saveImmediately(gameState, 'score_update');
      }, 0);
    },
    [gameState]
  );

  const unlockAchievement = useCallback((achievementId: string) => {
    setGameState(prevState => {
      if (prevState.achievements.includes(achievementId)) {
        return prevState; // Already unlocked
      }

      const newState = {
        ...prevState,
        achievements: [...prevState.achievements, achievementId],
      };

      // Save immediately for achievement unlock
      setTimeout(() => {
        saveManager.saveImmediately(newState, 'achievement_unlocked');
      }, 0);

      return newState;
    });
  }, []);

  const unlockCharacter = useCallback((characterId: string) => {
    setGameState(prevState => {
      if (prevState.unlockedCharacters.includes(characterId)) {
        return prevState; // Already unlocked
      }

      return {
        ...prevState,
        unlockedCharacters: [...prevState.unlockedCharacters, characterId],
      };
    });
  }, []);

  const incrementStat = useCallback(
    (statKey: keyof GameState['statistics'], amount: number = 1) => {
      setGameState(prevState => ({
        ...prevState,
        statistics: {
          ...prevState.statistics,
          [statKey]: prevState.statistics[statKey] + amount,
        },
      }));
    },
    []
  );

  const saveGame = useCallback(
    async (eventType: SaveEvent['type'] = 'autosave') => {
      return saveManager.saveGameState(gameState, eventType);
    },
    [gameState]
  );

  const clearGameData = useCallback(async () => {
    const success = await saveManager.clearGameData();
    if (success) {
      setGameState(initialGameState);
    }
    return success;
  }, []);

  const hasSaveData = useCallback(() => {
    return saveManager.hasSaveData();
  }, []);

  const getLastSaveTime = useCallback(() => {
    return saveManager.getLastSaveTime();
  }, []);

  const getSaveEvents = useCallback(() => {
    return saveManager.getSaveEvents();
  }, []);

  const contextValue: GameContextType = {
    gameState,
    isLoading,
    updateGameState,
    updateAudioSettings,
    updateStatistics,
    completeLevel,
    addScore,
    unlockAchievement,
    unlockCharacter,
    incrementStat,
    saveGame,
    loadGame,
    clearGameData,
    hasSaveData,
    getLastSaveTime,
    getSaveEvents,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
