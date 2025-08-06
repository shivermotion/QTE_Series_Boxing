import { useMMKVString, useMMKVNumber, useMMKVBoolean } from 'react-native-mmkv';
import { useCallback, useEffect, useMemo } from 'react';
import { gameStorage, settingsStorage, statisticsStorage } from '../utils/saveManager';
import { GameState, initialGameState, SaveEvent } from '../types/gameState';

/**
 * Hook that uses MMKV's built-in React hooks for optimal performance
 * This provides automatic re-renders when values change
 */
export const useMMKVGameState = () => {
  // Game progress (encrypted)
  const [currentLevel, setCurrentLevel] = useMMKVNumber('currentLevel', gameStorage);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useMMKVNumber('highestLevelUnlocked', gameStorage);
  const [totalScore, setTotalScore] = useMMKVNumber('totalScore', gameStorage);
  const [gamesPlayed, setGamesPlayed] = useMMKVNumber('gamesPlayed', gameStorage);
  const [gamesWon, setGamesWon] = useMMKVNumber('gamesWon', gameStorage);

  // Audio settings (encrypted)
  const [masterVolume, setMasterVolume] = useMMKVNumber('masterVolume', settingsStorage);
  const [musicVolume, setMusicVolume] = useMMKVNumber('musicVolume', settingsStorage);
  const [sfxVolume, setSfxVolume] = useMMKVNumber('sfxVolume', settingsStorage);

  // Statistics (unencrypted for performance)
  const [totalPunches, setTotalPunches] = useMMKVNumber('totalPunches', statisticsStorage);
  const [totalBlocks, setTotalBlocks] = useMMKVNumber('totalBlocks', statisticsStorage);
  const [totalDodges, setTotalDodges] = useMMKVNumber('totalDodges', statisticsStorage);
  const [bestCombo, setBestCombo] = useMMKVNumber('bestCombo', statisticsStorage);
  const [fastestWin, setFastestWin] = useMMKVNumber('fastestWin', statisticsStorage);
  const [totalPlayTime, setTotalPlayTime] = useMMKVNumber('totalPlayTime', statisticsStorage);

  // Achievements and unlocks
  const [achievements, setAchievements] = useMMKVString('achievements', gameStorage);
  const [unlockedCharacters, setUnlockedCharacters] = useMMKVString('unlockedCharacters', gameStorage);

  // Session data
  const [lastSaved, setLastSaved] = useMMKVString('lastSaved', gameStorage);
  const [gameVersion, setGameVersion] = useMMKVString('gameVersion', gameStorage);

  // Computed game state
  const gameState = useMemo((): GameState => {
    return {
      currentLevel: currentLevel ?? initialGameState.currentLevel,
      highestLevelUnlocked: highestLevelUnlocked ?? initialGameState.highestLevelUnlocked,
      totalScore: totalScore ?? initialGameState.totalScore,
      gamesPlayed: gamesPlayed ?? initialGameState.gamesPlayed,
      gamesWon: gamesWon ?? initialGameState.gamesWon,
      
      audioSettings: {
        masterVolume: masterVolume ?? initialGameState.audioSettings.masterVolume,
        musicVolume: musicVolume ?? initialGameState.audioSettings.musicVolume,
        sfxVolume: sfxVolume ?? initialGameState.audioSettings.sfxVolume,
      },
      
      statistics: {
        totalPunches: totalPunches ?? initialGameState.statistics.totalPunches,
        totalBlocks: totalBlocks ?? initialGameState.statistics.totalBlocks,
        totalDodges: totalDodges ?? initialGameState.statistics.totalDodges,
        bestCombo: bestCombo ?? initialGameState.statistics.bestCombo,
        fastestWin: fastestWin ?? initialGameState.statistics.fastestWin,
        totalPlayTime: totalPlayTime ?? initialGameState.statistics.totalPlayTime,
      },
      
      achievements: achievements ? JSON.parse(achievements) : initialGameState.achievements,
      unlockedCharacters: unlockedCharacters ? JSON.parse(unlockedCharacters) : initialGameState.unlockedCharacters,
      
      lastSaved: lastSaved ?? initialGameState.lastSaved,
      gameVersion: gameVersion ?? initialGameState.gameVersion,
    };
  }, [
    currentLevel, highestLevelUnlocked, totalScore, gamesPlayed, gamesWon,
    masterVolume, musicVolume, sfxVolume,
    totalPunches, totalBlocks, totalDodges, bestCombo, fastestWin, totalPlayTime,
    achievements, unlockedCharacters, lastSaved, gameVersion,
  ]);

  // Initialize default values if not set
  useEffect(() => {
    if (currentLevel === undefined) setCurrentLevel(initialGameState.currentLevel);
    if (highestLevelUnlocked === undefined) setHighestLevelUnlocked(initialGameState.highestLevelUnlocked);
    if (totalScore === undefined) setTotalScore(initialGameState.totalScore);
    if (gamesPlayed === undefined) setGamesPlayed(initialGameState.gamesPlayed);
    if (gamesWon === undefined) setGamesWon(initialGameState.gamesWon);
    
    if (masterVolume === undefined) setMasterVolume(initialGameState.audioSettings.masterVolume);
    if (musicVolume === undefined) setMusicVolume(initialGameState.audioSettings.musicVolume);
    if (sfxVolume === undefined) setSfxVolume(initialGameState.audioSettings.sfxVolume);
    
    if (totalPunches === undefined) setTotalPunches(initialGameState.statistics.totalPunches);
    if (totalBlocks === undefined) setTotalBlocks(initialGameState.statistics.totalBlocks);
    if (totalDodges === undefined) setTotalDodges(initialGameState.statistics.totalDodges);
    if (bestCombo === undefined) setBestCombo(initialGameState.statistics.bestCombo);
    if (fastestWin === undefined) setFastestWin(initialGameState.statistics.fastestWin);
    if (totalPlayTime === undefined) setTotalPlayTime(initialGameState.statistics.totalPlayTime);
    
    if (achievements === undefined) setAchievements(JSON.stringify(initialGameState.achievements));
    if (unlockedCharacters === undefined) setUnlockedCharacters(JSON.stringify(initialGameState.unlockedCharacters));
    if (gameVersion === undefined) setGameVersion(initialGameState.gameVersion);
  }, []);

  // Update last saved timestamp
  const updateLastSaved = useCallback(() => {
    setLastSaved(new Date().toISOString());
  }, [setLastSaved]);

  // Game event handlers
  const completeLevel = useCallback(async (level: number, score: number, winTime?: number) => {
    // Update fastest win time if applicable
    if (winTime && (fastestWin === 0 || winTime < (fastestWin ?? 0))) {
      setFastestWin(winTime);
    }
    
    setCurrentLevel(level + 1);
    setHighestLevelUnlocked(Math.max(highestLevelUnlocked ?? 1, level + 1));
    setTotalScore((totalScore ?? 0) + score);
    setGamesPlayed((gamesPlayed ?? 0) + 1);
    setGamesWon((gamesWon ?? 0) + 1);
    updateLastSaved();
  }, [setCurrentLevel, setHighestLevelUnlocked, setTotalScore, setGamesPlayed, setGamesWon, updateLastSaved, highestLevelUnlocked, totalScore, gamesPlayed, gamesWon, fastestWin, setFastestWin]);

  const addScore = useCallback((points: number) => {
    setTotalScore((totalScore ?? 0) + points);
    updateLastSaved();
  }, [setTotalScore, updateLastSaved, totalScore]);

  const updateAudioSettings = useCallback((settings: Partial<GameState['audioSettings']>) => {
    if (settings.masterVolume !== undefined) setMasterVolume(settings.masterVolume);
    if (settings.musicVolume !== undefined) setMusicVolume(settings.musicVolume);
    if (settings.sfxVolume !== undefined) setSfxVolume(settings.sfxVolume);
    updateLastSaved();
  }, [setMasterVolume, setMusicVolume, setSfxVolume, updateLastSaved]);

  const incrementStat = useCallback((statKey: keyof GameState['statistics'], amount: number = 1) => {
    switch (statKey) {
      case 'totalPunches':
        setTotalPunches((totalPunches ?? 0) + amount);
        break;
      case 'totalBlocks':
        setTotalBlocks((totalBlocks ?? 0) + amount);
        break;
      case 'totalDodges':
        setTotalDodges((totalDodges ?? 0) + amount);
        break;
      case 'bestCombo':
        setBestCombo(Math.max(bestCombo ?? 0, amount));
        break;
      case 'fastestWin':
        setFastestWin(amount);
        break;
      case 'totalPlayTime':
        setTotalPlayTime((totalPlayTime ?? 0) + amount);
        break;
    }
  }, [setTotalPunches, setTotalBlocks, setTotalDodges, setBestCombo, setFastestWin, setTotalPlayTime, totalPunches, totalBlocks, totalDodges, bestCombo, totalPlayTime]);

  const unlockAchievement = useCallback((achievementId: string) => {
    const currentAchievements = achievements ? JSON.parse(achievements) : [];
    if (!currentAchievements.includes(achievementId)) {
      const newAchievements = [...currentAchievements, achievementId];
      setAchievements(JSON.stringify(newAchievements));
      updateLastSaved();
    }
  }, [achievements, setAchievements, updateLastSaved]);

  const unlockCharacter = useCallback((characterId: string) => {
    const currentCharacters = unlockedCharacters ? JSON.parse(unlockedCharacters) : [];
    if (!currentCharacters.includes(characterId)) {
      const newCharacters = [...currentCharacters, characterId];
      setUnlockedCharacters(JSON.stringify(newCharacters));
    }
  }, [unlockedCharacters, setUnlockedCharacters]);

  return {
    gameState,
    completeLevel,
    addScore,
    updateAudioSettings,
    incrementStat,
    unlockAchievement,
    unlockCharacter,
    updateLastSaved,
  };
}; 