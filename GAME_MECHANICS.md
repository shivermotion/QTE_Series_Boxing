# QTE Series Boxing - Game Mechanics Document

## Overview

QTE Series Boxing is a rhythm-based fighting game that combines Quick Time Events (QTE) with boxing mechanics. Players must react to various prompt types with precise timing to defeat opponents across multiple levels of increasing difficulty.

## Core Gameplay Systems

### 1. Prompt Types

#### Swipe Prompts

- **Description**: Arrow prompts that appear on screen indicating swipe direction
- **Controls**: Swipe in the indicated direction (up, down, left, right)
- **Visual**: Large arrow symbols with color coding:
  - Left: Red (←)
  - Right: Teal (→)
  - Up: Blue (↑)
  - Down: Green (↓)
- **Animation**: Arrows appear instantly and blink rapidly while active
- **Scoring**: Based on reaction time within grade thresholds
- **Damage**: 3 damage (good) / 5 damage (perfect)

#### Tap Prompts

- **Description**: 3x3 grid-based prompts requiring taps on specific positions
- **Controls**: Tap on highlighted grid positions
- **Visual**: Grid cells with different states:
  - Active real prompts: Yellow background/border
  - Feints: Red background/border
  - Completed: Green background/border
- **Mechanics**: Must complete all real prompts while avoiding feints
- **Scoring**: Success determined by completing all real prompts within time limit
- **Damage**: 3 damage per real prompt completed

#### Timing Prompts

- **Description**: Ring-based prompts requiring precise timing
- **Controls**: Tap when the shrinking ring aligns with the target circle
- **Visual**: Red circle with shrinking ring animation
- **Timing Windows**:
  - Perfect: Small window for maximum points
  - Good: Larger window for reduced points
  - Miss: Outside timing windows
- **Scoring**: Multi-tier timing evaluation
- **Damage**: 3 damage (good) / 5 damage (perfect) per prompt

### 2. Timing System

#### Grade Thresholds

- **Perfect**: Tight timing window for maximum points (100 points)
- **Good**: Wider timing window for reduced points (50 points)
- **Miss**: Outside timing windows (lose a life)

#### Time Limits

- **Time Limit**: Maximum time to respond before auto-miss
- **Spawn Delay**: Time between prompt spawns
- **Stagger Delay**: Delay between multiple timing prompts

### 3. Feint System

#### Feint Mechanics

- **Description**: Deceptive prompts that look like real prompts but cause misses when tapped
- **Visual**: Red-tinted grid cells to distinguish from real prompts
- **Strategy**: Players must identify and avoid feints while completing real prompts
- **Configuration**:
  - Probability: Chance of feints appearing
  - Min/Max Feints: Range of feints per prompt set
  - Min/Max Taps: Range of real taps per prompt set

### 4. Super Meter System

#### Meter Building

- **Perfect Hits**: +15 super meter points
- **Good Hits**: +10 super meter points
- **Tap Prompts**: +10 points per completed real prompt
- **Timing Prompts**: +15 points for perfect, +10 for good

#### Super Mode Activation

- **Requirement**: 100 super meter points
- **Effect**: Activates special cinematic mode with speed lines
- **Duration**: Controlled by video length
- **Reward**: Massive damage to opponent

### 5. Super Combo System

#### Combo Mechanics

- **Description**: Special move sequences requiring precise input
- **Input**: 3-direction swipe sequences
- **Available Moves**:
  - Dragon Punch: [down, right, left] - 500 damage
  - Tornado Kick: [up, up, down] - 450 damage
  - Phoenix Strike: [right, up, left] - 600 damage
  - Thunder Clap: [left, right, left] - 400 damage
  - Ice Spike: [down, down, up] - 550 damage
  - Shadow Strike: [up, left, right] - 650 damage
  - Earth Shatter: [down, down, down] - 700 damage
  - Wind Cutter: [right, right, left] - 350 damage
  - Flame Burst: [up, down, up] - 480 damage
  - Cosmic Blast: [left, up, right] - 800 damage

#### Difficulty Levels

- **Easy**: Simple 3-direction sequences
- **Medium**: Moderate complexity
- **Hard**: Complex sequences with high damage

### 6. Level Progression

#### Level Structure

- **10 Levels**: From "Street Brawler" to "The Undefeated"
- **Difficulty Scaling**:
  - Easy (Levels 1-3): Basic mechanics introduction
  - Medium (Levels 4-6): Introduces feints and timing prompts
  - Hard (Levels 7-8): Increased complexity and speed
  - Expert (Levels 9-10): Maximum difficulty

#### Round System

