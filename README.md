# QTE Series: Boxing

A retro-style reflex-based arcade game built with React Native and Expo, inspired by classic Sega AM2 games like Space Harrier and OutRun.

## 🎮 Game Overview

**QTE Series: Boxing** is a fast-paced rhythm game where players tap and swipe to hit rising boxing pads in time-sensitive challenges. The game features:

- **3-lane gameplay**: Left, center, and right touch zones
- **Timing-based scoring**: Perfect hits (200ms window) vs Good hits (400ms window)
- **Combo system**: Multipliers for consecutive perfect hits
- **Progressive difficulty**: Speed increases every 30 seconds or 1,000 points
- **Avatar feedback**: Character face reflects performance (success/failure/idle)
- **Multiple game modes**: Arcade, Time Attack, and Endless

## 🎯 Gameplay Mechanics

### Core Loop

1. Boxing pads rise from the bottom in 3 lanes
2. Players tap in the corresponding touch zone to hit pads in the hit zone (cyan line)
3. Perfect timing = 100 points, Good timing = 50 points
4. Missed pads cost 1 life (3 lives total)
5. Combo multiplier: x2 at 5 perfects, x3 at 10 perfects

### Controls

- **Tap**: Hit pad in corresponding lane
- **Swipe Up**: Power hit (+200 points, 150ms window)
- **One-handed play**: Optimized for portrait orientation

### Game Modes

- **Arcade**: Increasing speed and complexity
- **Time Attack**: Max points in 60 seconds
- **Endless**: Survive without losing 3 lives

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Package Manager**: Yarn
- **Game Engine**: Custom game loop with React hooks
- **Graphics**: React Native components (Skia for future enhancements)
- **Audio**: Expo AV (placeholder for now)
- **Haptics**: Expo Haptics (placeholder for now)

## 📱 Features

### Visual Design

- **Style**: Retro 2D pixel art aesthetic
- **Color Palette**: Neon pink/cyan, dark blue/purple, yellow/red accents
- **Avatar**: 128x128px character with state-based animations
- **Targets**: 64x64px boxing pads with hit/miss animations
- **UI**: Pixelated buttons and bitmap-style fonts

### Audio (Planned)

- **Sound Effects**: Chiptune hits, misses, combos
- **Music**: 30-60s chiptune/FM synth loops
- **Tools**: Bfxr, Bosca Ceoil, Audacity

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- Yarn 1.22.0 or higher
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd QTE_Series_Boxing
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Start the development server**

   ```bash
   yarn start
   ```

4. **Run on device/emulator**

   ```bash
   # iOS
   yarn ios

   # Android
   yarn android

   # Web (for testing)
   yarn web
   ```

### Available Scripts

```bash
# Development
yarn start          # Start Expo development server
yarn dev            # Start with dev client
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn web            # Run on web browser

# Building
yarn build:android  # Build for Android
yarn build:ios      # Build for iOS
yarn build:web      # Build for web

# Development Tools
yarn test           # Run tests
yarn lint           # Run ESLint
yarn type-check     # Run TypeScript type checking
yarn clean          # Clean and reinstall dependencies
yarn reset          # Clean, reinstall, and start
```

## 📁 Project Structure

```
QTE_Series_Boxing/
├── src/
│   ├── components/
│   │   └── GameScreen.tsx          # Main game component
│   ├── screens/
│   │   ├── MainMenu.tsx            # Menu screen
│   │   ├── GameOverScreen.tsx      # Game over screen
│   │   └── SettingsScreen.tsx      # Settings screen
│   ├── types/
│   │   └── game.ts                 # TypeScript interfaces
│   └── utils/
│       ├── gameEngine.ts           # Game loop logic
│       └── gameUtils.ts            # Utility functions
├── assets/
│   ├── audio/
│   │   └── hit.mp3                 # Placeholder audio
│   ├── sprites/                    # Future sprite assets
│   └── fonts/                      # Future font assets
├── App.tsx                         # Main app component
├── package.json                    # Dependencies and scripts
├── yarn.lock                       # Yarn lock file
└── README.md                       # This file
```

## 🎨 Asset Development

### Sprite Creation

- **Tools**: Aseprite (recommended), GIMP
- **Avatar**: 128x128px with 3 animation states
- **Targets**: 64x64px boxing pads with 2-3 frame animations
- **UI Elements**: Pixelated buttons and icons

### Audio Creation

- **Sound Effects**: Bfxr for chiptune effects
- **Music**: Bosca Ceoil for FM synth loops
- **Format**: MP3/OGG for mobile optimization

## 🔧 Development Roadmap

### Phase 1: Core Gameplay ✅

- [x] Basic game loop implementation
- [x] Target spawning and movement
- [x] Touch gesture handling
- [x] Scoring system
- [x] Lives system
- [x] Menu navigation
- [x] Yarn package management

### Phase 2: Polish & Enhancement

- [ ] Sprite-based graphics (replace placeholder rectangles)
- [ ] Audio integration
- [ ] Haptic feedback
- [ ] Particle effects
- [ ] Screen shake on misses
- [ ] Combo multiplier display

### Phase 3: Advanced Features

- [ ] Firebase leaderboards
- [ ] Achievement system
- [ ] Avatar customization
- [ ] Power-up system
- [ ] Background parallax effects
- [ ] Settings menu

### Phase 4: Monetization & Distribution

- [ ] Ad integration (rewarded ads for +1 life)
- [ ] In-app purchases for cosmetics
- [ ] App Store optimization
- [ ] Performance optimization
- [ ] Accessibility features

## 🎯 Performance Targets

- **Frame Rate**: 60 FPS on mid-range devices
- **Memory Usage**: < 100MB
- **Load Time**: < 3 seconds
- **Battery Impact**: Minimal background processing

## 🐛 Known Issues

- Placeholder audio file (will be replaced with actual chiptune)
- Basic rectangle graphics (will be replaced with pixel art sprites)
- No haptic feedback yet (placeholder implementation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`yarn install`)
4. Make your changes
5. Run tests (`yarn test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by classic Sega AM2 arcade games
- Built with modern React Native and Expo tools
- Retro gaming community for inspiration and feedback

---

**Ready to punch some targets? Let's get boxing! 🥊**
