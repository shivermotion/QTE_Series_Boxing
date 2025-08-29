import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TutorialScreenProps {
  onBack: () => void;
}

const SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to Pocket Knockout',
    body: 'A fast, timing-based boxing game. Land hits by reacting to prompts, build combos, and chase high scores.',
    image: require('../../assets/main_menu/pocket_knockout.png'),
  },
  {
    key: 'objective',
    title: 'Objective',
    body: 'React accurately and quickly. Success builds your combo and score. Misses break your streak and can end your run.',
    image: require('../../assets/characters/hero.png'),
  },
  {
    key: 'modes',
    title: 'Game Modes',
    body: 'Arcade: Progress through levels. Endless: Survive as prompts speed up. Gym: Practice and view player details.',
    image: require('../../assets/main_menu/boxer.png'),
  },
  {
    key: 'flow',
    title: 'Level Flow',
    body: 'Each level is a sequence of prompts. Score points, keep your combo alive, and meet objectives to win the round.',
    image: require('../../assets/main_menu/boxing_ring.jpg'),
  },
  {
    key: 'swipe',
    title: 'Swipe Prompts',
    body: 'Swipe in the indicated direction within the shrinking window. Windows get tighter in Endless mode.',
    image: require('../../assets/ui/Asset_30.png'),
  },
  {
    key: 'tap',
    title: 'Tap Prompts',
    body: 'Tap the highlighted grid cells. Taps are more lenient than swipes but still demand precision.',
    image: require('../../assets/ui/Asset_27.png'),
  },
  {
    key: 'timing',
    title: 'Timing Prompts',
    body: 'Tap near the end of the shrinking circle when the center turns green. It is a simple success or miss.',
    image: require('../../assets/ui/Asset_28.png'),
  },
  {
    key: 'super',
    title: 'Super Combo',
    body: 'Fill the meter to enter Super Mode. Input the displayed finisher sequence correctly to unleash massive damage.',
    image: require('../../assets/characters/hero.png'),
  },
];

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onBack }) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width] = useState(Dimensions.get('window').width);

  const goToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    scrollRef.current.scrollTo({ x: clamped * width, animated: true });
    setCurrentIndex(clamped);
  };

  const handleNext = () => goToIndex(currentIndex + 1);
  const handleBack = () => goToIndex(currentIndex - 1);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>tutorial</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Image
            source={require('../../assets/ui/Back.png')}
            style={styles.backIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {SLIDES.map(slide => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <Image source={slide.image} style={styles.image} resizeMode="contain" />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === currentIndex ? styles.dotActive : undefined]}
            />
          ))}
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
            onPress={handleBack}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === SLIDES.length - 1 && styles.navDisabled]}
            onPress={handleNext}
            disabled={currentIndex === SLIDES.length - 1}
          >
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  backButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Round8Four',
  },
  backIconImage: {
    width: 120,
    height: 44,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  slideBody: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: 'white',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  navDisabled: {
    opacity: 0.5,
  },
  navText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TutorialScreen;
