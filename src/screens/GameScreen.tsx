import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

// Types and interfaces
import { GameScreenProps } from '../types/game';

// Hooks
import { useGameAudio } from '../hooks/useGameAudio';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameSave } from '../hooks/useGameSave';
import { useGame } from '../contexts/GameContext';

// Components
import GameOverScreen from './GameOverScreen';
import PostLevelScreen from './PostLevelScreen';
import GameHUD from '../components/GameHUD';
import GameInputArea from '../components/GameInputArea';
import PreRoundDisplay from '../components/PreRoundDisplay';
import CooldownDisplay from '../components/CooldownDisplay';
import SuperModeOverlay from '../components/SuperModeOverlay';
import SuperComboInput from '../components/SuperComboInput';
import SaveStatusIndicator from '../components/SaveStatusIndicator';

// Data
import { getLevelConfig, getRoundHPGoal, getRandomPromptInterval } from '../data/gameConfig';

// Asset imports
import neutralImg from '../../assets/avatar/neutral.jpg';
import shockedImg from '../../assets/avatar/shocked.jpg';
import revvedImg from '../../assets/avatar/revved.jpg';
import eyesClosedImg from '../../assets/avatar/eyes_closed.jpg';
import elatedImg from '../../assets/avatar/elated.jpg';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  selectedLevel = 1,
  onBackToMenu,
  onChooseLevel,
  debugMode: _debugMode,
}) => {
  // const levelConfig = getLevelConfig(selectedLevel);

  // Temporary switch: disable prompt spawning while working on UI
  const DISABLE_PROMPTS_FOR_UI = true;

  // Background video per story level (arcade). Uses static requires.
  const getLevelVideoSource = (level: number) => {
    switch (level) {
      case 1:
        return require('../../assets/video/henry.mp4');
      case 2:
        return require('../../assets/video/cyborg_boxer.mp4');
      case 3:
        return require('../../assets/video/rigoberto_hazuki.mp4');
      case 4:
        return require('../../assets/video/oronzo_hazuki.mp4');
      case 5:
        return require('../../assets/video/moai_man.mp4');
      case 6:
        return require('../../assets/video/cat.mp4');
      case 7:
        return require('../../assets/video/ms_nozomi.mp4');
      case 8:
        return require('../../assets/video/gus_yamato.mp4');
      case 9:
        return require('../../assets/video/cyborg_boxer.mp4');
      case 10:
        return require('../../assets/video/king.mp4');
      default:
        return require('../../assets/video/boxing_ring.mp4');
    }
  };

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { playGameSound, audioRefs } = useGameAudio();

  // Add save system integration
  const { handlePunch, handleLevelComplete } = useGameSave();

  const gameLogic = useGameLogic(
    selectedLevel,
    () => {
      playGameSound(audioRefs.qteFailureSound);
    },
    () => {
      playGameSound(audioRefs.qteSuccessSound);
      // Track punch statistics
      handlePunch();
    },
    () => {
      screenShake();
      animateMissX();
    },
    gameMode
  );

  const { gameState: persisted } = useGame();

  // Effect to save when level is completed
  useEffect(() => {
    if (gameLogic?.isPostLevel) {
      handleLevelComplete(selectedLevel, gameLogic.gameState.score);
    }
  }, [gameLogic?.isPostLevel, selectedLevel, gameLogic?.gameState?.score, handleLevelComplete]);

  // ============================================================================
  // ANIMATION VALUES
  // ============================================================================

  const screenShakeAnim = useSharedValue(0);
  const avatarScaleAnim = useSharedValue(1);
  const missXScaleAnim = useSharedValue(0);
  const missXOpacityAnim = useSharedValue(0);

  // ============================================================================
  // ANIMATED STYLES
  // ============================================================================

  const screenShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenShakeAnim.value }],
  }));

  const avatarScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScaleAnim.value }],
  }));

  const missXStyle = useAnimatedStyle(() => ({
    transform: [{ scale: missXScaleAnim.value }],
    opacity: missXOpacityAnim.value,
  }));

  // 3D model rendering removed; feedback handled via HUD and UI animations

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const screenShake = () => {
    screenShakeAnim.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // const animateAvatar = () => {
  //   avatarScaleAnim.value = withSequence(
  //     withTiming(1.2, { duration: 150 }),
  //     withTiming(1, { duration: 150 })
  //   );
  // };

  const animateMissX = () => {
    missXScaleAnim.value = 0;
    missXOpacityAnim.value = 0;
    missXScaleAnim.value = withTiming(1, { duration: 300 });
    missXOpacityAnim.value = withTiming(1, { duration: 200 });
  };

  const getAvatarImage = (state: 'idle' | 'success' | 'failure' | 'perfect') => {
    if (gameLogic.isBlinking) return eyesClosedImg;

    switch (state) {
      case 'success':
        return elatedImg;
      case 'failure':
        return shockedImg;
      case 'perfect':
        return revvedImg;
      default:
        return neutralImg;
    }
  };

  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================

  // const handleTap = () => {
  //   const now = Date.now();
  //   const timeSinceLastTap = now - gameLogic.lastTapTime;
  //   if (timeSinceLastTap < 300) {
  //     gameLogic.setTapCount(0);
  //     gameLogic.setLastTapTime(0);
  //   } else {
  //     gameLogic.setTapCount(1);
  //     gameLogic.setLastTapTime(now);
  //     if (gameLogic.gameState.isSuperComboActive) {
  //       gameLogic.processSuperComboInput('swipe', 'up');
  //     }
  //   }
  // };

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameLogic.gameState.isSuperComboActive) {
      gameLogic.processSuperComboInput('swipe', direction);
    } else {
      gameLogic.processInput('swipe', direction);
    }
  };

  const handleGridTap = (gridPosition: number) => {
    // Delegate all tap prompt handling to the game logic hook
    gameLogic.processTapPrompt(gridPosition);
  };

  // ============================================================================
  // GAME LOOP - Simplified (prompt spawning only)
  // ============================================================================

  useEffect(() => {
    if (DISABLE_PROMPTS_FOR_UI) return; // Skip spawning while UI work is in progress
    if (gameLogic.gameState.isPaused || gameLogic.isGameOver || gameLogic.isPreRound) return;

    const gameLoop = () => {
      const now = Date.now();

      // Only spawn new prompts when no prompts are active and not in cooldown
      const hasActivePrompts =
        gameLogic.currentPrompt?.isActive ||
        gameLogic.activeTapPrompts.some(p => p.isActive && !p.isCompleted) ||
        gameLogic.activeTimingPrompts.some(p => p.isActive && !p.isCompleted);

      if (
        !hasActivePrompts &&
        !gameLogic.gameState.isSuperComboActive &&
        (now - gameLogic.lastPromptTime > gameLogic.promptInterval ||
          gameLogic.lastPromptTime === 0) &&
        !gameLogic.isPreRound &&
        !gameLogic.isInCooldown &&
        gameLogic.activeTimingPrompts.length === 0 // Also check timing prompts
      ) {
        gameLogic.spawnPrompt();
        gameLogic.setLastPromptTime(now);
      }
    };

    gameLogic.gameLoopRef.current = setInterval(gameLoop, 16);

    return () => {
      if (gameLogic.gameLoopRef.current) {
        clearInterval(gameLogic.gameLoopRef.current);
      }
    };
  }, [
    gameLogic.currentPrompt,
    gameLogic.activeTapPrompts,
    gameLogic.gameState.isPaused,
    gameLogic.isGameOver,
    gameLogic.isPreRound,
    gameLogic.lastPromptTime,
    gameLogic.promptInterval,
    gameLogic.gameState.isSuperComboActive,
    gameLogic.isInCooldown,
  ]);

  // ============================================================================
  // AUTO-MISS TIMER - REMOVED (now handled in useGameLogic hook)
  // ============================================================================

  // ============================================================================
  // PARTICLE AND FEEDBACK TEXT CLEANUP
  // ============================================================================

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      gameLogic.setParticles(prev =>
        prev.filter(p => p.life > 0).map(p => ({ ...p, life: p.life - 0.02 }))
      );
      gameLogic.setFeedbackTexts(prev =>
        prev.filter(f => f.life > 0).map(f => ({ ...f, life: f.life - 0.02 }))
      );
    }, 16);

    return () => clearInterval(cleanupInterval);
  }, []);

  // ============================================================================
  // PRE-ROUND HANDLING
  // ============================================================================

  const handlePreRoundComplete = () => {
    gameLogic.setIsPreRound(false);
    gameLogic.setGameState(prev => ({ ...prev, isPaused: false }));
  };

  const handleSuperModeVideoEnd = () => {
    gameLogic.endSuperMode();
  };

  // Super combo complete (no 3D finisher)
  const handleSuperComboCompleteWithFinisher = (superMove: any) => {
    gameLogic.handleSuperComboComplete(superMove);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (gameLogic.isGameOver) {
    return (
      <GameOverScreen
        finalScore={gameLogic.gameState.score}
        gameMode={gameMode}
        onRestart={() => {
          const restartLevelConfig = getLevelConfig(selectedLevel);
          gameLogic.setGameState({
            score: 0,
            lives: 3,
            opponentHP: restartLevelConfig.hp,
            currentRound: 1,
            roundHPGoal: getRoundHPGoal(restartLevelConfig, 1),
            superMeter: 0,
            isSuperComboActive: false,
            isSuperModeActive: false,
            avatarState: 'idle',
            isPaused: true, // Start paused for pre-round
            gameTime: 0,
            level: selectedLevel,
          });
          gameLogic.setIsGameOver(false);
          gameLogic.setCurrentPrompt(null);
          gameLogic.setSuperComboSequence([]);
          gameLogic.setSuperComboIndex(0);
          gameLogic.setActiveTapPrompts([]);
          gameLogic.setActiveTimingPrompts([]);
          gameLogic.setLastPromptTime(0);
          gameLogic.setPromptInterval(getRandomPromptInterval(restartLevelConfig, 1));

          // Reset UI states
          gameLogic.setIsPreRound(true);
          gameLogic.setPreRoundText('ROUND 1');
          gameLogic.setIsCooldown(false);
          gameLogic.setCooldownTime(5);
          gameLogic.setCooldownText('COOL DOWN');
          gameLogic.setIsInCooldown(false);
          gameLogic.setShowMissAnimation(false);
          gameLogic.setParticles([]);
          gameLogic.setFeedbackTexts([]);
        }}
        onBackToMenu={onBackToMenu}
        onContinueWithGem={() => {
          const success = gameLogic.continueWithGem();
          if (success) {
            // The game logic will handle the cooldown and state restoration
            console.log('Continued with gem successfully');
          } else {
            console.log('Failed to continue with gem - no gems or no saved state');
          }
        }}
        gemsAvailable={persisted.gems}
        audioRefs={audioRefs}
      />
    );
  }

  if (gameLogic.isPostLevel) {
    return (
      <PostLevelScreen
        level={gameLogic.gameState.level}
        score={gameLogic.gameState.score}
        onChooseLevel={() => {
          gameLogic.returnToMenu();
          if (onChooseLevel) {
            onChooseLevel();
          }
        }}
        onReturnToMenu={() => {
          gameLogic.returnToMenu();
          onBackToMenu();
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[styles.container, screenShakeStyle]}>
        {/* Letterbox background: white with paper texture behind contained video */}
        <View style={styles.whiteBackground} />
        <Image
          source={require('../../assets/transition_screen/paper_texture.png')}
          style={styles.paperTexture}
          resizeMode="cover"
        />
        {/* Background video for Arcade levels (letterboxed with paper) */}
        {gameMode === 'arcade' && (
          <Video
            source={getLevelVideoSource(selectedLevel)}
            style={styles.backgroundVideo}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            resizeMode={ResizeMode.CONTAIN}
          />
        )}
        {/* Game HUD */}
        <GameHUD
          gameState={gameLogic.gameState}
          avatarScaleStyle={avatarScaleStyle}
          getAvatarImage={getAvatarImage}
          onSuperButtonPress={gameLogic.activateSuperMode}
          gameMode={gameMode}
        />

        {/* 3D model areas removed */}

        {/* Game Input Area */}
        <GameInputArea
          currentPrompt={gameLogic.currentPrompt}
          activeTapPrompts={gameLogic.activeTapPrompts}
          activeTimingPrompts={gameLogic.activeTimingPrompts}
          superComboSequence={gameLogic.superComboSequence}
          superComboIndex={gameLogic.superComboIndex}
          gameState={gameLogic.gameState}
          onSwipe={handleSwipe}
          onGridTap={handleGridTap}
          onTimingSuccess={gridPosition => gameLogic.processTimingPrompt(gridPosition, undefined)}
          onTimingMiss={() => gameLogic.handleMiss()}
          getCurrentPausedDuration={gameLogic.getCurrentPausedDuration}
        />

        {/* Particles */}
        {gameLogic.particles.map(particle => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                opacity: particle.life,
              },
            ]}
          />
        ))}

        {/* Feedback Texts */}
        {gameLogic.feedbackTexts.map(feedback => (
          <Text
            key={feedback.id}
            style={[
              styles.feedbackText,
              {
                left: feedback.x,
                top: feedback.y,
                color: feedback.color,
                opacity: feedback.life,
              },
            ]}
          >
            {feedback.text}
          </Text>
        ))}

        {/* Pause Button */}
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => {
            gameLogic.setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
            playGameSound(audioRefs.boxingBell2Sound);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/ui/Asset_28.png')}
            style={styles.pauseButtonImage}
            resizeMode="contain"
          />
          <Text style={styles.pauseButtonOverlayText}>II</Text>
        </TouchableOpacity>

        {/* Pause Overlay */}
        {gameLogic.gameState.isPaused && !gameLogic.isPreRound && !gameLogic.isCooldown && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSED</Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => {
                gameLogic.setGameState(prev => ({ ...prev, isPaused: false }));
                playGameSound(audioRefs.boxingBell1Sound);
              }}
            >
              <Text style={styles.resumeButtonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={onBackToMenu}>
              <Text style={styles.quitButtonText}>QUIT TO MENU</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Miss Animation - Big X */}
        {gameLogic.showMissAnimation && (
          <View style={styles.missAnimationOverlay}>
            <Animated.Text style={[styles.missXText, missXStyle]}>✗</Animated.Text>
          </View>
        )}

        {/* Cooldown Indicator */}
        {gameLogic.isInCooldown && !gameLogic.showMissAnimation && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>...</Text>
          </View>
        )}

        {/* Cooldown Display */}
        <CooldownDisplay
          isCooldown={gameLogic.isCooldown}
          cooldownTime={gameLogic.cooldownTime}
          cooldownText={gameLogic.cooldownText}
        />

        {/* Pre-round Display */}
        <PreRoundDisplay
          isPreRound={gameLogic.isPreRound}
          preRoundText={gameLogic.preRoundText}
          onPreRoundComplete={handlePreRoundComplete}
        />

        {/* Super Mode Overlay (arcade only) */}
        {gameMode === 'arcade' && (
          <SuperModeOverlay
            isActive={gameLogic.gameState.isSuperModeActive}
            onVideoEnd={handleSuperModeVideoEnd}
          />
        )}

        {/* Super Combo Input (arcade only) */}
        {gameMode === 'arcade' && (
          <SuperComboInput
            isActive={gameLogic.gameState.isSuperModeActive}
            onComboComplete={handleSuperComboCompleteWithFinisher}
            onComboProgress={gameLogic.handleSuperComboProgress}
          />
        )}

        {/* Save Status Indicator (debug hidden) */}
        <SaveStatusIndicator showDetails={false} />
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  whiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 0,
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedbackText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pauseButton: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'transparent',
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    zIndex: 50,
    width: 120,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    fontSize: 20,
  },
  pauseButtonImage: {
    width: 120,
    height: 40,
  },
  pauseButtonOverlayText: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 2,
  },

  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  pauseText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resumeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  quitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  missAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  missXText: {
    fontSize: 200,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cooldownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default GameScreen;
