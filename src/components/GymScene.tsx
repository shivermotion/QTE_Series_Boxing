import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Animated } from 'react-native';
import {
  FilamentView,
  DefaultLight,
  Model,
  Camera,
  useCameraManipulator,
  Animator,
  FilamentScene,
} from 'react-native-filament';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-worklets-core';
import { runOnJS } from 'react-native-reanimated';
import PunchingBagModel from '../../assets/models/punching_bag.glb';
import LockerModel from '../../assets/models/locker.glb';

const SingleModelScene: React.FC<{
  source: any;
  translate?: [number, number, number];
  rotate?: [number, number, number];
  scale?: [number, number, number];
  withAnimator?: boolean;
  containerStyle: any;
  logButtonLabel?: string; // deprecated UI, kept for compatibility
  sceneLabel?: string;
  onTap?: () => void;
}> = ({
  source,
  translate = [0, 0, 0],
  rotate = [0, 0, 0],
  scale = [1, 1, 1],
  withAnimator = false,
  containerStyle,
  logButtonLabel,
  sceneLabel = 'Scene',
  onTap,
}) => {
  const animationIndex = useSharedValue(0);
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition:
      sceneLabel === 'PunchingBag'
        ? [-8.75736141204834, 3.1101062297821045, 18.226125717163086]
        : [-8.685441017150879, 3.3773651123046875, 18.25777816772461],
    targetPosition:
      sceneLabel === 'PunchingBag'
        ? [-8.47143840789795, 3.2890989780426025, 17.284738540649414]
        : [-8.47107982635498, 3.290437698364258, 17.28489875793457],
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
      // Log camera state when orbiting stops
      if (cameraManipulator) {
        const [position, target, up] = cameraManipulator.getLookAt();
        // Compact, copy-paste friendly
        console.log(`[GymScene][${sceneLabel}] orbit end`);
        console.log(`[GymScene][${sceneLabel}] orbitHomePosition:`, JSON.stringify(position));
        console.log(`[GymScene][${sceneLabel}] targetPosition:`, JSON.stringify(target));
        console.log(`[GymScene][${sceneLabel}] up:`, JSON.stringify(up));
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (withAnimator) {
      animationIndex.value = (animationIndex.value + 1) % 2;
    }
    if (onTap) {
      runOnJS(onTap)();
    }
  });

  return (
    <View style={[styles.sceneContainer, containerStyle]}>
      <FilamentScene>
        <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
          <FilamentView style={styles.filamentView}>
            <DefaultLight />
            <Model source={source} translate={translate} scale={scale} rotate={rotate}>
              {withAnimator && (
                <Animator animationIndex={animationIndex} onAnimationsLoaded={() => {}} />
              )}
            </Model>
            {cameraManipulator ? <Camera cameraManipulator={cameraManipulator} /> : null}
          </FilamentView>
        </GestureDetector>
      </FilamentScene>
    </View>
  );
};

interface GymSceneProps {
  onNavigateToTutorial?: () => void;
  onNavigateToEquipment?: () => void;
  onNavigateToPlayerDetails?: () => void;
}

