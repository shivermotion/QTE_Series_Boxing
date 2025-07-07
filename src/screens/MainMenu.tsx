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
} from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
}: {
  corner: 'left' | 'right';
  anims: Animated.Value[];
}) => {
  // corner: 'left' or 'right'
  // anims: array of Animated.Value (one per beam)
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
        // Animate angle between -delta and +delta around baseAngle
        const delta = Math.PI / 12; // 15 degrees sweep
        // Use Animated for angle, but Skia expects a number, so we need to use listeners
        const [angle, setAngle] = React.useState<number>(baseAngles[i]);
        useEffect(() => {
          const id = anim.addListener(({ value }: { value: number }) => {
            setAngle(baseAngles[i] - delta + value * delta * 2);
          });
          return () => anim.removeListener(id);
        }, [anim]);
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
const BrashBoxingTitle: React.FC = () => {
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
    ]).start();

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

// Animated Button Component
const AnimatedButton: React.FC<{
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  delay?: number;
}> = ({ onPress, style, children, delay = 0 }) => {
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [buttonOpacity, buttonScale, delay]);

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

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenAudioDebug,
  onOpenUIDebug,
  debugMode,
  onToggleDebugMode,
}) => {
  // Animated values for each beam (3 per corner)
  const leftAnims = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);
  const rightAnims = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  // UI visibility toggle for debugging
  const [showUI, setShowUI] = React.useState(true);

  const insets = useSafeAreaInsets();

  useEffect(() => {
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
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/main_menu/boxing_ring.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Camera Flashes: above background, below overlay */}
        <CameraFlashes />

        {/* Skia Canvas for stage light beams */}
        <Canvas style={StyleSheet.absoluteFillObject}>
          <AnimatedStageBeams corner="left" anims={leftAnims} />
          <AnimatedStageBeams corner="right" anims={rightAnims} />
        </Canvas>

        {/* Overlay for readability */}
        <View style={styles.overlay} />

        {/* Hide UI toggle button (always visible, above overlay) */}
        <TouchableOpacity
          style={[styles.hideUIButton, { top: insets.top + 12, zIndex: 10 }]}
          onPress={() => setShowUI(v => !v)}
        >
          <Text style={styles.hideUIButtonText}>{showUI ? 'Hide UI' : 'Show UI'}</Text>
        </TouchableOpacity>

        {/* All other UI is hidden when showUI is false */}
        {showUI && (
          <View style={styles.contentContainer}>
            {/* Animated Titles */}
            <View style={styles.titleContainer}>
              <ElegantTitle />
              <BrashBoxingTitle />
            </View>

            {/* Menu buttons */}
            <View style={styles.menuContainer}>
              <AnimatedButton style={styles.button} onPress={() => onStartGame('arcade')} delay={0}>
                <Text style={styles.buttonText}>Arcade Mode</Text>
              </AnimatedButton>

              <AnimatedButton
                style={styles.button}
                onPress={() => onStartGame('endless')}
                delay={100}
              >
                <Text style={styles.buttonText}>Endless</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.button, styles.settingsButton]}
                onPress={onOpenSettings}
                delay={200}
              >
                <Text style={styles.buttonText}>Settings</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.button, styles.audioDebugButton]}
                onPress={onOpenAudioDebug}
                delay={300}
              >
                <Text style={styles.buttonText}>Audio Debug</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.button, styles.uiDebugButton]}
                onPress={onOpenUIDebug}
                delay={400}
              >
                <Text style={styles.buttonText}>UI Debug</Text>
              </AnimatedButton>

              {/* Debug Mode Toggle */}
              <AnimatedButton
                style={[styles.button, styles.debugButton, debugMode && styles.debugButtonActive]}
                onPress={onToggleDebugMode}
                delay={500}
              >
                <Text style={styles.buttonText}>
                  {debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
                </Text>
              </AnimatedButton>
            </View>

            {/* Instructions */}
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
          </View>
        )}
      </ImageBackground>
    </View>
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
  },
  instruction: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  debugInstruction: {
    color: '#00ff00',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hideUIButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#ff00ff',
    padding: 10,
    borderRadius: 8,
  },
  hideUIButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainMenu;
