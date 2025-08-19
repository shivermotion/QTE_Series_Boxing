import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AudioProvider } from './src/contexts/AudioContext';
import { TransitionProvider } from './src/contexts/TransitionContext';
import { GameProvider } from './src/contexts/GameContext';
import TransitionWrapper from './src/components/TransitionWrapper';
import MainMenu from './src/screens/MainMenu';
import TapToStartScreen from './src/screens/TapToStartScreen';
import ChooseLevelScreen from './src/screens/ChooseLevelScreen';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SaveInfoScreen from './src/screens/SaveInfoScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import AudioDebugScreen from './src/screens/AudioDebugScreen';
import UIDebugScreen from './src/screens/UIDebugScreen';
import SplashScreenComponent from './src/screens/SplashScreen';
import TeaserScreen from './src/screens/TeaserScreen';
import CutsceneScreen from './src/screens/CutsceneScreen';
import GymScreen from './src/screens/GymScreen';
import { cutscenes } from './src/data/cutscenes';
import PlayerDetailsScreen from './src/screens/PlayerDetailsScreen';
import TutorialScreen from './src/screens/TutorialScreen';
import EquipmentScreen from './src/screens/EquipmentScreen';

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
  | 'teaser'
  | 'tapToStart'
  | 'menu'
  | 'chooseLevel'
  | 'cutscene'
  | 'game'
  | 'settings'
  | 'saveInfo'
  | 'credits'
  | 'audioDebug'
  | 'uiDebug'
  | 'gym'
  | 'tutorial'
  | 'equipment'
  | 'playerDetails';

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
    Round8Four: require('./assets/fonts/round-8-font-1754003737-0/round8-four.otf'),
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
    setCurrentScreen('teaser');
  };

  const handleTeaserComplete = () => {
    setCurrentScreen('tapToStart');
  };

  const handleTapToStartComplete = () => {
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

  const handleReturnToTitle = () => {
    setCurrentScreen('tapToStart');
  };

  const handleOpenAudioDebug = () => {
    setCurrentScreen('audioDebug');
  };

  const handleOpenUIDebug = () => {
    setCurrentScreen('uiDebug');
  };

  const handleOpenSaveInfo = () => {
    setCurrentScreen('saveInfo');
  };

  const handleOpenGym = () => {
    setCurrentScreen('gym');
  };

  const handleBackToGym = () => {
    setCurrentScreen('gym');
  };

  const handleNavigateToTutorial = () => {
    setCurrentScreen('tutorial');
  };

  const handleNavigateToEquipment = () => {
    setCurrentScreen('equipment');
  };

  const handleNavigateToPlayerDetails = () => {
    setCurrentScreen('playerDetails');
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <TransitionWrapper>
          {currentScreen === 'splash' ? (
            <SplashScreenComponent onFinish={handleSplashFinish} />
          ) : currentScreen === 'teaser' ? (
            <TeaserScreen onComplete={handleTeaserComplete} />
          ) : currentScreen === 'tapToStart' ? (
            <TapToStartScreen onComplete={handleTapToStartComplete} />
          ) : currentScreen === 'menu' ? (
            <MainMenu
              onStartGame={handleStartGame}
              onOpenSettings={handleOpenSettings}
              onOpenChooseLevel={() => setCurrentScreen('chooseLevel')}
              onOpenGym={handleOpenGym}
              onToggleDebugMode={toggleDebugMode}
              onBackToTitle={handleReturnToTitle}
            />
          ) : currentScreen === 'chooseLevel' ? (
            <ChooseLevelScreen
              onSelectLevel={handleSelectLevel}
              onBack={handleBackFromLevelSelect}
            />
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
            <SettingsScreen
              onBackToMenu={handleBackToMenu}
              onOpenCredits={handleOpenCredits}
              onReturnToTitle={handleReturnToTitle}
              onOpenSaveInfo={handleOpenSaveInfo}
            />
          ) : currentScreen === 'saveInfo' ? (
            <SaveInfoScreen onBack={handleBackToMenu} />
          ) : currentScreen === 'credits' ? (
            <CreditsScreen onBackToMenu={handleBackToMenu} />
          ) : currentScreen === 'audioDebug' ? (
            <AudioDebugScreen onBackToMenu={handleBackToMenu} />
          ) : currentScreen === 'gym' ? (
            <GymScreen
              onBack={handleBackToMenu}
              onNavigateToTutorial={handleNavigateToTutorial}
              onNavigateToEquipment={handleNavigateToEquipment}
              onNavigateToPlayerDetails={handleNavigateToPlayerDetails}
            />
          ) : currentScreen === 'tutorial' ? (
            <TutorialScreen onBack={handleBackToMenu} />
          ) : currentScreen === 'equipment' ? (
            <EquipmentScreen onBack={handleBackToMenu} />
          ) : currentScreen === 'playerDetails' ? (
            <PlayerDetailsScreen onBack={handleBackToGym} />
          ) : (
            <UIDebugScreen onBackToMenu={handleBackToMenu} />
          )}
        </TransitionWrapper>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AudioProvider>
        <TransitionProvider>
          <AppContent />
        </TransitionProvider>
      </AudioProvider>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
