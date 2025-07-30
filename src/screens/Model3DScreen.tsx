import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Layer 1: Black Background */}
      <View style={styles.backgroundLayer}>
        <Text style={styles.backgroundText}>Background Layer</Text>
      </View>

      {/* Layer 2: Side Navigation Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
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

        {/* Rectangle Below Exposed Tab */}
        <View style={styles.belowTabRectangle}>
          <View style={styles.innerRedRectangle} />
        </View>

        {/* Top Rectangle Container */}
        <View style={styles.topRectangleContainer}>
          <View style={styles.topRectangle} />
        </View>

        {/* Drawer Header */}
        <View style={styles.drawerHeader}></View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00ff00',
  },
  backgroundLayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  topRectangleContainer: {
    position: 'absolute',
    top: -5,
    left: -10,
    width: '50%',
    height: 75,
    backgroundColor: '#ffffff',
    // borderWidth: 1,
    // borderColor: '#00000',
    zIndex: 1,
  },
  topRectangle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00ff00',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 55,
    // TODO: Fix radial curve corners using trickery later
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
    shadowColor: '#00ffff',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    // TODO: Fix radial curve corners using trickery later
  },
  exposedTab: {
    position: 'absolute',
    left: -50,
    top: 70,
    width: 50,
    height: '45%',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 55,
    borderBottomLeftRadius: 55,
    // borderWidth: 1,
    // borderColor: '#000000',
    // TODO: Fix radial curve corners using trickery later
  },
  belowTabRectangle: {
    position: 'absolute',
    left: -40,
    top: 430,
    width: 80,
    height: '50%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    // borderWidth: 1,
    // TODO: Fix radial curve corners using trickery later
  },
  innerRedRectangle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00ff00',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 80,
    borderBottomRightRadius: 0,
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
