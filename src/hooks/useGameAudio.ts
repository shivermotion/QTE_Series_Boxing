import { useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import { loadAudio, unloadAudio, playSound } from '../utils/audioUtils';

// ============================================================================
// GAME AUDIO HOOK
// ============================================================================

export const useGameAudio = () => {
  const { getEffectiveVolume, stopMainTheme, startMainTheme } = useAudio();

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);
  const powerUpSound = useRef<Audio.Sound | null>(null);
  const qteSuccessSound = useRef<Audio.Sound | null>(null);
  const qteFailureSound = useRef<Audio.Sound | null>(null);
  const boxingBell2Sound = useRef<Audio.Sound | null>(null);
  const boxingBell1Sound = useRef<Audio.Sound | null>(null);

  const audioRefs = {
    hitSound,
    missSound,
    comboSound,
    powerUpSound,
    qteSuccessSound,
    qteFailureSound,
    boxingBell2Sound,
    boxingBell1Sound,
  };

  // Load audio on mount
  useEffect(() => {
    loadAudio(audioRefs).catch(error => {
      console.log('Audio loading failed:', error);
    });

    return () => {
      unloadAudio(audioRefs);
    };
  }, []);

  // Stop main theme when entering game
  useEffect(() => {
    const stopMainThemeImmediately = async () => {
      try {
        await stopMainTheme();
      } catch (error) {
        console.log('Audio transition error:', error);
      }
    };

    stopMainThemeImmediately();
  }, []);

  // Restart main theme when leaving game
  useEffect(() => {
    return () => {
      startMainTheme();
    };
  }, []);

  const playGameSound = (soundRef: React.MutableRefObject<Audio.Sound | null>) => {
    playSound(soundRef, getEffectiveVolume);
  };

  return {
    playGameSound,
    audioRefs,
  };
}; 