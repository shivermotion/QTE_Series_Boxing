import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TutorialScreenProps {
  onBack: () => void;
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>tutorial</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>
          Learn the basics: swipe prompts, tap prompts, timing prompts, feints, and super combo
          concepts.
        </Text>
        <Text style={styles.body}>
          - Swipe: perform the indicated direction within the time limit.
        </Text>
        <Text style={styles.body}>- Tap: hit the marked grid cells; avoid feints.</Text>
        <Text style={styles.body}>- Timing: tap near the end of the shrinking circle.</Text>
        <Text style={styles.body}>
          Endless mode focuses on survival and progressive difficulty.
        </Text>
      </ScrollView>
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  backText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Round8Four',
  },
  content: {
    padding: 16,
  },
  body: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
});

export default TutorialScreen;

