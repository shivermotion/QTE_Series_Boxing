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

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);

  // Load audio on component mount
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  const loadAudio = async () => {
    setIsLoading(true);
    try {
      const { sound: hit } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      hitSound.current = hit;

      // Create placeholder sounds for miss and combo
      const { sound: miss } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      missSound.current = miss;

      const { sound: combo } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      comboSound.current = combo;

      console.log('Audio loaded successfully');
    } catch (error) {
      console.log('Audio loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unloadAudio = async () => {
    if (hitSound.current) await hitSound.current.unloadAsync();
    if (missSound.current) await missSound.current.unloadAsync();
    if (comboSound.current) await comboSound.current.unloadAsync();
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
              {isLoading ? 'Loading...' : 'Ready'}
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
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#767577', true: '#ff00ff' }}
              thumbColor={soundEnabled ? '#00ffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#767577', true: '#ff00ff' }}
              thumbColor={hapticsEnabled ? '#00ffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Volume: {Math.round(volume * 100)}%</Text>
            <View style={styles.volumeContainer}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(volume - 0.1)}
              >
                <Text style={styles.volumeButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => adjustVolume(volume + 0.1)}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Audio</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => playSound(hitSound, 'Hit Sound')}
          >
            <Text style={styles.testButtonText}>Test Hit Sound</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => playSound(missSound, 'Miss Sound')}
          >
            <Text style={styles.testButtonText}>Test Miss Sound</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => playSound(comboSound, 'Combo Sound')}
          >
            <Text style={styles.testButtonText}>Test Combo Sound</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.testAllButton]}
            onPress={testAllAudio}
          >
            <Text style={styles.testButtonText}>Test All Audio</Text>
          </TouchableOpacity>
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
            • Use the switches to enable/disable sound and haptics{'\n'}• Adjust volume with the +/-
            buttons{'\n'}• Test individual sounds and haptics{'\n'}• Use "Test All Audio" to play
            everything in sequence{'\n'}• Check the console for detailed feedback{'\n'}• Make sure
            your device volume is turned up
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
  },
  volumeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  volumeButton: {
    backgroundColor: '#ff00ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  testAllButton: {
    backgroundColor: '#00ff00',
    borderColor: '#ff00ff',
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
});

export default AudioDebugScreen;
