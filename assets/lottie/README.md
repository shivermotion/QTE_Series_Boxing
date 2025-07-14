# Lottie Animations for QTE Boxing Game

This directory contains Lottie animations for the input prompts in the game.

## Current Status

The Lottie integration is **fully implemented** using the official Expo `lottie-react-native` package. This package works with Expo Go and should display your `arrow.lottie` animations properly.

## Required Animations

The following Lottie animations should be added to this directory:

1. **arrow.lottie** - **PRIORITY**: Single arrow animation that will be rotated for all swipe directions
2. **tap-animation.lottie** - Animation for tap prompts
3. **hold-flick.lottie** - Animation for hold-and-flick prompts

### Arrow Animation Requirements

The `arrow.lottie` file should:

- Point **right** by default (0 degrees)
- Be designed for 120x120px display area
- Be loopable and smooth
- Work well when rotated to different angles:
  - **Left**: 0° (default)
  - **Right**: 180° (rotated)
  - **Up**: 270° (rotated)
  - **Down**: 90° (rotated)

## How to Enable Lottie Animations

### Step 1: Add Animation Files

1. Create your Lottie animations using Adobe After Effects, Figma, or other tools
2. Export them as `.lottie` files (dotLottie format)
3. Place the files in this directory

### Step 2: Component Status ✅

The component is already configured to use the Expo Lottie package:

```typescript
import LottieView from 'lottie-react-native';

// Clean, professional Lottie implementation
<LottieView
  ref={lottieRef}
  source={require('../../assets/lottie/arrow.lottie')}
  loop
  autoPlay={false} // Controlled manually
  speed={1.2}
  style={[styles.lottieAnimation, rotation]}
/>;

// Features:
// - 150x150px animation size
// - Automatic rotation for each direction
// - Smooth 1.2x speed playback
// - Clean fallback to emojis if needed
```

### Step 3: Metro Configuration ✅

A `metro.config.js` file has been created to handle `.lottie` files:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .lottie files to asset extensions
config.resolver.assetExts.push('lottie');

module.exports = config;
```

This configuration allows Metro to properly bundle `.lottie` files as assets.

## Enhanced Features

Based on the [Airbnb Lottie documentation](https://airbnb.io/lottie/#/react-native), the component includes:

### Animation Control

- **Manual Control**: `autoPlay={false}` with manual play/pause control
- **Speed Control**: `speed={1.2}` for faster animation playback
- **Lifecycle Management**: Animations start/pause based on `isActive` prop

### Available Methods

```typescript
// Control animation playback
playAnimation(); // Start the animation
pauseAnimation(); // Pause the animation
resetAnimation(); // Reset to beginning
```

### Performance Optimizations

- **Conditional Rendering**: Only renders when source is available
- **Proper Cleanup**: Animations pause when component becomes inactive
- **Rotation Optimization**: Efficient transform-based rotation

## Animation Guidelines

- **Size**: Animations should be designed for 120x120px display area
- **Duration**: Keep animations short (1-2 seconds) and loopable
- **Style**: Match the game's visual style with boxing/fighting themes
- **Format**: Use dotLottie format (.lottie) for better performance

## Fallback

If Lottie animations fail to load, the component will automatically fall back to emoji-based prompts.

## Resources

- [LottieFiles](https://lottiefiles.com/) - Find and create Lottie animations
- [dotLottie Documentation](https://dotlottie.io/) - Learn about dotLottie format
- [React Native Lottie](https://github.com/lottie-react-native/lottie-react-native) - React Native Lottie library
