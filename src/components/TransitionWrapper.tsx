import React from 'react';
import { View } from 'react-native';
import { useTransition } from '../contexts/TransitionContext';

interface TransitionWrapperProps {
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children }) => {
  // Keep the hook to avoid refactor in callers; no overlay rendering
  useTransition();

  return <View style={{ flex: 1 }}>{children}</View>;
};

export default TransitionWrapper;
