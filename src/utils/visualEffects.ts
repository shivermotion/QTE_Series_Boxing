import { Particle, FeedbackText } from '../types/game';

// ============================================================================
// VISUAL EFFECTS UTILITIES
// ============================================================================

export const createParticles = (
  x: number, 
  y: number, 
  color: string, 
  count: number = 8,
  particleIdCounter: React.MutableRefObject<number>
): Particle[] => {
  const newParticles: Particle[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    particleIdCounter.current += 1;
    newParticles.push({
      id: `particle_${timestamp}_${particleIdCounter.current}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      maxLife: 1,
      color,
    });
  }
  
  return newParticles;
};

export const createFeedbackText = (
  text: string, 
  x: number, 
  y: number, 
  color: string
): FeedbackText => {
  return {
    id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    x,
    y,
    color,
    life: 1,
    maxLife: 1,
  };
}; 