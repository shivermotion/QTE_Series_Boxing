# Save System Documentation

This document explains how to use the comprehensive save system implemented for the QTE Series Boxing game.

## Overview

The save system provides both **event-based saving** and **autosaving** functionality using `react-native-mmkv` for high-performance storage. It automatically saves game progress and provides easy-to-use hooks for game events.

## Features

- ✅ **Event-based saving**: Save after specific game events (level completion, score updates, etc.)
- ✅ **Autosaving**: Automatic saves every 5 seconds after state changes
- ✅ **High performance**: Uses MMKV for 30x faster storage than AsyncStorage
- ✅ **Encryption**: Secure storage for sensitive game data
- ✅ **Multiple instances**: Separate storage for different data types (progress, settings, statistics)
- ✅ **React hooks integration**: Built-in MMKV hooks for automatic re-renders
- ✅ **Save history**: Tracks all save events with timestamps
- ✅ **Error handling**: Graceful fallbacks and error recovery
- ✅ **Data migration**: Handles missing properties from older save files
- ✅ **Export/Import**: Backup and restore save data
- ✅ **Save status indicators**: Visual feedback for save status
- ✅ **Storage optimization**: Automatic trimming and size monitoring
- ✅ **New architecture**: Fully compatible with React Native's new architecture (TurboModules)

## Quick Start

### 1. Basic Usage

The save system is already integrated into your app via the `GameProvider`. You can start using it immediately:

```tsx
import { useGameSave } from '../hooks/useGameSave';

function MyGameComponent() {
  const { gameState, handleLevelComplete, handleScoreAdd, handlePunch } = useGameSave();

  // Your game logic here
  const onLevelWin = () => {
    handleLevelComplete(currentLevel, score, winTime);
  };

  const onPunch = () => {
    handlePunch(); // Automatically tracks punch statistics
  };
}
```

### 2. High-Performance MMKV Hooks (Recommended)

For optimal performance, use the MMKV-specific hooks that provide automatic re-renders:

```tsx
import { useMMKVGameState } from '../hooks/useMMKVGameState';

function OptimizedGameComponent() {
  const { gameState, completeLevel, addScore, incrementStat } = useMMKVGameState();

  // These automatically trigger re-renders when values change
  const onPunch = () => {
    incrementStat('totalPunches');
  };

  const onLevelWin = () => {
    completeLevel(currentLevel, score);
  };
}
```

**Note**: This implementation uses MMKV v3.x.x with React Native's new architecture (TurboModules) for optimal performance and advanced features like encryption and built-in React hooks.

### 2. Save Status Indicator

Add a visual save indicator to any screen:

```tsx
import SaveStatusIndicator from '../components/SaveStatusIndicator';

function GameScreen() {
  return (
    <View>
      {/* Your game content */}
      <SaveStatusIndicator showDetails={true} />
    </View>
  );
}
```

## Available Hooks and Methods

### useGameSave Hook

The main hook that provides all save functionality:

```tsx
const {
  // Game state
  gameState,

  // Event handlers (automatically save)
  handleLevelComplete,
  handleScoreAdd,
  handleAchievementUnlock,
  handleCharacterUnlock,
  handlePunch,
  handleBlock,
  handleDodge,
  handleCombo,
  handleAudioSettingChange,

  // Manual save
  manualSave,

  // Save status
  getSaveStatus,
} = useGameSave();
```

### Event Handlers

All event handlers automatically save the game state:

```tsx
// Level completion (saves immediately)
handleLevelComplete(level, score, winTime);

// Score updates (saves immediately)
handleScoreAdd(points);

// Achievement unlocks (saves immediately)
handleAchievementUnlock('first_win');

// Character unlocks
handleCharacterUnlock('new_fighter');

// Combat actions (tracked for statistics)
handlePunch();
handleBlock();
handleDodge();

// Combo tracking
handleCombo(5); // Updates best combo if higher

// Audio settings (saves immediately)
handleAudioSettingChange({ masterVolume: 0.8 });
```

### Manual Save Operations

```tsx
// Manual save
const success = await manualSave('autosave');

// Check save status
const status = getSaveStatus();
console.log(status.hasData, status.lastSave, status.isRecent);
```

## Game State Structure

The save system tracks comprehensive game data:

```tsx
interface GameState {
  // Player progress
  currentLevel: number;
  highestLevelUnlocked: number;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;

  // Settings
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  };

  // Statistics
  statistics: {
    totalPunches: number;
    totalBlocks: number;
    totalDodges: number;
    bestCombo: number;
    fastestWin: number;
    totalPlayTime: number;
  };

  // Achievements and unlocks
  achievements: string[];
  unlockedCharacters: string[];

  // Session data
  lastSaved: string | null;
  gameVersion: string;
}
```

## Integration Examples

### 1. Game Screen Integration

```tsx
import { useGameSave } from '../hooks/useGameSave';

function GameScreen() {
  const { gameState, handleLevelComplete, handlePunch, handleBlock, handleDodge, handleCombo } =
    useGameSave();

  const onPunch = () => {
    handlePunch();
    // Your punch logic here
  };

  const onLevelWin = (score: number, winTime: number) => {
    handleLevelComplete(gameState.currentLevel, score, winTime);
    // Navigate to next level or show win screen
  };

  return (
    <View>
      {/* Game UI */}
      <SaveStatusIndicator />
    </View>
  );
}
```

### 2. Settings Screen Integration

