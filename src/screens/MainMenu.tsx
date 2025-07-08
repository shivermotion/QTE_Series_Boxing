import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
  Dimensions,
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
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import BoxerImg from '../../assets/main_menu/boxer.png';

interface MainMenuProps {
  onStartGame: (mode: 'arcade' | 'endless') => void;
  onOpenSettings: () => void;
  onOpenAudioDebug: () => void;
  onOpenUIDebug: () => void;
  debugMode: boolean;
  onToggleDebugMode: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper to create a Skia Path for a conical beam
function createBeamPath(
  baseX: number,
  baseY: number,
  angle: number,
  width: number,
  length: number
) {
  const tipX = baseX + length * Math.cos(angle);
  const tipY = baseY + length * Math.sin(angle);
  const leftX = baseX + width * Math.cos(angle - Math.PI / 2);
  const leftY = baseY + width * Math.sin(angle - Math.PI / 2);
  const rightX = baseX + width * Math.cos(angle + Math.PI / 2);
  const rightY = baseY + width * Math.sin(angle + Math.PI / 2);
  const path = Skia.Path.Make();
  path.moveTo(leftX, leftY);
  path.lineTo(tipX, tipY);
  path.lineTo(rightX, rightY);
  path.close();
  return { path, tip: { x: tipX, y: tipY } };
}

// Skia Stage Beam
const StageBeam = ({
  baseX,
  baseY,
  angle,
  width,
  length,
  opacity,
}: {
  baseX: number;
  baseY: number;
  angle: number;
  width: number;
  length: number;
  opacity: number;
}) => {
  const { path, tip } = createBeamPath(baseX, baseY, angle, width, length);
  return (
    <SkiaPath path={path} style="fill" opacity={opacity}>
      <LinearGradient
        start={vec(baseX, baseY)}
        end={vec(tip.x, tip.y)}
        colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
      />
    </SkiaPath>
  );
};

// Animated Stage Beams Group
const AnimatedStageBeams = ({
  corner,
  anims,
  maxBeams = 3,
}: {
  corner: 'left' | 'right';
  anims: Animated.Value[];
  maxBeams?: number;
}) => {
  // corner: 'left' or 'right'
  // anims: array of Animated.Value (one per beam)
  // maxBeams: maximum number of beams to show (default 3)
  const baseX = corner === 'left' ? screenWidth * 0.1 : screenWidth * 0.9;
  const baseY = screenHeight * 0.02; // TOP corners now
  const length = screenHeight * 1.1;
  const width = screenWidth * 0.08;
  const baseAngles =
    corner === 'left'
      ? [Math.PI / 3, Math.PI / 4, Math.PI / 6] // Downward and inward
      : [Math.PI - Math.PI / 3, Math.PI - Math.PI / 4, Math.PI - Math.PI / 6];

  return (
    <>
      {anims.map((anim: Animated.Value, i: number) => {
        // Always call hooks for all beams, but only render up to maxBeams
        const delta = Math.PI / 12; // 15 degrees sweep
        const [angle, setAngle] = React.useState<number>(baseAngles[i]);
        useEffect(() => {
          const id = anim.addListener(({ value }: { value: number }) => {
            setAngle(baseAngles[i] - delta + value * delta * 2);
          });
          return () => anim.removeListener(id);
        }, [anim]);
        if (i >= maxBeams) return null;
        return (
          <StageBeam
            key={i}
            baseX={baseX}
            baseY={baseY}
            angle={angle}
            width={width * (1 + i * 0.3)}
            length={length * (0.95 + i * 0.1)}
            opacity={0.5 - i * 0.12}
          />
        );
      })}
    </>
  );
};

// Elegant Title Animation Component
const ElegantTitle: React.FC = () => {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elegant entrance animation
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle continuous glow effect - separate from other animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(titleGlow, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.titleWrapper}>
      {/* Glow effect layer */}
      <Animated.Text
        style={[
          styles.elegantTitle,
          styles.glowLayer,
          {
            textShadowRadius: titleGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 20],
            }),
          },
        ]}
      >
        QTE Series
      </Animated.Text>

      {/* Main title layer */}
      <Animated.Text
        style={[
          styles.elegantTitle,
          {
            opacity: titleOpacity,
            transform: [{ scale: titleScale }, { translateY: titleTranslateY }],
          },
        ]}
      >
        QTE Series
      </Animated.Text>
    </View>
  );
};

