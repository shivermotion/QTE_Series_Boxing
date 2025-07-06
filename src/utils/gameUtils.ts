import { Target, HitResult, GameConfig, Lane } from '../types/game';

export const generateTargetId = (): string => {
  return `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getLaneX = (lane: Lane, screenWidth: number): number => {
  switch (lane) {
    case 'left':
      return screenWidth / 6;
    case 'center':
      return screenWidth / 2;
    case 'right':
      return (5 * screenWidth) / 6;
    default:
      return screenWidth / 2;
  }
};

export const getRandomLane = (): Lane => {
  const lanes: Lane[] = ['left', 'center', 'right'];
  return lanes[Math.floor(Math.random() * lanes.length)];
};

export const calculateHitResult = (
  target: Target,
  config: GameConfig,
  currentTime: number
): HitResult => {
  const hitZoneCenter = config.hitZoneY;
  const distance = Math.abs(target.position - hitZoneCenter);
  
  if (distance <= 0.05) { // Perfect hit zone
    return {
      type: 'perfect',
      points: 100,
      combo: 1
    };
  } else if (distance <= 0.1) { // Good hit zone
    return {
      type: 'good',
      points: 50,
      combo: 1
    };
  } else {
    return {
      type: 'miss',
      points: 0,
      combo: 0
    };
  }
};

export const calculateComboMultiplier = (combo: number): number => {
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
};

export const updateTargetPositions = (
  targets: Target[],
  deltaTime: number,
  config: GameConfig
): Target[] => {
  return targets.map(target => ({
    ...target,
    position: target.position + (target.speed * deltaTime)
  })).filter(target => target.position <= 1.2); // Remove targets that are off screen
};

export const shouldSpawnTarget = (
  lastSpawnTime: number,
  currentTime: number,
  config: GameConfig
): boolean => {
  return currentTime - lastSpawnTime >= config.spawnInterval;
};

export const createTarget = (
  lane: Lane,
  speed: number,
  type: 'normal' | 'power' = 'normal'
): Target => {
  return {
    id: generateTargetId(),
    lane,
    position: 0,
    speed,
    type
  };
};

export const getLevelConfig = (level: number): Partial<GameConfig> => {
  const baseSpeed = 0.002;
  const baseSpawnInterval = 2000;
  
  return {
    targetSpeed: baseSpeed * (1 + (level * 0.1)), // 10% increase per level
    spawnInterval: Math.max(baseSpawnInterval - (level * 100), 1500) // Min 1.5s
  };
};

export const formatScore = (score: number): string => {
  return score.toString().padStart(6, '0');
};

export const formatTime = (timeMs: number): string => {
  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 