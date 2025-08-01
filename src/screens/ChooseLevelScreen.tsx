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
import { getLevelConfig } from '../data/gameConfig';

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
  isScrolling: boolean;
}

const AnimatedLevelButton: React.FC<AnimatedLevelButtonProps> = ({
  level,
  onPress,
  delay,
  onPressIn,
  isSelected,
  onSelect,
  backgroundImage,
  isScrolling,
}) => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(-screenWidth * 1.5)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const buttonSelectionScale = useRef(new Animated.Value(1)).current;
  const buttonBlinkOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animation with snap-to-position effect
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(buttonTranslateX, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
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
  }, [buttonTranslateX, buttonGlow, delay, level]);

  // Handle selection state changes
  useEffect(() => {
    if (isSelected) {
      // Start classic retro blinking animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonBlinkOpacity, {
            toValue: 0.2,
            duration: 150,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(buttonBlinkOpacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Return to normal state when deselected
      Animated.timing(buttonBlinkOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected, buttonBlinkOpacity]);

  const [pressStartTime, setPressStartTime] = React.useState<number | null>(null);
  const [wasScrollingDuringPress, setWasScrollingDuringPress] = React.useState(false);

  const handlePressIn = () => {
    if (isScrolling) {
      console.log('🚫 Button press blocked during scroll');
      return;
    }
    console.log('✅ Button press started - level', level);
    setPressStartTime(Date.now());
    setWasScrollingDuringPress(false);
    onPressIn();
  };

  // Monitor scrolling during press
  React.useEffect(() => {
    if (pressStartTime && isScrolling) {
      setWasScrollingDuringPress(true);
    }
  }, [isScrolling, pressStartTime]);

  const handlePressOut = () => {
    if (!pressStartTime) {
      console.log('🚫 No press start time - ignoring press out');
      return;
    }

    const pressDuration = Date.now() - pressStartTime;

    if (isScrolling || wasScrollingDuringPress) {
      console.log('🚫 Button press out blocked - scrolling detected during press');
      setPressStartTime(null);
      return;
    }

    // Only trigger if press was deliberate (not too short, not too long)
    if (pressDuration < 50 || pressDuration > 1000) {
      console.log('🚫 Press duration invalid:', pressDuration, 'ms');
      setPressStartTime(null);
      return;
    }

    console.log(
      '✅ Button press completed - selecting level',
      level,
      'duration:',
      pressDuration,
      'ms'
    );
    onSelect(level);
    setPressStartTime(null);

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

  const handleLongPress = () => {
    if (isScrolling) {
      console.log('🚫 Long press blocked during scroll');
      return;
    }
    console.log('✅ Long press detected - selecting level', level);
    onSelect(level);
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
    try {
      const levelConfig = getLevelConfig(level);
      return levelConfig.difficulty.charAt(0).toUpperCase() + levelConfig.difficulty.slice(1);
    } catch (error) {
      // Fallback to hardcoded values if levelConfig not found
      if (level <= 3) return 'Easy';
      if (level <= 6) return 'Medium';
      if (level <= 8) return 'Hard';
      return 'Expert';
    }
  };

  const getChapterTitle = (level: number) => {
    try {
      const levelConfig = getLevelConfig(level);
      return levelConfig.name;
    } catch (error) {
      // Fallback to hardcoded values if levelConfig not found
      const titles = [
        'The Beginning',
        'Rising Star',
        'Local Champion',
        'City Contender',
        'Regional Power',
        'State Champion',
        'National Glory',
        'World Stage',
        'Legend Status',
        'Ultimate Champion',
      ];
      return titles[(level - 1) % titles.length];
    }
  };

  const getLevelNumber = (level: number) => {
    return `Chapter ${level}`;
  };

  const getLevelDescription = (level: number) => {
    return getChapterTitle(level);
  };

  const [currentGlow, setCurrentGlow] = React.useState(0);

  React.useEffect(() => {
    const id = buttonGlow.addListener(({ value }) => setCurrentGlow(value));
    return () => buttonGlow.removeListener(id);
  }, [buttonGlow]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX: buttonTranslateX }],
        opacity: Animated.multiply(buttonOpacity, buttonBlinkOpacity),
      }}
    >
      <TouchableOpacity
        style={styles.levelButtonContainer}
        onPress={() => onPress(level)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={1}
      >
        <ImageBackground
          source={backgroundImage}
          style={styles.levelButtonBackground}
          resizeMode="cover"
        >
          <View style={styles.levelButtonOverlay}>
            <Text style={styles.levelNumber}>{getLevelNumber(level)}</Text>
            <Text style={styles.chapterTitle}>{getLevelDescription(level)}</Text>
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);

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

  // Replace handleLevelSelect with just selection logic
  const handleLevelSelect = (level: number) => {
    if (isScrolling) {
      console.log('🚫 Button press blocked - scrolling in progress');
      return;
    }
    console.log('✅ Button press allowed - selecting level', level);
    setSelectedLevel(level);
  };

  // Open modal when a level is selected
  useEffect(() => {
    if (selectedLevel !== null) {
      // Give time for selection animation (e.g., 350ms)
      const timer = setTimeout(() => setModalVisible(true), 350);
      return () => clearTimeout(timer);
    }
  }, [selectedLevel]);

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
            showsVerticalScrollIndicator={true}
            scrollEnabled={!scrollLocked}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="never"
            onTouchStart={() => {
              console.log('📱 Touch started on ScrollView');
              setIsScrolling(false);
            }}
            onTouchMove={() => {
              console.log('📱 Touch moving - scrolling detected');
              setIsScrolling(true);
              // Mark that scrolling occurred during any active button press
              if (selectedLevel !== null) {
                setSelectedLevel(null);
              }
            }}
            onTouchEnd={() => {
              console.log('📱 Touch ended on ScrollView');
              // Longer delay to prevent accidental button presses after scroll
              setTimeout(() => setIsScrolling(false), 500);
            }}
          >
            {/* Main Campaign Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.levelGrid}>
                {Array.from({ length: 10 }, (_, i) => (
                  <AnimatedLevelButton
                    key={i + 1}
                    level={i + 1}
                    onPress={handleLevelSelect}
                    delay={500 + i * 400}
                    onPressIn={playButtonSound}
                    isSelected={selectedLevel === i + 1}
                    onSelect={setSelectedLevel}
                    backgroundImage={getLevelBackgroundImage(i + 1)}
                    isScrolling={isScrolling}
                  />
                ))}
              </View>
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
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 10,
  },
  levelButtonContainer: {
    width: '100%',
    height: 140,
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
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 10,
    letterSpacing: 1,
  },
  chapterTitle: {
    fontSize: 16,
    color: '#00ffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  levelDifficulty: {
    fontSize: 14,
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  levelStars: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 12,
  },
  star: {
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 20,
  },
});

export default ChooseLevelScreen;
