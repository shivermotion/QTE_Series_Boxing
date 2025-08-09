import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { useGame } from './GameContext';

interface AudioContextType {
  settings: {
    masterVolume: number;
    soundEffectsVolume: number;
    musicVolume: number;
    audioEnabled: boolean;
  };
  updateMasterVolume: (volume: number) => void;
  updateSoundEffectsVolume: (volume: number) => void;
  updateMusicVolume: (volume: number) => void;
  toggleAudioEnabled: (enabled: boolean) => void;
  getEffectiveVolume: (type: 'master' | 'sfx' | 'music') => number;
  startMainTheme: () => Promise<void>;
  stopMainTheme: () => Promise<void>;
  isMainThemePlaying: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const { gameState, updateAudioSettings } = useGame();
  const settings = gameState.audioSettings;

  const [isMainThemePlaying, setIsMainThemePlaying] = useState(false);
  const mainThemeRef = useRef<Audio.Sound | null>(null);

  const updateMasterVolume = (volume: number) => {
    updateAudioSettings({ masterVolume: volume });
  };

  const updateSoundEffectsVolume = (volume: number) => {
    updateAudioSettings({ sfxVolume: volume });
  };

  const updateMusicVolume = (volume: number) => {
    updateAudioSettings({ musicVolume: volume });
  };

  const toggleAudioEnabled = (enabled: boolean) => {
    updateAudioSettings({ audioEnabled: enabled });
  };

  const getEffectiveVolume = (type: 'master' | 'sfx' | 'music'): number => {
    if (!settings.audioEnabled) return 0;

    const masterVol = settings.masterVolume;

    switch (type) {
      case 'master':
        return masterVol;
      case 'sfx':
        return masterVol * settings.sfxVolume;
      case 'music':
        return masterVol * settings.musicVolume;
      default:
        return masterVol;
    }
  };

  const startMainTheme = async () => {
    try {
      if (mainThemeRef.current) {
        await mainThemeRef.current.stopAsync();
        await mainThemeRef.current.unloadAsync();
      }

      const mainTheme = new Audio.Sound();
      // await mainTheme.loadAsync(require('../../assets/audio/main_theme.mp3'));
      await mainTheme.setIsLoopingAsync(true);
      const effectiveVolume = getEffectiveVolume('music');
      await mainTheme.setVolumeAsync(effectiveVolume);
      await mainTheme.playAsync();

      mainThemeRef.current = mainTheme;
      setIsMainThemePlaying(true);
    } catch (e) {
      console.log('Error starting main theme:', e);
    }
  };

  const stopMainTheme = async () => {
    try {
      if (mainThemeRef.current) {
        await mainThemeRef.current.stopAsync();
        await mainThemeRef.current.unloadAsync();
        mainThemeRef.current = null;
        setIsMainThemePlaying(false);
      }
    } catch (e) {
      console.log('Error stopping main theme:', e);
    }
  };

  // Apply volume changes to main theme when settings change
  useEffect(() => {
    const updateMainThemeVolume = async () => {
      if (mainThemeRef.current && isMainThemePlaying) {
        try {
          const effectiveVolume = getEffectiveVolume('music');
          await mainThemeRef.current.setVolumeAsync(effectiveVolume);
        } catch (e) {
          console.log('Error updating main theme volume:', e);
        }
      }
    };

    updateMainThemeVolume();
  }, [settings, isMainThemePlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mainThemeRef.current) {
        mainThemeRef.current.stopAsync();
        mainThemeRef.current.unloadAsync();
      }
    };
  }, []);

  const value: AudioContextType = {
    settings: {
      masterVolume: settings.masterVolume,
      soundEffectsVolume: settings.sfxVolume,
      musicVolume: settings.musicVolume,
      audioEnabled: settings.audioEnabled,
    },
    updateMasterVolume,
    updateSoundEffectsVolume,
    updateMusicVolume,
    toggleAudioEnabled,
    getEffectiveVolume,
    startMainTheme,
    stopMainTheme,
    isMainThemePlaying,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
