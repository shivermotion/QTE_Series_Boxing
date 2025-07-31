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

interface Model3DScreenProps {
  onBackToMenu: () => void;
}

const Model3DScreen: React.FC<Model3DScreenProps> = ({ onBackToMenu }) => {
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    zIndex: 5,
    overflow: 'hidden',
  },
  wallTextureImage: {
    width: '100%',
    height: '100%',
  },

  boxerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 2,
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
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
    zIndex: 7, // Always on top
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
});

export default Model3DScreen;
