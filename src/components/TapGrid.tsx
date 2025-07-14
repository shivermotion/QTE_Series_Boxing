import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface TapPrompt {
  id: string;
  gridPosition: number; // 0-8 for 3x3 grid (0=top-left, 8=bottom-right)
  startTime: number;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface TapGridProps {
  activeTapPrompts: TapPrompt[];
  onGridTap: (gridPosition: number) => void;
}

const TapGrid: React.FC<TapGridProps> = ({ activeTapPrompts, onGridTap }) => {
  const [tapAnimations, setTapAnimations] = useState<{ [key: number]: Animated.Value }>({});

  const gridSize = 3;
  const cellSize = 120; // Size of each grid cell
  const gridGap = 10; // Gap between cells
  const totalGridSize = gridSize * cellSize + (gridSize - 1) * gridGap;

  const getPromptAtPosition = (position: number): TapPrompt | undefined => {
    return activeTapPrompts.find(prompt => prompt.gridPosition === position && prompt.isActive);
  };

  const handleTap = (position: number) => {
    // Create tap animation
    const animation = new Animated.Value(1);
    setTapAnimations(prev => ({ ...prev, [position]: animation }));

    // Animate tap feedback
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Clean up animation
      setTapAnimations(prev => {
        const newState = { ...prev };
        delete newState[position];
        return newState;
      });
    });

    // Call the original onGridTap
    onGridTap(position);
  };

  const renderGridCell = (position: number) => {
    const prompt = getPromptAtPosition(position);
    const isActive = !!prompt && !prompt.isCompleted;
    const isCompleted = !!prompt && prompt.isCompleted;

    const tapAnimation = tapAnimations[position];

    return (
      <Animated.View
        key={position}
        style={[
          {
            transform: tapAnimation ? [{ scale: tapAnimation }] : [{ scale: 1 }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.gridCell,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor: isActive
                ? 'rgba(255, 255, 0, 0.3)'
                : isCompleted
                ? 'rgba(0, 255, 0, 0.6)' // Green for completed
                : 'rgba(255, 255, 255, 0.1)',
              borderColor: isActive
                ? '#ffff00'
                : isCompleted
                ? '#00ff00' // Green border for completed
                : 'rgba(255, 255, 255, 0.3)',
              borderRadius: isCompleted ? 4 : 8, // Square for completed, rounded for active
            },
          ]}
          onPress={() => handleTap(position)}
          activeOpacity={0.7}
        >
          {isActive && (
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../../assets/lottie/tap.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const position = row * gridSize + col;
        cells.push(renderGridCell(position));
      }
    }
    return cells;
  };

  return (
    <View style={[styles.container, { width: totalGridSize, height: totalGridSize }]}>
      <View style={styles.gridContainer}>{renderGrid()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  gridCell: {
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 80,
    height: 80,
  },
  fallbackText: {
    fontSize: 40,
    textAlign: 'center',
  },
  completedContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default TapGrid;
