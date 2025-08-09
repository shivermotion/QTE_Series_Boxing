import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, initialGameState, SaveEvent } from '../types/gameState';
import debounce from 'lodash.debounce';

// Storage keys
const GAME_STATE_KEY = '@game_state';
const SAVE_EVENTS_KEY = '@save_events';
const AUDIO_SETTINGS_KEY = '@audio_settings';
const STATISTICS_KEY = '@statistics';
const ACHIEVEMENTS_KEY = '@achievements';
const UNLOCKED_CHARACTERS_KEY = '@unlocked_characters';

export class SaveManager {
  private static instance: SaveManager;
  private saveEvents: SaveEvent[] = [];
  private isSaving = false;
  private autosaveTimer: NodeJS.Timeout | null = null;
  private pendingAutosave = false;

  // Debounced save function to prevent excessive saves
  private debouncedSave = debounce(
    async (state: GameState, eventType: SaveEvent['type']) => {
      await this.performSave(state, eventType);
    },
    1000, // Wait 1 second before saving
    { leading: false, trailing: true }
  );

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
      // Load all parts of the game state in parallel for better performance
      const [
        savedState,
        audioSettings,
        statistics,
        achievements,
        unlockedCharacters,
      ] = await Promise.all([
        AsyncStorage.getItem(GAME_STATE_KEY),
        AsyncStorage.getItem(AUDIO_SETTINGS_KEY),
        AsyncStorage.getItem(STATISTICS_KEY),
        AsyncStorage.getItem(ACHIEVEMENTS_KEY),
        AsyncStorage.getItem(UNLOCKED_CHARACTERS_KEY),
      ]);

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

      // Merge achievements if they exist
      if (achievements) {
        gameState.achievements = JSON.parse(achievements);
      }

      // Merge unlocked characters if they exist
      if (unlockedCharacters) {
        gameState.unlockedCharacters = JSON.parse(unlockedCharacters);
      }

