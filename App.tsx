import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MainMenu from './src/screens/MainMenu';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AudioDebugScreen from './src/screens/AudioDebugScreen';
import UIDebugScreen from './src/screens/UIDebugScreen';
import SplashScreenComponent from './src/screens/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type GameMode = 'arcade' | 'endless';
type Screen = 'splash' | 'menu' | 'game' | 'settings' | 'audioDebug' | 'uiDebug';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [debugMode, setDebugMode] = useState(false);

  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    BOXING: require('./assets/fonts/BOXING.ttf'),
    'BOXING-Striped': require('./assets/fonts/BOXING_striped.ttf'),
  });

  // Handle font loading
  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleSplashFinish = () => {
    setCurrentScreen('menu');
  };

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

        {currentScreen === 'splash' ? (
          <SplashScreenComponent onFinish={handleSplashFinish} />
        ) : currentScreen === 'menu' ? (
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
    backgroundColor: 'black',
  },
});
