import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getLevelConfig } from '../data/gameConfig';

interface LevelInfoModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
  onReady: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LevelInfoModal: React.FC<LevelInfoModalProps> = ({ visible, level, onClose, onReady }) => {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 50,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalOpacity, modalScale, contentTranslateY]);

  const getChapterName = (level: number) => {
    try {
      const levelConfig = getLevelConfig(level);
      return levelConfig.name;
    } catch (error) {
      // Fallback to hardcoded values if opponent not found
      const chapters = [
        'The Beginning',
        'First Blood',
        'Rising Star',
        'The Challenge',
        'Midnight Brawl',
        "Champion's Path",
        'Dark Arena',
        'Final Countdown',
        "Legend's Trial",
        'Ultimate Showdown',
      ];
      return chapters[level - 1] || `Chapter ${level}`;
    }
  };

  const getDifficultyColor = (level: number) => {
    try {
      const levelConfig = getLevelConfig(level);
      switch (levelConfig.difficulty) {
        case 'easy':
          return '#00ff00'; // Green
        case 'medium':
          return '#ffff00'; // Yellow
        case 'hard':
          return '#ff8800'; // Orange
        case 'expert':
          return '#ff0000'; // Red
        default:
          return '#00ff00';
      }
    } catch (error) {
      // Fallback to hardcoded values if opponent not found
      if (level <= 3) return '#00ff00'; // Green for easy
      if (level <= 6) return '#ffff00'; // Yellow for medium
      if (level <= 8) return '#ff8800'; // Orange for hard
      return '#ff0000'; // Red for expert
    }
  };

  const getDifficultyText = (level: number) => {
    try {
      const levelConfig = getLevelConfig(level);
      return levelConfig.difficulty.charAt(0).toUpperCase() + levelConfig.difficulty.slice(1);
    } catch (error) {
      // Fallback to hardcoded values if opponent not found
      if (level <= 3) return 'Easy';
      if (level <= 6) return 'Medium';
      if (level <= 8) return 'Hard';
      return 'Expert';
    }
  };

  const getDifficultyStars = (level: number) => {
    try {
      const levelConfig = getLevelConfig(level);
      switch (levelConfig.difficulty) {
        case 'easy':
          return 1;
        case 'medium':
          return 3;
        case 'hard':
          return 4;
        case 'expert':
          return 5;
        default:
          return Math.min(level, 5);
      }
    } catch (error) {
      // Fallback to hardcoded values if opponent not found
      return Math.min(level, 5);
    }
  };

  const getLevelImage = (level: number) => {
    const images = [
      require('../../assets/level_select/image (3).jpg'),
      require('../../assets/level_select/image (13).jpg'),
      require('../../assets/level_select/knockout.png'),
    ];
    return images[(level - 1) % images.length];
  };

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: modalOpacity,
          },
        ]}
      >
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onClose}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }, { translateY: contentTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when touching modal content
            >
              <LinearGradient
                colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
                style={styles.modalContent}
              >
                {/* Close button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>

                {/* Level number and chapter name */}
                <View style={styles.header}>
                  <Text style={styles.levelNumber}>Level {level}</Text>
                  <Text style={styles.chapterName}>{getChapterName(level)}</Text>
                </View>

                {/* Level image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={getLevelImage(level)}
                    style={styles.levelImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                </View>

                {/* Difficulty and Opponent section */}
                <View style={styles.difficultySection}>
                  <View style={styles.difficultyHeader}>
                    <Text style={styles.difficultyLabel}>Difficulty</Text>
                    <Text style={styles.vsText}>VS {getLevelConfig(level).name}</Text>
                  </View>
                  <View style={styles.starsContainer}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Text
                        key={i}
                        style={[styles.star, { opacity: i < getDifficultyStars(level) ? 1 : 0.3 }]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Story description */}
                <View style={styles.storySection}>
                  <Text style={styles.storyLabel}>Story</Text>
                  <Text style={styles.storyText}>
                    {(() => {
                      try {
                        const levelConfig = getLevelConfig(level);
                        return levelConfig.description;
                      } catch (error) {
                        return `Chapter ${level} of your boxing journey awaits. Face new challenges, discover hidden techniques, and prove your worth in the ring. The story continues...`;
                      }
                    })()}
                  </Text>
                </View>

                {/* Ready button */}
                <TouchableOpacity style={styles.readyButton} onPress={onReady} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#ff4444', '#ff6666', '#ff4444']}
                    style={styles.readyButtonGradient}
                  >
                    <Text style={styles.readyButtonText}>Ready?</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  chapterName: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    height: 150,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  levelImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  difficultySection: {
    marginBottom: 15,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  difficultyMeter: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  difficultyFill: {
    height: '100%',
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 60,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 5,
  },
  star: {
    fontSize: 32,
    flex: 1,
    textAlign: 'center',
  },
  storySection: {
    marginBottom: 15,
  },
  storyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  storyText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    textAlign: 'justify',
  },
  opponentSection: {
    marginBottom: 20,
  },
  opponentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  opponentInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  opponentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 5,
  },
  opponentDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 18,
    marginBottom: 15,
  },
  opponentStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaaaaa',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  readyButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  readyButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  readyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default LevelInfoModal;
