import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';

interface PlayerDetailsScreenProps {
  onBack: () => void;
}

const PlayerDetailsScreen: React.FC<PlayerDetailsScreenProps> = ({ onBack }) => {
  const { gameState } = useGame();

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>player details</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Score</Text>
            <Text style={styles.value}>{gameState.totalScore}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Gems</Text>
            <Text style={styles.value}>{gameState.gems}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Highest Level</Text>
            <Text style={styles.value}>{gameState.highestLevelUnlocked}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Games</Text>
            <Text style={styles.value}>
              {gameState.gamesWon}/{gameState.gamesPlayed} won
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Play Time</Text>
            <Text style={styles.value}>{formatSeconds(gameState.statistics.totalPlayTime)}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Best Combo</Text>
            <Text style={styles.value}>{gameState.statistics.bestCombo}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Punches</Text>
            <Text style={styles.value}>{gameState.statistics.totalPunches}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Misses</Text>
            <Text style={styles.value}>{gameState.statistics.totalMisses}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Rounds</Text>
            <Text style={styles.value}>{gameState.statistics.roundsCompleted}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Continues</Text>
            <Text style={styles.value}>{gameState.statistics.continuesUsed}</Text>
          </View>
        </View>

        {/* Audio details intentionally omitted */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meta</Text>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Achievements</Text>
            <Text style={styles.value}>{gameState.achievements.length}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Characters</Text>
            <Text style={styles.value}>{gameState.unlockedCharacters.length}</Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Last Save</Text>
            <Text style={styles.value}>
              {gameState.lastSaved ? new Date(gameState.lastSaved).toLocaleString() : '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Image
              source={require('../../assets/ui/Asset_27.png')}
              style={styles.rowAccent}
              resizeMode="cover"
            />
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>{gameState.gameVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  backText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Round8Four',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    overflow: 'hidden',
    borderRadius: 8,
  },
  rowAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
  },
  value: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlayerDetailsScreen;
