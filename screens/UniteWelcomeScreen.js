import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function UniteWelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const logoSize = 170;

  useEffect(() => {
    const startAnimation = () => {
      // Fade + Pop initial
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Pulse doux en boucle
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    };

    const checkSession = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { data: { session } } = await supabase.auth.getSession();

      setTimeout(() => {
        if (session) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 1800);
    };

    startAnimation();
    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        }}
      >
        <Image
          source={require('../assets/logo.jpg')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 100,
  },
});
