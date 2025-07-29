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
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>3D Model Viewer</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 3D Model Container */}
        <View style={styles.modelContainer}>
          <FilamentScene>
            <Model3DView />
          </FilamentScene>
        </View>

        {/* Controls Area */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsTitle}>Controls:</Text>
          <Text style={styles.controlText}>• Touch and drag to rotate camera</Text>
          <Text style={styles.controlText}>• Pinch to zoom</Text>
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
    orbitHomePosition: [0, 0, 5], // Camera position
    targetPosition: [0, 0, 0], // Looking at origin
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

        {/* 3D Model */}
        <Model source={require('../../assets/models/model.glb')} transformToUnitCube />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#ff00ff',
  },
  backButton: {
    backgroundColor: '#ff00ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffff',
    minWidth: 80,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  title: {
    color: '#00ffff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 80,
  },
  modelContainer: {
    flex: 1,
    backgroundColor: '#111111',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#ff00ff',
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
});

export default Model3DScreen;
