import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function UniteWelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkSession = async () => {
      // ⏱ Petite attente pour s’assurer que la session est bien restaurée depuis le cache local
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { data: { session } } = await supabase.auth.getSession();

      setTimeout(() => {
        if (session) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 1650); // Laisse le temps à l’animation de finir
    };

    // Animations parallèles
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.09,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.96,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }),
    ]).start();

    checkSession();
  }, []);

  const { width } = Dimensions.get('window');
  const logoWidth = Math.min(width * 0.41, 135);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { rotate: spin },
          ],
        }}
      >
        <Image
          source={require('../assets/logo.jpg')}
          style={[styles.logo, { width: logoWidth, height: logoWidth }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 100,
  },
});