const GymScene: React.FC<GymSceneProps> = ({
  onNavigateToTutorial,
  onNavigateToEquipment,
  onNavigateToPlayerDetails,
}) => {
  const heroJitterAnimation = useRef(new Animated.Value(0)).current;

  const triggerHeroJitter = () => {
    // Reset animation
    heroJitterAnimation.setValue(0);

    // Create oblique snap sequence - down and to the right
    const snapSequence = Animated.sequence([
      Animated.timing(heroJitterAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heroJitterAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    snapSequence.start();
  };

  const heroJitterStyle = {
    transform: [
      {
        translateX: heroJitterAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 15], // Move 15px to the right
        }),
      },
      {
        translateY: heroJitterAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10], // Move 10px down
        }),
      },
    ],
  };

  const handleTopThirdTap = () => {
    console.log('Top third tapped - navigating to equipment');
    if (onNavigateToEquipment) {
      onNavigateToEquipment();
    }
  };

  const handleMiddleThirdTap = () => {
    console.log('Middle third tapped - navigating to tutorial');
    if (onNavigateToTutorial) {
      onNavigateToTutorial();
    }
  };

  const handleBottomThirdTap = () => {
    console.log('Bottom third tapped - navigating to player details');
    if (onNavigateToPlayerDetails) {
      onNavigateToPlayerDetails();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background paper texture */}
      <Image
        source={require('../../assets/transition_screen/paper_texture.png')}
        style={[styles.backgroundTexture, { transform: [{ scaleX: -1 }] }]}
        resizeMode="stretch"
      />
      <SingleModelScene
        source={PunchingBagModel}
        translate={[0, -0.5, 0]}
        rotate={[0, -Math.PI / 3, 0]}
        scale={[2.3, 2.3, 2.3]}
        withAnimator
        containerStyle={styles.rightMiddle}
        sceneLabel="PunchingBag"
        onTap={triggerHeroJitter}
      />
      <SingleModelScene
        source={LockerModel}
        translate={[0, 0, 0]}
        rotate={[0, -Math.PI / 3, 0]}
        scale={[2.9, 2.9, 2.9]}
        containerStyle={styles.topLeft}
        sceneLabel="Locker"
      />
      {/* Hero image in the center */}
      <Animated.View style={[styles.heroContainer, heroJitterStyle]}>
        <Image
          source={require('../../assets/characters/hero.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </Animated.View>
      {/* Hero image at the top right */}
      <View style={styles.heroTopRightContainer}>
        <Image
          source={require('../../assets/characters/hero.png')}
          style={styles.heroTopRightImage}
          resizeMode="contain"
        />
      </View>
      {/* Second hero image at the bottom left */}
      <View style={styles.heroBottomLeftContainer}>
        <Image
          source={require('../../assets/characters/hero.png')}
          style={styles.heroBottomLeftImage}
          resizeMode="contain"
        />
      </View>
      {/* UI Images stacked vertically - each taking up a third of the screen */}
      <View style={styles.uiImagesContainer}>
        <Image
          source={require('../../assets/ui/Asset_30.png')}
          style={[styles.uiImage, { transform: [{ scaleX: -1 }] }]}
          resizeMode="stretch"
        />
        <Image
          source={require('../../assets/ui/Asset_30.png')}
          style={styles.uiImage}
          resizeMode="stretch"
        />
        <Image
          source={require('../../assets/ui/Asset_30.png')}
          style={[styles.uiImage, { transform: [{ scaleX: -1 }] }]}
          resizeMode="stretch"
        />
      </View>
      {/* Training text */}
      <View style={styles.trainingTextContainer}>
        <Text style={styles.trainingText}>tutorial</Text>
      </View>
      {/* Equipment text */}
      <View style={styles.equipmentTextContainer}>
        <Text style={styles.equipmentText}>equipment</Text>
      </View>
      {/* Player details text */}
      <View style={styles.playerDetailsTextContainer}>
        <Text style={styles.playerDetailsText}>player details</Text>
      </View>
      {/* Touchable thirds */}
      <TouchableOpacity style={styles.topThird} onPress={handleTopThirdTap} />
      <TouchableOpacity style={styles.middleThird} onPress={handleMiddleThirdTap} />
      <TouchableOpacity style={styles.bottomThird} onPress={handleBottomThirdTap} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sceneContainer: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 12,
  },
  filamentView: {
    width: '100%',
    height: '100%',
  },
  topLeft: {
    top: 0,
    left: 0,
    width: 260,
    height: 320,
    zIndex: 3,
  },
  rightMiddle: {
    right: 0,
    width: 260,
    height: 320,
    top: '50%',
    transform: [{ translateY: -160 }], // half of height to center vertically
    zIndex: 5,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  heroImage: {
    width: '100%',
    height: '35%',
  },
  heroTopRightContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: '35%',
    height: '35%',
    zIndex: 4,
  },
  heroTopRightImage: {
    width: '100%',
    height: '100%',
  },
  heroBottomLeftContainer: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: '45%',
    height: '45%',
    zIndex: 4,
  },
  heroBottomLeftImage: {
    width: '100%',
    height: '100%',
  },
  uiImagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    zIndex: 1,
  },
  uiImage: {
    flex: 1,
    width: '100%',
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  trainingTextContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    width: 200,
    transform: [{ translateY: -50 }],
    zIndex: 6,
  },
  trainingText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  equipmentTextContainer: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 400,
    zIndex: 6,
  },
  equipmentText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'right',
  },
  playerDetailsTextContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 400,
    zIndex: 6,
  },
  playerDetailsText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'right',
  },
  topThird: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '33.33%',
    zIndex: 10,
  },
  middleThird: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: '33.33%',
    zIndex: 10,
  },
  bottomThird: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: '33.33%',
    zIndex: 10,
  },
});

export default GymScene;
