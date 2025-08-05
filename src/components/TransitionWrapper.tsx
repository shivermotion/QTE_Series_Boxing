import React from 'react';
import { View } from 'react-native';
import TransitionScreen from '../screens/TransitionScreen';
import { useTransition } from '../contexts/TransitionContext';

interface TransitionWrapperProps {
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children }) => {
  const {
    isTransitioning,
    transitionImage,
    loadingDuration,
    wipeDuration,
    targetScreen,
    shouldMountTarget,
    initialWipeComplete,
  } = useTransition();

  return (
    <View style={{ flex: 1 }}>
      {/* Render target screen behind transition if it exists and should be mounted */}
      {targetScreen && shouldMountTarget && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {targetScreen}
        </View>
      )}

      {/* Render current screen on top - hide when initial wipe is complete */}
      <View style={{ flex: 1, opacity: initialWipeComplete ? 0 : 1 }}>{children}</View>

      {/* Render transition overlay */}
      {isTransitioning && (
        <TransitionScreen
          onTransitionComplete={() => {
            // This will be called by the TransitionScreen
          }}
          transitionImage={transitionImage}
          loadingDuration={loadingDuration}
          wipeDuration={wipeDuration}
        />
      )}
    </View>
  );
};

export default TransitionWrapper;