```tsx
import { useGameSave } from '../hooks/useGameSave';

function SettingsScreen() {
  const { handleAudioSettingChange, gameState } = useGameSave();

  const onVolumeChange = (type: 'master' | 'music' | 'sfx', value: number) => {
    handleAudioSettingChange({ [`${type}Volume`]: value });
  };

  return (
    <View>
      <Slider
        value={gameState.audioSettings.masterVolume}
        onValueChange={value => onVolumeChange('master', value)}
      />
    </View>
  );
}
```

### 3. Statistics Screen

```tsx
import { useGameSave } from '../hooks/useGameSave';

function StatisticsScreen() {
  const { gameState } = useGameSave();

  return (
    <View>
      <Text>Total Punches: {gameState.statistics.totalPunches}</Text>
      <Text>Best Combo: {gameState.statistics.bestCombo}</Text>
      <Text>Fastest Win: {gameState.statistics.fastestWin}s</Text>
      <Text>Total Play Time: {Math.floor(gameState.statistics.totalPlayTime / 60)}m</Text>
    </View>
  );
}
```

## MMKV-Specific Features

### Multiple Storage Instances

The save system uses three separate MMKV instances for optimal performance:

```tsx
import { gameStorage, settingsStorage, statisticsStorage } from '../utils/saveManager';

// Game progress
gameStorage.set('currentLevel', 5);

// Audio settings
settingsStorage.set('masterVolume', 0.8);

// Statistics
statisticsStorage.set('totalPunches', 1000);
```

### Architecture Compatibility

This implementation uses MMKV v3.x.x with React Native's new architecture (TurboModules):

- **TurboModules enabled**: Leverages React Native's new architecture for maximum performance
- **Cross-platform**: Supports both iOS and Android with new architecture
- **High performance**: 30x faster than AsyncStorage with JSI bindings
- **Advanced features**: Encryption, built-in React hooks, and storage optimization

### Storage Management

```tsx
import { saveManager } from '../utils/saveManager';

// Check if save data exists
const hasData = saveManager.hasSaveData();

// Get last save time
const lastSave = saveManager.getLastSaveTime();

// Export/Import save data
const saveData = saveManager.exportSaveData();
await saveManager.importSaveData(saveData);
```

## Advanced Usage

### Direct Context Access

For advanced use cases, you can access the context directly:

```tsx
import { useGame } from '../contexts/GameContext';

function AdvancedComponent() {
  const { gameState, updateGameState, saveGame, clearGameData } = useGame();

  const customUpdate = () => {
    updateGameState({
      totalScore: gameState.totalScore + 1000,
      statistics: {
        ...gameState.statistics,
        totalPunches: gameState.statistics.totalPunches + 10,
      },
    });
  };

  const forceSave = async () => {
    await saveGame('score_update');
  };

  const resetGame = async () => {
    await clearGameData();
  };
}
```

### Save Manager Direct Access

For low-level operations:

```tsx
import { saveManager } from '../utils/saveManager';

// Export save data
const saveData = saveManager.exportSaveData();

// Import save data
await saveManager.importSaveData(saveData);

// Check if save exists
const hasData = saveManager.hasSaveData();

// Get save events history
const events = saveManager.getSaveEvents();
```

## Save Events

The system tracks different types of save events:

- `level_complete`: When a level is completed
- `score_update`: When score changes
- `achievement_unlocked`: When an achievement is unlocked
- `settings_change`: When settings are modified
- `autosave`: Automatic periodic saves

## Performance Considerations

- **Autosaving**: Debounced to 5 seconds to prevent excessive writes
- **Event-based saves**: Immediate for critical events
- **Storage**: Uses MMKV for 30x faster performance than AsyncStorage
- **Memory**: Limits save history to 100 events to prevent bloat
- **React hooks**: Built-in MMKV hooks provide automatic re-renders without manual state management
- **Multiple instances**: Separate storage instances for different data types improve performance
- **Encryption**: Only applied to sensitive data (game progress, settings) while statistics remain unencrypted for speed
- **Storage optimization**: Automatic trimming and size monitoring prevent storage bloat
- **JSI bindings**: Direct native method invocations without bridge overhead

## Error Handling

The system includes comprehensive error handling:

- Graceful fallbacks to initial state if loading fails
- Automatic retry mechanisms
- Console logging for debugging
- User-friendly error messages

## Migration and Compatibility

- Automatically merges new properties with existing save data
- Handles missing properties from older save versions
- Maintains backward compatibility

## Testing

To test the save system:

1. Play the game and trigger various events
2. Check the save status indicator
3. Close and reopen the app
4. Verify that progress is maintained
5. Test the manual save button

## Troubleshooting

### Common Issues

1. **Save not working**: Check if MMKV is properly linked
2. **Data not loading**: Verify the save file exists
3. **Performance issues**: Check for excessive save calls

### Debug Information

Enable debug logging by checking the console for save-related messages:

```
Game saved successfully (level_complete)
Game saved successfully (autosave)
Failed to save game state: [error]
```

## Future Enhancements

Potential improvements for the save system:

- **Cloud save integration**: Cross-device synchronization
- **Multiple save slots**: For different game profiles
- **Save data compression**: Reduce storage footprint
- **App Groups support**: For iOS extensions and widgets
- **Multi-process mode**: For app extensions and background tasks
- **Custom storage paths**: For different data types
- **Real-time sync**: Between app instances
- **Advanced encryption**: Custom encryption keys and algorithms
- **Backup/restore**: Cloud backup integration
