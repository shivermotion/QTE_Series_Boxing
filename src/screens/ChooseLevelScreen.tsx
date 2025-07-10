import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Canvas,
  Path as SkiaPath,
  LinearGradient,
  vec,
  Group,
  Skia,
  Paint,
  useClock,
} from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import LevelInfoModal from './LevelInfoModal';

interface ChooseLevelScreenProps {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animated Level Button Component
interface AnimatedLevelButtonProps {
  level: number;
  onPress: (level: number) => void;
  delay: number;
  onPressIn: () => void;
  isSelected: boolean;
  onSelect: (level: number) => void;
  backgroundImage: any;
}

const AnimatedLevelButton: React.FC<AnimatedLevelButtonProps> = ({
  level,
  onPress,
  delay,
  onPressIn,
  isSelected,
  onSelect,
  backgroundImage,
}) => {
  const buttonScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(50)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const buttonSpinRotation = useRef(new Animated.Value(0)).current;
  const buttonSelectionScale = useRef(new Animated.Value(1)).current;
  const buttonSelectionRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation with spin-in effect
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        // Spin-in effect - starts at 360 degrees and spins to 0
        Animated.timing(buttonSpinRotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 2000 + level * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 2000 + level * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [buttonOpacity, buttonScale, buttonTranslateY, buttonGlow, buttonSpinRotation, delay, level]);

  // Handle selection state changes
  useEffect(() => {
    if (isSelected) {
      // Enlarge and spin when selected
      Animated.parallel([
        Animated.timing(buttonSelectionScale, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonSelectionRotation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Return to normal state when deselected
      Animated.parallel([
        Animated.timing(buttonSelectionScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonSelectionRotation, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected, buttonSelectionScale, buttonSelectionRotation]);

  const handlePressIn = () => {
    onPressIn();
    onSelect(level);
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getLevelColor = (level: number) => {
    const colors = [
      '#ff4444',
      '#ff8844',
      '#ffcc44',
      '#ffff44',
      '#ccff44',
      '#88ff44',
      '#44ff44',
      '#44ff88',
      '#44ffcc',
      '#44ffff',
    ];
    return colors[(level - 1) % colors.length];
  };

  const getLevelDifficulty = (level: number) => {
    if (level <= 3) return 'Easy';
    if (level <= 6) return 'Medium';
    if (level <= 8) return 'Hard';
    return 'Expert';
  };

  const [currentGlow, setCurrentGlow] = React.useState(0);

  React.useEffect(() => {
    const id = buttonGlow.addListener(({ value }) => setCurrentGlow(value));
    return () => buttonGlow.removeListener(id);
  }, [buttonGlow]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: buttonScale },
          { translateY: buttonTranslateY },
          // Spin-in effect: starts at 360 degrees, spins to 0, then locks upright
          {
            rotate: buttonSpinRotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['360deg', '0deg'],
            }),
          },
          // Selection effects: scale and rotation
          { scale: buttonSelectionScale },
          {
            rotate: buttonSelectionRotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
        opacity: buttonOpacity,
      }}
    >
      <TouchableOpacity
        style={styles.levelButtonContainer}
        onPress={() => onPress(level)}
        onPressIn={handlePressIn}
        activeOpacity={1}
      >
        <ImageBackground
          source={backgroundImage}
          style={styles.levelButtonBackground}
          resizeMode="cover"
        >
          <View style={styles.levelButtonOverlay}>
            <Text style={styles.levelNumber}>Level {level}</Text>
            <Text style={styles.levelDifficulty}>{getLevelDifficulty(level)}</Text>
            <View style={styles.levelStars}>
              {[...Array(Math.min(level, 5))].map((_, i) => (
                <Text key={i} style={styles.star}>
                  ⭐
                </Text>
              ))}
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Back Button
const AnimatedBackButton: React.FC<{ onPress: () => void; onPressIn: () => void }> = ({
  onPress,
  onPressIn,
}) => {
  const buttonScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [buttonOpacity, buttonScale]);

  const handlePressIn = () => {
    onPressIn();
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: buttonScale }],
        opacity: buttonOpacity,
      }}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={onPress}
        onPressIn={handlePressIn}
        activeOpacity={1}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Floating Particles Effect
const FloatingParticles = () => {
  const clock = useClock();
  const [particles, setParticles] = React.useState(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: 2 + Math.random() * 4,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
    }))
  );

  React.useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      setParticles(prev =>
        prev.map(particle => ({
          ...particle,
          y: (particle.y - particle.speed) % (screenHeight + 50),
        }))
      );
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, []);

