import { useState, useCallback } from 'react';

interface UseTransitionOptions {
  transitionImage?: any;
  loadingDuration?: number;
  wipeDuration?: number;
}

interface UseTransitionReturn {
  isTransitioning: boolean;
  startTransition: (onComplete: () => void) => void;
  transitionImage?: any;
  loadingDuration: number;
  wipeDuration: number;
}

export const useTransition = (options: UseTransitionOptions = {}): UseTransitionReturn => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const {
    transitionImage,
    loadingDuration = 2000,
    wipeDuration = 800,
  } = options;

  const startTransition = useCallback((onComplete: () => void) => {
    setIsTransitioning(true);
    
    // The actual transition logic is handled by the TransitionScreen component
    // This function just sets the state and provides a callback for completion
    const handleTransitionComplete = () => {
      setIsTransitioning(false);
      onComplete();
    };

    // Store the completion handler in a way that TransitionScreen can access it
    // For now, we'll use a simple approach - you might want to use a ref or context
    (global as any).__transitionCompleteHandler = handleTransitionComplete;
  }, []);

  return {
    isTransitioning,
    startTransition,
    transitionImage,
    loadingDuration,
    wipeDuration,
  };
}; 