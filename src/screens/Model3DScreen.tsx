import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useAudio } from '../contexts/AudioContext';
import {
  FilamentScene,
  FilamentView,
  Light,
  Model,
  Camera,
  useCameraManipulator,
  DefaultLight,
} from 'react-native-filament';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Model3DScreenProps {
  onBackToMenu: () => void;
}

const Model3DScreen: React.FC<Model3DScreenProps> = ({ onBackToMenu }) => {
  const insets = useSafeAreaInsets();
  const { getEffectiveVolume } = useAudio();
  const punchSoundRef = React.useRef<Audio.Sound | null>(null);

  // Preload punch sound
  React.useEffect(() => {
    const loadPunch = async () => {
      try {
        const punch = new Audio.Sound();
        await punch.loadAsync(require('../../assets/audio/punch_1.mp3'));
        punchSoundRef.current = punch;
      } catch (e) {
        console.log('Error preloading punch sound:', e);
      }
    };
    loadPunch();

    return () => {
      if (punchSoundRef.current) {
        punchSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const playPunchSound = async () => {
    try {
      if (punchSoundRef.current) {
        const effectiveVolume = getEffectiveVolume('sfx');
        await punchSoundRef.current.setVolumeAsync(effectiveVolume);
        await punchSoundRef.current.replayAsync();
      }
    } catch (e) {
      console.log('Error playing punch sound:', e);
    }
  };

  const handleBackPress = async () => {
    await playPunchSound();
    onBackToMenu();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 3D Scene - Full Screen */}
        <View style={styles.fullScreenScene}>
          <FilamentScene>
            <Model3DView />
          </FilamentScene>
        </View>

        {/* UI Overlay */}
        <View style={styles.uiOverlay}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonOverlay}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Minimal Stats Panel */}
          <View style={styles.minimalStatsPanel}>
            <View style={styles.statRow}>
              <Text style={styles.minimalStatLabel}>HP</Text>
              <View style={styles.minimalStatBar}>
                <View style={[styles.minimalStatFill, { width: '85%' }]} />
              </View>
              <Text style={styles.minimalStatValue}>85</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.minimalStatLabel}>SP</Text>
              <View style={styles.minimalStatBar}>
                <View style={[styles.minimalStatFill, { width: '60%' }]} />
              </View>
              <Text style={styles.minimalStatValue}>60</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.minimalStatLabel}>PWR</Text>
              <View style={styles.minimalStatBar}>
                <View style={[styles.minimalStatFill, { width: '90%' }]} />
              </View>
              <Text style={styles.minimalStatValue}>90</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.minimalStatLabel}>SPD</Text>
              <View style={styles.minimalStatBar}>
                <View style={[styles.minimalStatFill, { width: '75%' }]} />
              </View>
              <Text style={styles.minimalStatValue}>75</Text>
            </View>
          </View>

          {/* Equipment Panel - Bottom */}
          <View style={styles.bottomEquipmentPanel}>
            <Text style={styles.equipmentPanelTitle}>EQUIPMENT</Text>

            <View style={styles.equipmentGrid}>
              <View style={styles.equipmentSlot}>
                <Text style={styles.equipmentSlotLabel}>WEAPON</Text>
                <Text style={styles.equipmentSlotName}>Iron Fist</Text>
                <Text style={styles.equipmentSlotStats}>ATK: 45 | CRIT: 15%</Text>
              </View>

              <View style={styles.equipmentSlot}>
                <Text style={styles.equipmentSlotLabel}>ARMOR</Text>
                <Text style={styles.equipmentSlotName}>Leather Vest</Text>
                <Text style={styles.equipmentSlotStats}>DEF: 25 | SPD: +5</Text>
              </View>

              <View style={styles.equipmentSlot}>
                <Text style={styles.equipmentSlotLabel}>ACCESSORY</Text>
                <Text style={styles.equipmentSlotName}>Power Ring</Text>
                <Text style={styles.equipmentSlotStats}>ATK: +10 | HP: +20</Text>
              </View>

              <View style={styles.equipmentSlot}>
                <Text style={styles.equipmentSlotLabel}>SPECIAL</Text>
                <Text style={styles.equipmentSlotName}>Dragon Punch</Text>
                <Text style={styles.equipmentSlotStats}>DMG: 120 | COST: 50 SP</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

