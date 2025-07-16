import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Prompt, TapPrompt } from '../types/game';
import TestArrow from './TestArrow';
import TapGrid from './TapGrid';

// ============================================================================
// GAME INPUT AREA COMPONENT
// ============================================================================

interface GameInputAreaProps {
  currentPrompt: Prompt | null;
  activeTapPrompts: TapPrompt[];
  superComboSequence: Prompt[];
  superComboIndex: number;
  gameState: any;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onGridTap: (gridPosition: number) => void;
}

const GameInputArea: React.FC<GameInputAreaProps> = ({
  currentPrompt,
  activeTapPrompts,
  superComboSequence,
  superComboIndex,
  gameState,
  onSwipe,
  onGridTap,
}) => {
  return (
    <View style={styles.inputArea}>
      {/* Prompt Area - Inside Input Area */}
      <View style={styles.promptArea}>
        {gameState.isSuperComboActive && superComboSequence[superComboIndex] && (
          <View style={styles.superComboContainer}>
            <Text style={styles.superComboLabel}>SUPER COMBO!</Text>
            <TestArrow
              direction={superComboSequence[superComboIndex].direction!}
              isActive={superComboSequence[superComboIndex].isActive}
            />
          </View>
        )}
      </View>

      {/* Test Arrow Area - Outside Input Area for better visibility */}
      {currentPrompt && currentPrompt.isActive && currentPrompt.type === 'swipe' && (
        <TestArrow direction={currentPrompt.direction!} isActive={currentPrompt.isActive} />
      )}

      {/* Tap Grid Area - For 3x3 tap prompts */}
      {activeTapPrompts.length > 0 && (
        <View style={styles.tapGridArea}>
          <TapGrid activeTapPrompts={activeTapPrompts} onGridTap={onGridTap} />
        </View>
      )}

      {/* Swipe gesture handler - only active when there's an active swipe prompt and no tap prompts */}
      {currentPrompt &&
        currentPrompt.type === 'swipe' &&
        currentPrompt.isActive &&
        activeTapPrompts.length === 0 && (
          <PanGestureHandler
            onGestureEvent={event => {
              // Gesture event handling for debugging if needed
            }}
            onHandlerStateChange={event => {
              const { state, translationX, translationY } = event.nativeEvent;

              if (state === State.END) {
                const minSwipeDistance = 50;
                const absX = Math.abs(translationX);
                const absY = Math.abs(translationY);

                if (absX > absY && absX > minSwipeDistance) {
                  if (translationX > 0) {
                    onSwipe('right');
                  } else {
                    onSwipe('left');
                  }
                } else if (absY > absX && absY > minSwipeDistance) {
                  if (translationY > 0) {
                    onSwipe('down');
                  } else {
                    onSwipe('up');
                  }
                }
              }
            }}
            minDist={10}
            minVelocity={100}
          >
            <View style={styles.inputAreaGestureHandler}>
              {/* Gesture handler area - no visual indicator */}
            </View>
          </PanGestureHandler>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 400,
    height: 400,
    transform: [{ translateX: -200 }, { translateY: -200 }],
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  promptArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -200 }, { translateY: -200 }],
    zIndex: 5,
  },
  tapGridArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  inputAreaGestureHandler: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 400,
    height: 400,
    zIndex: 40,
    borderRadius: 200,
  },

  superComboContainer: {
    alignItems: 'center',
  },
  superComboLabel: {
    color: '#ff00ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default GameInputArea;
