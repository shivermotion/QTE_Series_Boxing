import { GameState, Target, GameConfig } from '../types/game';
import { 
  updateTargetPositions, 
  shouldSpawnTarget, 
  createTarget, 
  getRandomLane,
  getLevelConfig 
} from './gameUtils';

export interface GameEngineState {
  gameState: GameState;
  config: GameConfig;
  lastSpawnTime: number;
  lastFrameTime: number;
}

export const GameEngine = {
  update: (entities: any, { time }: { time: { current: number } }) => {
    const { gameState, config, lastSpawnTime, lastFrameTime } = entities.gameEngine;
    
    if (gameState.isPaused) {
      return entities;
    }

    const currentTime = time.current;
    const deltaTime = currentTime - lastFrameTime;

    // Update game time
    gameState.gameTime += deltaTime;

    // Update level based on time or score
    const newLevel = Math.floor(gameState.gameTime / 30000) + Math.floor(gameState.score / 1000) + 1;
    if (newLevel !== gameState.level) {
      gameState.level = newLevel;
      const levelConfig = getLevelConfig(newLevel);
      Object.assign(config, levelConfig);
    }

    // Update target positions
    gameState.targets = updateTargetPositions(gameState.targets, deltaTime, config);

    // Check for missed targets
    gameState.targets.forEach((target: Target) => {
      if (target.position > 1.0) {
        gameState.lives--;
        gameState.combo = 0;
        gameState.avatarState = 'failure';
        // Remove the missed target
        gameState.targets = gameState.targets.filter((t: Target) => t.id !== target.id);
      }
    });

    // Spawn new targets
    if (shouldSpawnTarget(lastSpawnTime, currentTime, config)) {
      const newTarget = createTarget(getRandomLane(), config.targetSpeed);
      gameState.targets.push(newTarget);
      entities.gameEngine.lastSpawnTime = currentTime;
    }

    // Reset avatar state after a delay
    if (gameState.avatarState !== 'idle') {
      setTimeout(() => {
        gameState.avatarState = 'idle';
      }, 1000);
    }

    entities.gameEngine.lastFrameTime = currentTime;

    return entities;
  }
};

export const createGameEngineState = (config: GameConfig): GameEngineState => {
  return {
    gameState: {
      score: 0,
      lives: 3,
      targets: [],
      avatarState: 'idle',
      combo: 0,
      gameMode: 'arcade',
      isPaused: false,
      gameTime: 0,
      level: 1
    },
    config,
    lastSpawnTime: 0,
    lastFrameTime: 0
  };
}; 