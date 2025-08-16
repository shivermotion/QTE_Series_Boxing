import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { SaveEvent } from '../types/gameState';
import { saveManager } from '../utils/saveManager';

export const useGameSave = () => {
  const {
    gameState,
    saveGame,
    completeLevel,
    addScore,
    unlockAchievement,
    unlockCharacter,
    incrementStat,
    updateAudioSettings,
    getLastSaveTime,
    hasSaveData,
    setGems,
    snapshotRun,
    clearSnapshot,
  } = useGame();

  const sessionStartTime = useRef<number>(Date.now());

  // Track play time
  useEffect(() => {
    const interval = setInterval(() => {
      const playTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      incrementStat('totalPlayTime', 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [incrementStat]);

  // Game event handlers with automatic saving
  const handleLevelComplete = useCallback(
    async (level: number, score: number, winTime?: number) => {
      // Update fastest win time if applicable (store absolute best time)
      if (
        typeof winTime === 'number' &&
        (gameState.statistics.fastestWin === 0 || winTime < gameState.statistics.fastestWin)
      ) {
        // Directly set the new fastest time via increment of the delta
        const delta = winTime - gameState.statistics.fastestWin;
        incrementStat('fastestWin', delta);
      }

      await completeLevel(level, score);
    },
    [completeLevel, incrementStat, gameState.statistics.fastestWin]
  );

  const handleScoreAdd = useCallback(async (points: number) => {
    await addScore(points);
  }, [addScore]);

  const handleAchievementUnlock = useCallback(async (achievementId: string) => {
    await unlockAchievement(achievementId);
  }, [unlockAchievement]);

  const handleCharacterUnlock = useCallback(async (characterId: string) => {
    await unlockCharacter(characterId);
  }, [unlockCharacter]);

  const handlePunch = useCallback(() => {
    incrementStat('totalPunches');
  }, [incrementStat]);
  // Snapshot API for continues
  const snapshotForContinue = useCallback((snapshot: NonNullable<typeof gameState.lastRunSnapshot>) => {
    snapshotRun(snapshot);
  }, [snapshotRun]);

  const useGemContinue = useCallback(() => {
    if (gameState.gems <= 0 || !gameState.lastRunSnapshot) return false;
    setGems(prev => Math.max(0, (prev as number) - 1));
    clearSnapshot();
    incrementStat('continuesUsed', 1);
    return true;
  }, [gameState.gems, gameState.lastRunSnapshot, setGems, clearSnapshot, incrementStat]);


  // Removed block/dodge tracking per spec
  const handleBlock = useCallback(() => {}, []);
  const handleDodge = useCallback(() => {}, []);

  const handleCombo = useCallback((comboCount: number) => {
    if (comboCount > gameState.statistics.bestCombo) {
      incrementStat('bestCombo', comboCount - gameState.statistics.bestCombo);
    }
  }, [incrementStat, gameState.statistics.bestCombo]);

  const handleAudioSettingChange = useCallback(async (settings: Partial<typeof gameState.audioSettings>) => {
    await updateAudioSettings(settings);
  }, [updateAudioSettings]);

  // Manual save functions
  const manualSave = useCallback(async (eventType: SaveEvent['type'] = 'autosave') => {
    return await saveGame(eventType);
  }, [saveGame]);

  // Save status helpers
  const getSaveStatus = useCallback(() => {
    const lastSave = getLastSaveTime();
    if (!lastSave) return { hasData: false, lastSave: null, timeSinceLastSave: null, isRecent: false };
    
    const lastSaveDate = new Date(lastSave);
    if (isNaN(lastSaveDate.getTime())) {
      return { hasData: false, lastSave: null, timeSinceLastSave: null, isRecent: false };
    }
    
    const now = new Date();
    const timeSinceLastSave = now.getTime() - lastSaveDate.getTime();
    
    return {
      hasData: hasSaveData(),
      lastSave: lastSaveDate,
      timeSinceLastSave,
      isRecent: timeSinceLastSave < 60000, // Less than 1 minute
    };
  }, [getLastSaveTime, hasSaveData]);

  return {
    // Game state
    gameState,
    
    // Event handlers
    handleLevelComplete,
    handleScoreAdd,
    handleAchievementUnlock,
    handleCharacterUnlock,
    handlePunch,
    handleBlock,
    handleDodge,
    handleCombo,
    handleAudioSettingChange,
    
    // Manual save
    manualSave,
    
    // Save status
    getSaveStatus,
    
    // Direct access to context methods
    saveGame,
    incrementStat,
    
    // Additional save management functions
    exportSaveData: () => saveManager.exportSaveData(),
    importSaveData: (data: string) => saveManager.importSaveData(data),
    clearGameData: () => saveManager.clearGameData(),
  };
}; 