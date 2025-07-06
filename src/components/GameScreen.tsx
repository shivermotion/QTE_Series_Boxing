import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import GameOverScreen from '../screens/GameOverScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GameScreenProps {
  gameMode: 'arcade' | 'endless';
  onBackToMenu: () => void;
  debugMode: boolean;
}

interface Target {
  id: string;
  lane: 'left' | 'center' | 'right';
  position: number;
  speed: number;
  type: 'normal' | 'power';
}

interface GameState {
  score: number;
  lives: number;
  targets: Target[];
  avatarState: 'idle' | 'success' | 'failure';
  combo: number;
  isPaused: boolean;
  gameTime: number;
  level: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FeedbackText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

interface TouchState {
  startY: number;
  startTime: number;
  isSwipe: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameMode, onBackToMenu, debugMode }) => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    targets: [],
    avatarState: 'idle',
    combo: 0,
    isPaused: false,
    gameTime: 0,
    level: 1,
  });

  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [feedbackTexts, setFeedbackTexts] = useState<FeedbackText[]>([]);
  const [touchStates, setTouchStates] = useState<{ [key: string]: TouchState }>({});
  const particleIdCounter = useRef(0);

  // Animation refs
  const screenShakeAnim = useRef(new Animated.Value(0)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;
  const pauseOverlayAnim = useRef(new Animated.Value(0)).current;

  // Audio refs
  const hitSound = useRef<Audio.Sound | null>(null);
  const missSound = useRef<Audio.Sound | null>(null);
  const comboSound = useRef<Audio.Sound | null>(null);

  // Load audio
  useEffect(() => {
    loadAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  const loadAudio = async () => {
    try {
      const { sound: hit } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      hitSound.current = hit;

      // Create placeholder sounds for miss and combo
      const { sound: miss } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      missSound.current = miss;

      const { sound: combo } = await Audio.Sound.createAsync(require('../../assets/audio/hit.mp3'));
      comboSound.current = combo;
    } catch (error) {
      console.log('Audio loading error:', error);
    }
  };

  const unloadAudio = async () => {
    if (hitSound.current) await hitSound.current.unloadAsync();
    if (missSound.current) await missSound.current.unloadAsync();
    if (comboSound.current) await comboSound.current.unloadAsync();
  };

  const playSound = async (soundRef: React.MutableRefObject<Audio.Sound | null>) => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.log('Haptic error:', error);
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < count; i++) {
      particleIdCounter.current += 1;
      newParticles.push({
        id: `particle_${timestamp}_${particleIdCounter.current}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 1,
        color,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createFeedbackText = (text: string, x: number, y: number, color: string) => {
    const feedback: FeedbackText = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      x,
      y,
      color,
      life: 1,
      maxLife: 1,
    };
    setFeedbackTexts(prev => [...prev, feedback]);
  };

  const screenShake = () => {
    Animated.sequence([
      Animated.timing(screenShakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(screenShakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCombo = () => {
    Animated.sequence([
      Animated.timing(comboScaleAnim, {
        toValue: 1.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(comboScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateAvatar = () => {
    Animated.sequence([
      Animated.timing(avatarScaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const togglePause = () => {
    const newPausedState = !gameState.isPaused;
    setGameState(prev => ({ ...prev, isPaused: newPausedState }));

    Animated.timing(pauseOverlayAnim, {
      toValue: newPausedState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (!gameState.isPaused) {
        updateGame();
      }
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, lastSpawnTime, lastFrameTime]);

  // Update particles and feedback texts
  useEffect(() => {
    const animationLoop = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, life: p.life - 0.02, x: p.x + p.vx, y: p.y + p.vy }))
          .filter(p => p.life > 0)
      );

      setFeedbackTexts(prev =>
        prev.map(f => ({ ...f, life: f.life - 0.02, y: f.y - 1 })).filter(f => f.life > 0)
      );
    }, 16);

    return () => clearInterval(animationLoop);
  }, []);

  const updateGame = () => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime;

    // Update game time
    const newGameTime = gameState.gameTime + deltaTime;

    // Update target positions (reversed: targets move up from bottom)
    const speedMultiplier = debugMode ? 0.3 : 1; // Slow down targets in debug mode
    const updatedTargets = gameState.targets
      .map(target => ({
        ...target,
        position: target.position - target.speed * deltaTime * speedMultiplier, // Reversed direction
      }))
      .filter(target => target.position >= -0.2); // Keep targets that haven't gone off screen

    // Check for missed targets (reversed: targets miss when they go above the hit zone)
    let newLives = gameState.lives;
    let newAvatarState = gameState.avatarState;
    let newCombo = gameState.combo;

    updatedTargets.forEach(target => {
      if (target.position < 0.15) {
        // Reversed: miss when target goes above hit zone
        newLives--;
        newCombo = 0;
        newAvatarState = 'failure';
        triggerHaptic('heavy');
        screenShake();
        createParticles(getLaneX(target.lane), screenHeight * 0.2, '#ff0000', 12); // Updated position
        createFeedbackText('MISS!', getLaneX(target.lane), screenHeight * 0.3, '#ff0000'); // Updated position
        playSound(missSound);
      }
    });

    // Spawn new targets at the bottom
    let newTargets = [...updatedTargets];
    if (currentTime - lastSpawnTime >= 2000) {
      const lanes: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
      const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

      newTargets.push({
        id: `target_${Date.now()}_${Math.random()}`,
        lane: randomLane,
        position: 1.2, // Start at bottom (reversed)
        speed: 0.002,
        type: 'normal',
      });
      setLastSpawnTime(currentTime);
    }

    // Reset avatar state after delay
    if (newAvatarState !== 'idle') {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, avatarState: 'idle' }));
      }, 1000);
    }

    setGameState(prev => ({
      ...prev,
      gameTime: newGameTime,
      targets: newTargets,
      lives: newLives,
      avatarState: newAvatarState,
      combo: newCombo,
    }));

    // Check for game over
    if (newLives <= 0 && !isGameOver) {
      setIsGameOver(true);
    }

    setLastFrameTime(currentTime);
  };

  const handleTouchStart = (zone: 'left' | 'center' | 'right', event: any) => {
    if (gameState.isPaused) return;

    const { pageY } = event.nativeEvent;
    setTouchStates(prev => ({
      ...prev,
      [zone]: {
        startY: pageY,
        startTime: Date.now(),
        isSwipe: false,
      },
    }));
  };

  const handleTouchEnd = (zone: 'left' | 'center' | 'right', event: any) => {
    if (gameState.isPaused) return;

    const touchState = touchStates[zone];
    if (!touchState) return;

    const { pageY } = event.nativeEvent;
    const deltaY = touchState.startY - pageY;
    const deltaTime = Date.now() - touchState.startTime;
    const velocity = deltaY / deltaTime;

    // Determine if it's a swipe (upward motion with sufficient velocity)
    const isSwipe = deltaY > 50 && velocity > 0.5;

    processHit(zone, isSwipe ? 'swipe' : 'tap');

    // Clear touch state
    setTouchStates(prev => {
      const newState = { ...prev };
      delete newState[zone];
      return newState;
    });
  };

  const processHit = (zone: 'left' | 'center' | 'right', hitType: 'tap' | 'swipe') => {
    // Find target in the hit zone (reversed: check for targets moving up)
    const target = gameState.targets.find(
      t => t.lane === zone && t.position >= 0.15 && t.position <= 0.25
    );

    if (target) {
      const hitZoneCenter = 0.2; // Hit zone near top under avatar
      const distance = Math.abs(target.position - hitZoneCenter);
      let points = 0;
      let feedback = '';
      let color = '#ffffff';

      if (distance <= 0.02) {
        points = hitType === 'swipe' ? 300 : 100;
        feedback = 'PERFECT!';
        color = '#00ff00';
        triggerHaptic('medium');
        playSound(hitSound);
      } else if (distance <= 0.05) {
        points = hitType === 'swipe' ? 200 : 75;
        feedback = 'GOOD!';
        color = '#ffff00';
        triggerHaptic('light');
        playSound(hitSound);
      } else {
        points = hitType === 'swipe' ? 100 : 50;
        feedback = 'OK';
        color = '#ff8800';
        triggerHaptic('light');
        playSound(hitSound);
      }

      const newCombo = gameState.combo + 1;
      const comboMultiplier = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
      const totalPoints = points * comboMultiplier;

      setGameState(prev => ({
        ...prev,
        score: prev.score + totalPoints,
        combo: newCombo,
        avatarState: 'success',
        targets: prev.targets.filter(t => t.id !== target.id),
      }));

      // Visual feedback
      animateAvatar();
      if (newCombo >= 5) {
        animateCombo();
        playSound(comboSound);
      }

      createParticles(getLaneX(zone), screenHeight * 0.2, color, 8); // Updated position
      createFeedbackText(feedback, getLaneX(zone), screenHeight * 0.3, color); // Updated position

      if (hitType === 'swipe') {
        createParticles(getLaneX(zone), screenHeight * 0.2, '#ff00ff', 16); // Updated position
        createFeedbackText('POWER!', getLaneX(zone), screenHeight * 0.4, '#ff00ff'); // Updated position
      }
    } else {
      setGameState(prev => ({
        ...prev,
        combo: 0,
        avatarState: 'failure',
      }));

      triggerHaptic('heavy');
      screenShake();
      createParticles(getLaneX(zone), screenHeight * 0.2, '#ff0000', 6); // Updated position
      createFeedbackText('MISS!', getLaneX(zone), screenHeight * 0.3, '#ff0000'); // Updated position
      playSound(missSound);
    }
  };

  const getLaneX = (lane: 'left' | 'center' | 'right'): number => {
    switch (lane) {
      case 'left':
        return screenWidth / 6;
      case 'center':
        return screenWidth / 2;
      case 'right':
        return (5 * screenWidth) / 6;
      default:
        return screenWidth / 2;
    }
  };

  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
  };

  const handleRestart = () => {
    setGameState({
      score: 0,
      lives: 3,
      targets: [],
      avatarState: 'idle',
      combo: 0,
      isPaused: false,
      gameTime: 0,
      level: 1,
    });
    setLastSpawnTime(0);
    setLastFrameTime(0);
    setIsGameOver(false);
    setParticles([]);
    setFeedbackTexts([]);
  };

  const getAvatarColor = (): string => {
    switch (gameState.avatarState) {
      case 'success':
        return '#00ff00';
      case 'failure':
        return '#ff0000';
      default:
        return '#ffff00';
    }
  };

  const getComboMultiplier = (): number => {
    if (gameState.combo >= 10) return 3;
    if (gameState.combo >= 5) return 2;
    return 1;
  };

  const renderDebugOverlay = () => {
    if (!debugMode) return null;

    return (
      <View style={styles.debugOverlay}>
        {/* Debug Info Panel */}
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>DEBUG MODE</Text>
          <Text style={styles.debugText}>Score: {gameState.score}</Text>
          <Text style={styles.debugText}>Lives: {gameState.lives}</Text>
          <Text style={styles.debugText}>Combo: {gameState.combo}</Text>
          <Text style={styles.debugText}>Level: {gameState.level}</Text>
          <Text style={styles.debugText}>Targets: {gameState.targets.length}</Text>
          <Text style={styles.debugText}>Game Time: {Math.floor(gameState.gameTime / 1000)}s</Text>
        </View>

        {/* Hit Zone Indicators */}
        <View style={styles.debugHitZone}>
          <View style={styles.debugHitZoneLine} />
          <Text style={styles.debugHitZoneText}>HIT ZONE (0.15-0.25)</Text>
        </View>

        {/* Perfect Hit Zone */}
        <View style={styles.debugPerfectZone}>
          <View style={styles.debugPerfectZoneLine} />
          <Text style={styles.debugPerfectZoneText}>PERFECT (0.18-0.22)</Text>
        </View>

        {/* Lane Indicators */}
        <View style={[styles.debugLaneIndicator, { left: getLaneX('left') - 20 }]}>
          <Text style={styles.debugLaneText}>LEFT</Text>
        </View>
        <View style={[styles.debugLaneIndicator, { left: getLaneX('center') - 30 }]}>
          <Text style={styles.debugLaneText}>CENTER</Text>
        </View>
        <View style={[styles.debugLaneIndicator, { left: getLaneX('right') - 25 }]}>
          <Text style={styles.debugLaneText}>RIGHT</Text>
        </View>

        {/* Target Hit Boxes */}
        {gameState.targets.map(target => (
          <View
            key={`debug_${target.id}`}
            style={[
              styles.debugTargetBox,
              {
                left: getLaneX(target.lane) - 32,
                top: target.position * screenHeight - 32,
                borderColor:
                  target.position >= 0.15 && target.position <= 0.25 ? '#00ff00' : '#ff0000',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: screenShakeAnim }],
        },
      ]}
    >
      {/* Game UI */}
      <View style={styles.gameUI}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToMenu}>
          <Text style={styles.backButtonText}>← Menu</Text>
        </TouchableOpacity>

        <Text style={styles.scoreText}>Score: {formatScore(gameState.score)}</Text>
        <Text style={styles.livesText}>Lives: {gameState.lives}</Text>
      </View>

      {/* Pause Button */}
      <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
        <Text style={styles.pauseButtonText}>{gameState.isPaused ? '▶' : '⏸'}</Text>
      </TouchableOpacity>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatar,
            {
              backgroundColor: getAvatarColor(),
              transform: [{ scale: avatarScaleAnim }],
            },
          ]}
        />

        {/* Hit Zone */}
        <View style={styles.hitZone} />

        {/* Targets */}
        {gameState.targets.map(target => (
          <View
            key={target.id}
            style={[
              styles.target,
              {
                left: getLaneX(target.lane) - 32,
                top: target.position * screenHeight - 32,
                backgroundColor: target.type === 'power' ? '#ff00ff' : '#ff8800',
                borderColor: target.type === 'power' ? '#ffffff' : '#ffaa00',
              },
            ]}
          />
        ))}

        {/* Combo Display */}
        {gameState.combo > 0 && (
          <Animated.View
            style={[styles.comboContainer, { transform: [{ scale: comboScaleAnim }] }]}
          >
            <Text style={styles.comboText}>Combo: x{getComboMultiplier()}</Text>
            <Text style={styles.comboCount}>{gameState.combo}</Text>
          </Animated.View>
        )}

        {/* Particles */}
        {particles.map(particle => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x - 4,
                top: particle.y - 4,
                backgroundColor: particle.color,
                opacity: particle.life,
              },
            ]}
          />
        ))}

        {/* Feedback Texts */}
        {feedbackTexts.map(feedback => (
          <Text
            key={feedback.id}
            style={[
              styles.feedbackText,
              {
                left: feedback.x - 50,
                top: feedback.y,
                color: feedback.color,
                opacity: feedback.life,
                transform: [{ scale: 1 + (1 - feedback.life) }],
              },
            ]}
          >
            {feedback.text}
          </Text>
        ))}

        {/* Debug Overlay */}
        {renderDebugOverlay()}
      </View>

      {/* Touch Zones with Swipe Support */}
      <View style={styles.touchZones}>
        <TouchableOpacity
          style={[styles.touchZone, debugMode && styles.debugTouchZone]}
          onPressIn={e => handleTouchStart('left', e)}
          onPressOut={e => handleTouchEnd('left', e)}
        >
          {debugMode && <Text style={styles.debugTouchText}>LEFT ZONE</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.touchZone, debugMode && styles.debugTouchZone]}
          onPressIn={e => handleTouchStart('center', e)}
          onPressOut={e => handleTouchEnd('center', e)}
        >
          {debugMode && <Text style={styles.debugTouchText}>CENTER ZONE</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.touchZone, debugMode && styles.debugTouchZone]}
          onPressIn={e => handleTouchStart('right', e)}
          onPressOut={e => handleTouchEnd('right', e)}
        >
          {debugMode && <Text style={styles.debugTouchText}>RIGHT ZONE</Text>}
        </TouchableOpacity>
      </View>

      {/* Pause Overlay */}
      <Animated.View
        style={[styles.pauseOverlay, { opacity: pauseOverlayAnim }]}
        pointerEvents={gameState.isPaused ? 'auto' : 'none'}
      >
        <View style={styles.pausePanel}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverScreen
          finalScore={gameState.score}
          gameMode={gameMode}
          onRestart={handleRestart}
          onBackToMenu={onBackToMenu}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameUI: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  livesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#ff8800',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  avatar: {
    position: 'absolute',
    top: 20,
    left: screenWidth / 2 - 64,
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#00ffff',
  },
  hitZone: {
    position: 'absolute',
    top: screenHeight * 0.2,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#00ffff',
  },
  target: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 3,
  },
  comboContainer: {
    position: 'absolute',
    top: 160,
    left: screenWidth / 2 - 60,
    alignItems: 'center',
  },
  comboText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboCount: {
    color: '#ff00ff',
    fontSize: 24,
    fontWeight: 'bold',
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
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  touchZones: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
  },
  touchZone: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  debugTouchZone: {
    backgroundColor: 'rgba(255, 0, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#ff00ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugTouchText: {
    color: '#ff00ff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  debugPanel: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 12,
    marginBottom: 2,
  },
  debugHitZone: {
    position: 'absolute',
    top: screenHeight * 0.15,
    left: 0,
    right: 0,
    height: screenHeight * 0.1,
    borderWidth: 2,
    borderColor: '#ffff00',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugHitZoneLine: {
    position: 'absolute',
    top: screenHeight * 0.2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ffff00',
  },
  debugHitZoneText: {
    color: '#ffff00',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 2,
  },
  debugPerfectZone: {
    position: 'absolute',
    top: screenHeight * 0.18,
    left: 0,
    right: 0,
    height: screenHeight * 0.04,
    borderWidth: 1,
    borderColor: '#00ff00',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugPerfectZoneLine: {
    position: 'absolute',
    top: screenHeight * 0.2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#00ff00',
  },
  debugPerfectZoneText: {
    color: '#00ff00',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 2,
  },
  debugLaneIndicator: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(255, 0, 255, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  debugLaneText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  debugTargetBox: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  pausePanel: {
    backgroundColor: '#1a1a2e',
    padding: 40,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#00ffff',
    alignItems: 'center',
  },
  pauseTitle: {
    color: '#ff00ff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameScreen;
