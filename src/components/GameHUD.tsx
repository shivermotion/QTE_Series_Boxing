import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState } from '../types/game';
import { getLevelConfig } from '../data/gameConfig';

// ============================================================================
// GAME HUD COMPONENT
// ============================================================================

interface GameHUDProps {
  gameState: GameState;
  avatarScaleStyle: any;
  getAvatarImage: (state: 'idle' | 'success' | 'failure' | 'perfect') => any;
  onSuperButtonPress?: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  avatarScaleStyle,
  getAvatarImage,
  onSuperButtonPress,
}) => {
  // Animation for breathing glow effect
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Breathing glow animation
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  const levelConfig = getLevelConfig(gameState.level);

  return (
    <>
      {/* Top HUD - Opponent */}
      <View style={styles.topHud}>
        <View style={styles.opponentRow}>
          <View style={styles.opponentContainer}>
            <View style={styles.opponentTopRow}>
              <Text style={styles.opponentLabel}>OPPONENT</Text>
              <View style={styles.gameInfoInline}>
                <Text style={styles.roundTextInline}>ROUND {gameState.currentRound}</Text>
                <Text style={styles.levelTextInline}>LEVEL {gameState.level}</Text>
              </View>
            </View>
            <View style={styles.hpBar}>
              <LinearGradient
                colors={['#ef4444', '#dc2626']} // Light red to dark red gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.hpFill,
                  {
                    width: `${(gameState.opponentHP / levelConfig.hp) * 100}%`,
                    alignSelf: 'flex-end', // Anchor to right side
                  },
                ]}
              />
              <View
                style={[
                  styles.hpBorder,
                  {
                    width: `${(gameState.opponentHP / levelConfig.hp) * 100}%`,
                    alignSelf: 'flex-end', // Anchor to right side
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.avatarContainer}>
            <Animated.Image
              source={getAvatarImage(gameState.avatarState)}
              style={[styles.avatar, avatarScaleStyle]}
            />
          </View>
        </View>
      </View>

      {/* Bottom HUD - Player */}
      <View style={styles.bottomHud}>
        <View style={styles.playerRow}>
          <TouchableOpacity
            style={styles.playerAvatarContainer}
            onPress={gameState.superMeter >= 100 ? onSuperButtonPress : undefined}
            activeOpacity={gameState.superMeter >= 100 ? 0.8 : 1}
          >
            <Animated.Image
              source={getAvatarImage(gameState.avatarState)}
              style={[
                styles.avatar,
                avatarScaleStyle,
                {
                  borderWidth: 4,
                  borderColor: gameState.superMeter >= 100 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                  // Match the irregular shape from the avatar style
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 12,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 48,
                },
              ]}
            />
          </TouchableOpacity>
          <View style={styles.playerContainer}>
            <View style={styles.playerTopRow}>
              <Text style={styles.playerLabel}>PLAYER</Text>
              <View style={styles.playerStatsInline}>
                <Text style={styles.scoreTextInline}>{gameState.score}</Text>
                <View style={styles.livesBar}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.lifeSegment,
                        { backgroundColor: i <= gameState.lives ? '#00ff00' : '#333' },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Super Meter */}
            <View style={styles.superMeterContainer}>
              <View style={styles.superMeterBar}>
                {/* Glow effect underneath the meter - only left, top, bottom edges animate */}
                <Animated.View
                  style={[
                    styles.superMeterGlow,
                    {
                      width: `${Math.max(gameState.superMeter, 5)}%`,
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }),
                      transform: [
                        {
                          scaleX: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.0, 1.05],
                          }),
                        },
                        {
                          scaleY: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.0, 1.1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <LinearGradient
                  colors={['#1e3a8a', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.superMeterFill, { width: `${gameState.superMeter}%` }]}
                />
                <Animated.View
                  style={[
                    styles.superMeterBorder,
                    {
                      width: `${Math.max(gameState.superMeter, 5)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topHud: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomHud: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerContainer: {
    flex: 1,
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  playerLabel: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerStatsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTextInline: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  playerAvatarContainer: {
    width: 96,
    height: 96,
    marginRight: 20,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    marginLeft: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderWidth: 4,
    borderColor: '#ffffff',
    // Create irregular shape with convex oblique corner using border radius
    borderTopLeftRadius: 30,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 48, // This creates the convex oblique corner
  },
  opponentContainer: {
    flex: 1,
  },
  opponentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  gameInfoInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundTextInline: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  levelTextInline: {
    color: '#ffffff',
    fontSize: 12,
  },
  opponentLabel: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hpBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 5,
    transform: [{ skewX: '20deg' }],
  },
  hpFill: {
    height: '100%',
  },
  hpBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 3,
  },
  livesBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  lifeSegment: {
    width: 20,
    height: 20,
    marginHorizontal: 2,
    borderRadius: 10,
  },

  superMeterContainer: {
    marginTop: 0,
  },
  superMeterLabel: {
    color: '#ffff00',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  superMeterBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'visible',
    marginVertical: 5,
    transform: [{ skewX: '20deg' }],
  },
  superMeterFill: {
    height: '100%',
  },
  superMeterGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    height: 26, // Increased to account for glow expansion
    backgroundColor: '#ffffff',
    borderRadius: 6,
    opacity: 0.6,
  },
  superMeterBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 3,
  },
});

export default GameHUD;
