import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AudioProvider } from './src/contexts/AudioContext';
import MainMenu from './src/screens/MainMenu';
import ChooseLevelScreen from './src/screens/ChooseLevelScreen';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import AudioDebugScreen from './src/screens/AudioDebugScreen';
import UIDebugScreen from './src/screens/UIDebugScreen';
import Model3DScreen from './src/screens/Model3DScreen';
import SplashScreenComponent from './src/screens/SplashScreen';
import CutsceneScreen from './src/screens/CutsceneScreen';
import { cutscenes } from './src/data/cutscenes';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// TODO: Remove once react-native-reanimated publishes React 19 compatible release.
LogBox.ignoreLogs([
  'useInsertionEffect must not schedule updates',
  'Tried to modify key `current`',
]);

type GameMode = 'arcade' | 'endless';
type Screen =
  | 'splash'
  | 'menu'
  | 'chooseLevel'
  | 'cutscene'
  | 'game'
  | 'settings'
  | 'credits'
  | 'audioDebug'
  | 'uiDebug'
  | 'model3d';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [debugMode, setDebugMode] = useState(false);

  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    BOXING: require('./assets/fonts/boxing/BOXING.ttf'),
    'BOXING-Striped': require('./assets/fonts/boxing/BOXING_striped.ttf'),
    DigitalStrip: require('./assets/fonts/digital_strip/digistrip.ttf'),
    'Round8-Four': require('./assets/fonts/round-8-font-1754003737-0/round8-four.otf'),
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
    if (mode === 'arcade') {
      setCurrentScreen('chooseLevel');
    } else {
      setCurrentScreen('game');
    }
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    setCurrentScreen('cutscene');
  };

  const handleCutsceneFinish = () => {
    setCurrentScreen('game');
  };

  const handleBackFromLevelSelect = () => {
    setCurrentScreen('menu');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleOpenCredits = () => {
    setCurrentScreen('credits');
  };

  const handleOpenAudioDebug = () => {
    setCurrentScreen('audioDebug');
  };

  const handleOpenUIDebug = () => {
    setCurrentScreen('uiDebug');
  };

  const handleOpenModel3D = () => {
    setCurrentScreen('model3d');
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
            onOpenModel3D={handleOpenModel3D}
            debugMode={debugMode}
            onToggleDebugMode={toggleDebugMode}
          />
        ) : currentScreen === 'chooseLevel' ? (
          <ChooseLevelScreen onSelectLevel={handleSelectLevel} onBack={handleBackFromLevelSelect} />
        ) : currentScreen === 'cutscene' ? (
          <CutsceneScreen
            images={(cutscenes as any)[`level${selectedLevel}`]?.cutscene || []}
            onFinish={handleCutsceneFinish}
          />
        ) : currentScreen === 'game' ? (
          <GameScreen
            gameMode={gameMode}
            selectedLevel={selectedLevel}
            onBackToMenu={handleBackToMenu}
            onChooseLevel={() => setCurrentScreen('chooseLevel')}
            debugMode={debugMode}
          />
        ) : currentScreen === 'settings' ? (
          <SettingsScreen onBackToMenu={handleBackToMenu} onOpenCredits={handleOpenCredits} />
        ) : currentScreen === 'credits' ? (
          <CreditsScreen onBackToMenu={handleBackToMenu} />
        ) : currentScreen === 'audioDebug' ? (
          <AudioDebugScreen onBackToMenu={handleBackToMenu} />
        ) : currentScreen === 'uiDebug' ? (
          <UIDebugScreen onBackToMenu={handleBackToMenu} />
        ) : currentScreen === 'model3d' ? (
          <Model3DScreen onBackToMenu={handleBackToMenu} fontsLoaded={fontsLoaded} />
        ) : null}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