  return (
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Group>
        {particles.map((particle, i) => (
          <SkiaPath
            key={i}
            path={Skia.Path.Make().addCircle(particle.x, particle.y, particle.size)}
            style="fill"
            opacity={particle.opacity}
            color="rgba(255, 255, 255, 0.6)"
          />
        ))}
      </Group>
    </Canvas>
  );
};

const ChooseLevelScreen: React.FC<ChooseLevelScreenProps> = ({ onSelectLevel, onBack }) => {
  const { getEffectiveVolume } = useAudio();
  const insets = useSafeAreaInsets();

  // Screen entrance animation
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(0.9)).current;

  // Selection state
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Audio references
  const buttonSoundRef = useRef<Audio.Sound | null>(null);
  const selectSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Screen entrance animation
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Preload sounds
    const loadSounds = async () => {
      try {
        const buttonSound = new Audio.Sound();
        await buttonSound.loadAsync(require('../../assets/audio/punch_1.mp3'));
        buttonSoundRef.current = buttonSound;

        const selectSound = new Audio.Sound();
        await selectSound.loadAsync(require('../../assets/audio/boxing_bell_1.mp3'));
        selectSoundRef.current = selectSound;
      } catch (e) {
        console.log('Error loading sounds:', e);
      }
    };
    loadSounds();

    return () => {
      if (buttonSoundRef.current) buttonSoundRef.current.unloadAsync();
      if (selectSoundRef.current) selectSoundRef.current.unloadAsync();
    };
  }, [screenOpacity, screenScale]);

  const playButtonSound = async () => {
    try {
      if (buttonSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await buttonSoundRef.current.setVolumeAsync(effectiveVolume);
        await buttonSoundRef.current.replayAsync();
      }
    } catch (e) {
      console.log('Error playing button sound:', e);
    }
  };

  const playSelectSound = async () => {
    try {
      if (selectSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await selectSoundRef.current.setVolumeAsync(effectiveVolume);
        await selectSoundRef.current.replayAsync();
      }
    } catch (e) {
      console.log('Error playing select sound:', e);
    }
  };

  const handleLevelSelect = async (level: number) => {
    // Show modal when a level is selected
    setSelectedLevel(level);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedLevel(null);
  };

  const handleReady = async () => {
    if (selectedLevel) {
      await playSelectSound();
      setModalVisible(false);
      onSelectLevel(selectedLevel);
    }
  };

  const getLevelBackgroundImage = (level: number) => {
    const images = [
      require('../../assets/level_select/image (3).jpg'),
      require('../../assets/level_select/image (13).jpg'),
      require('../../assets/level_select/knockout.png'),
    ];
    return images[(level - 1) % images.length];
  };

  const handleBack = async () => {
    await playButtonSound();
    onBack();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      <ImageBackground
        source={require('../../assets/main_menu/boxing_ring.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Floating particles */}
        <FloatingParticles />

        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={[styles.contentContainer, { paddingTop: insets.top + 20 }]}>
          {/* Back button */}
          <AnimatedBackButton onPress={handleBack} onPressIn={playButtonSound} />

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Choose Your Level</Text>
            <Text style={styles.subtitle}>Select the challenge that awaits you</Text>
          </View>

          {/* Level buttons */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.levelGrid}>
              {Array.from({ length: 10 }, (_, i) => (
                <AnimatedLevelButton
                  key={i + 1}
                  level={i + 1}
                  onPress={handleLevelSelect}
                  delay={500 + i * 400}
                  onPressIn={playButtonSound}
                  isSelected={false}
                  onSelect={() => {}}
                  backgroundImage={getLevelBackgroundImage(i + 1)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Level Info Modal */}
      <LevelInfoModal
        visible={modalVisible}
        level={selectedLevel || 1}
        onClose={handleModalClose}
        onReady={handleReady}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 10,
  },
  levelButtonContainer: {
    width: screenWidth * 0.35,
    aspectRatio: 1,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  levelButtonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelButtonOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
  },
  levelDifficulty: {
    fontSize: 12,
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  levelStars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
});

export default ChooseLevelScreen;
