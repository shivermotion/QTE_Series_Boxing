import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';

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
  useEffect(() => {
    console.log('[GymScreen] Component mounted, videos should start playing');
  }, []);

  const topVideoRef = useRef<any>(null);
  const middleVideoRef = useRef<any>(null);
  const bottomVideoRef = useRef<any>(null);

  const handleTopThirdTap = () => {
    console.log('Top third tapped - navigating to equipment');
    console.log('onNavigateToEquipment function:', onNavigateToEquipment);
    if (onNavigateToEquipment) {
      onNavigateToEquipment();
    } else {
      console.log('onNavigateToEquipment function is not provided');
    }
  };

  const handleMiddleThirdTap = () => {
    console.log('Middle third tapped - navigating to tutorial');
    console.log('onNavigateToTutorial function:', onNavigateToTutorial);
    if (onNavigateToTutorial) {
      onNavigateToTutorial();
    } else {
      console.log('onNavigateToTutorial function is not provided');
    }
  };

  const handleBottomThirdTap = () => {
    console.log('Bottom third tapped - navigating to player details');
    console.log('onNavigateToPlayerDetails function:', onNavigateToPlayerDetails);
    if (onNavigateToPlayerDetails) {
      onNavigateToPlayerDetails();
    } else {
      console.log('onNavigateToPlayerDetails function is not provided');
    }
  };

  return (
    <View style={styles.container}>
      {/* White background with paper texture - outside SafeAreaView */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require('../../assets/transition_screen/paper_texture.png')}
          style={styles.paperTexture}
          resizeMode="cover"
        />
      </View>

      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Image
              source={require('../../assets/ui/Asset_28.png')}
              style={styles.backButtonImage}
              resizeMode="contain"
            />
            <View style={styles.backButtonOverlay}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>BACK</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.sceneContainer}>
          {/* Top third */}
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={handleTopThirdTap}
            onPressIn={() => console.log('Top button pressed in')}
            onPressOut={() => console.log('Top button pressed out')}
            activeOpacity={0.8}
          >
            <Video
              ref={topVideoRef}
              source={require('../../assets/video/crowd.mp4')}
              style={styles.videoBackground}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              resizeMode={ResizeMode.COVER}
              onLoadStart={() => console.log('[GymScreen] Top video loading started')}
              onLoad={async () => {
                console.log('[GymScreen] Top video loaded successfully');
                try {
                  await topVideoRef.current?.replayAsync();
                } catch {}
              }}
              onError={e => {
                console.log('[GymScreen] Top video error:', e);
              }}
            />
            <View style={styles.textOverlay}>
              <Text style={styles.sectionText}>Equipment</Text>
            </View>
          </TouchableOpacity>

          {/* Middle third */}
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={handleMiddleThirdTap}
            activeOpacity={0.8}
          >
            <Video
              ref={middleVideoRef}
              source={require('../../assets/video/girl.mp4')}
              style={styles.videoBackground}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              resizeMode={ResizeMode.COVER}
              onLoadStart={() => console.log('[GymScreen] Middle video loading started')}
              onLoad={async () => {
                console.log('[GymScreen] Middle video loaded successfully');
                try {
                  await middleVideoRef.current?.replayAsync();
                } catch {}
              }}
              onError={e => {
                console.log('[GymScreen] Middle video error:', e);
              }}
            />
            <View style={styles.textOverlay}>
              <Text style={styles.sectionText}>Tutorial</Text>
            </View>
          </TouchableOpacity>

          {/* Bottom third */}
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={handleBottomThirdTap}
            activeOpacity={0.8}
          >
            <Video
              ref={bottomVideoRef}
              source={require('../../assets/video/judges.mp4')}
              style={styles.videoBackground}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              resizeMode={ResizeMode.COVER}
              onLoadStart={() => console.log('[GymScreen] Bottom video loading started')}
              onLoad={async () => {
                console.log('[GymScreen] Bottom video loaded successfully');
                try {
                  await bottomVideoRef.current?.replayAsync();
                } catch {}
              }}
              onError={e => {
                console.log('[GymScreen] Bottom video error:', e);
              }}
            />
            <View style={styles.textOverlay}>
              <Text style={styles.sectionText}>Player Stats</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Round8Four',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 100,
  },
  sceneContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 5,
  },
  safeAreaContainer: {
    flex: 1,
    zIndex: 3,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  sectionButton: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'yellow',
    borderStyle: 'dashed',
    minHeight: 100,
  },
  videoBackground: {
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  videoWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 5,
    pointerEvents: 'none',
  },
  sectionText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Round8Four',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    width: '100%',
    paddingHorizontal: 20,
    pointerEvents: 'none',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
    zIndex: 25,
  },
  backButtonImage: {
    width: 120,
    height: 40,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  backArrow: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    flex: 1,
  },
  backText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Round8Four',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    flex: 1,
  },
});

export default GymScreen;
