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
  Image,
} from 'react-native';
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

// Character mapping for each level
const getCharacterForLevel = (level: number) => {
  const characters = [
    require('../../assets/characters/henry_hitchens .png'), // Level 1
    require('../../assets/characters/cyborg_boxer.png'), // Level 2
    require('../../assets/characters/rigoberto_hazuki.png'), // Level 3
    require('../../assets/characters/oronzo_hazuki.png'), // Level 4
    require('../../assets/characters/moai_man.png'), // Level 5
    require('../../assets/characters/ripper.png'), // Level 6
    require('../../assets/characters/ms_nozomi.png'), // Level 7 (reuse)
    require('../../assets/characters/gus_yamato.png'), // Level 8 (reuse)
    require('../../assets/characters/cyborg_boxer.png'), // Level 9 (reuse)
    require('../../assets/characters/king.png'), // Level 10 (reuse)
  ];

  return characters[(level - 1) % characters.length];
};

// Character name image mapping for each level
const getCharacterNameForLevel = (level: number) => {
  const characterNames = [
    require('../../assets/level_select/name5-game-assets.png'), // Level 1 - Henry Hitchens
    require('../../assets/level_select/cyborg_boxer.png'), // Level 2 - Cyborg Boxer
    require('../../assets/level_select/rigoberto_hazuki.png'), // Level 3 - Rigoberto Hazuki
    require('../../assets/level_select/oronzo_hazuki.png'), // Level 4 - Oronzo Hazuki
    require('../../assets/level_select/moai_man.png'), // Level 5 - Moai Man
    require('../../assets/level_select/king.png'), // Level 6 - King
    require('../../assets/level_select/name5-game-assets.png'), // Level 7 - Henry Hitchens (reuse)
    require('../../assets/level_select/cyborg_boxer.png'), // Level 8 - Cyborg Boxer (reuse)
    require('../../assets/level_select/rigoberto_hazuki.png'), // Level 9 - Rigoberto Hazuki (reuse)
    require('../../assets/level_select/oronzo_hazuki.png'), // Level 10 - Oronzo Hazuki (reuse)
  ];

  return characterNames[(level - 1) % characterNames.length];
};

