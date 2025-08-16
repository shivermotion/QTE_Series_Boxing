import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilamentScene } from 'react-native-filament';
import GymScene from '../components/GymScene';

interface GymScreenProps {
  onBack: () => void;
  onNavigateToTutorial?: () => void;
  onNavigateToEquipment?: () => void;
  onNavigateToPlayerDetails?: () => void;
}

const GymScreen: React.FC<GymScreenProps> = ({
  onBack,
  onNavigateToTutorial,
  onNavigateToEquipment,
  onNavigateToPlayerDetails,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sceneContainer}>
        <FilamentScene>
          <GymScene
            onNavigateToTutorial={onNavigateToTutorial}
            onNavigateToEquipment={onNavigateToEquipment}
            onNavigateToPlayerDetails={onNavigateToPlayerDetails}
          />
        </FilamentScene>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Image
            source={require('../../assets/ui/Asset_28.png')}
            style={styles.backButtonImage}
            resizeMode="contain"
          />
          <View style={styles.backButtonOverlay}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>back</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#808080',
  },
  sceneContainer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  backButtonImage: {
    width: 120,
    height: 120,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: 200,
  },
  backArrow: {
    fontSize: 90,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  backText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginLeft: 10,
    paddingRight: 90,
  },
});

export default GymScreen;
