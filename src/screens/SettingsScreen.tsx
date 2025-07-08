import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../contexts/AudioContext';
import { Audio } from 'expo-av';

interface SettingsScreenProps {
  onBackToMenu: () => void;
  onOpenCredits: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackToMenu, onOpenCredits }) => {
  const insets = useSafeAreaInsets();

  const {
    settings,
    updateMasterVolume,
    updateSoundEffectsVolume,
    updateMusicVolume,
    toggleAudioEnabled,
    getEffectiveVolume,
  } = useAudio();

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
            onValueChange={updateMasterVolume}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            minimumTrackTintColor="#ff00ff"
            maximumTrackTintColor="#333"
            thumbTintColor="#ff00ff"
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
              onValueChange={updateSoundEffectsVolume}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              minimumTrackTintColor="#00ffff"
              maximumTrackTintColor="#333"
              thumbTintColor="#00ffff"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Music</Text>
            <Text style={styles.volumeValue}>{formatVolume(settings.musicVolume)}</Text>
          </View>
          <Slider
            style={styles.slider}
            value={settings.musicVolume}
            onValueChange={updateMusicVolume}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            minimumTrackTintColor="#ff8800"
            maximumTrackTintColor="#333"
            thumbTintColor="#ff8800"
          />

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Audio Enabled</Text>
            <Switch
              value={settings.audioEnabled}
              onValueChange={toggleAudioEnabled}
              trackColor={{ false: '#767577', true: '#ff00ff' }}
              thumbColor={settings.audioEnabled ? '#00ffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Gameplay Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gameplay</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#767577', true: '#ff00ff' }}
              thumbColor={'#00ffff'}
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
            <Text style={styles.aboutValue}>QTE Series Team</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Inspired by</Text>
            <Text style={styles.aboutValue}>Sega AM2 Classics</Text>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits</Text>
          <Text style={styles.creditsText}>
            Built with React Native & Expo{'\n'}
            Retro gaming inspiration{'\n'}
            Pixel art aesthetic{'\n'}
            Chiptune audio design
          </Text>
          <TouchableOpacity style={styles.watchCreditsButton} onPress={onOpenCredits}>
            <Text style={styles.watchCreditsButtonText}>Watch Credits</Text>
          </TouchableOpacity>
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
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  aboutLabel: {
    color: 'white',
    fontSize: 16,
  },
  aboutValue: {
    color: '#00ffff',
    fontSize: 16,
  },
  creditsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  volumeValue: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  testButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    marginBottom: 15,
  },
  watchCreditsButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 15,
  },
  watchCreditsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
