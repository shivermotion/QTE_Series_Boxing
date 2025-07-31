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
}

const Model3DScreen: React.FC<Model3DScreenProps> = ({ onBackToMenu }) => {
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.85; // 80% of screen width
  const exposedTabWidth = 0.0 * screenWidth; // Width of the exposed tab

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsDrawerOpen(!isDrawerOpen);
  };

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
          source={require('../../assets/character_menu/boxer.png')}
          style={styles.boxerImage}
          resizeMode="cover"
        />
      </View>

      {/* Layer 3: Side Navigation Drawer (Top) */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [drawerWidth - exposedTabWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Exposed Tab */}
        <TouchableOpacity style={styles.exposedTab} onPress={toggleDrawer} activeOpacity={1}>
          <Text style={styles.tabText}>{isDrawerOpen ? '›' : '‹'}</Text>
        </TouchableOpacity>
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

  drawer: {
    position: 'absolute',
    top: 20,
    right: 5,
    bottom: 20,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderTopLeftRadius: 55,
    borderTopRightRadius: 55,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 55,
    shadowColor: '#000000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 7, // Drawer on top
    // TODO: Fix radial curve corners using trickery later
  },
  exposedTab: {
    position: 'absolute',
    left: -40,
    top: 70,
    width: 40,
    height: '45%',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 55,
    borderBottomLeftRadius: 30,
    // borderWidth: 1,
    // borderColor: '#000000',
    // TODO: Fix radial curve corners using trickery later
  },

  tabText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 255, 255, 0.0)',
    width: '100%',
  },
  drawerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  drawerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  drawerItemText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
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
});

export default Model3DScreen;
