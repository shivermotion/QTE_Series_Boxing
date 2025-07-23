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
  Platform,
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
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import BoxerImg from '../../assets/main_menu/boxer.png';
import SilhouetteImg from '../../assets/main_menu/silhouette.png';
import RingGirl1Img from '../../assets/main_menu/ring_girl_1.png';
import RingGirl2Img from '../../assets/main_menu/ring_girl_2.png';
import RefImg from '../../assets/main_menu/ref.png';

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
      : [(125 * Math.PI) / 180, (125 * Math.PI) / 180, (125 * Math.PI) / 180]; // 125 degrees for right beams

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

// Skia Title Image Component
const SkiaTitleImage = ({
  opacity,
  scale,
  translateY,
}: {
  opacity: Animated.Value;
  scale: Animated.Value;
  translateY: Animated.Value;
}) => {
  const image = useImage(require('../../assets/main_menu/pocket_knockout.png'));
  const [currentOpacity, setCurrentOpacity] = React.useState(1);
  const [currentScale, setCurrentScale] = React.useState(4.0);
  const [currentTranslateY, setCurrentTranslateY] = React.useState(-screenHeight * 0.8);

  React.useEffect(() => {
    const opacityId = opacity.addListener(({ value }) => setCurrentOpacity(value));
    const scaleId = scale.addListener(({ value }) => setCurrentScale(value));
    const translateYId = translateY.addListener(({ value }) => setCurrentTranslateY(value));

    return () => {
      opacity.removeListener(opacityId);
      scale.removeListener(scaleId);
      translateY.removeListener(translateYId);
    };
  }, [opacity, scale, translateY]);

  if (!image) {
    return null;
  }

  const imageWidth = screenWidth * 1.1;
  const imageHeight = imageWidth * (image.height() / image.width());
  const x = (screenWidth - imageWidth * currentScale) / 2; // Keep perfectly centered
  const y = screenHeight * 0.1 + currentTranslateY; // Ever so slightly raised position

  return (
    <>
      <SkiaImage
        image={image}
        x={x}
        y={y}
        width={imageWidth * currentScale}
        height={imageHeight * currentScale}
        opacity={currentOpacity}
      />
      <ShimmeringTwinkle
        x={x + imageWidth * currentScale * 0.9}
        y={y + imageHeight * currentScale * 0.3}
        scale={currentScale}
      />
    </>
  );
};

// Shimmering Twinkle Component
const ShimmeringTwinkle = ({ x, y, scale }: { x: number; y: number; scale: number }) => {
  const clock = useClock();
  const [twinkleOpacity, setTwinkleOpacity] = React.useState(0);
  const [twinkleScale, setTwinkleScale] = React.useState(0.5);
  const [twinkleRotation, setTwinkleRotation] = React.useState(0);

  React.useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      const time = clock.value;
      // Twinkle opacity animation (0 -> 1 -> 0)
      const opacityCycle = Math.sin(time * 0.003) * 0.5 + 0.5;
      setTwinkleOpacity(opacityCycle);
      // Twinkle scale animation (0.5 -> 1.2 -> 0.5)
      const scaleCycle = Math.sin(time * 0.002) * 0.35 + 0.85;
      setTwinkleScale(scaleCycle);
      // Twinkle rotation animation
      setTwinkleRotation(time * 0.001);
      requestAnimationFrame(animate);
    }
    animate();
    return () => {
      running = false;
    };
  }, [clock]);

  const twinkleSize = 20 * scale * twinkleScale;
  const twinklePath = Skia.Path.Make();
  // Create a star-like twinkle shape
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const radius = i % 2 === 0 ? twinkleSize : twinkleSize * 0.5;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) {
      twinklePath.moveTo(px, py);
    } else {
      twinklePath.lineTo(px, py);
    }
  }
  twinklePath.close();

  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: twinkleRotation }]}>
      <SkiaPath path={twinklePath} style="fill" opacity={twinkleOpacity}>
        <LinearGradient
          start={vec(-twinkleSize, -twinkleSize)}
          end={vec(twinkleSize, twinkleSize)}
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
          positions={[0, 0.5, 1]}
        />
      </SkiaPath>
    </Group>
  );
};

