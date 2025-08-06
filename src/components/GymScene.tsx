import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  FilamentView,
  DefaultLight,
  Model,
  Camera,
  useCameraManipulator,
  Animator,
} from 'react-native-filament';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-worklets-core';
import PunchingBagModel from '../../assets/models/punching_bag.glb';
import LockerModel from '../../assets/models/locker.glb';

const GymScene: React.FC = () => {
  const animationIndex = useSharedValue(0);

  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: [-8.88, 3.61, 18.14], // Your latest preferred camera position
    targetPosition: [-8.47, 3.29, 17.28], // Your latest preferred target
    orbitSpeed: [0.003, 0.003],
  });

  const panGesture = Gesture.Pan()
    .onBegin(event => {
      cameraManipulator?.grabBegin(event.translationX, event.translationY, false);
    })
    .onUpdate(event => {
      cameraManipulator?.grabUpdate(event.translationX, event.translationY);
    })
    .onEnd(() => {
      cameraManipulator?.grabEnd();
      // Log camera position and rotation when gesture ends
      if (cameraManipulator) {
        const [position, target, up] = cameraManipulator.getLookAt();
        console.log('Camera Position:', position);
        console.log('Camera Target:', target);
        console.log('Camera Up:', up);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    // Skip to next animation and cycle back to 0
    animationIndex.value = (animationIndex.value + 1) % 2; // Cycle between 0 and 1
    console.log(`Switching to animation index: ${animationIndex.value}`);
  });

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
      <FilamentView style={styles.filamentView}>
        <DefaultLight />
        <Model
          source={PunchingBagModel}
          translate={[-0.5, -4, 7]} // Position to the left
          scale={[1, 1, 1]} // Equal scale
          rotate={[0, -Math.PI / 3, 0]} // Rotation in radians (x, y, z)
        >
          <Animator
            animationIndex={animationIndex}
            onAnimationsLoaded={animations => {
              console.log('Punching bag animations loaded:', animations);
              console.log('Current animation index:', animationIndex);
            }}
          />
        </Model>
        <Model
          source={LockerModel}
          translate={[0, 0, 0]} // Position to the right
          scale={[2, 2, 2]} // Equal scale
          rotate={[0, -Math.PI / 3, 0]} // 60 degrees around Y-axis
        />
        <Camera cameraManipulator={cameraManipulator} />

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => {
            if (cameraManipulator) {
              const [position, target, up] = cameraManipulator.getLookAt();
              console.log('=== CAMERA STATE ===');
              console.log('Camera Position:', position);
              console.log('Camera Target:', target);
              console.log('Camera Up:', up);
              console.log('==================');
            }
          }}
        >
          <Text style={styles.logButtonText}>Log Camera</Text>
        </TouchableOpacity>
      </FilamentView>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
  },
  logButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  logButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GymScene;