// Separate component for the 3D view to use Filament context
const Model3DView: React.FC = () => {
  const [viewHeight, setViewHeight] = React.useState(0);

  // Camera manipulator setup
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: [0, 1.5, 5], // Camera position
    targetPosition: [0.5, 1, 0.5], // Looking at origin
    orbitSpeed: [0.003, 0.003],
  });

  // Pan gesture for camera rotation
  const panGesture = Gesture.Pan()
    .onBegin(event => {
      const yCorrected = viewHeight - event.y;
      cameraManipulator?.grabBegin(event.x, yCorrected, false); // false = rotation mode
    })
    .onUpdate(event => {
      const yCorrected = viewHeight - event.y;
      cameraManipulator?.grabUpdate(event.x, yCorrected);
    })
    .onEnd(() => {
      cameraManipulator?.grabEnd();
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch().onUpdate(event => {
    if (cameraManipulator) {
      const zoomSpeed = 0.1;
      const zoomDelta = (1 - event.scale) * zoomSpeed;
      cameraManipulator.scroll(0, 0, zoomDelta);
    }
  });

  // Combine gestures
  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  return (
    <GestureDetector gesture={composedGestures}>
      <FilamentView
        style={{ flex: 1 }}
        onLayout={event => {
          setViewHeight(event.nativeEvent.layout.height);
        }}
      >
        {/* Use default light which includes IBL and directional light */}
        <DefaultLight />

        {/* Ring Platform */}
        <Model
          source={require('../../assets/models/ring.glb')}
          translate={[6.5, -4, 10]}
          scale={[0.25, 0.25, 0.25]}
        />

        {/* Boxer Model */}
        <Model
          source={require('../../assets/models/boxer.glb')}
          translate={[0, 0, 0]}
          scale={[2, 2, 2]}
        />

        {/* Camera */}
        <Camera cameraManipulator={cameraManipulator} />
      </FilamentView>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenScene: {
    flex: 1,
    backgroundColor: '#111111',
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    minWidth: 80,
    alignItems: 'center',
    zIndex: 1000,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff00ff',
  },
  controlsTitle: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 10,
  },
  controlText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 5,
  },
  minimalStatsPanel: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalStatLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
    width: 35,
  },
  minimalStatBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  minimalStatFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  minimalStatValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'System',
    width: 30,
    textAlign: 'right',
  },
  bottomEquipmentPanel: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#00ffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  equipmentPanelTitle: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  equipmentSlot: {
    width: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  equipmentSlotLabel: {
    color: '#00ffff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  equipmentSlotName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
  },

  statBarWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  statLabel: {
    color: '#00ffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  statBarBackground: {
    height: 12,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 0,
    position: 'relative',
  },
  healthBar: {
    backgroundColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  staminaBar: {
    backgroundColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  powerBar: {
    backgroundColor: '#ff8800',
    shadowColor: '#ff8800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  speedBar: {
    backgroundColor: '#0088ff',
    shadowColor: '#0088ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: 'bold',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  retroHeader: {
    color: '#00ffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
    paddingBottom: 8,
  },
  statBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  equipmentButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 3,
    borderColor: '#00ffff',
    borderRadius: 0,
    padding: 15,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  equipmentButtonInner: {
    alignItems: 'center',
  },
  equipmentButtonText: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    textShadowColor: '#00ffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
    marginBottom: 4,
  },
  equipmentButtonSubtext: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'System',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },

  equipmentSlotStats: {
    color: '#cccccc',
    fontSize: 9,
    fontFamily: 'System',
  },
});

export default Model3DScreen;
