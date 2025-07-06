export interface Target {
  id: string;
  lane: 'left' | 'center' | 'right';
  position: number;
  speed: number;
  type: 'normal' | 'power';
}

export interface GameState {
  score: number;
  lives: number;
  targets: Target[];
  avatarState: 'idle' | 'success' | 'failure';
  combo: number;
  gameMode: 'arcade' | 'endless';
  isPaused: boolean;
  gameTime: number;
  level: number;
}

export interface HitResult {
  type: 'perfect' | 'good' | 'miss';
  points: number;
  combo: number;
}

export interface AvatarAnimation {
  currentFrame: number;
  totalFrames: number;
  frameDuration: number;
  lastFrameTime: number;
}

export interface GameConfig {
  perfectHitWindow: number; // 200ms
  goodHitWindow: number; // 400ms
  targetSpeed: number;
  spawnInterval: number;
  screenWidth: number;
  screenHeight: number;
  hitZoneY: number; // 0.8 of screen height
}

export type Lane = 'left' | 'center' | 'right';

export interface GestureEvent {
  x: number;
  y: number;
  velocityY?: number;
  type: 'tap' | 'swipe';
} 