interface AnimatedButtonProps {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  delay?: number;
  instant?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  style,
  children,
  delay = 0,
  instant = false,
}) => {
  const buttonScale = useRef(new Animated.Value(instant ? 1 : 0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(instant ? 1 : 0)).current;

  useEffect(() => {
    if (instant) {
      buttonScale.setValue(1);
      buttonOpacity.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.delay(delay),
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
  }, [buttonOpacity, buttonScale, delay, instant]);

  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(buttonScale, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: buttonScale }],
        opacity: buttonOpacity,
      }}
    >
      <TouchableOpacity
        style={style}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getLevelDifficulty = (level: number) => {
  try {
    const levelConfig = getLevelConfig(level);
    return levelConfig.difficulty.charAt(0).toUpperCase() + levelConfig.difficulty.slice(1);
  } catch (error) {
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

const ChooseLevelScreen: React.FC<ChooseLevelScreenProps> = ({ onSelectLevel, onBack }) => {
  const { getEffectiveVolume } = useAudio();
  const insets = useSafeAreaInsets();

  const [currentLevel, setCurrentLevel] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values for navigation buttons
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;
  const leftButtonOpacity = useRef(new Animated.Value(1)).current;
  const rightButtonOpacity = useRef(new Animated.Value(1)).current;

  // Animation for character image sliding in from right
  const characterImageTranslateX = useRef(new Animated.Value(screenWidth)).current;

  // Animation for character name image sliding down from top
  const characterNameTranslateY = useRef(new Animated.Value(-screenHeight)).current;

  const buttonSoundRef = useRef<Audio.Sound | null>(null);
  const bellSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const buttonSound = new Audio.Sound();
        await buttonSound.loadAsync(require('../../assets/audio/punch_1.mp3'));
        buttonSoundRef.current = buttonSound;

        const bell = new Audio.Sound();
        await bell.loadAsync(require('../../assets/audio/boxing_bell_1.mp3'));
        bellSoundRef.current = bell;
      } catch (e) {
        console.log('Error loading sounds:', e);
      }
    };
    loadSounds();

    return () => {
      if (buttonSoundRef.current) buttonSoundRef.current.unloadAsync();
      if (bellSoundRef.current) bellSoundRef.current.unloadAsync();
    };
  }, []);

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

  const playBellSound = async () => {
    try {
      if (bellSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await bellSoundRef.current.setVolumeAsync(effectiveVolume);
        await bellSoundRef.current.replayAsync();
      }
    } catch (e) {
      console.log('Error playing bell sound:', e);
    }
  };

  const handleLeftArrow = async () => {
    await playButtonSound();
    setCurrentLevel(prev => Math.max(1, prev - 1));
  };

  const handleRightArrow = async () => {
    await playButtonSound();
    setCurrentLevel(prev => Math.min(10, prev + 1));
  };

  // Debug logging for character mapping
  useEffect(() => {
    console.log(`🎯 Level ${currentLevel}: Character image changed`);
  }, [currentLevel]);

  // Animate navigation buttons based on current level
  useEffect(() => {
    const animateButton = (
      scaleValue: Animated.Value,
      opacityValue: Animated.Value,
      shouldAnimate: boolean
    ) => {
      if (shouldAnimate) {
        // Pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleValue, {
                toValue: 1.1,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(opacityValue, {
                toValue: 0.7,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(opacityValue, {
                toValue: 1,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ])
        ).start();
      } else {
        // Stop animation and reset to normal
        scaleValue.stopAnimation();
        opacityValue.stopAnimation();
        scaleValue.setValue(1);
        opacityValue.setValue(1);
      }
    };

    // Animate right button if there are more levels to go
    animateButton(rightButtonScale, rightButtonOpacity, currentLevel < 10);

    // Animate left button if there are previous levels to go
    animateButton(leftButtonScale, leftButtonOpacity, currentLevel > 1);
  }, [currentLevel, leftButtonScale, leftButtonOpacity, rightButtonScale, rightButtonOpacity]);

  // Animate character image when level changes
  useEffect(() => {
    // Start offscreen
    characterImageTranslateX.setValue(screenWidth);

    // Slide in from right
    Animated.timing(characterImageTranslateX, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentLevel, characterImageTranslateX]);

  // Animate character name image sliding down
  useEffect(() => {
    // Start offscreen at top
    characterNameTranslateY.setValue(-screenHeight);

    // Slide down to center
    Animated.timing(characterNameTranslateY, {
      toValue: 0,
      duration: 1000,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [currentLevel, characterNameTranslateY]);

  const handleSelect = async () => {
    await playBellSound();
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleReady = async () => {
    await playBellSound();
    setModalVisible(false);
    onSelectLevel(currentLevel);
  };

  const handleBack = async () => {
    await playButtonSound();
    onBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Main body area with background */}
      <TouchableOpacity style={styles.bodyArea} onPress={handleSelect} activeOpacity={0.9}>
        {/* Background GIF */}
        <Image
          source={require('../../assets/video/world_black.gif')}
          style={styles.backgroundGif}
          resizeMode="contain"
        />

        {/* Paper texture overlay */}
        <Image
          source={require('../../assets/transition_screen/paper_texture.png')}
          style={styles.paperTexture}
          resizeMode="cover"
        />

        {/* Paper border overlay */}
        <Image
          source={require('../../assets/level_select/paper_border.png')}
          style={styles.paperBorder}
          resizeMode="cover"
        />

        {/* Character name image that slides down from top */}
        <Animated.View
          style={[
            styles.characterNameContainer,
            {
              transform: [{ translateY: characterNameTranslateY }],
            },
          ]}
        >
          <Image
            source={getCharacterNameForLevel(currentLevel)}
            style={styles.characterNameImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Character image that slides in from right */}
        <Animated.View
          style={[
            styles.characterImageContainer,
            {
              transform: [{ translateX: characterImageTranslateX }],
            },
          ]}
        >
          <Image
            source={getCharacterForLevel(currentLevel)}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* HUD at bottom of body - Hidden for now */}
        {/* <View style={styles.hudContainer}>
          <View style={styles.hudContent}>
            <Text style={styles.hudChapterTitle}>{getChapterTitle(currentLevel)}</Text>
            <Text style={styles.hudOpponentName}>Opponent Name</Text>
            <Text style={styles.hudDifficulty}>{getLevelDifficulty(currentLevel)}</Text>
            <View style={styles.hudMetersSection}>
              <View style={styles.meterPlaceholder}>
                <Text style={styles.meterPlaceholderText}>Power Meter</Text>
              </View>
              <View style={styles.meterPlaceholder}>
                <Text style={styles.meterPlaceholderText}>Speed Meter</Text>
              </View>
            </View>
          </View>
        </View> */}
      </TouchableOpacity>

      {/* Back button at top left */}
      <View style={[styles.backButtonContainer, { top: insets.top }]}>
        <AnimatedButton onPress={handleBack} instant={true}>
          <View style={styles.backButtonWrapper}>
            <Image
              source={require('../../assets/level_select/toggle_4.png')}
              style={styles.backButtonImage}
              resizeMode="contain"
            />
            <Text style={styles.backButtonText}>← Back</Text>
          </View>
        </AnimatedButton>
      </View>

      {/* Bottom navigation buttons */}
      <View style={[styles.bottomNavigationContainer, { bottom: insets.bottom }]}>
        <AnimatedButton onPress={handleLeftArrow} instant={true}>
          <Animated.View
            style={[
              styles.navButtonWrapper,
              {
                transform: [{ scale: leftButtonScale }],
                opacity: leftButtonOpacity,
              },
            ]}
          >
            <Image
              source={require('../../assets/ui/Asset_30.png')}
              style={styles.navButtonImage}
              resizeMode="contain"
            />
            <Text style={styles.navArrowText}>←</Text>
          </Animated.View>
        </AnimatedButton>

        <AnimatedButton onPress={handleRightArrow} instant={true}>
          <Animated.View
            style={[
              styles.navButtonWrapper,
              {
                transform: [{ scale: rightButtonScale }],
                opacity: rightButtonOpacity,
              },
            ]}
          >
            <Image
              source={require('../../assets/ui/Asset_30.png')}
              style={[styles.navButtonImage, { transform: [{ rotate: '180deg' }] }]}
              resizeMode="contain"
            />
            <Text style={styles.navArrowText}>→</Text>
          </Animated.View>
        </AnimatedButton>
      </View>

      {/* Level Info Modal */}
      <LevelInfoModal
        visible={modalVisible}
        level={currentLevel}
        onClose={handleModalClose}
        onReady={handleReady}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  backButtonText: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  backButtonImage: {
    width: 160,
    height: 160,
  },
  backButtonWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0236F2',
  },
  backgroundGif: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    flex: 1,
    zIndex: 2,
  },
  levelInfo: {
    alignItems: 'center',
    zIndex: 1,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
    letterSpacing: 2,
  },
  levelTitle: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 15,
    fontWeight: '600',
  },
  levelDifficulty: {
    fontSize: 18,
    color: '#ff8800',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  bottomNavigationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
    zIndex: 10,
  },
  navButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  navButtonImage: {
    width: 140,
    height: 140,
  },
  navButtonWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowText: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },

  hudContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 2,
    borderTopColor: '#00ffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    zIndex: 4,
  },
  hudContent: {
    alignItems: 'center',
  },
  hudChapterTitle: {
    color: '#00ffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'Round8Four',
  },
  hudOpponentName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    fontFamily: 'Round8Four',
  },
  hudDifficulty: {
    color: '#ff8800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    fontFamily: 'Round8Four',
  },
  hudMetersSection: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  meterPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00ffff',
    minWidth: 80,
    alignItems: 'center',
  },
  meterPlaceholderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
  },
  characterNameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  characterNameImage: {
    width: '100%',
    height: '100%',
  },
  characterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    // opacity: 0.3,
    zIndex: 1,
  },
  paperBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
});

export default ChooseLevelScreen;
