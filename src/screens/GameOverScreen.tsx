import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GameOverScreenProps {
  finalScore: number;
  gameMode: 'arcade' | 'endless';
  onRestart: () => void;
  onBackToMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  finalScore,
  gameMode,
  onRestart,
  onBackToMenu,
}) => {
  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
  };

  const getGameModeText = (mode: string): string => {
    switch (mode) {
      case 'arcade':
        return 'Arcade Mode';
      case 'endless':
        return 'Endless Mode';
      default:
        return 'Game';
    }
  };

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <View style={styles.overlay} />

      {/* Game Over Panel */}
      <View style={styles.panel}>
        <Text style={styles.gameOverText}>GAME OVER</Text>

        <View style={styles.scoreContainer}>
          <Text style={styles.modeText}>{getGameModeText(gameMode)}</Text>
          <Text style={styles.scoreText}>Final Score</Text>
          <Text style={styles.finalScore}>{formatScore(finalScore)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onRestart}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.menuButton]} onPress={onBackToMenu}>
            <Text style={styles.buttonText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  panel: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ffff',
    minWidth: 300,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modeText: {
    fontSize: 18,
    color: '#ff8800',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 5,
  },
  finalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
  },
  button: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    alignItems: 'center',
  },
  menuButton: {
    backgroundColor: '#ff8800',
    borderColor: '#ff00ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameOverScreen;