      console.log('Game state loaded successfully');
      return gameState;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return { ...initialGameState };
    }
  }

  /**
   * Save the game state to storage (public interface)
   */
  async saveGameState(state: GameState, eventType: SaveEvent['type'] = 'autosave'): Promise<boolean> {
    // Use debounced save for non-critical events
    if (eventType === 'autosave' || eventType === 'score_update') {
      this.debouncedSave(state, eventType);
      return true;
    }
    
    // Immediate save for critical events
    return this.performSave(state, eventType);
  }

  /**
   * Perform the actual save operation
   */
  private async performSave(state: GameState, eventType: SaveEvent['type']): Promise<boolean> {
    if (this.isSaving) {
      console.log('Save already in progress, queueing...');
      this.pendingAutosave = true;
      return false;
    }

    this.isSaving = true;

    try {
      const stateToSave = {
        ...state,
        lastSaved: new Date().toISOString(),
        gameVersion: '1.0.0',
      };

      // Save different parts of the state in parallel for better performance
      const savePromises = [
        // Save main game state
        AsyncStorage.setItem(GAME_STATE_KEY, JSON.stringify({
          currentLevel: stateToSave.currentLevel,
          highestLevelUnlocked: stateToSave.highestLevelUnlocked,
          totalScore: stateToSave.totalScore,
          gamesPlayed: stateToSave.gamesPlayed,
          gamesWon: stateToSave.gamesWon,
          lastSaved: stateToSave.lastSaved,
          gameVersion: stateToSave.gameVersion,
        })),
        // Save audio settings separately
        AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(stateToSave.audioSettings)),
        // Save statistics separately
        AsyncStorage.setItem(STATISTICS_KEY, JSON.stringify(stateToSave.statistics)),
        // Save achievements
        AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(stateToSave.achievements)),
        // Save unlocked characters
        AsyncStorage.setItem(UNLOCKED_CHARACTERS_KEY, JSON.stringify(stateToSave.unlockedCharacters)),
      ];

      await Promise.all(savePromises);

      // Track save event
      await this.addSaveEvent(eventType);

      console.log(`Game saved successfully (${eventType})`);
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    } finally {
      this.isSaving = false;
      
      // If there was a pending autosave, process it now
      if (this.pendingAutosave) {
        this.pendingAutosave = false;
        // We don't recursively call save here to avoid infinite loops
        console.log('Pending autosave will be processed on next cycle');
      }
    }
  }

  /**
   * Clear all game data
   */
  async clearGameData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        GAME_STATE_KEY,
        SAVE_EVENTS_KEY,
        AUDIO_SETTINGS_KEY,
        STATISTICS_KEY,
        ACHIEVEMENTS_KEY,
        UNLOCKED_CHARACTERS_KEY,
      ]);
      this.saveEvents = [];
      console.log('Game data cleared');
    } catch (error) {
      console.error('Failed to clear game data:', error);
    }
  }

  /**
   * Export save data as a JSON string
   */
  async exportSaveData(): Promise<string> {
    try {
      const gameState = await this.loadGameState();
      const saveEvents = await AsyncStorage.getItem(SAVE_EVENTS_KEY);
      
      const exportData = {
        gameState,
        saveEvents: saveEvents ? JSON.parse(saveEvents) : [],
        exportDate: new Date().toISOString(),
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error('Failed to export save data:', error);
      throw error;
    }
  }

  /**
   * Import save data from a JSON string
   */
  async importSaveData(jsonData: string): Promise<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.gameState) {
        throw new Error('Invalid save data format');
      }
      
      // Save the imported game state (treat as manual save for type safety)
      await this.saveGameState(importData.gameState, 'manual');
      
      // Import save events if available
      if (importData.saveEvents) {
        await AsyncStorage.setItem(SAVE_EVENTS_KEY, JSON.stringify(importData.saveEvents));
        this.saveEvents = importData.saveEvents;
      }
      
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }

  /**
   * Check if save data exists
   */
  async hasSaveData(): Promise<boolean> {
    try {
      const savedState = await AsyncStorage.getItem(GAME_STATE_KEY);
      return savedState !== null;
    } catch (error) {
      console.error('Failed to check save data:', error);
      return false;
    }
  }

  /**
   * Get the last save time
   */
  async getLastSaveTime(): Promise<string | null> {
    try {
      const savedState = await AsyncStorage.getItem(GAME_STATE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        return state.lastSaved || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get last save time:', error);
      return null;
    }
  }

  /**
   * Start autosave timer
   */
  startAutosave(intervalMs: number = 30000): void {
    this.stopAutosave(); // Clear any existing timer
    
    this.autosaveTimer = setInterval(() => {
      // The actual save will be triggered by the component using this
      console.log('Autosave timer triggered');
    }, intervalMs);
  }

  /**
   * Stop autosave timer
   */
  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{ totalSize: number; itemCount: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return {
        totalSize,
        itemCount: keys.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { totalSize: 0, itemCount: 0 };
    }
  }

  /**
   * Optimize storage by removing old save events
   */
  async optimizeStorage(): Promise<void> {
    try {
      // Keep only the last 100 save events
      if (this.saveEvents.length > 100) {
        this.saveEvents = this.saveEvents.slice(-100);
        await AsyncStorage.setItem(SAVE_EVENTS_KEY, JSON.stringify(this.saveEvents));
      }
      
      console.log('Storage optimized');
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }

  // Private helper methods

  private mergeWithInitialState(savedState: Partial<GameState>): GameState {
    // Deep merge to handle nested objects and new properties
    return {
      ...initialGameState,
      ...savedState,
      audioSettings: {
        ...initialGameState.audioSettings,
        ...(savedState.audioSettings || {}),
      },
      statistics: {
        ...initialGameState.statistics,
        ...(savedState.statistics || {}),
      },
      achievements: savedState.achievements || initialGameState.achievements,
      unlockedCharacters: savedState.unlockedCharacters || initialGameState.unlockedCharacters,
    };
  }

  private async loadSaveEvents(): Promise<void> {
    try {
      const events = await AsyncStorage.getItem(SAVE_EVENTS_KEY);
      if (events) {
        this.saveEvents = JSON.parse(events);
      }
    } catch (error) {
      console.error('Failed to load save events:', error);
      this.saveEvents = [];
    }
  }

  private async addSaveEvent(type: SaveEvent['type']): Promise<void> {
    const event: SaveEvent = {
      type,
      timestamp: new Date().toISOString(),
    };
    
    this.saveEvents.push(event);
    
    // Keep only the last 100 events to prevent memory bloat
    if (this.saveEvents.length > 100) {
      this.saveEvents = this.saveEvents.slice(-100);
    }
    
    try {
      await AsyncStorage.setItem(SAVE_EVENTS_KEY, JSON.stringify(this.saveEvents));
    } catch (error) {
      console.error('Failed to save event history:', error);
    }
  }

  public getSaveEvents(): SaveEvent[] {
    return [...this.saveEvents];
  }
}

// Export singleton instance
export const saveManager = SaveManager.getInstance();