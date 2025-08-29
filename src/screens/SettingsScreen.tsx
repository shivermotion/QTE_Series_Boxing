import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../contexts/AudioContext';
import { useGameSave } from '../hooks/useGameSave';
import { Audio } from 'expo-av';

const colors = {
  background: '#0f172a',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#9ca3af',
  primary: '#3b82f6',
  border: '#334155',
  borderStrong: '#1f2937',
  onPrimary: '#ffffff',
  thumbActive: '#e2e8f0',
  thumbInactive: '#cbd5e1',
};

interface SettingsScreenProps {
  onBackToMenu: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackToMenu }) => {
  const insets = useSafeAreaInsets();

  const {
    settings,
    updateMasterVolume,
    updateSoundEffectsVolume,
    updateMusicVolume,
    toggleAudioEnabled,
    getEffectiveVolume,
  } = useAudio();
  const { handleAudioSettingChange } = useGameSave();

  const bellSoundRef = useRef<Audio.Sound | null>(null);

  const formatVolume = (value: number) => {
    return Math.round(value * 100) + '%';
  };

  const playTestSound = async () => {
    try {
      if (bellSoundRef.current) {
        await bellSoundRef.current.stopAsync();
        await bellSoundRef.current.unloadAsync();
      }

      const bell = new Audio.Sound();
      await bell.loadAsync(require('../../assets/audio/boxing_bell_1.mp3'));
      const effectiveVolume = getEffectiveVolume('sfx');
      await bell.setVolumeAsync(effectiveVolume);
      await bell.playAsync();
      bellSoundRef.current = bell;
    } catch (e) {
      console.log('Error playing test sound:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToMenu}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Master Volume</Text>
            <Text style={styles.volumeValue}>{formatVolume(settings.masterVolume)}</Text>
          </View>
          <Slider
            style={styles.slider}
            value={settings.masterVolume}
            onValueChange={value => {
              updateMasterVolume(value);
              handleAudioSettingChange({ masterVolume: value });
            }}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.thumbActive}
          />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.volumeValue}>{formatVolume(settings.soundEffectsVolume)}</Text>
          </View>
          <TouchableOpacity style={styles.testButton} onPress={playTestSound}>
            <Text style={styles.testButtonText}>Test Sound</Text>
          </TouchableOpacity>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              value={settings.soundEffectsVolume}
              onValueChange={value => {
                updateSoundEffectsVolume(value);
                handleAudioSettingChange({ sfxVolume: value });
              }}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.thumbActive}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Music</Text>
            <Text style={styles.volumeValue}>{formatVolume(settings.musicVolume)}</Text>
          </View>
          <Slider
            style={styles.slider}
            value={settings.musicVolume}
            onValueChange={value => {
              updateMusicVolume(value);
              handleAudioSettingChange({ musicVolume: value });
            }}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.thumbActive}
          />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Audio Enabled</Text>
            <Switch
              value={settings.audioEnabled}
              onValueChange={value => {
                toggleAudioEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.audioEnabled ? colors.thumbActive : colors.thumbInactive}
            />
          </View>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => {
              updateMasterVolume(1.0);
              updateSoundEffectsVolume(0.8);
              updateMusicVolume(0.6);
              toggleAudioEnabled(true);
              handleAudioSettingChange({
                masterVolume: 1.0,
                sfxVolume: 0.8,
                musicVolume: 0.6,
              });
            }}
          >
            <Text style={styles.restoreButtonText}>Restore to Default</Text>
          </TouchableOpacity>
        </View>

        {/* Gameplay Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gameplay</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.thumbActive}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Developer</Text>
            <Text style={styles.aboutValue}>Nexrage Studios</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  aboutValue: {
    color: colors.primary,
    fontSize: 16,
  },
  creditsText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  volumeValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  testButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 15,
  },
  testButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  restoreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 15,
  },
  restoreButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
