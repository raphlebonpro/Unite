import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
  Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../assets/onboarding-1.jpg'),
    title: 'Bouger seul, c’est bien.\nEnsemble, c’est différent.',
    subtitle: 'Ressens l’énergie du groupe.',
  },
  {
    id: '2',
    image: require('../assets/onboarding-2.jpg'),
    title: 'La motivation se partage.',
    subtitle: 'Plus d’énergie.\nPlus de progression.',
  },
  {
    id: '3',
    image: require('../assets/onboarding-3.jpg'),
    title: 'Trouve ton équipe.\nLance ta session.',
    subtitle: 'Autour de toi. Aujourd’hui.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = { viewAreaCoveragePercentThreshold: 50 };

  useEffect(() => {
  const interval = setInterval(() => {
    const nextIndex = (currentIndex + 1) % slides.length;

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  }, 4000); // 🔥 change la durée ici (4000ms = 4s)

  return () => clearInterval(interval);
}, [currentIndex]);

  const renderItem = ({ item }) => (
<ImageBackground
  source={item.image}
  style={styles.image}
  imageStyle={styles.imageInner}
>
  <View style={styles.content}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.subtitle}>{item.subtitle}</Text>
  </View>

</ImageBackground>
  );

  return (
    <View style={styles.container}>

      {/* HEADER 15% */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.jpg')}
          style={styles.logo}
        />
        <Text style={styles.tagline}>
          Le sport nous rassemble
        </Text>

        <TouchableOpacity
          style={styles.primaryHeaderButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryHeaderText}>
            Inscription gratuite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryHeaderButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryHeaderText}>
            Connexion
          </Text>
        </TouchableOpacity>
      </View>

      {/* SLIDER 85% */}
      <View style={styles.sliderContainer}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={flatListRef}
          getItemLayout={(data, index) => ({
  length: width,
  offset: width * index,
  index,
})}
        />

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
container: { flex: 1 },
header: {
  flex: 0.30,
  backgroundColor: '#FDFDFD',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 20,
  paddingBottom: 10,

  borderBottomLeftRadius: 50,
  borderBottomRightRadius: 50,

  zIndex: 10,

  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
},

logo: {
  width: 110,
  height: 75,
  resizeMode: 'contain',
},
tagline: {
  marginTop: 6,
  fontSize: 20,
  fontWeight: '900',
  color: '#FE5D02',
},
sliderContainer: {
  flex: 0.70,
  marginTop: -50, // 👈 superposition douce
},
image: {
  width,
  height: Platform.OS === 'android'
    ? height * 0.78   // légèrement plus grand pour couvrir
    : height * 0.75,
  justifyContent: 'flex-end',
},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    padding: 30,
    paddingBottom: 120,
  },
title: {
  color: '#fff',
  fontSize: 30,
  fontWeight: '800',
  lineHeight: 38,
  marginBottom: 16,
},
  subtitle: {
    color: '#fff',
    fontSize: 17,
    opacity: 0.9,
    marginBottom: 30,
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 18,
  },
primaryHeaderButton: {
  backgroundColor: '#FE5D02',
  paddingVertical: 13,
  paddingHorizontal: 36,
  borderRadius: 32,
  marginTop: 16,
},
primaryHeaderText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 14,
},
secondaryHeaderButton: {
  backgroundColor: '#FFFFFF',
  borderColor: '#F62DAE',
  borderRadius: 5,
  borderWidth: 2,
  paddingVertical: 10,
  paddingHorizontal: 30,
  borderRadius: 32,
  marginTop: 16,
  marginBottom: 10,
},
secondaryHeaderText: {
  color: '#F62DAE',
  fontWeight: '700',
  fontSize: 14,
},
imageInner: {
  resizeMode: 'cover',
  transform: [{ translateY: -40 }], // ← ajuste la valeur ici
},
});
