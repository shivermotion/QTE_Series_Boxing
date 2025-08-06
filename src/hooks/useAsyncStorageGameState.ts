import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, initialGameState } from '../types/gameState';
import { saveManager } from '../utils/saveManager';

/**
 * Hook that uses AsyncStorage for game state management
 * Provides automatic state updates and persistence
 */
export const useAsyncStorageGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    loadGameState();
  }, []);

  // Load game state from AsyncStorage
  const loadGameState = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await saveManager.loadGameState();
      setGameState(state);
      setLastSaveTime(state.lastSaved || null);
    } catch (error) {
      console.error('Failed to load game state:', error);
      setGameState(initialGameState);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save game state to AsyncStorage
  const saveGameState = useCallback(async (state?: GameState, eventType: string = 'manual') => {
    const stateToSave = state || gameState;
    const success = await saveManager.saveGameState(stateToSave, eventType as any);
    if (success) {
      setLastSaveTime(new Date().toISOString());
    }
    return success;
  }, [gameState]);

  // Update specific parts of the game state
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Level management
  const completeLevel = useCallback(async (level: number, score: number) => {
    const newState = {
      ...gameState,
      currentLevel: level + 1,
      highestLevelUnlocked: Math.max(gameState.highestLevelUnlocked, level + 1),
      totalScore: gameState.totalScore + score,
      gamesPlayed: gameState.gamesPlayed + 1,
      gamesWon: gameState.gamesWon + 1,
    };
    setGameState(newState);
    await saveGameState(newState, 'level_complete');
  }, [gameState, saveGameState]);

  // Score management
  const addScore = useCallback(async (points: number) => {
    const newState = {
      ...gameState,
      totalScore: gameState.totalScore + points,
    };
    setGameState(newState);
    await saveGameState(newState, 'score_update');
  }, [gameState, saveGameState]);

  // Statistics management
  const incrementStat = useCallback(async (statKey: keyof GameState['statistics'], amount: number = 1) => {
    const newState = {
      ...gameState,
      statistics: {
        ...gameState.statistics,
        [statKey]: (gameState.statistics[statKey] as number) + amount,
      },
    };
    setGameState(newState);
    // Don't save immediately for stat updates to avoid excessive saves
    // These will be saved with the next major event or autosave
  }, [gameState]);

  // Audio settings management
  const updateAudioSettings = useCallback(async (settings: Partial<GameState['audioSettings']>) => {
    const newState = {
      ...gameState,
      audioSettings: {
        ...gameState.audioSettings,
        ...settings,
      },
    };
    setGameState(newState);
    await saveGameState(newState, 'settings_change');
  }, [gameState, saveGameState]);

  // Achievements management
  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (gameState.achievements.includes(achievementId)) {
      return; // Already unlocked
    }
    
    const newState = {
      ...gameState,
      achievements: [...gameState.achievements, achievementId],
    };
    setGameState(newState);
    await saveGameState(newState, 'achievement_unlocked');
  }, [gameState, saveGameState]);

  // Character management
  const unlockCharacter = useCallback(async (characterId: string) => {
    if (gameState.unlockedCharacters.includes(characterId)) {
      return; // Already unlocked
    }
    
    const newState = {
      ...gameState,
      unlockedCharacters: [...gameState.unlockedCharacters, characterId],
    };
    setGameState(newState);
    await saveGameState(newState, 'character_unlocked');
  }, [gameState, saveGameState]);

  // Clear all data
  const clearGameData = useCallback(async () => {
    await saveManager.clearGameData();
    setGameState(initialGameState);
    setLastSaveTime(null);
  }, []);

  // Export/Import functionality
  const exportSaveData = useCallback(async () => {
    return await saveManager.exportSaveData();
  }, []);

  const importSaveData = useCallback(async (jsonData: string) => {
    const success = await saveManager.importSaveData(jsonData);
    if (success) {
      await loadGameState();
    }
    return success;
  }, [loadGameState]);

  return {
    // State
    gameState,
    isLoading,
    lastSaveTime,
    
    // Core functions
    saveGameState,
    updateGameState,
    loadGameState,
    clearGameData,
    
    // Level and score
    completeLevel,
    addScore,
    
    // Statistics
    incrementStat,
    
    // Settings
    updateAudioSettings,
    
    // Unlockables
    unlockAchievement,
    unlockCharacter,
    
    // Import/Export
    exportSaveData,
    importSaveData,
  };
};