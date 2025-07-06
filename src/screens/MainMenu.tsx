import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MainMenuProps {
  onStartGame: (mode: 'arcade' | 'endless') => void;
  onOpenSettings: () => void;
  debugMode: boolean;
  onToggleDebugMode: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  debugMode,
  onToggleDebugMode,
}) => {
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background} />

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>QTE Series</Text>
        <Text style={styles.subtitle}>Boxing</Text>
      </View>

      {/* Menu buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.button} onPress={() => onStartGame('arcade')}>
          <Text style={styles.buttonText}>Arcade Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => onStartGame('endless')}>
          <Text style={styles.buttonText}>Endless</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.settingsButton]} onPress={onOpenSettings}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        {/* Debug Mode Toggle */}
        <TouchableOpacity
          style={[styles.button, styles.debugButton, debugMode && styles.debugButtonActive]}
          onPress={onToggleDebugMode}
        >
          <Text style={styles.buttonText}>{debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to Play:</Text>
        <Text style={styles.instruction}>• Tap to hit targets in the hit zone</Text>
        <Text style={styles.instruction}>• Swipe up for power hits</Text>
        <Text style={styles.instruction}>• Perfect timing = more points</Text>
        <Text style={styles.instruction}>• Don't let targets pass the line!</Text>
        {debugMode && (
          <Text style={styles.debugInstruction}>• Debug mode shows hit zones and game info</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textAlign: 'center',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff8800',
    textAlign: 'center',
    marginTop: 10,
  },
  menuContainer: {
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#ff8800',
    borderColor: '#ff00ff',
  },
  debugButton: {
    backgroundColor: '#00ff00',
    borderColor: '#ff00ff',
  },
  debugButtonActive: {
    backgroundColor: '#ff0000',
    borderColor: '#ffff00',
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  instructionsTitle: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  debugInstruction: {
    color: '#00ff00',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MainMenu;
