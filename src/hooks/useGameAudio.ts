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
  
  // Countdown sound refs
  const countdownTenSound = useRef<Audio.Sound | null>(null);
  const countdownNineSound = useRef<Audio.Sound | null>(null);
  const countdownEightSound = useRef<Audio.Sound | null>(null);
  const countdownSevenSound = useRef<Audio.Sound | null>(null);
  const countdownSixSound = useRef<Audio.Sound | null>(null);
  const countdownFiveSound = useRef<Audio.Sound | null>(null);
  const countdownFourSound = useRef<Audio.Sound | null>(null);
  const countdownThreeSound = useRef<Audio.Sound | null>(null);
  const countdownTwoSound = useRef<Audio.Sound | null>(null);
  const countdownOneSound = useRef<Audio.Sound | null>(null);
  const knockoutSound = useRef<Audio.Sound | null>(null);

  const audioRefs = {
    hitSound,
    missSound,
    comboSound,
    powerUpSound,
    qteSuccessSound,
    qteFailureSound,
    boxingBell2Sound,
    boxingBell1Sound,
    countdownTenSound,
    countdownNineSound,
    countdownEightSound,
    countdownSevenSound,
    countdownSixSound,
    countdownFiveSound,
    countdownFourSound,
    countdownThreeSound,
    countdownTwoSound,
    countdownOneSound,
    knockoutSound,
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