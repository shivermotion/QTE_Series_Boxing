import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FilamentScene,
  FilamentView,
  DefaultLight,
  Model,
  Camera,
  Animator,
} from 'react-native-filament';

// Type for animation items based on the API documentation
type AnimationItem = {
  index: number;
  duration: number;
  name: string;
};

interface Model3DScreenProps {
  onBackToMenu: () => void;
  fontsLoaded?: boolean;
}

const Model3DScreen: React.FC<Model3DScreenProps> = ({ onBackToMenu, fontsLoaded }) => {
  const insets = useSafeAreaInsets();
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [showAnimations, setShowAnimations] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const textSlideAnim = React.useRef(new Animated.Value(-200)).current;
  const textScrollAnim = React.useRef(new Animated.Value(-200)).current;
  const nameSlideAnim = React.useRef(new Animated.Value(-500)).current;
  const nameSlideVerticalAnim = React.useRef(new Animated.Value(-400)).current;
  const heroImageAnim = React.useRef(new Animated.Value(500)).current; // Start off-screen to the right

  // Define the different scenes with their models and coordinates
  const scenes = [
    {
      model: require('../../assets/models/boxer.glb'),
      scale: [0.7, 0.7, 0.7] as [number, number, number], // Normal scale (no skew)
      translate: [0, 0, 3] as [number, number, number],
      rotation: [Math.PI / 4, -Math.PI / 4, -0.5] as [number, number, number], // 45° X-axis + 45° Y-axis (left) + skew effect
      name: 'Boxer',
    },
    {
      model: require('../../assets/models/model.glb'),
      scale: [1, 1, 1] as [number, number, number],
      translate: [0, -2, -30] as [number, number, number],
      rotation: [0, Math.PI / -4, 0] as [number, number, number], // 45° X-axis + 45° Y-axis for isometric view
      name: 'Model',
    },
    {
      model: require('../../assets/models/punching_bag.glb'),
      scale: [0.5, 0.5, 0.5] as [number, number, number],
      translate: [0, -2, 0] as [number, number, number],
      name: 'Punching Bag',
    },
  ];

  const currentScene = scenes[currentSceneIndex];

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsDrawerOpen(!isDrawerOpen);
  };

  const cycleScene = (direction: 'next' | 'prev') => {
    const oldSceneName = scenes[currentSceneIndex].name;
    if (direction === 'next') {
      setCurrentSceneIndex(prev => (prev + 1) % scenes.length);
    } else {
      setCurrentSceneIndex(prev => (prev - 1 + scenes.length) % scenes.length);
    }
    const newSceneName =
      scenes[
        direction === 'next'
          ? (currentSceneIndex + 1) % scenes.length
          : (currentSceneIndex - 1 + scenes.length) % scenes.length
      ].name;
    console.log(`🔄 Scene transition: ${oldSceneName} → ${newSceneName}`);
  };

  // Clear animations when switching to models without animations
  useEffect(() => {
    console.log(`📱 Scene changed to: ${currentScene.name}`);
    if (currentScene.name !== 'Punching Bag') {
      console.log(`🗑️ Clearing animations for ${currentScene.name}`);
      setAnimations([]);
      setCurrentAnimationIndex(0);
      setShowAnimations(false);
    } else {
      console.log(`🎬 Auto-activating animations for Punching Bag`);
      setShowAnimations(true);
    }
  }, [currentScene.name]);

  // Track FilamentScene component mounting/unmounting due to key changes
  useEffect(() => {
    console.log(`🎯 FilamentScene mounted for: ${currentScene.name}`);
    return () => {
      console.log(`🗑️ FilamentScene unmounting for: ${currentScene.name}`);
    };
  }, [currentScene.name]);

  // Animate name slide when boxer is displayed
  useEffect(() => {
    if (currentScene.name === 'Boxer') {
      // Slide in from top-left at oblique angle
      Animated.parallel([
        Animated.timing(nameSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(nameSlideVerticalAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to top-left
      Animated.parallel([
        Animated.timing(nameSlideAnim, {
          toValue: -500,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(nameSlideVerticalAnim, {
          toValue: -400,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentScene.name, nameSlideAnim, nameSlideVerticalAnim]);

  // Animate text sliding in from top left when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset text position when drawer closes
      Animated.timing(textSlideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isDrawerOpen]);

  // Continuous scrolling animation for text
  useEffect(() => {
    const startScrolling = () => {
      Animated.loop(
        Animated.timing(textScrollAnim, {
          toValue: 200,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();
    };

    if (isDrawerOpen) {
      // Start scrolling after the initial slide-in animation
      const timer = setTimeout(startScrolling, 800);
      return () => clearTimeout(timer);
    } else {
      // Reset scroll position when drawer closes
      textScrollAnim.setValue(-200);
    }
  }, [isDrawerOpen]);

  // Animate hero image when boxer is selected
  useEffect(() => {
    if (currentScene.name === 'Boxer') {
      // Slide in from right
      Animated.timing(heroImageAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to right
      Animated.timing(heroImageAnim, {
        toValue: 500,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [currentScene.name, heroImageAnim]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: currentScene.name === 'Boxer' ? '#ff0000' : '#d3d3d3', // Red for boxer, light gray for others
        },
      ]}
    >
      {/* Wall Texture Layer - Top Half (Beyond Safe Area) */}
      <View style={styles.wallTextureLayer}>
        <Image
          source={
            currentScene.name === 'Punching Bag'
              ? require('../../assets/character_menu/wall_texture.png')
              : require('../../assets/character_menu/paper.png')
          }
          style={styles.wallTextureImage}
          resizeMode="cover"
        />
      </View>

      {/* 3D Scene Layer - Full Screen */}
      <View style={styles.sceneLayer}>
        <View style={styles.sceneContainer}>
          <FilamentScene key={currentScene.name}>
            <FilamentView style={styles.filamentView}>
              {/* Light source for the 3D scene */}
              <DefaultLight />

              {/* 3D Model */}
              <Model
                source={currentScene.model}
                scale={currentScene.scale}
                translate={currentScene.translate}
                rotate={currentScene.rotation}
              >
                {/* Only show Animator for punching bag when animations are activated */}
                {currentScene.name === 'Punching Bag' && showAnimations && (
                  <Animator
                    animationIndex={currentAnimationIndex}
                    onAnimationsLoaded={loadedAnimations => {
                      // Only set animations if they haven't been set yet or if they're different
                      if (
                        animations.length === 0 ||
                        JSON.stringify(animations) !== JSON.stringify(loadedAnimations)
                      ) {
                        console.log('Animations loaded:', loadedAnimations);
                        setAnimations(loadedAnimations);
                      }
                    }}
                  />
                )}
              </Model>

              {/* Camera for viewing the scene */}
              <Camera />
            </FilamentView>
          </FilamentScene>
        </View>

        {/* Transparent overlay for tap detection */}
        <TouchableOpacity
          style={styles.tapOverlay}
          activeOpacity={1}
          onPress={() => {
            if (currentScene.name === 'Punching Bag' && animations.length > 0) {
              // Cycle through animations
              const nextIndex = (currentAnimationIndex + 1) % animations.length;
              setCurrentAnimationIndex(nextIndex);
              console.log(
                `Tap detected - Switched to animation: ${animations[nextIndex].name} (index: ${nextIndex})`
              );
            }
          }}
        />
      </View>

      {/* Hero Image Layer */}
      <Animated.View
        style={[
          styles.boxerLayer,
          {
            transform: [{ translateX: heroImageAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/character_menu/hero_1.png')}
          style={styles.boxerImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
          },
        ]}
        onPress={() => cycleScene('prev')}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            top: insets.top + 10,
          },
        ]}
        onPress={() => cycleScene('next')}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>→</Text>
      </TouchableOpacity>

      {/* Select Character Text */}
      <Animated.View
        style={[
          styles.selectCharacterText,
          {
            top: insets.top + 10,
            transform: [
              {
                translateX: textSlideAnim,
              },
              {
                translateX: textScrollAnim,
              },
            ],
          },
        ]}
      >
        <Text
          style={[
            styles.selectCharacterTextContent,
            { fontFamily: fontsLoaded ? 'Round8-Four' : undefined },
          ]}
        >
          Menu
        </Text>
      </Animated.View>

      {/* Name Slide - slides in when boxer is displayed */}
      <Animated.View
        style={[
          styles.nameSlide,
          {
            transform: [
              {
                translateX: nameSlideAnim,
              },
              {
                translateY: nameSlideVerticalAnim,
              },
            ],
          },
        ]}
      >
        <Text
          style={[styles.nameSlideContent, { fontFamily: fontsLoaded ? 'Round8-Four' : undefined }]}
        >
          GIO TANAKA
        </Text>
      </Animated.View>

      {/* Drawer using drawer.png */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [380, 0], // Slide in from right (300px off-screen)
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.drawerImageContainer}
          onPress={toggleDrawer}
          activeOpacity={1.0}
        >
          <Image
            source={require('../../assets/character_menu/drawer.png')}
            style={styles.drawerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  wallTextureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2, // Wall texture layer above background
    overflow: 'hidden',
  },
  wallTextureImage: {
    width: '100%',
    height: '100%',
  },

  // 3D Scene Layer - positioned above wall texture
  sceneLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5, // 3D Scene layer above wall texture
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  boxerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3, // Hero image layer above wall texture
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: '#000000',
    // resizeMode: 'contain',
  },
  boxerImage: {
    width: '100%',
    height: '100%',
  },

  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 6, // Tap overlay above 3D scene
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 11, // Top layer above everything
  },
  drawerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  drawerImage: {
    width: '100%',
    height: '100%',
  },
  selectCharacterText: {
    position: 'absolute',
    left: 20,
    zIndex: 10, // Above debug overlay
    minWidth: 200,
    minHeight: 40,
  },
  selectCharacterTextContent: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  nameSlide: {
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4, // Above the 3D scene layer
  },
  nameSlideContent: {
    color: '#ffffff',
    fontSize: 170,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 20, height: 20 },
    textShadowRadius: 4,
    padding: 10,
    width: '200%',
    textAlign: 'center',
    transform: [{ rotateX: '45deg' }, { rotateY: '45deg' }, { skewX: '-40deg' }],
    flexWrap: 'nowrap',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 9, // Above everything
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    position: 'absolute',
    right: 20, // Positioned on the top right
    zIndex: 9, // Above everything
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Model3DScreen;
