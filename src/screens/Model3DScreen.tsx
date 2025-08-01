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
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const textSlideAnim = React.useRef(new Animated.Value(-200)).current;
  const textScrollAnim = React.useRef(new Animated.Value(-200)).current;

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsDrawerOpen(!isDrawerOpen);
  };

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

  return (
    <View style={styles.container}>
      {/* Wall Texture Layer - Top Half (Beyond Safe Area) */}
      <View style={styles.wallTextureLayer}>
        <Image
          source={require('../../assets/character_menu/wall_texture.png')}
          style={styles.wallTextureImage}
          resizeMode="cover"
        />
      </View>

      {/* 3D Scene Layer - Full Screen */}
      <View style={styles.sceneLayer}>
        <View style={styles.sceneContainer}>
          <FilamentScene>
            <FilamentView style={styles.filamentView}>
              {/* Light source for the 3D scene */}
              <DefaultLight />

              {/* 3D Model */}
              <Model
                source={require('../../assets/models/punching_bag.glb')}
                scale={[0.5, 0.5, 0.5]}
                translate={[0, -2, 0]}
              >
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
            if (animations.length > 0) {
              const nextIndex = (currentAnimationIndex + 1) % animations.length;
              setCurrentAnimationIndex(nextIndex);
              console.log(
                `Tap detected - Switched to animation: ${animations[nextIndex].name} (index: ${nextIndex})`
              );
            }
          }}
        />
      </View>

      {/* Boxer Image Layer */}
      <View style={styles.boxerLayer}>
        <Image
          source={require('../../assets/character_menu/boxer_halftone.png')}
          style={styles.boxerImage}
          resizeMode="cover"
        />
      </View>

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
          Select
        </Text>
      </Animated.View>

      {/* Animation Debug Overlay */}
      <View style={[styles.debugOverlay, { bottom: insets.bottom + 20 }]}>
        <Text style={styles.debugText}>Animations: {animations.length}</Text>
        <Text style={styles.debugText}>Current: {currentAnimationIndex}</Text>
        {animations.length > 0 && (
          <Text style={styles.debugText}>Playing: {animations[currentAnimationIndex]?.name}</Text>
        )}
        <Text style={styles.debugText}>Tap the punching bag to cycle animations!</Text>
        {animations.length > 0 && (
          <TouchableOpacity
            style={styles.animationButton}
            onPress={() => {
              const nextIndex = (currentAnimationIndex + 1) % animations.length;
              setCurrentAnimationIndex(nextIndex);
            }}
          >
            <Text style={styles.debugText}>Next Animation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Drawer using drawer.png */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [340, 0], // Slide in from right (300px off-screen)
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
    backgroundColor: '#e5e1b0',
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
    zIndex: 3, // Wall texture layer
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
    zIndex: 4, // 3D Scene layer above wall texture
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
    height: '50%',
    zIndex: 2, // Boxer layer above background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // borderWidth: 1,
    // borderColor: '#000000',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    // resizeMode: 'contain',
  },
  boxerImage: {
    width: '100%',
    height: '100%',
  },
  debugOverlay: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 6, // Debug overlay above tap overlay
  },
  debugText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  animationButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },

  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5, // Tap overlay above 3D scene
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10, // Top layer above everything
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
    zIndex: 7, // Above debug overlay
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
});

export default Model3DScreen;
