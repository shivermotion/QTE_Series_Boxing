import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useGameSave } from '../hooks/useGameSave';
import { saveManager } from '../utils/saveManager';
import { SaveEvent } from '../types/gameState';

interface SaveInfoScreenProps {
  onBack: () => void;
}

interface StorageInfo {
  totalSize: number;
  itemCount: number;
}

const SaveInfoScreen: React.FC<SaveInfoScreenProps> = ({ onBack }) => {
  const { gameState, getSaveStatus, manualSave, exportSaveData, clearGameData } = useGameSave();
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [saveEvents, setSaveEvents] = useState<SaveEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaveInfo = useCallback(async () => {
    if (isLoading || refreshing) return;

    try {
      const info = await saveManager.getStorageInfo();
      setStorageInfo(info);

      const events = saveManager.getSaveEvents();
      setSaveEvents(events);
    } catch (error) {
      console.error('Failed to load save info:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isLoading, refreshing]);

  useEffect(() => {
    loadSaveInfo();
    // Refresh save info every 5 seconds (only in development for debugging)
    const interval = __DEV__ ? setInterval(loadSaveInfo, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadSaveInfo]);

  const handleManualSave = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous saves

    setIsLoading(true);
    try {
      await manualSave('manual');
      Alert.alert('Success', 'Game saved successfully!');
      await loadSaveInfo(); // Refresh the data
    } catch (error) {
      console.error('Manual save error:', error);
      Alert.alert('Error', 'Failed to save game');
    } finally {
      setIsLoading(false);
    }
  }, [manualSave, loadSaveInfo, isLoading]);

  const handleExportSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const saveData = await exportSaveData();
      const sizeInKB = Math.round(saveData.length / 1024);
      Alert.alert(
        'Export Success',
        `Save data exported successfully!\n\nData size: ${sizeInKB}KB`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // TODO: Implement clipboard functionality
              console.log('Copy to clipboard not yet implemented');
            },
          },
          { text: 'OK', style: 'default' },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export save data');
    } finally {
      setIsLoading(false);
    }
  }, [exportSaveData, isLoading]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete all your game progress, settings, and statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            if (isLoading) return;

            setIsLoading(true);
            try {
              await clearGameData();
              Alert.alert('Success', 'All game data has been cleared');
              await loadSaveInfo(); // Refresh the data
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Error', 'Failed to clear game data');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [clearGameData, loadSaveInfo, isLoading]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Never';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  };

  const getSaveStatusColor = (isRecent: boolean | undefined) => {
    return isRecent ? '#4CAF50' : '#FF9800';
  };

  const formatTimeSince = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const formatPlayTime = (totalSeconds: number) => {
    if (totalSeconds === 0) return '0s';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  const saveStatus = getSaveStatus();

  // Remove debug log in production
  if (__DEV__) {
    console.log('GameState debug:', {
      lastSaved: gameState.lastSaved,
      currentLevel: gameState.currentLevel,
      totalScore: gameState.totalScore,
      gamesPlayed: gameState.gamesPlayed,
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Save Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSaveInfo();
            }}
            tintColor="#ffffff"
            colors={['#4CAF50']}
          />
        }
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Save Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Save Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getSaveStatusColor(saveStatus.isRecent || false) },
                ]}
              >
                <Text style={styles.statusText}>
                  {saveStatus.hasData
                    ? saveStatus.isRecent
                      ? 'Recently Saved'
                      : 'Saved'
                    : 'No Save Data'}
                </Text>
              </View>
            </View>

            {saveStatus.lastSave && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Save:</Text>
                <Text style={styles.statusValue}>{formatDate(saveStatus.lastSave)}</Text>
              </View>
            )}

            {saveStatus.timeSinceLastSave !== null && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Time Since Save:</Text>
                <Text style={styles.statusValue}>
                  {formatTimeSince(saveStatus.timeSinceLastSave)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Game Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Game Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Current Level:</Text>
              <Text style={styles.progressValue}>{gameState.currentLevel}</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Highest Level:</Text>
              <Text style={styles.progressValue}>{gameState.highestLevelUnlocked}</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Total Score:</Text>
              <Text style={styles.progressValue}>{gameState.totalScore.toLocaleString()}</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Games Played:</Text>
              <Text style={styles.progressValue}>{gameState.gamesPlayed}</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Games Won:</Text>
              <Text style={styles.progressValue}>{gameState.gamesWon}</Text>
            </View>
            {gameState.gamesPlayed > 0 && (
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Win Rate:</Text>
                <Text style={styles.progressValue}>
                  {Math.round((gameState.gamesWon / gameState.gamesPlayed) * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Punches:</Text>
              <Text style={styles.statsValue}>
                {gameState.statistics.totalPunches.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Misses:</Text>
              <Text style={styles.statsValue}>
                {gameState.statistics.totalMisses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Best Combo:</Text>
              <Text style={styles.statsValue}>{gameState.statistics.bestCombo}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Fastest Win:</Text>
              <Text style={styles.statsValue}>{gameState.statistics.fastestWin}s</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Play Time:</Text>
              <Text style={styles.statsValue}>
                {formatPlayTime(gameState.statistics.totalPlayTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Information */}
        {storageInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Storage Information</Text>
            <View style={styles.storageCard}>
              <View style={styles.storageRow}>
                <Text style={styles.storageLabel}>Total Size:</Text>
                <Text style={styles.storageValue}>{formatBytes(storageInfo.totalSize)}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text style={styles.storageLabel}>Items Stored:</Text>
                <Text style={styles.storageValue}>{storageInfo.itemCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Save Events */}
        {saveEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Recent Save Events</Text>
            <View style={styles.eventsCard}>
              {saveEvents
                .slice(-5)
                .reverse()
                .map((event, index) => (
                  <View key={index} style={styles.eventRow}>
                    <Text style={styles.eventType}>{event.type}</Text>
                    <Text style={styles.eventTime}>{formatDate(event.timestamp)}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Save Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.disabledButton]}
              onPress={handleManualSave}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>💾 Manual Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.disabledButton]}
              onPress={handleExportSave}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>📤 Export Save Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, isLoading && styles.disabledButton]}
              onPress={handleClearData}
              disabled={isLoading}
            >
              <Text style={styles.dangerButtonText}>🗑️ Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#16213e',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
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
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#cccccc',
    fontSize: 16,
  },
  statusValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#cccccc',
    fontSize: 16,
  },
  progressValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsLabel: {
    color: '#cccccc',
    fontSize: 16,
  },
  statsValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  storageCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageLabel: {
    color: '#cccccc',
    fontSize: 16,
  },
  storageValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventTime: {
    color: '#cccccc',
    fontSize: 14,
  },
  actionsCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default SaveInfoScreen;
