import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Prompt, TapPrompt, TimingPrompt } from '../types/game';
import TestArrow from './TestArrow';
import TapGrid from './TapGrid';
import TimingPromptComponent from './TimingPrompt';

// ============================================================================
// GAME INPUT AREA COMPONENT
// ============================================================================

interface GameInputAreaProps {
  currentPrompt: Prompt | null;
  activeTapPrompts: TapPrompt[];
  activeTimingPrompts: TimingPrompt[];
  superComboSequence: Prompt[];
  superComboIndex: number;
  gameState: any;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onGridTap: (gridPosition: number) => void;
  onTimingSuccess: (gridPosition: number, hitQuality: 'perfect' | 'good') => void;
  onTimingMiss: () => void;
}

const GameInputArea: React.FC<GameInputAreaProps> = ({
  currentPrompt,
  activeTapPrompts = [],
  activeTimingPrompts = [],
  superComboSequence = [],
  superComboIndex = 0,
  gameState,
  onSwipe,
  onGridTap,
  onTimingSuccess,
  onTimingMiss,
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

      {/* Debug: Show timing prompts count */}
      {activeTimingPrompts && activeTimingPrompts.length > 0 && (
        <View style={styles.debugTimingIndicator}>
          <Text style={styles.debugText}>Timing: {activeTimingPrompts.length}</Text>
        </View>
      )}

      {/* Timing Prompt Area */}
      {activeTimingPrompts && activeTimingPrompts.length > 0 && (
        <View style={styles.timingPromptArea}>
          {activeTimingPrompts
            .filter(prompt => prompt.isActive) // Only render active (visible) prompts
            .map((prompt, index) => (
              <TimingPromptComponent
                key={prompt.id}
                prompt={prompt}
                onMiss={onTimingMiss}
                onSuccess={hitQuality => onTimingSuccess(prompt.gridPosition, hitQuality)}
              />
            ))}
        </View>
      )}

      {/* Tap Grid Area - For 3x3 tap prompts */}
      {activeTapPrompts && activeTapPrompts.length > 0 && (
        <View style={styles.tapGridArea}>
          <TapGrid activeTapPrompts={activeTapPrompts} onGridTap={onGridTap} />
        </View>
      )}

      {/* Swipe gesture handler - only active when there's an active swipe prompt and no tap prompts */}
      {currentPrompt &&
        currentPrompt.type === 'swipe' &&
        currentPrompt.isActive &&
        (!activeTapPrompts || activeTapPrompts.length === 0) && (
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
  timingPromptArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 400,
    height: 400,
    zIndex: 25,
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
  debugText: {
    color: '#ffff00',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugTimingIndicator: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
});

export default GameInputArea;
