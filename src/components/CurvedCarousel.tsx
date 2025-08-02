import * as React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { Extrapolation, interpolate } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

const { width: windowWidth } = Dimensions.get('window');
const PAGE_WIDTH = windowWidth / 1.5; // Increased from /2 to /1.5 for much bigger items

// Sample data for the carousel
const carouselData = [
  { id: 1, title: 'Knockout 1' },
  { id: 2, title: 'Knockout 2' },
  { id: 3, title: 'Knockout 3' },
  { id: 4, title: 'Knockout 4' },
  { id: 5, title: 'Knockout 5' },
  { id: 6, title: 'Knockout 6' },
];

const CarouselItem = ({ index }: { index: number }) => {
  const item = carouselData[index % carouselData.length];

  return (
    <View style={styles.carouselItem}>
      <Image
        source={require('../../assets/character_menu/boxer.png')}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      <View style={styles.textOverlay}>
        <Text style={styles.carouselItemText}>{item.title}</Text>
      </View>
    </View>
  );
};

const CurvedCarousel: React.FC = () => {
  const baseOptions = {
    vertical: false,
    width: PAGE_WIDTH,
    height: PAGE_WIDTH * 1.2, // Increased height ratio from 1.0 to 1.2 for much bigger items
  } as const;

  return (
    <View style={styles.container}>
      <Carousel
        {...baseOptions}
        loop
        style={styles.carousel}
        autoPlayInterval={150}
        scrollAnimationDuration={600}
        customAnimation={(value: number) => {
          'worklet';
          const size = PAGE_WIDTH;
          const scale = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [1.7, 1.2, 1, 1.2, 1.7],
            Extrapolation.CLAMP
          );

          const translate = interpolate(
            value,
            [-2, -1, 0, 1, 2],
            [-size * 1.45, -size * 0.9, 0, size * 0.9, size * 1.45]
          );

          const transform = {
            transform: [
              { scale },
              {
                translateX: translate,
              },
              { perspective: 150 },
              {
                rotateY: `${interpolate(value, [-1, 0, 1], [30, 0, -30], Extrapolation.CLAMP)}deg`,
              },
            ],
          };

          return {
            ...transform,
          };
        }}
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        data={carouselData}
        renderItem={({ index }) => <CarouselItem index={index} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    height: windowWidth / 1.0, // Increased height from /1.2 to /1.0 for much bigger carousel
    width: windowWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselItem: {
    width: PAGE_WIDTH,
    height: PAGE_WIDTH * 1.2, // Increased height ratio from 1.0 to 1.2 for much bigger items
    borderRadius: 24, // Increased border radius for bigger items
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5, // Increased shadow offset
    },
    shadowOpacity: 0.5, // Increased shadow opacity
    shadowRadius: 8, // Increased shadow radius
    elevation: 12, // Increased elevation
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle background for the image
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  textOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
  },
  carouselItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default CurvedCarousel;
