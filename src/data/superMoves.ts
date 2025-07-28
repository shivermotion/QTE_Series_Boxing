export interface SuperMove {
  id: string;
  name: string;
  combo: ('up' | 'down' | 'left' | 'right')[];
  damage: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const superMoves: SuperMove[] = [
  {
    id: 'dragon_punch',
    name: 'Dragon Punch',
    combo: ['down', 'right', 'left'],
    damage: 500,
    description: 'A devastating punch that channels the power of a dragon',
    difficulty: 'medium',
  },
  {
    id: 'tornado_kick',
    name: 'Tornado Kick',
    combo: ['up', 'up', 'down'],
    damage: 450,
    description: 'A spinning kick that creates a whirlwind of destruction',
    difficulty: 'easy',
  },
  {
    id: 'phoenix_strike',
    name: 'Phoenix Strike',
    combo: ['right', 'up', 'left'],
    damage: 600,
    description: 'A fiery strike that rises from the ashes',
    difficulty: 'hard',
  },
  {
    id: 'thunder_clap',
    name: 'Thunder Clap',
    combo: ['left', 'right', 'left'],
    damage: 400,
    description: 'A powerful clap that creates a shockwave',
    difficulty: 'easy',
  },
  {
    id: 'ice_spike',
    name: 'Ice Spike',
    combo: ['down', 'down', 'up'],
    damage: 550,
    description: 'A freezing spike that pierces through defenses',
    difficulty: 'medium',
  },
  {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    combo: ['up', 'left', 'right'],
    damage: 650,
    description: 'A mysterious strike from the shadows',
    difficulty: 'hard',
  },
  {
    id: 'earth_shatter',
    name: 'Earth Shatter',
    combo: ['down', 'down', 'down'],
    damage: 700,
    description: 'A ground-shaking attack that cracks the earth',
    difficulty: 'medium',
  },
  {
    id: 'wind_cutter',
    name: 'Wind Cutter',
    combo: ['right', 'right', 'left'],
    damage: 350,
    description: 'A swift cutting motion like the wind',
    difficulty: 'easy',
  },
  {
    id: 'flame_burst',
    name: 'Flame Burst',
    combo: ['up', 'down', 'up'],
    damage: 480,
    description: 'An explosive burst of flames',
    difficulty: 'medium',
  },
  {
    id: 'cosmic_blast',
    name: 'Cosmic Blast',
    combo: ['left', 'up', 'right'],
    damage: 800,
    description: 'A blast of cosmic energy from the stars',
    difficulty: 'hard',
  },
];

// Helper function to find a super move by combo
export const findSuperMoveByCombo = (combo: ('up' | 'down' | 'left' | 'right')[]): SuperMove | null => {
  return superMoves.find(move => 
    move.combo.length === combo.length && 
    move.combo.every((direction, index) => direction === combo[index])
  ) || null;
};

// Helper function to get all super moves by difficulty
export const getSuperMovesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): SuperMove[] => {
  return superMoves.filter(move => move.difficulty === difficulty);
};

// Helper function to get a random super move
export const getRandomSuperMove = (): SuperMove => {
  const randomIndex = Math.floor(Math.random() * superMoves.length);
  return superMoves[randomIndex];
};

// Helper function to validate a combo
export const isValidCombo = (combo: ('up' | 'down' | 'left' | 'right')[]): boolean => {
  return combo.length === 3 && combo.every(direction => 
    ['up', 'down', 'left', 'right'].includes(direction)
  );
}; 