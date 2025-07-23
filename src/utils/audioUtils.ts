import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';

// ============================================================================
// AUDIO UTILITIES
// ============================================================================

export async function loadWithTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  name: string
): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timeout loading ${name}`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

export const loadAudio = async (audioRefs: {
  hitSound: React.MutableRefObject<Audio.Sound | null>;
  missSound: React.MutableRefObject<Audio.Sound | null>;
  comboSound: React.MutableRefObject<Audio.Sound | null>;
  powerUpSound: React.MutableRefObject<Audio.Sound | null>;
  qteSuccessSound: React.MutableRefObject<Audio.Sound | null>;
  qteFailureSound: React.MutableRefObject<Audio.Sound | null>;
  boxingBell2Sound: React.MutableRefObject<Audio.Sound | null>;
  boxingBell1Sound: React.MutableRefObject<Audio.Sound | null>;
  countdownTenSound: React.MutableRefObject<Audio.Sound | null>;
  countdownNineSound: React.MutableRefObject<Audio.Sound | null>;
  countdownEightSound: React.MutableRefObject<Audio.Sound | null>;
  countdownSevenSound: React.MutableRefObject<Audio.Sound | null>;
  countdownSixSound: React.MutableRefObject<Audio.Sound | null>;
  countdownFiveSound: React.MutableRefObject<Audio.Sound | null>;
  countdownFourSound: React.MutableRefObject<Audio.Sound | null>;
  countdownThreeSound: React.MutableRefObject<Audio.Sound | null>;
  countdownTwoSound: React.MutableRefObject<Audio.Sound | null>;
  countdownOneSound: React.MutableRefObject<Audio.Sound | null>;
  knockoutSound: React.MutableRefObject<Audio.Sound | null>;
}) => {
  try {
    const audioFiles: Record<string, any> = {
      punch_1: require('../../assets/audio/punch_1.mp3'),
      qte_success: require('../../assets/audio/qte_success.mp3'),
      qte_failure: require('../../assets/audio/qte_failure.mp3'),
      boxing_bell_2: require('../../assets/audio/boxing_bell_2.mp3'),
      boxing_bell_1: require('../../assets/audio/boxing_bell_1.mp3'),
      ten: require('../../assets/audio/ten.mp3'),
      nine: require('../../assets/audio/nine.mp3'),
      eight: require('../../assets/audio/eight.mp3'),
      seven: require('../../assets/audio/seven.mp3'),
      six: require('../../assets/audio/six.mp3'),
      five: require('../../assets/audio/five.mp3'),
      four: require('../../assets/audio/four.mp3'),
      three: require('../../assets/audio/three.mp3'),
      two: require('../../assets/audio/two.mp3'),
      one: require('../../assets/audio/one.mp3'),
      knockout: require('../../assets/audio/knockout.mp3'),
    };

    const tryLoad = async (label: string, ref: React.MutableRefObject<Audio.Sound | null>) => {
      const mod = audioFiles[label];
      if (!mod) return;
      
      try {
        const { sound } = await loadWithTimeout(Audio.Sound.createAsync(mod), 10000, label);
        ref.current = sound;
      } catch (error) {
        console.log(`Audio loading error (${label}):`, error);
      }
    };

    // Load all available audio files
    await tryLoad('punch_1', audioRefs.hitSound); // Use punch_1 for hit sound
    await tryLoad('punch_1', audioRefs.missSound); // Use punch_1 for miss sound
    await tryLoad('punch_1', audioRefs.comboSound); // Use punch_1 for combo sound
    await tryLoad('punch_1', audioRefs.powerUpSound); // Use punch_1 for power up sound
    await tryLoad('qte_success', audioRefs.qteSuccessSound);
    await tryLoad('qte_failure', audioRefs.qteFailureSound);
    await tryLoad('boxing_bell_2', audioRefs.boxingBell2Sound);
    await tryLoad('boxing_bell_1', audioRefs.boxingBell1Sound);
    
    // Load countdown sounds
    await tryLoad('ten', audioRefs.countdownTenSound);
    await tryLoad('nine', audioRefs.countdownNineSound);
    await tryLoad('eight', audioRefs.countdownEightSound);
    await tryLoad('seven', audioRefs.countdownSevenSound);
    await tryLoad('six', audioRefs.countdownSixSound);
    await tryLoad('five', audioRefs.countdownFiveSound);
    await tryLoad('four', audioRefs.countdownFourSound);
    await tryLoad('three', audioRefs.countdownThreeSound);
    await tryLoad('two', audioRefs.countdownTwoSound);
    await tryLoad('one', audioRefs.countdownOneSound);
    await tryLoad('knockout', audioRefs.knockoutSound);
  } catch (error) {
    console.log('Audio loading error:', error);
  }
};

export const unloadAudio = async (audioRefs: {
  hitSound: React.MutableRefObject<Audio.Sound | null>;
  missSound: React.MutableRefObject<Audio.Sound | null>;
  comboSound: React.MutableRefObject<Audio.Sound | null>;
  powerUpSound: React.MutableRefObject<Audio.Sound | null>;
  qteSuccessSound: React.MutableRefObject<Audio.Sound | null>;
  qteFailureSound: React.MutableRefObject<Audio.Sound | null>;
  boxingBell2Sound: React.MutableRefObject<Audio.Sound | null>;
  boxingBell1Sound: React.MutableRefObject<Audio.Sound | null>;
  countdownTenSound: React.MutableRefObject<Audio.Sound | null>;
  countdownNineSound: React.MutableRefObject<Audio.Sound | null>;
  countdownEightSound: React.MutableRefObject<Audio.Sound | null>;
  countdownSevenSound: React.MutableRefObject<Audio.Sound | null>;
  countdownSixSound: React.MutableRefObject<Audio.Sound | null>;
  countdownFiveSound: React.MutableRefObject<Audio.Sound | null>;
  countdownFourSound: React.MutableRefObject<Audio.Sound | null>;
  countdownThreeSound: React.MutableRefObject<Audio.Sound | null>;
  countdownTwoSound: React.MutableRefObject<Audio.Sound | null>;
  countdownOneSound: React.MutableRefObject<Audio.Sound | null>;
  knockoutSound: React.MutableRefObject<Audio.Sound | null>;
}) => {
  if (audioRefs.hitSound.current) await audioRefs.hitSound.current.unloadAsync();
  if (audioRefs.missSound.current) await audioRefs.missSound.current.unloadAsync();
  if (audioRefs.comboSound.current) await audioRefs.comboSound.current.unloadAsync();
  if (audioRefs.powerUpSound.current) await audioRefs.powerUpSound.current.unloadAsync();
  if (audioRefs.qteSuccessSound.current) await audioRefs.qteSuccessSound.current.unloadAsync();
  if (audioRefs.qteFailureSound.current) await audioRefs.qteFailureSound.current.unloadAsync();
  if (audioRefs.boxingBell2Sound.current) await audioRefs.boxingBell2Sound.current.unloadAsync();
  if (audioRefs.boxingBell1Sound.current) await audioRefs.boxingBell1Sound.current.unloadAsync();
  if (audioRefs.countdownTenSound.current) await audioRefs.countdownTenSound.current.unloadAsync();
  if (audioRefs.countdownNineSound.current) await audioRefs.countdownNineSound.current.unloadAsync();
  if (audioRefs.countdownEightSound.current) await audioRefs.countdownEightSound.current.unloadAsync();
  if (audioRefs.countdownSevenSound.current) await audioRefs.countdownSevenSound.current.unloadAsync();
  if (audioRefs.countdownSixSound.current) await audioRefs.countdownSixSound.current.unloadAsync();
  if (audioRefs.countdownFiveSound.current) await audioRefs.countdownFiveSound.current.unloadAsync();
  if (audioRefs.countdownFourSound.current) await audioRefs.countdownFourSound.current.unloadAsync();
  if (audioRefs.countdownThreeSound.current) await audioRefs.countdownThreeSound.current.unloadAsync();
  if (audioRefs.countdownTwoSound.current) await audioRefs.countdownTwoSound.current.unloadAsync();
  if (audioRefs.countdownOneSound.current) await audioRefs.countdownOneSound.current.unloadAsync();
  if (audioRefs.knockoutSound.current) await audioRefs.knockoutSound.current.unloadAsync();
};

export const playSound = async (
  soundRef: React.MutableRefObject<Audio.Sound | null>,
  getEffectiveVolume: (type: 'master' | 'sfx' | 'music') => number
) => {
  try {
    console.log('🔊 playSound called, soundRef exists:', !!soundRef.current);
    if (soundRef.current) {
      const effectiveVolume = getEffectiveVolume('sfx');
      console.log('🔊 Effective volume:', effectiveVolume);
      if (effectiveVolume === 0) {
        console.log('🔊 Volume is 0, skipping sound');
        return;
      }

      console.log('🔊 Setting volume and replaying sound');
      await soundRef.current.setVolumeAsync(effectiveVolume);
      await soundRef.current.replayAsync();
      console.log('🔊 Sound played successfully');
    } else {
      console.log('🔊 Sound ref is null, cannot play');
    }
  } catch (error) {
    console.log('🔊 Sound play error:', error);
  }
}; 