- **Multiple Rounds**: 2-4 rounds per level
- **HP Goals**: Specific HP targets for each round
- **Round Scaling**: Increased difficulty in later rounds
- **Cooldown**: 5-second cooldown between rounds

### 7. Scoring System

#### Points

- **Perfect Swipe/Timing**: 100 points
- **Good Swipe/Timing**: 50 points
- **Tap Prompts**: 50 points per real prompt completed
- **Super Combo**: 500 points base

#### Damage

- **Perfect Swipe/Timing**: Configurable per level (30-120 damage)
- **Good Swipe/Timing**: Configurable per level (15-60 damage)
- **Success Swipe/Timing**: Configurable per level (10-55 damage) - for inputs completed within time limit but outside grade thresholds
- **Tap Prompts**: Configurable per level (15-60 damage per real prompt completed)
- **Super Combo**: Configurable per level (90-360 damage) + individual super move damage (350-800 damage)
- **Super Mode**: Massive damage (varies by move)

#### Lives System

- **Starting Lives**: 3 lives
- **Life Loss**: Miss any prompt type
- **Game Over**: Lose all lives
- **Continue**: Use gems to continue (3 gems available)

### 8. Visual Feedback Systems

#### Haptic Feedback

- **Success**: Light vibration for successful prompts
- **Error**: Strong vibration for misses
- **Heavy**: Intense vibration for super moves

#### Screen Effects

- **Screen Shake**: Visual feedback for misses
- **Particles**: Particle effects for successful hits
- **Feedback Text**: On-screen text showing hit quality
- **Avatar States**: Different avatar expressions based on performance

#### Animation States

- **Idle**: Neutral expression
- **Success**: Elated expression
- **Failure**: Shocked expression
- **Perfect**: Revved up expression
- **Blinking**: Eyes closed during certain states

### 9. Audio System

#### Sound Effects

- **QTE Success**: Success sound for completed prompts
- **QTE Failure**: Failure sound for misses
- **Super Combo**: Special sound for super moves
- **Background Music**: Dynamic music system

#### Audio Context

- **Volume Control**: Adjustable sound levels
- **Audio Debug**: Debug screen for audio testing

### 10. Pause System

#### Pause Mechanics

- **Game Pause**: Pause all game timers and animations
- **Pause Tracking**: Accurate timing calculations during pause
- **Resume**: Seamless continuation of paused timers

### 11. UI Systems

#### HUD Elements

- **Score Display**: Current score
- **Lives Counter**: Remaining lives
- **Super Meter**: Visual super meter bar
- **Round Display**: Current round information
- **Opponent HP**: Visual HP bar

#### Pre-Round Display

- **Round Announcement**: "ROUND X" display
- **Animation**: Slide-in animation with impact effects
- **Duration**: 800ms display time

#### Cooldown Display

- **Countdown**: 5-second cooldown timer
- **Text**: "COOL DOWN" display
- **Visual**: Animated countdown

### 12. Technical Features

#### Performance

- **60 FPS**: Smooth animation targeting
- **Native Driver**: Hardware-accelerated animations
- **Memory Management**: Efficient particle and effect cleanup

#### Responsiveness

- **Touch Handling**: Precise touch detection
- **Gesture Recognition**: Accurate swipe detection
- **Input Validation**: Proper input verification

#### Error Handling

- **Graceful Degradation**: Fallback systems for failures
- **Debug Logging**: Comprehensive logging system
- **State Recovery**: Robust state management

## Configuration System

### Level Configuration

Each level has configurable parameters:

- **HP**: Opponent health points
- **Damage**: Perfect/good/super combo damage values
- **Prompt Config**: Time limits, grade thresholds, spawn delays
- **Feints**: Probability and count ranges
- **Timing Prompts**: Probability and count ranges
- **Rounds**: Number of rounds and HP goals

### Round Scaling

Advanced configuration for round-specific adjustments:

- **Prompt Intervals**: Faster/slower prompt spawning
- **Feint Adjustments**: Round-specific feint settings
- **Timing Prompt Modifiers**: Round-specific timing settings

## Future Features (Planned)

### 3D Models

- **Opponent Models**: 3D character models for each level
- **Player Models**: Customizable player character
- **Animation System**: Dynamic character animations

### Enhanced Audio

- **Dynamic Music**: Music that responds to gameplay
- **Voice Acting**: Character voice lines
- **Environmental Audio**: Crowd sounds and atmosphere

### Additional Mechanics

- **Combo Multipliers**: Streak-based scoring bonuses
- **Special Events**: Random special prompt sequences
- **Achievement System**: Unlockable achievements
- **Leaderboards**: Global and local score tracking

---

_This document reflects the current state of QTE Series Boxing as of the latest development iteration. Game mechanics and features are subject to change during development._
