import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { GameState } from '../types/game';

// ============================================================================
// GAME HUD COMPONENT
// ============================================================================

interface GameHUDProps {
  gameState: GameState;
  opponentConfig: any;
  avatarScaleStyle: any;
  powerMeterStyle: any;
  getAvatarImage: (state: 'idle' | 'success' | 'failure' | 'perfect') => any;
}

const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  opponentConfig,
  avatarScaleStyle,
  powerMeterStyle,
  getAvatarImage,
}) => {
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
              <View
                style={[
                  styles.hpFill,
                  { width: `${(gameState.opponentHP / opponentConfig.hp) * 100}%` },
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
          <View style={styles.playerAvatarContainer}>
            <Animated.Image
              source={getAvatarImage(gameState.avatarState)}
              style={[styles.avatar, avatarScaleStyle]}
            />
          </View>
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
            <View style={styles.powerBar}>
              <Animated.View
                style={[
                  styles.powerFill,
                  {
                    width: `${gameState.powerMeter}%`,
                  },
                  powerMeterStyle,
                ]}
              />
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
    width: 64,
    height: 64,
    marginRight: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    marginLeft: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 5,
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#ff0000',
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
  powerBar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 5,
  },
  powerFill: {
    height: '100%',
    backgroundColor: '#ff00ff',
  },
});

export default GameHUD;
