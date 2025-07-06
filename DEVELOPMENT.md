# Development Guide - QTE Series: Boxing

## 🛠 Development Setup

### Prerequisites

- Node.js 16.x or higher
- Yarn 1.22.0 or higher
- Expo CLI (`yarn global add @expo/cli`)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd QTE_Series_Boxing

# Install dependencies
yarn install

# Start development server
yarn start
```

## 📝 Available Commands

### Development

```bash
yarn start          # Start Expo development server
yarn dev            # Start with dev client (for custom dev builds)
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn web            # Run on web browser (for testing)
```

### Building

```bash
yarn build:android  # Build APK for Android
yarn build:ios      # Build for iOS (requires Apple Developer account)
yarn build:web      # Build for web deployment
```

### Development Tools

```bash
yarn test           # Run Jest tests
yarn lint           # Run ESLint for code quality
yarn type-check     # Run TypeScript type checking
yarn clean          # Remove node_modules and reinstall
yarn reset          # Clean, reinstall, and start dev server
```

## 🏗 Project Structure

```
QTE_Series_Boxing/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── GameScreen.tsx   # Main game component
│   │   └── GameScreen.tsx   # Main game component
│   ├── screens/             # Screen components
│   │   ├── MainMenu.tsx     # Main menu
│   │   ├── GameOverScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── types/               # TypeScript type definitions
│   │   └── game.ts
│   └── utils/               # Utility functions
│       ├── gameEngine.ts    # Game loop logic
│       └── gameUtils.ts     # Game utilities
├── assets/                  # Static assets
│   ├── audio/               # Sound files
│   ├── sprites/             # Image assets
│   └── fonts/               # Custom fonts
├── App.tsx                  # Main app component
├── package.json             # Dependencies and scripts
├── yarn.lock                # Yarn lock file
└── .yarnrc                  # Yarn configuration
```

## 🎮 Game Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement changes in appropriate directories
3. Add tests if applicable
4. Run `yarn type-check` and `yarn lint`
5. Test on target platforms
6. Commit and push changes

### Game Loop Architecture

The game uses a custom game loop implemented in `src/utils/gameEngine.ts`:

- 60 FPS target using `setInterval`
- State management with React hooks
- Target spawning and movement
- Collision detection and scoring

### Adding New Game Modes

1. Update `GameMode` type in `src/types/game.ts`
2. Add mode logic in `GameScreen.tsx`
3. Update `MainMenu.tsx` with new option
4. Test mode-specific features

## 🎨 Asset Development

### Sprite Guidelines

- **Avatar**: 128x128px, 3 animation states (idle, success, failure)
- **Targets**: 64x64px, 2-3 frame animations
- **UI Elements**: Pixel art style, consistent with retro theme
- **Format**: PNG with transparency

### Audio Guidelines

- **Sound Effects**: 8-bit chiptune style
- **Music**: 30-60 second loops
- **Format**: MP3/OGG for mobile optimization
- **Tools**: Bfxr, Bosca Ceoil, Audacity

## 🧪 Testing

### Running Tests

```bash
yarn test                    # Run all tests
yarn test --watch           # Run tests in watch mode
yarn test --coverage        # Run tests with coverage
```

### Testing Checklist

- [ ] Game mechanics work correctly
- [ ] Touch gestures respond properly
- [ ] Scoring system functions
- [ ] Game over conditions trigger
- [ ] UI navigation works
- [ ] Performance is acceptable (60 FPS)

## 🚀 Deployment

### Building for Production

```bash
# Android
yarn build:android

# iOS
yarn build:ios

# Web
yarn build:web
```

### App Store Preparation

1. Update version in `package.json`
2. Update build number in `app.json`
3. Test on physical devices
4. Create production build
5. Submit to app stores

## 🔧 Troubleshooting

### Common Issues

**Yarn install fails:**

```bash
yarn cache clean
yarn install
```

**Expo build issues:**

```bash
yarn clean
yarn install
expo doctor
```

**TypeScript errors:**

```bash
yarn type-check
# Fix any type issues
```

**Performance issues:**

- Check frame rate with React DevTools
- Optimize game loop in `gameEngine.ts`
- Reduce simultaneous animations

### Getting Help

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review [React Native docs](https://reactnative.dev/)
3. Search existing issues in the repository
4. Create a new issue with detailed description

## 📋 Code Standards

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use proper type imports/exports

### React Native

- Use functional components with hooks
- Follow React Native best practices
- Optimize for performance
- Handle platform differences

### Git Workflow

- Use descriptive commit messages
- Create feature branches for new work
- Test before pushing
- Update documentation as needed

---

**Happy coding! 🥊**
