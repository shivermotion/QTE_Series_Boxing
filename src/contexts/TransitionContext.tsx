import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TransitionContextType {
  isTransitioning: boolean;
  startTransition: (onComplete: () => void, options?: TransitionOptions) => void;
  transitionImage?: any;
  loadingDuration: number;
  wipeDuration: number;
  targetScreen?: React.ReactNode;
  setTargetScreen: (screen: React.ReactNode) => void;
  shouldMountTarget: boolean;
  initialWipeComplete: boolean;
}

interface TransitionOptions {
  transitionImage?: any;
  loadingDuration?: number;
  wipeDuration?: number;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

interface TransitionProviderProps {
  children: ReactNode;
}

export const TransitionProvider: React.FC<TransitionProviderProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionImage, setTransitionImage] = useState<any>(undefined);
  const [loadingDuration, setLoadingDuration] = useState(2000);
  const [wipeDuration, setWipeDuration] = useState(800);
  const [targetScreen, setTargetScreen] = useState<React.ReactNode>(undefined);
  const [shouldMountTarget, setShouldMountTarget] = useState(false);
  const [initialWipeComplete, setInitialWipeComplete] = useState(false);

  const startTransition = useCallback((onComplete: () => void, options: TransitionOptions = {}) => {
    const {
      transitionImage: newTransitionImage,
      loadingDuration: newLoadingDuration = 2000,
      wipeDuration: newWipeDuration = 800,
    } = options;

    // Update transition options
    setTransitionImage(newTransitionImage);
    setLoadingDuration(newLoadingDuration);
    setWipeDuration(newWipeDuration);

    // Reset target mounting state
    setShouldMountTarget(false);
    setInitialWipeComplete(false);

    // Start transition
    setIsTransitioning(true);

    // Store completion handler
    (global as any).__transitionCompleteHandler = () => {
      setIsTransitioning(false);
      setShouldMountTarget(false);
      setInitialWipeComplete(false);
      onComplete();
    };

    // Store mount target handler
    (global as any).__mountTargetHandler = () => {
      setShouldMountTarget(true);
    };

    // Store initial wipe complete handler
    (global as any).__initialWipeCompleteHandler = () => {
      setInitialWipeComplete(true);
    };
  }, []);

  const value: TransitionContextType = {
    isTransitioning,
    startTransition,
    transitionImage,
    loadingDuration,
    wipeDuration,
    targetScreen,
    setTargetScreen,
    shouldMountTarget,
    initialWipeComplete,
  };

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
};

export const useTransition = (): TransitionContextType => {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};
