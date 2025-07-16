// ============================================================================
// GAME TYPES AND INTERFACES
// ============================================================================

export interface GameScreenProps {
  gameMode: 'arcade' | 'endless';
  selectedLevel?: number;
  onBackToMenu: () => void;
  debugMode: boolean;
}

export interface Prompt {
  id: string;
  type: 'tap' | 'swipe' | 'hold-and-flick';
  direction?: 'left' | 'right' | 'up' | 'down';
  startTime: number;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface TapPrompt {
  id: string;
  gridPosition: number; // 0-8 for 3x3 grid (0=top-left, 8=bottom-right)
  startTime: number;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
  isFeint: boolean;
}

export interface GameState {
  score: number;
  lives: number;
  opponentHP: number;
  currentRound: number;
  roundHPGoal: number;
  powerMeter: number;
  isSuperComboActive: boolean;
  avatarState: 'idle' | 'success' | 'failure' | 'perfect';
  isPaused: boolean;
  gameTime: number;
  level: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FeedbackText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface TouchState {
  startY: number;
  startX: number;
  startTime: number;
  isHolding: boolean;
  holdStartTime: number;
}

export type HitQuality = 'perfect' | 'good' | 'miss';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type InputType = 'tap' | 'swipe' | 'hold-and-flick';
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'; 