// Brash Boxing Title Animation Component
const BrashBoxingTitle: React.FC<{ onAnimDone?: () => void }> = ({ onAnimDone }) => {
  const boxingOpacity = useRef(new Animated.Value(0)).current;
  const boxingScale = useRef(new Animated.Value(0.3)).current;
  const boxingTranslateX = useRef(new Animated.Value(-100)).current;
  const boxingRotation = useRef(new Animated.Value(-15)).current;
  const boxingShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Brash entrance animation - delayed after elegant title
    Animated.sequence([
      Animated.delay(2500),
      Animated.parallel([
        Animated.timing(boxingOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(boxingScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(boxingTranslateX, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(boxingRotation, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onAnimDone) onAnimDone();
    });

    // Continuous pounding/shake effect
    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(boxingShake, {
          toValue: 1,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(boxingShake, {
          toValue: 0,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();
  }, [boxingOpacity, boxingScale, boxingTranslateX, boxingRotation, boxingShake]);

  return (
    <Animated.Text
      style={[
        styles.brashBoxingTitle,
        {
          opacity: boxingOpacity,
          transform: [
            { scale: boxingScale },
            { translateX: boxingTranslateX },
            {
              rotate: boxingRotation.interpolate({
                inputRange: [-15, 0],
                outputRange: ['-15deg', '0deg'],
              }),
            },
            {
              translateX: boxingShake.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 3],
              }),
            },
          ],
        },
      ]}
    >
      Boxing
    </Animated.Text>
  );
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

// Camera Flashes Component
const CameraFlashes = () => {
  const NUM_FLASHES = 15;
  const [flashes, setFlashes] = React.useState(
    Array.from({ length: NUM_FLASHES }, () => ({
      x: Math.random() * screenWidth,
      y: screenHeight * (0.1 + Math.random() * 0.55), // upper 2/3
      r: 16 + Math.random() * 10, // Assign radius once
      opacity: 0,
      active: false,
    }))
  );

  // Animated values for each flash
  const opacities = React.useRef(
    Array.from({ length: NUM_FLASHES }, () => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    function triggerFlash(i: number) {
      // Randomize position
      const newX = Math.random() * screenWidth;
      const newY = screenHeight * (0.1 + Math.random() * 0.55); // upper 2/3
      setFlashes(f => {
        const copy = [...f];
        copy[i] = { ...copy[i], x: newX, y: newY, active: true };
        return copy;
      });
      // Animate opacity: 0 -> 1 -> 0
      opacities[i].setValue(0);
      Animated.sequence([
        Animated.timing(opacities[i], {
          toValue: 1,
          duration: 80 + Math.random() * 60,
          useNativeDriver: false,
        }),
        Animated.timing(opacities[i], {
          toValue: 0,
          duration: 200 + Math.random() * 100,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setFlashes(f => {
          const copy = [...f];
          copy[i].active = false;
          return copy;
        });
        // Schedule next flash for this index
        timers[i] = setTimeout(() => triggerFlash(i), 400 + Math.random() * 1200);
      });
    }
    // Start all flashes at random intervals
    for (let i = 0; i < NUM_FLASHES; i++) {
      timers[i] = setTimeout(() => triggerFlash(i), Math.random() * 2000);
    }
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Group>
        {flashes.map((flash, i) => (
          <AnimatedCircleFlash key={i} x={flash.x} y={flash.y} r={flash.r} opacity={opacities[i]} />
        ))}
      </Group>
    </Canvas>
  );
};

// Animated Circle Flash (Skia + Animated)
const AnimatedCircleFlash = ({
  x,
  y,
  r,
  opacity,
}: {
  x: number;
  y: number;
  r: number;
  opacity: Animated.Value;
}) => {
  const [currentOpacity, setCurrentOpacity] = React.useState(0);
  React.useEffect(() => {
    const id = opacity.addListener(({ value }) => setCurrentOpacity(value));
    return () => opacity.removeListener(id);
  }, [opacity]);
  return (
    <SkiaPath path={Skia.Path.Make().addCircle(x, y, r)} style="fill" opacity={currentOpacity}>
      <LinearGradient
        start={vec(x, y)}
        end={vec(x, y + r)}
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
      />
    </SkiaPath>
  );
};

// Helper for overlay rectangle (Skia)
function makeOverlayRect(x: number, y: number, width: number, height: number) {
  const path = Skia.Path.Make();
  path.addRect({ x, y, width, height });
  return path;
}

// Skia Overlay with Eraser Spotlights
const OverlayWithSpotlights = ({ revealingMode = false }: { revealingMode?: boolean }) => {
  // Animate 3 beams sweeping from top
  const clock = useClock();
  // Beam configs
  const beams = [
    {
      baseX: screenWidth * 0.1, // Left corner
      baseY: 0,
      sweep: Math.PI / 8, // 22.5 degrees sweep
      speed: 0.0008,
      width: screenWidth * 0.18,
      length: screenHeight * 1.2,
      phase: 0,
    },
    {
      baseX: screenWidth * 0.5, // Center
      baseY: 0,
      sweep: Math.PI / 10, // 18 degrees sweep
      speed: 0.0005,
      width: screenWidth * 0.16,
      length: screenHeight * 1.2,
      phase: Math.PI / 3,
    },
    {
      baseX: screenWidth * 0.9, // Right corner
      baseY: 0,
      sweep: Math.PI / 8, // 22.5 degrees sweep
      speed: 0.001,
      width: screenWidth * 0.2,
      length: screenHeight * 1.2,
      phase: Math.PI / 1.5,
    },
  ];

  // Store angles in React state
  const [angles, setAngles] = React.useState([0, 0, 0]);

  React.useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      const c = clock.value; // Only read here, not in render
      setAngles(
        beams.map((b, i) => {
          // Use the same baseAngle logic as before
          let baseAngle;
          if (i === 0) {
            baseAngle = Math.PI / 2.8;
          } else if (i === 1) {
            baseAngle = Math.PI / 2.2;
          } else {
            baseAngle = Math.PI / 2.1;
          }
          return baseAngle + b.sweep * Math.sin(c * b.speed + b.phase);
        })
      );
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, [clock]);

  return (
    <Canvas style={[StyleSheet.absoluteFillObject, { zIndex: 3 }]} pointerEvents="none">
      {/* Overlay rectangle */}
      <SkiaPath
        path={makeOverlayRect(0, 0, screenWidth, screenHeight)}
        style="fill"
        color="rgba(0,0,0,0.7)"
      />
      {/* Eraser beams with glow and diffusion effects - only show in revealing mode */}
      {revealingMode &&
        beams.map((b, i) => {
          const { path, tip } = createBeamPath(b.baseX, b.baseY, angles[i], b.width, b.length);
          return (
            <SkiaPath key={i} path={path} style="fill" blendMode="clear">
              <LinearGradient
                start={vec(b.baseX, b.baseY)}
                end={vec(tip.x, tip.y)}
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']}
                positions={[0, 0.6, 1]}
              />
            </SkiaPath>
          );
        })}
    </Canvas>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenAudioDebug,
  onOpenUIDebug,
  debugMode,
  onToggleDebugMode,
}) => {
  const { getEffectiveVolume, startMainTheme, isMainThemePlaying } = useAudio();

  // Fade-in animation for the entire menu
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fadeInComplete, setFadeInComplete] = React.useState(false);

  // Animated values for each beam (3 per corner)
  const leftAnims = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);
  const rightAnims = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  // UI visibility toggle for debugging
  const [showUI, setShowUI] = React.useState(true);
  // Spotlight mode toggle
  const [revealingSpotlights, setRevealingSpotlights] = React.useState(true);
  // Add state for tap-to-start overlay
  const [showTapToStart, setShowTapToStart] = React.useState(false); // initially false
  // Add state for flash sequence
  const [flashing, setFlashing] = React.useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  // Animated opacity for flashing Tap to Start
  const tapToStartOpacity = useRef(new Animated.Value(1)).current;
  // Track if menu area is allowed to render at all
  const [menuAreaReady, setMenuAreaReady] = React.useState(false);

  // Boxer image slide-in animation
  const boxerTranslateX = useRef(new Animated.Value(screenWidth * 0.7)).current; // start off-screen right (mirrored)
  const [boxerVisible, setBoxerVisible] = React.useState(false);
  const [boxerBehindOverlay, setBoxerBehindOverlay] = React.useState(false);

  const insets = useSafeAreaInsets();

  const punchSoundRef = React.useRef<Audio.Sound | null>(null);
  const bellSoundRef = React.useRef<Audio.Sound | null>(null);
  const crowdCheerRef = React.useRef<Audio.Sound | null>(null);

  // Start fade-in animation when component mounts
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setFadeInComplete(true);
    });
  }, [fadeAnim]);

  React.useEffect(() => {
    // Only start animations and load audio after fade-in is complete
    if (!fadeInComplete) return;

    // Preload punch sound
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

    // Preload bell sound
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

    // Load and play crowd cheer sound
    const loadAndPlayCrowdCheer = async () => {
      try {
        const crowdCheer = new Audio.Sound();
        await crowdCheer.loadAsync(require('../../assets/main_menu/crowd_cheer.mp3'));
        const effectiveVolume = getEffectiveVolume('sfx');
        await crowdCheer.setVolumeAsync(effectiveVolume);
        await crowdCheer.playAsync();
        crowdCheerRef.current = crowdCheer;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error loading/playing crowd cheer sound:', e);
      }
    };
    loadAndPlayCrowdCheer();

    return () => {
      if (punchSoundRef.current) {
        punchSoundRef.current.unloadAsync();
      }
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync();
      }
      if (crowdCheerRef.current) {
        crowdCheerRef.current.stopAsync();
        crowdCheerRef.current.unloadAsync();
      }
    };
  }, [fadeInComplete, getEffectiveVolume]);

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

  // Helper to run the flash sequence
  const runFlashSequence = () => {
    setFlashing(true);
    setBoxerVisible(true);
    // Animate boxer sliding in during flashes
    Animated.timing(boxerTranslateX, {
      toValue: 0, // snapped to right edge
      duration: 440, // match total flash duration
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // Sequence: flash white 3 times
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setFlashing(false);
      setShowTapToStart(true);
      setMenuAreaReady(true);
      setBoxerBehindOverlay(true);
    });
  };

  // Track when the boxing animation is done
  const [boxingAnimDone, setBoxingAnimDone] = React.useState(false);

  // When boxing animation is done, run the flash sequence
  useEffect(() => {
    if (boxingAnimDone && fadeInComplete) {
      runFlashSequence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxingAnimDone, fadeInComplete]);

  useEffect(() => {
    // Only start beam animations after fade-in is complete
    if (!fadeInComplete) return;

    leftAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + i * 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + i * 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
    rightAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3200 + i * 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3200 + i * 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
  }, [fadeInComplete, leftAnims, rightAnims]);

  // Animate Tap to Start flashing
  useEffect(() => {
    if (showTapToStart) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tapToStartOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(tapToStartOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      tapToStartOpacity.setValue(1);
    }
  }, [showTapToStart]);

  // Handler for tap-to-start overlay
  const handleTapToStart = async () => {
    await playBellSound();
    setShowTapToStart(false);
  };

  // Start main theme music after fade-in is complete
  useEffect(() => {
    if (fadeInComplete && !isMainThemePlaying) {
      startMainTheme();
    }
  }, [fadeInComplete, isMainThemePlaying, startMainTheme]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ImageBackground
        source={require('../../assets/main_menu/boxing_ring.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Camera Flashes: above background, below overlay */}
        <CameraFlashes />

        {/* Skia Canvas for stage light beams - show in both modes */}
        <Canvas style={StyleSheet.absoluteFillObject}>
          <AnimatedStageBeams
            corner="left"
            anims={leftAnims}
            maxBeams={revealingSpotlights ? 1 : 3}
          />
          <AnimatedStageBeams
            corner="right"
            anims={rightAnims}
            maxBeams={revealingSpotlights ? 1 : 3}
          />
        </Canvas>

        {/* Boxer image slides in during flashes, then moves behind overlay */}
        {boxerVisible && (
          <Animated.Image
            source={BoxerImg}
            style={[
              styles.boxerImage,
              {
                transform: [{ translateX: boxerTranslateX }, { scaleX: -1 }, { scale: 1.35 }],
                right: 0,
                left: undefined,
              },
            ]}
            resizeMode="contain"
          />
        )}

        {/* Skia overlay - always present to cover boxer image */}
        <OverlayWithSpotlights revealingMode={revealingSpotlights} />

        {/* Hide UI toggle button (always visible, above overlay) */}
        <TouchableOpacity
          style={[styles.hideUIButton, { top: insets.top + 12, zIndex: 10 }]}
          onPress={() => setShowUI(v => !v)}
        >
          <Text style={styles.hideUIButtonText}>{showUI ? 'Hide UI' : 'Show UI'}</Text>
        </TouchableOpacity>

        {/* Spotlight mode toggle button */}
        <TouchableOpacity
          style={[styles.spotlightToggleButton, { top: insets.top + 12, left: 20, zIndex: 10 }]}
          onPress={() => setRevealingSpotlights(v => !v)}
        >
          <Text style={styles.hideUIButtonText}>
            {revealingSpotlights ? 'Show Regular Spotlights' : 'Show Revealing Spotlights'}
          </Text>
        </TouchableOpacity>

        {/* White flash overlay */}
        {flashing && (
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />
        )}

        {/* All other UI is hidden when showUI is false or tap-to-start is active */}
        {showUI && (
          <View style={styles.contentContainer}>
            {/* Animated Titles */}
            <View style={styles.titleContainer}>
              <ElegantTitle />
              <BrashBoxingTitle onAnimDone={() => setBoxingAnimDone(true)} />
            </View>

            {/* Menu area: show Tap to Start or menu buttons */}
            {menuAreaReady && (
              <View style={styles.menuContainer}>
                {showTapToStart ? (
                  <TouchableOpacity
                    style={styles.tapToStartMenuArea}
                    activeOpacity={1}
                    onPress={handleTapToStart}
                  >
                    <Animated.Text style={[styles.tapToStartText, { opacity: tapToStartOpacity }]}>
                      Tap to Start
                    </Animated.Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <AnimatedButton
                      style={styles.button}
                      onPress={async () => {
                        await playPunchSound();
                        onStartGame('arcade');
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>Arcade Mode</Text>
                    </AnimatedButton>

                    <AnimatedButton
                      style={styles.button}
                      onPress={async () => {
                        await playPunchSound();
                        onStartGame('endless');
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>Endless</Text>
                    </AnimatedButton>

                    <AnimatedButton
                      style={[styles.button, styles.settingsButton]}
                      onPress={async () => {
                        await playPunchSound();
                        onOpenSettings();
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>Settings</Text>
                    </AnimatedButton>

                    <AnimatedButton
                      style={[styles.button, styles.audioDebugButton]}
                      onPress={async () => {
                        await playPunchSound();
                        onOpenAudioDebug();
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>Audio Debug</Text>
                    </AnimatedButton>

                    <AnimatedButton
                      style={[styles.button, styles.uiDebugButton]}
                      onPress={async () => {
                        await playPunchSound();
                        onOpenUIDebug();
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>UI Debug</Text>
                    </AnimatedButton>

                    {/* Debug Mode Toggle */}
                    <AnimatedButton
                      style={[
                        styles.button,
                        styles.debugButton,
                        debugMode && styles.debugButtonActive,
                      ]}
                      onPress={async () => {
                        await playPunchSound();
                        onToggleDebugMode();
                      }}
                      delay={0}
                      instant={true}
                    >
                      <Text style={styles.buttonText}>
                        {debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
                      </Text>
                    </AnimatedButton>

                    {/* Instructions: Only show with menu buttons */}
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>How to Play:</Text>
                      <Text style={styles.instruction}>• Tap to hit targets in the hit zone</Text>
                      <Text style={styles.instruction}>• Swipe up for power hits</Text>
                      <Text style={styles.instruction}>• Perfect timing = more points</Text>
                      <Text style={styles.instruction}>• Don't let targets pass the line!</Text>
                      {debugMode && (
                        <Text style={styles.debugInstruction}>
                          • Debug mode shows hit zones and game info
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ImageBackground>
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
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay for dramatic lighting
    zIndex: 3,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 60,
    zIndex: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  elegantTitle: {
    fontSize: 56,
    fontWeight: '300', // Lighter weight for elegance
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 8, // Elegant spacing
    fontFamily: 'System',
  },
  glowLayer: {
    position: 'absolute',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    zIndex: 1,
  },
  brashBoxingTitle: {
    fontSize: 48,
    fontWeight: '900', // Heavy weight for impact
    color: '#ff4400',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'System',
  },
  menuContainer: {
    alignItems: 'center',
    gap: 20,
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
    backgroundColor: '#ff8800',
    borderColor: '#ff00ff',
  },
  audioDebugButton: {
    backgroundColor: '#000000',
    borderColor: '#ff00ff',
  },
  uiDebugButton: {
    backgroundColor: '#000000',
    borderColor: '#ff00ff',
  },
  debugButton: {
    backgroundColor: '#00ff00',
    borderColor: '#ff00ff',
  },
  debugButtonActive: {
    backgroundColor: '#ff0000',
    borderColor: '#ffff00',
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  instructionsTitle: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'System',
  },
  instruction: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  debugInstruction: {
    color: '#00ff00',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  hideUIButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#ff00ff',
    padding: 10,
    borderRadius: 8,
  },
  spotlightToggleButton: {
    position: 'absolute',
    left: 20,
    backgroundColor: '#00ff00',
    padding: 10,
    borderRadius: 8,
  },
  hideUIButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  tapToStartOverlay: {
    // (no longer used)
  },
  tapToStartContent: {
    // (no longer used)
  },
  tapToStartText: {
    color: '#00ffff',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 2,
    padding: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  tapToStartMenuArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    paddingVertical: 40,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 30,
  },
  boxerImage: {
    position: 'absolute',
    bottom: -screenHeight * 0.07, // lower below the screen edge
    right: 0,
    width: screenWidth * 0.7,
    aspectRatio: 0.7, // maintain image proportions (adjust as needed)
    maxHeight: screenHeight,
    zIndex: 0, // always below overlay
  },
});

export default MainMenu;
