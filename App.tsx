import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainMenu from './src/screens/MainMenu';
import GameScreen from './src/components/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type GameMode = 'arcade' | 'endless';
type Screen = 'menu' | 'game' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [debugMode, setDebugMode] = useState(false);

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />

      {currentScreen === 'menu' ? (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenSettings={handleOpenSettings}
          debugMode={debugMode}
          onToggleDebugMode={toggleDebugMode}
        />
      ) : currentScreen === 'game' ? (
        <GameScreen gameMode={gameMode} onBackToMenu={handleBackToMenu} debugMode={debugMode} />
      ) : (
        <SettingsScreen onBackToMenu={handleBackToMenu} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
