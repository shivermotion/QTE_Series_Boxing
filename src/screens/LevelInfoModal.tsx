import React, { useRef, useEffect, useState } from 'react';
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

// Character name mapping for each level
const getCharacterNameForLevel = (level: number) => {
  const characterNames = [
    'Henry Hitchens', // Level 1
    'Cyborg Boxer', // Level 2
    'Rigoberto Hazuki', // Level 3
    'Oronzo Hazuki', // Level 4
    'Moai Man', // Level 5
    'Ripper', // Level 6
    'Ms. Nozomi', // Level 7
    'Gus Yamato', // Level 8
    'Cyborg Boxer Mach 2', // Level 9
    'King', // Level 10
  ];

  return characterNames[(level - 1) % characterNames.length];
};

// Character modal image mapping for each level
const getCharacterModalImageForLevel = (level: number) => {
  const characterModalImages = [
    require('../../assets/character_menu/henry_hitchens_modal.png'), // Level 1
    require('../../assets/character_menu/cyborg_boxer_modal.png'), // Level 2
    require('../../assets/character_menu/rigoberto_hazuki_modal.png'), // Level 3
    require('../../assets/character_menu/oronzo_hazuki_modal.png'), // Level 4
    require('../../assets/character_menu/moai_man_modal.png'), // Level 5
    require('../../assets/character_menu/ripper_modal.png'), // Level 6
    require('../../assets/character_menu/ms_nozomi_modal.png'), // Level 7 (reuse)
    require('../../assets/character_menu/gus_yamato_modal.png'), // Level 8 (reuse)
    require('../../assets/character_menu/cyborg_boxer_modal.png'), // Level 9 (reuse)
    require('../../assets/character_menu/king_modal.png'), // Level 10 (reuse)
  ];

  return characterModalImages[(level - 1) % characterModalImages.length];
};

const LevelInfoModal: React.FC<LevelInfoModalProps> = ({ visible, level, onClose, onReady }) => {
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  // Shatter animation state
  const [showShatter, setShowShatter] = useState(false);
  const shatterOpacity = useRef(new Animated.Value(0)).current;

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

  const handleReadyPress = () => {
    // Show shatter animation
    setShowShatter(true);
    shatterOpacity.setValue(0);

    // Animate shatter in
    Animated.timing(shatterOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // After shatter animation completes, call onReady
      setTimeout(() => {
        setShowShatter(false);
        onReady();
      }, 1000); // Wait 1 second for shatter effect
    });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      {/* Shatter animation overlay */}
      {showShatter && (
        <Animated.View
          style={[
            styles.shatterOverlay,
            {
              opacity: shatterOpacity,
            },
          ]}
        >
          <Image
            source={require('../../assets/video/shatter.gif')}
            style={styles.shatterGif}
            resizeMode="cover"
          />
        </Animated.View>
      )}

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
              <View style={styles.modalContent}>
                {/* Paper texture background */}
                <Image
                  source={require('../../assets/transition_screen/paper_texture.png')}
                  style={styles.paperTexture}
                  resizeMode="cover"
                />
                {/* Close button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>

                {/* Level number and chapter name */}
                <View style={styles.header}>
                  <Text style={styles.levelNumber}>Level {level}</Text>
                  <Text style={styles.chapterName}>{getChapterName(level)}</Text>
                </View>

                {/* Character modal image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={getCharacterModalImageForLevel(level)}
                    style={styles.levelImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay} />
                </View>

                {/* Difficulty and Opponent section */}
                <View style={styles.difficultySection}>
                  <View style={styles.difficultyHeader}>
                    <Text style={styles.difficultyLabel}>Difficulty</Text>
                    <Text style={styles.vsText}>VS {getCharacterNameForLevel(level)}</Text>
                  </View>
                  <View style={styles.starsPillContainer}>
                    <View style={styles.starsPillBackground} />
                    <View style={styles.starsContainer}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Image
                          key={i}
                          source={require('../../assets/ui/star.png')}
                          style={[
                            styles.star,
                            { opacity: i < getDifficultyStars(level) ? 1 : 0.3 },
                          ]}
                          resizeMode="contain"
                        />
                      ))}
                    </View>
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
                <TouchableOpacity
                  style={styles.readyButton}
                  onPress={handleReadyPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ff4444', '#ff6666', '#ff4444']}
                    style={styles.readyButtonGradient}
                  >
                    <Text style={styles.readyButtonText}>Ready?</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#000000',
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
    color: '#000000',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  chapterName: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginTop: 5,
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#000000',
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
  starsPillContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  starsPillBackground: {
    position: 'absolute',
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 2,
  },
  star: {
    width: 28,
    height: 28,
  },
  storySection: {
    marginBottom: 15,
  },
  storyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  storyText: {
    fontSize: 14,
    color: '#333333',
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
  shatterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  shatterGif: {
    width: '100%',
    height: '100%',
  },
});

export default LevelInfoModal;
