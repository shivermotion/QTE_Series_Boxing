export interface PauseSafeClock {
  pauseStartTime: number | null;
  totalPaused: number;
  isPaused: boolean;
}

export const createPauseSafeClock = (): PauseSafeClock => ({
  pauseStartTime: null,
  totalPaused: 0,
  isPaused: false,
});

export const onPause = (clock: PauseSafeClock) => {
  if (!clock.isPaused) {
    clock.isPaused = true;
    clock.pauseStartTime = Date.now();
  }
};

export const onResume = (clock: PauseSafeClock) => {
  if (clock.isPaused && clock.pauseStartTime) {
    clock.totalPaused += Date.now() - clock.pauseStartTime;
    clock.pauseStartTime = null;
    clock.isPaused = false;
  }
};

export const getElapsedSince = (clock: PauseSafeClock, startTime: number): number => {
  const now = Date.now();
  const currentPaused = clock.pauseStartTime ? now - clock.pauseStartTime : 0;
  return now - startTime - (clock.totalPaused + currentPaused);
};



