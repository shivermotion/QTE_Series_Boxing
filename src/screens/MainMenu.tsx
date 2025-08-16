import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import { useTransition } from '../contexts/TransitionContext';
import ChooseLevelScreen from './ChooseLevelScreen';
import GymScreen from './GymScreen';

interface MainMenuProps {
  onStartGame: (mode: 'arcade' | 'endless') => void;
  onOpenSettings: () => void;
  onOpenChooseLevel: () => void;
  onOpenGym: () => void;
  onToggleDebugMode: () => void;
}

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
      Animated.delay(3500 + delay), // Start after titles
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

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenChooseLevel,
  onOpenGym,
}) => {
  const { getEffectiveVolume, startMainTheme, isMainThemePlaying } = useAudio();
  const { startTransition, setTargetScreen } = useTransition();

  const [menuAreaReady, setMenuAreaReady] = React.useState(true);

  const punchSoundRef = React.useRef<Audio.Sound | null>(null);
  const bellSoundRef = React.useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    const loadPunch = async () => {
      try {
        const punch = new Audio.Sound();
        await punch.loadAsync(require('../../assets/audio/punch_1.mp3'));
        punchSoundRef.current = punch;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error preloading punch sound:', e);
      }
    };
    loadPunch();

    const loadBell = async () => {
      try {
        const bell = new Audio.Sound();
        await bell.loadAsync(require('../../assets/audio/boxing_bell_1.mp3'));
        bellSoundRef.current = bell;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error preloading bell sound:', e);
      }
    };
    loadBell();

    return () => {
      if (punchSoundRef.current) {
        punchSoundRef.current.unloadAsync();
      }
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync();
      }
    };
  }, [getEffectiveVolume]);

  const playPunchSound = async () => {
    try {
      if (punchSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await punchSoundRef.current.setVolumeAsync(effectiveVolume);
        await punchSoundRef.current.replayAsync();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error playing punch sound:', e);
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
      // eslint-disable-next-line no-console
      console.log('Error playing bell sound:', e);
    }
  };

  // Menu is ready immediately (no fade-in)
  useEffect(() => {
    setMenuAreaReady(true);
  }, []);

  useEffect(() => {
    if (!isMainThemePlaying) {
      startMainTheme();
    }
  }, [isMainThemePlaying, startMainTheme]);

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <View style={[styles.contentContainer, { zIndex: 6 }]}>
        {menuAreaReady && (
          <View style={[styles.menuContainer, { zIndex: 7 }]}>
            <>
              <View style={styles.topRightContainer}>
                <AnimatedButton
                  style={styles.settingsButton}
                  onPress={async () => {
                    await playPunchSound();
                    onOpenSettings();
                  }}
                  delay={0}
                  instant={true}
                >
                  <Text style={styles.settingsButtonText}>Settings</Text>
                </AnimatedButton>
              </View>

              <AnimatedButton
                style={styles.bigStoryButton}
                onPress={async () => {
                  await playPunchSound();

                  const targetScreen = (
                    <ChooseLevelScreen
                      onSelectLevel={level => {
                        onStartGame('arcade');
                      }}
                      onBack={() => {
                        onOpenChooseLevel();
                      }}
                    />
                  );

                  setTargetScreen(targetScreen);

                  startTransition(
                    () => {
                      onOpenChooseLevel();
                    },
                    {
                      transitionImage: require('../../assets/transition_screen/paper_texture.png'),
                      loadingDuration: 2000,
                      wipeDuration: 800,
                    }
                  );
                }}
                delay={0}
                instant={true}
              >
                <Text style={styles.bigStoryButtonText}>Story</Text>
              </AnimatedButton>

              <View style={styles.sideBySideContainer}>
                <AnimatedButton
                  style={styles.sideButton}
                  onPress={async () => {
                    await playPunchSound();

                    const targetScreen = (
                      <GymScreen
                        onBack={() => {
                          onOpenGym();
                        }}
                      />
                    );

                    setTargetScreen(targetScreen);

                    startTransition(
                      () => {
                        onOpenGym();
                      },
                      {
                        transitionImage: require('../../assets/transition_screen/paper_texture.png'),
                        loadingDuration: 2000,
                        wipeDuration: 800,
                      }
                    );
                  }}
                  delay={0}
                  instant={true}
                >
                  <Text style={styles.buttonText}>GYM</Text>
                </AnimatedButton>

                <AnimatedButton
                  style={styles.sideButton}
                  onPress={async () => {
                    await playPunchSound();
                    onStartGame('endless');
                  }}
                  delay={0}
                  instant={true}
                >
                  <Text style={styles.buttonText}>Endless</Text>
                </AnimatedButton>
              </View>
            </>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#808080',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingVertical: 60,
    zIndex: 4,
  },
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },

  bigStoryButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 60,
    paddingVertical: 30,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#00ffff',
    width: 320,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bigStoryButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 40,
  },
  topRightContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  sideButton: {
    backgroundColor: '#ff8800',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff00ff',
    width: 140,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default MainMenu;