// Bright Gleam Component
const BrightGleam = ({ flashAnim }: { flashAnim: Animated.Value }) => {
  const [currentOpacity, setCurrentOpacity] = React.useState(0);
  const clock = useClock();

  React.useEffect(() => {
    const id = flashAnim.addListener(({ value }) => setCurrentOpacity(value));
    return () => flashAnim.removeListener(id);
  }, [flashAnim]);

  // Create a full-screen flash gleam
  const gleamPath = Skia.Path.Make();

  // Full screen rectangle
  gleamPath.addRect({ x: 0, y: 0, width: screenWidth, height: screenHeight });

  return (
    <SkiaPath path={gleamPath} style="fill" opacity={currentOpacity}>
      <LinearGradient
        start={vec(0, 0)}
        end={vec(screenWidth, screenHeight)}
        colors={[
          'rgba(255,255,255,0.3)',
          'rgba(255,255,255,0.8)',
          'rgba(255,255,255,1)',
          'rgba(255,255,255,0.8)',
          'rgba(255,255,255,0.3)',
        ]}
        positions={[0, 0.2, 0.5, 0.8, 1]}
      />
    </SkiaPath>
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
    <Canvas
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 2,
          // Android-specific pointer events
          ...(Platform.OS === 'android' && { pointerEvents: 'box-none' }),
        },
      ]}
      pointerEvents={Platform.OS === 'android' ? 'box-none' : 'none'}
    >
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

  // Silhouette image slide-in animation
  const silhouetteTranslateX = useRef(new Animated.Value(-screenWidth * 0.7)).current; // start off-screen left
  const [silhouetteVisible, setSilhouetteVisible] = React.useState(false);

  // Ring girls slide-in animation
  const ringGirl1TranslateX = useRef(new Animated.Value(-screenWidth * 0.8)).current; // start further off-screen left
  const ringGirl2TranslateX = useRef(new Animated.Value(-screenWidth * 0.9)).current; // start even further off-screen left
  const [ringGirlsVisible, setRingGirlsVisible] = React.useState(false);

  // Ref image slide-in animation
  const refTranslateX = useRef(new Animated.Value(-screenWidth * 0.6)).current; // start off-screen left
  const [refVisible, setRefVisible] = React.useState(false);

  // Title image animations
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleScale = useRef(new Animated.Value(4.0)).current;
  const titleTranslateY = useRef(new Animated.Value(-screenHeight * 0.8)).current;

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
    setSilhouetteVisible(true);
    setRingGirlsVisible(true);
    setRefVisible(true);

    // Animate boxer sliding in during flashes (fastest - foreground layer)
    Animated.timing(boxerTranslateX, {
      toValue: 0, // snapped to right edge
      duration: 280, // fastest duration for parallax effect
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animate silhouette sliding in from left to center (slowest - background layer)
    Animated.timing(silhouetteTranslateX, {
      toValue: (screenWidth - screenWidth * 1.5) / 2, // center the large silhouette
      duration: 600, // slower duration for parallax effect
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animate ring girls sliding in (medium speed - middle layer)
    Animated.timing(ringGirl1TranslateX, {
      toValue: (screenWidth - screenWidth * 0.8) / 2 - 50, // slightly to the left of center
      duration: 480, // medium duration for parallax effect
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(ringGirl2TranslateX, {
      toValue: (screenWidth - screenWidth * 0.8) / 2 + 50, // slightly to the right of center
      duration: 480, // medium duration for parallax effect
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animate ref sliding in from left to left side (fastest - foreground layer)
    Animated.timing(refTranslateX, {
      toValue: -screenWidth * 0.1, // move further left
      duration: 360, // faster duration for parallax effect
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

  // Helper to run the punch-in animation
  const runPunchInAnimation = () => {
    // Start title image straight-down drop with powerful impact
    Animated.sequence([
      // Fast drop down
      Animated.parallel([
        Animated.timing(titleScale, {
          toValue: 1.0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      // Impact bounce
      Animated.parallel([
        Animated.timing(titleScale, {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(titleTranslateY, {
          toValue: -20,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      // Settle back
      Animated.parallel([
        Animated.timing(titleScale, {
          toValue: 1.0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      // Start flash sequence after impact completes
      runFlashSequence();
    });
  };

  // Track when the fade-in is complete to start the punch-in animation
  useEffect(() => {
    if (fadeInComplete) {
      // Add a delay before starting the punch-in animation to match the original timing
      const timer = setTimeout(() => {
        runPunchInAnimation();
      }, 500); // 500ms delay to match original title animation timing

      return () => clearTimeout(timer);
    }
  }, [fadeInComplete]);

  useEffect(() => {
    // Only start beam animations after fade-in is complete
    if (!fadeInComplete) return;

    leftAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2800 + i * 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2800 + i * 800,
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
            duration: 3600 + i * 400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3600 + i * 400,
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

        {/* Skia Canvas for stage light beams - behind silhouette */}
        <Canvas
          style={[
            StyleSheet.absoluteFillObject,
            {
              zIndex: 0, // same layer as silhouette, but rendered first
              // Android-specific pointer events
              ...(Platform.OS === 'android' && { pointerEvents: 'box-none' }),
            },
          ]}
          pointerEvents={Platform.OS === 'android' ? 'box-none' : 'none'}
        >
          <AnimatedStageBeams corner="left" anims={leftAnims} maxBeams={1} />
          <AnimatedStageBeams corner="right" anims={rightAnims} maxBeams={1} />
        </Canvas>

        {/* Ref image slides in from left to left side */}
        {refVisible && (
          <Animated.Image
            source={RefImg}
            style={[
              styles.refImage,
              {
                transform: [{ translateX: refTranslateX }],
              },
            ]}
            resizeMode="contain"
          />
        )}

        {/* Silhouette image slides in from left to center */}
        {silhouetteVisible && (
          <Animated.Image
            source={SilhouetteImg}
            style={[
              styles.silhouetteImage,
              {
                transform: [{ translateX: silhouetteTranslateX }],
              },
            ]}
            resizeMode="contain"
          />
        )}

        {/* Dark Overlay Layer */}
        <View style={styles.darkOverlay} />

        {/* Ring girls slide in from left */}
        {ringGirlsVisible && (
          <>
            <Animated.Image
              source={RingGirl1Img}
              style={[
                styles.ringGirlImage,
                {
                  transform: [{ translateX: ringGirl1TranslateX }],
                },
              ]}
              resizeMode="contain"
            />
            <Animated.Image
              source={RingGirl2Img}
              style={[
                styles.ringGirlImage,
                {
                  transform: [{ translateX: ringGirl2TranslateX }, { scaleX: -1 }],
                },
              ]}
              resizeMode="contain"
            />
          </>
        )}

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
        <OverlayWithSpotlights revealingMode={true} />

        {/* Bright gleam effect */}
        {flashing && (
          <Canvas
            style={[
              StyleSheet.absoluteFillObject,
              {
                zIndex: 4,
                // Android-specific pointer events
                ...(Platform.OS === 'android' && { pointerEvents: 'box-none' }),
              },
            ]}
            pointerEvents={Platform.OS === 'android' ? 'box-none' : 'none'}
          >
            <BrightGleam flashAnim={flashAnim} />
          </Canvas>
        )}

        {/* All other UI is hidden when tap-to-start is active */}
        {
          <View style={[styles.contentContainer, { zIndex: 6 }]}>
            {/* Skia Title Image - on top layer */}
            <Canvas
              style={[
                StyleSheet.absoluteFillObject,
                {
                  zIndex: 5,
                  // Android-specific pointer events
                  ...(Platform.OS === 'android' && { pointerEvents: 'box-none' }),
                },
              ]}
              pointerEvents={Platform.OS === 'android' ? 'box-none' : 'none'}
            >
              <SkiaTitleImage
                opacity={titleOpacity}
                scale={titleScale}
                translateY={titleTranslateY}
              />
            </Canvas>

            {/* Menu area: show Tap to Start or menu buttons */}
            {menuAreaReady && (
              <View style={[styles.menuContainer, { zIndex: 7 }]}>
                {showTapToStart ? (
                  <TouchableOpacity
                    style={[
                      styles.tapToStartMenuArea,
                      {
                        zIndex: 8,
                        // Android-specific improvements
                        ...(Platform.OS === 'android' && {
                          minHeight: 400,
                          paddingVertical: 60,
                          backgroundColor: 'rgba(0,0,0,0.05)', // Slightly more visible on Android
                        }),
                      },
                    ]}
                    activeOpacity={0.8}
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
        }
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
    justifyContent: 'flex-end',
    paddingVertical: 60,
    zIndex: 4,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  darkOverlay: {
    position: 'absolute',
    top: screenHeight * 0.66, // starts at 66% height
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // dark overlay
    zIndex: 0, // same layer as silhouette
  },
  silhouetteImage: {
    position: 'absolute',
    top: screenHeight * 0.2, // raise it higher up
    width: screenWidth * 1.5, // much larger, will overflow
    aspectRatio: 0.08, // make it EXTREMELY taller
    maxHeight: screenHeight * 8, // allow extreme overflow
    zIndex: 0, // bottom layer (3rd layer)
  },
  refImage: {
    position: 'absolute',
    top: screenHeight * 0.3, // raise it higher up
    width: screenWidth * 0.7, // larger size
    aspectRatio: 0.8,
    maxHeight: screenHeight * 0.8, // larger max height
    zIndex: 1, // middle layer (2nd layer)
  },
  ringGirlImage: {
    position: 'absolute',
    bottom: -screenHeight * 0.2, // lower position
    width: screenWidth * 0.4, // make smaller
    aspectRatio: 0.6,
    maxHeight: screenHeight * 0.6, // smaller max height
    zIndex: 1, // middle layer (2nd layer)
  },

  boxerImage: {
    position: 'absolute',
    bottom: -screenHeight * 0.07, // lower below the screen edge
    right: 0,
    width: screenWidth * 0.7,
    aspectRatio: 0.7, // maintain image proportions (adjust as needed)
    maxHeight: screenHeight,
    zIndex: 5, // same layer as title image (top layer)
  },
});

export default MainMenu;
