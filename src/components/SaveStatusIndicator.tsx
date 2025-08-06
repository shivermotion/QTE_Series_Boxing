import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useGameSave } from '../hooks/useGameSave';

interface SaveStatusIndicatorProps {
  showDetails?: boolean;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ showDetails = false }) => {
  const { getSaveStatus, manualSave, gameState } = useGameSave();
  const [saveStatus, setSaveStatus] = useState(getSaveStatus());
  const [isSaving, setIsSaving] = useState(false);

  // Update save status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSaveStatus(getSaveStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, [getSaveStatus]);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const success = await manualSave('autosave');
      if (success) {
        setSaveStatus(getSaveStatus());
        Alert.alert('Success', 'Game saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save game.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (!showDetails) {
    return (
      <View style={styles.container}>
        <View style={[styles.indicator, saveStatus.isRecent ? styles.saved : styles.unsaved]}>
          <Text style={styles.indicatorText}>{saveStatus.isRecent ? '●' : '○'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Save Status:</Text>
        <View style={[styles.indicator, saveStatus.isRecent ? styles.saved : styles.unsaved]}>
          <Text style={styles.indicatorText}>{saveStatus.isRecent ? '●' : '○'}</Text>
        </View>
      </View>

      {saveStatus.lastSave && (
        <Text style={styles.lastSaveText}>Last saved: {formatTimeAgo(saveStatus.lastSave)}</Text>
      )}

      <View style={styles.statsRow}>
        <Text style={styles.statText}>Level: {gameState.currentLevel}</Text>
        <Text style={styles.statText}>Score: {gameState.totalScore.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleManualSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Now'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saved: {
    backgroundColor: '#00ff00',
  },
  unsaved: {
    backgroundColor: '#ff0000',
  },
  indicatorText: {
    fontSize: 8,
    color: '#000000',
    fontWeight: 'bold',
  },
  detailedContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00ffff',
    minWidth: 200,
    zIndex: 1000,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  lastSaveText: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    color: '#ffffff',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SaveStatusIndicator;
