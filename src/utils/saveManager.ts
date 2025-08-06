import { MMKV, Mode } from 'react-native-mmkv';
import { GameState, initialGameState, SaveEvent } from '../types/gameState';

// Create separate MMKV instances for different data types
export const gameStorage = new MMKV({
  id: 'game-progress',
  encryptionKey: 'game-progress-key-2024',
  mode: Mode.SINGLE_PROCESS,
});

export const settingsStorage = new MMKV({
  id: 'game-settings',
  encryptionKey: 'game-settings-key-2024',
  mode: Mode.SINGLE_PROCESS,
});

export const statisticsStorage = new MMKV({
  id: 'game-statistics',
  mode: Mode.SINGLE_PROCESS,
});

// Storage keys
const GAME_STATE_KEY = 'game_state';
const SAVE_EVENTS_KEY = 'save_events';
const AUDIO_SETTINGS_KEY = 'audio_settings';
const STATISTICS_KEY = 'statistics';

export class SaveManager {
  private static instance: SaveManager;
  private saveEvents: SaveEvent[] = [];
  private isSaving = false;

  private constructor() {
    this.loadSaveEvents();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Load the current game state from storage
   */
  async loadGameState(): Promise<GameState> {
    try {
      // Load main game state
      const savedState = gameStorage.getString(GAME_STATE_KEY);
      const audioSettings = settingsStorage.getString(AUDIO_SETTINGS_KEY);
      const statistics = statisticsStorage.getString(STATISTICS_KEY);

      let gameState: GameState;

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState = this.mergeWithInitialState(parsedState);
      } else {
        gameState = { ...initialGameState };
      }

      // Merge audio settings if they exist
      if (audioSettings) {
        gameState.audioSettings = {
          ...gameState.audioSettings,
          ...JSON.parse(audioSettings),
        };
      }

      // Merge statistics if they exist
      if (statistics) {
        gameState.statistics = {
          ...gameState.statistics,
          ...JSON.parse(statistics),
        };
      }

      return gameState;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return { ...initialGameState };
    }
  }

  /**
   * Save the game state to storage
   */
  async saveGameState(state: GameState, eventType: SaveEvent['type'] = 'autosave'): Promise<boolean> {
    if (this.isSaving) {
      console.log('Save already in progress, skipping...');
      return false;
    }

    this.isSaving = true;

    try {
      const stateToSave = {
        ...state,
        lastSaved: new Date().toISOString(),
      };

      // Save main game state (encrypted)
      gameStorage.set(GAME_STATE_KEY, JSON.stringify(stateToSave));

      // Save audio settings separately (encrypted)
      settingsStorage.set(AUDIO_SETTINGS_KEY, JSON.stringify(state.audioSettings));

      // Save statistics separately (unencrypted for performance)
      statisticsStorage.set(STATISTICS_KEY, JSON.stringify(state.statistics));

      // Record the save event
      const saveEvent: SaveEvent = {
        type: eventType,
        timestamp: new Date().toISOString(),
        data: { level: state.currentLevel, score: state.totalScore },
      };

      this.saveEvents.push(saveEvent);
      this.saveSaveEvents();

      // Keep only last 100 save events to prevent storage bloat
      if (this.saveEvents.length > 100) {
        this.saveEvents = this.saveEvents.slice(-100);
        this.saveSaveEvents();
      }

      console.log(`Game saved successfully (${eventType})`);
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Save immediately for critical events (no debouncing)
   */
  async saveImmediately(state: GameState, eventType: SaveEvent['type']): Promise<boolean> {
    return this.saveGameState(state, eventType);
  }

  /**
   * Clear all saved game data
   */
  async clearGameData(): Promise<boolean> {
    try {
      gameStorage.clearAll();
      settingsStorage.clearAll();
      statisticsStorage.clearAll();
      this.saveEvents = [];
      console.log('Game data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear game data:', error);
      return false;
    }
  }

  /**
   * Get save events history
   */
  getSaveEvents(): SaveEvent[] {
    return [...this.saveEvents];
  }

  /**
   * Check if save data exists
   */
  hasSaveData(): boolean {
    return gameStorage.contains(GAME_STATE_KEY);
  }

  /**
   * Get the last save timestamp
   */
  getLastSaveTime(): string | null {
    try {
      const savedState = gameStorage.getString(GAME_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        return parsedState.lastSaved || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get last save time:', error);
      return null;
    }
  }

  /**
   * Export save data (for backup purposes)
   */
  exportSaveData(): string | null {
    try {
      const gameState = gameStorage.getString(GAME_STATE_KEY);
      const audioSettings = settingsStorage.getString(AUDIO_SETTINGS_KEY);
      const statistics = statisticsStorage.getString(STATISTICS_KEY);
      const saveEvents = this.saveEvents;
      
      return JSON.stringify({
        gameState: gameState ? JSON.parse(gameState) : null,
        audioSettings: audioSettings ? JSON.parse(audioSettings) : null,
        statistics: statistics ? JSON.parse(statistics) : null,
        saveEvents,
        exportDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to export save data:', error);
      return null;
    }
  }

  /**
   * Import save data (for restore purposes)
   */
  async importSaveData(data: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(data);
      
      if (parsedData.gameState) {
        gameStorage.set(GAME_STATE_KEY, JSON.stringify(parsedData.gameState));
      }
      
      if (parsedData.audioSettings) {
        settingsStorage.set(AUDIO_SETTINGS_KEY, JSON.stringify(parsedData.audioSettings));
      }
      
      if (parsedData.statistics) {
        statisticsStorage.set(STATISTICS_KEY, JSON.stringify(parsedData.statistics));
      }
      
      if (parsedData.saveEvents) {
        this.saveEvents = parsedData.saveEvents;
        this.saveSaveEvents();
      }
      
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }

  /**
   * Get storage size information
   */
  getStorageInfo() {
    return {
      gameStorageSize: gameStorage.size,
      settingsStorageSize: settingsStorage.size,
      statisticsStorageSize: statisticsStorage.size,
      totalSize: gameStorage.size + settingsStorage.size + statisticsStorage.size,
    };
  }

  /**
   * Optimize storage by trimming unused space
   */
  optimizeStorage(): void {
    try {
      gameStorage.trim();
      settingsStorage.trim();
      statisticsStorage.trim();
      console.log('Storage optimized');
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }

  /**
   * Private methods
   */
  private loadSaveEvents(): void {
    try {
      const savedEvents = gameStorage.getString(SAVE_EVENTS_KEY);
      this.saveEvents = savedEvents ? JSON.parse(savedEvents) : [];
    } catch (error) {
      console.error('Failed to load save events:', error);
      this.saveEvents = [];
    }
  }

  private saveSaveEvents(): void {
    try {
      gameStorage.set(SAVE_EVENTS_KEY, JSON.stringify(this.saveEvents));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  private mergeWithInitialState(savedState: Partial<GameState>): GameState {
    const mergedState = { ...initialGameState };
    
    // Recursively merge objects
    for (const key in savedState) {
      if (savedState.hasOwnProperty(key)) {
        const value = savedState[key as keyof GameState];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          (mergedState as any)[key] = { ...(mergedState as any)[key], ...value };
        } else {
          (mergedState as any)[key] = value;
        }
      }
    }
    
    return mergedState;
  }
}

// Export a singleton instance
export const saveManager = SaveManager.getInstance(); 