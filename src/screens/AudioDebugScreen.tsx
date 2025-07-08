import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface AudioDebugScreenProps {
  onBackToMenu: () => void;
}

const AudioDebugScreen: React.FC<AudioDebugScreenProps> = ({ onBackToMenu }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSoundName, setLoadingSoundName] = useState<string | null>(null);

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);
  const bellSound = useRef<Audio.Sound | null>(null);
  const punchSound = useRef<Audio.Sound | null>(null);
  const mainThemeSound = useRef<Audio.Sound | null>(null);

  const audioFiles: Record<string, any> = {
    hit: require('../../assets/audio/hit.mp3'),
    miss: require('../../assets/audio/hit.mp3'),
    combo: require('../../assets/audio/hit.mp3'),
    bell: require('../../assets/audio/boxing_bell_1.mp3'),
    punch: require('../../assets/audio/punch_1.mp3'),
    'main theme': require('../../assets/audio/main_theme.mp3'),
  };

  // State to toggle between label and file name for each sound
  const [showFileNames, setShowFileNames] = useState<Record<string, boolean>>({});

  // Load audio on component mount
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  async function loadWithTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
    let timeout: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`Timeout loading ${name}`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
  }

  const loadAudio = async () => {
    setIsLoading(true);
    // Helper to try loading a sound from the mapping
    const tryLoad = async (label: string, ref: React.MutableRefObject<Audio.Sound | null>) => {
      setLoadingSoundName(label);
      const mod = audioFiles[label];
      if (!mod) {
        console.log(`Audio file for ${label} not found in mapping.`);
        return;
      }
      try {
        const { sound } = await loadWithTimeout(Audio.Sound.createAsync(mod), 5000, label);
        ref.current = sound;
        console.log(`Loaded ${label} sound (${getFileName(label)})`);
      } catch (error) {
        console.log(`Audio loading error (${label}):`, error);
      }
    };
    await tryLoad('hit', hitSound);
    await tryLoad('miss', missSound);
    await tryLoad('combo', comboSound);
    await tryLoad('bell', bellSound);
    await tryLoad('punch', punchSound);
    await tryLoad('main theme', mainThemeSound);
    setLoadingSoundName(null);
    setIsLoading(false);
  };

  const unloadAudio = async () => {
    if (hitSound.current) await hitSound.current.unloadAsync();
    if (missSound.current) await missSound.current.unloadAsync();
    if (comboSound.current) await comboSound.current.unloadAsync();
    if (bellSound.current) await bellSound.current.unloadAsync();
    if (punchSound.current) await punchSound.current.unloadAsync();
    if (mainThemeSound.current) await mainThemeSound.current.unloadAsync();
  };

  const playSound = async (
    soundRef: React.MutableRefObject<Audio.Sound | null>,
    soundName: string
  ) => {
    if (!soundEnabled) {
      console.log(`${soundName} disabled`);
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(volume);
        await soundRef.current.replayAsync();
        console.log(`Playing ${soundName}`);
      } else {
        console.log(`${soundName} not loaded`);
      }
    } catch (error) {
      console.log(`${soundName} play error:`, error);
    }
  };

  const pauseSound = async (
    soundRef: React.MutableRefObject<Audio.Sound | null>,
    soundName: string
  ) => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        console.log(`Paused ${soundName}`);
      } else {
        console.log(`${soundName} not loaded`);
      }
    } catch (error) {
      console.log(`${soundName} pause error:`, error);
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy', hapticName: string) => {
    if (!hapticsEnabled) {
      console.log(`${hapticName} disabled`);
      return;
    }

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
      console.log(`Triggered ${hapticName}`);
    } catch (error) {
      console.log(`${hapticName} error:`, error);
    }
  };

  const testAllAudio = async () => {
    console.log('=== Testing All Audio ===');

    // Test sounds
    await playSound(hitSound, 'Hit Sound');
    await new Promise(resolve => setTimeout(resolve, 500));
    await playSound(missSound, 'Miss Sound');
    await new Promise(resolve => setTimeout(resolve, 500));
    await playSound(comboSound, 'Combo Sound');

    // Test haptics
    await new Promise(resolve => setTimeout(resolve, 500));
    triggerHaptic('light', 'Light Haptic');
    await new Promise(resolve => setTimeout(resolve, 300));
    triggerHaptic('medium', 'Medium Haptic');
    await new Promise(resolve => setTimeout(resolve, 300));
    triggerHaptic('heavy', 'Heavy Haptic');

    console.log('=== Audio Test Complete ===');
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  // Helper to stop a sound
  const stopSound = async (
    soundRef: React.MutableRefObject<Audio.Sound | null>,
    soundName: string
  ) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        console.log(`Stopped ${soundName}`);
      } else {
        console.log(`${soundName} not loaded`);
      }
    } catch (error) {
      console.log(`${soundName} stop error:`, error);
    }
  };

  // Helper to get file name from mapping
  const getFileName = (label: string) => {
    const mod = audioFiles[label];
    if (!mod) return '';
    // Try to extract file name from the module (works in Expo/Metro)
    if (typeof mod === 'number') return label + '.mp3'; // fallback
    if (mod.uri) return mod.uri.split('/').pop();
    if (mod.default && mod.default.split) return mod.default.split('/').pop();
    return label + '.mp3';
  };

  // Helper to toggle label/file name
  const toggleShowFileName = (label: string) => {
    setShowFileNames(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToMenu}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audio Debug</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text
              style={[styles.statusValue, isLoading ? styles.statusError : styles.statusSuccess]}
            >
              {isLoading
                ? `Loading...${loadingSoundName ? ` (${loadingSoundName})` : ''}`
                : 'Ready'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Hit Sound:</Text>
            <Text
              style={[
                styles.statusValue,
                hitSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {hitSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Miss Sound:</Text>
            <Text
              style={[
                styles.statusValue,
                missSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {missSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Combo Sound:</Text>
            <Text
              style={[
                styles.statusValue,
                comboSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {comboSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Bell Sound:</Text>
            <Text
              style={[
                styles.statusValue,
                bellSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {bellSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Punch Sound:</Text>
            <Text
              style={[
                styles.statusValue,
                punchSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {punchSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Main Theme:</Text>
            <Text
              style={[
                styles.statusValue,
                mainThemeSound.current ? styles.statusSuccess : styles.statusError,
              ]}
            >
              {mainThemeSound.current ? 'Loaded' : 'Not Loaded'}
            </Text>
          </View>
        </View>

        {/* Test all sounds/music - SFX */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test SFX</Text>
          {(
            [
              ['Hit', 'hit', hitSound],
              ['Miss', 'miss', missSound],
              ['Combo', 'combo', comboSound],
              ['Bell', 'bell', bellSound],
              ['Punch', 'punch', punchSound],
            ] as [string, string, React.MutableRefObject<Audio.Sound | null>][]
          ).map(([label, key, ref]) => (
            <View
              key={key}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
            >
              <TouchableOpacity
                style={[styles.testButton, styles.flexButton]}
                onPress={() => toggleShowFileName(key)}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText} numberOfLines={1} ellipsizeMode="tail">
                  {showFileNames[key] ? getFileName(key) : label}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconOnlyButton}
                onPress={() => playSound(ref, `${label} Sound`)}
                disabled={isLoading || !ref.current}
              >
                <Text style={styles.iconText}>▶️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconOnlyButton, styles.stopButton]}
                onPress={() => stopSound(ref, `${label} Sound`)}
                disabled={isLoading || !ref.current}
              >
                <Text style={styles.iconText}>⏹️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Test all sounds/music - Music */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Music</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.testButton, styles.flexButton]}
              onPress={() => toggleShowFileName('main theme')}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText} numberOfLines={1} ellipsizeMode="tail">
                {showFileNames['main theme'] ? getFileName('main theme') : 'Main Theme'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconOnlyButton}
              onPress={() => playSound(mainThemeSound, 'Main Theme')}
              disabled={isLoading || !mainThemeSound.current}
            >
              <Text style={styles.iconText}>▶️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconOnlyButton, styles.stopButton]}
              onPress={() => stopSound(mainThemeSound, 'Main Theme')}
              disabled={isLoading || !mainThemeSound.current}
            >
              <Text style={styles.iconText}>⏹️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Haptic Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Haptics</Text>

          <TouchableOpacity
            style={styles.hapticButton}
            onPress={() => triggerHaptic('light', 'Light Haptic')}
          >
            <Text style={styles.hapticButtonText}>Light Haptic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hapticButton}
            onPress={() => triggerHaptic('medium', 'Medium Haptic')}
          >
            <Text style={styles.hapticButtonText}>Medium Haptic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hapticButton}
            onPress={() => triggerHaptic('heavy', 'Heavy Haptic')}
          >
            <Text style={styles.hapticButtonText}>Heavy Haptic</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            {`
• Tap the left button to toggle between the sound label and file name
• Use ▶️ to play and ⏹️ to stop each sound or music
• Test haptic feedback with the buttons below
• Check the status section above for which sounds are loaded
• Check the console for detailed feedback and errors
• Make sure your device volume is turned up
            `}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
  },
  backButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    color: '#ff8800',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusLabel: {
    color: 'white',
    fontSize: 16,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusSuccess: {
    color: '#00ff00',
  },
  statusError: {
    color: '#ff0000',
  },
  testButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hapticButton: {
    backgroundColor: '#ff8800',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff00ff',
  },
  hapticButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  flexButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: 0,
    marginLeft: 0,
    paddingHorizontal: 16,
    minWidth: 0,
  },
  iconOnlyButton: {
    width: 44,
    height: 44,
    backgroundColor: '#ff00ff',
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffff',
    paddingHorizontal: 0,
  },
  stopButton: {
    backgroundColor: '#888',
    borderColor: '#888',
  },
  iconText: {
    fontSize: 20,
    marginLeft: 2,
    marginRight: 2,
  },
});

export default AudioDebugScreen;
