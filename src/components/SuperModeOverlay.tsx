import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface SuperModeOverlayProps {
  isActive: boolean;
  onVideoEnd?: () => void;
}

const SuperModeOverlay: React.FC<SuperModeOverlayProps> = ({ isActive, onVideoEnd }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef<boolean>(false);

  // Handle super mode start
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      console.log('🎬 Super mode starting - setting up 5-second timer');
      hasStartedRef.current = true;

      // Set 5-second timer
      timerRef.current = setTimeout(() => {
        console.log('🎬 5-second timer completed - ending super mode');
        hasStartedRef.current = false;
        if (onVideoEnd) {
          onVideoEnd();
        }
      }, 5000);
    }
  }, [isActive, onVideoEnd]);

  // Handle super mode end
  useEffect(() => {
    if (!isActive && hasStartedRef.current) {
      console.log('🎬 Super mode ending - cleaning up');
      hasStartedRef.current = false;

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Text style={styles.headerText}>SUPER COMBO MODE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#ffff00',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default SuperModeOverlay;
