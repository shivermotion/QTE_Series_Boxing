import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainMenu from './src/screens/MainMenu';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AudioDebugScreen from './src/screens/AudioDebugScreen';
import UIDebugScreen from './src/screens/UIDebugScreen';

type GameMode = 'arcade' | 'endless';
type Screen = 'menu' | 'game' | 'settings' | 'audioDebug' | 'uiDebug';

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

  const handleOpenAudioDebug = () => {
    setCurrentScreen('audioDebug');
  };

  const handleOpenUIDebug = () => {
    setCurrentScreen('uiDebug');
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />

        {currentScreen === 'menu' ? (
          <MainMenu
            onStartGame={handleStartGame}
            onOpenSettings={handleOpenSettings}
            onOpenAudioDebug={handleOpenAudioDebug}
            onOpenUIDebug={handleOpenUIDebug}
            debugMode={debugMode}
            onToggleDebugMode={toggleDebugMode}
          />
        ) : currentScreen === 'game' ? (
          <GameScreen gameMode={gameMode} onBackToMenu={handleBackToMenu} debugMode={debugMode} />
        ) : currentScreen === 'settings' ? (
          <SettingsScreen onBackToMenu={handleBackToMenu} />
        ) : currentScreen === 'audioDebug' ? (
          <AudioDebugScreen onBackToMenu={handleBackToMenu} />
        ) : (
          <UIDebugScreen onBackToMenu={handleBackToMenu} />
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
