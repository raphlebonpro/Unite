import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const PARIS_COORDS = { latitude: 48.8566, longitude: 2.3522 };

export default function LocationScreen({ navigation, route }) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [pendingPref, setPendingPref] = useState(false);
  const scaleAnim = new Animated.Value(locationEnabled ? 1 : 0.96);

  // Callback optionnel pour mise à jour de la carte
  const onLocationChange = route?.params?.onLocationChange;

  useEffect(() => {
    (async () => {
      setCheckingStatus(true);

      // 1. Récupère la préférence côté utilisateur (Supabase)
      const { data: { user } } = await supabase.auth.getUser();
      let userPref = true;
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('geoloc_enabled')
          .eq('id', user.id)
          .single();
        userPref = userData?.geoloc_enabled !== false;
      }

      // 2. Récupère la permission système
      let { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === 'granted';

      setLocationEnabled(userPref && hasPermission);

      // Si refusé, centre sur Paris
      if ((!userPref || !hasPermission) && typeof onLocationChange === "function") {
        onLocationChange(PARIS_COORDS);
      }

      setCheckingStatus(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler pour le switch
  const handleLocationToggle = async (value) => {
    setCheckingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (value) {
      // User active la géoloc
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        if (typeof onLocationChange === "function") {
          let { coords } = await Location.getCurrentPositionAsync({});
          onLocationChange(coords);
        }
        if (user) {
          await supabase.from('users').update({ geoloc_enabled: true }).eq('id', user.id);
        }
      } else {
        setLocationEnabled(false);
        Alert.alert(
          "Localisation refusée",
          "Tu dois autoriser l’accès à la localisation dans les réglages pour obtenir des sessions proches."
        );
        if (typeof onLocationChange === "function") {
          onLocationChange(PARIS_COORDS);
        }
        if (user) {
          await supabase.from('users').update({ geoloc_enabled: false }).eq('id', user.id);
        }
      }
    } else {
      setLocationEnabled(false);
      if (typeof onLocationChange === "function") {
        onLocationChange(PARIS_COORDS);
      }
      if (user) {
        await supabase.from('users').update({ geoloc_enabled: false }).eq('id', user.id);
      }
    }
    setCheckingStatus(false);
    setPendingPref(true); // Préférence modifiée, prêt pour confirmation
    Animated.spring(scaleAnim, {
      toValue: value ? 1 : 0.96,
      useNativeDriver: true,
      speed: 12,
    }).start();
  };

  // Feedback utilisateur à l’enregistrement
  const handleSave = () => {
    Alert.alert(
      "Préférence enregistrée",
      locationEnabled
        ? "La localisation est activée. Tu verras les sessions proches de toi."
        : "La localisation est désactivée. Tu es positionné par défaut à Paris.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
    setPendingPref(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <MaterialCommunityIcons
        name={locationEnabled ? "map-marker-radius" : "map-marker-off"}
        size={44}
        color={locationEnabled ? "#1976d2" : "#bababa"}
        style={{ alignSelf: 'center', marginTop: 12, marginBottom: 6 }}
      />
      <Text style={styles.subtitle}>
        Active la localisation pour trouver des sessions de sport autour de toi.
        <Text style={{ color: '#1976d2', fontWeight: '600' }}> Tu pourras modifier ce choix à tout moment.</Text>
      </Text>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Accès à la position</Text>
            <Text style={styles.cardDescription}>
              Permets à Unite d’accéder à ta position pour te proposer les sessions les plus proches.
            </Text>
            {!locationEnabled && (
              <Text style={styles.disabledText}>
                Localisation désactivée. Tu seras positionné sur Paris par défaut.
              </Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#e4e5ed', true: '#1976d2' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              ios_backgroundColor="#e4e5ed"
              disabled={checkingStatus}
            />
          </Animated.View>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={checkingStatus}
        >
          <LinearGradient
            colors={['#ff9966', '#ff5e62']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Feather name="check-circle" size={19} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Enregistrer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
    paddingHorizontal: 0,
    paddingTop: hp('3%'),
  },
  subtitle: {
    fontSize: wp('4%'),
    color: '#222',
    marginBottom: hp('2.3%'),
    marginHorizontal: wp('5.7%'),
    textAlign: 'center',
    fontWeight: '400',
    marginTop: hp('1%'),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('4.5%'),
    paddingVertical: hp('2.6%'),
    paddingHorizontal: wp('4.5%'),
    shadowColor: '#191A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: wp('2%'),
    elevation: 2,
    marginBottom: hp('2.2%'),
    marginHorizontal: wp('4.7%'),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: wp('4.3%'),
    marginBottom: hp('0.6%'),
    color: '#222',
  },
  cardDescription: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: 0,
    fontWeight: '400',
    lineHeight: hp('2.1%'),
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('3.4%'),
    paddingVertical: hp('1.7%'),
    paddingHorizontal: wp('9.6%'),
    shadowColor: '#ff9966',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: wp('1.3%'),
    elevation: 1,
    minWidth: wp('44%'),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('4.1%'),
    letterSpacing: 0.12,
  },
  disabledText: {
    color: '#bb1111',
    marginTop: hp('1.7%'),
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
});
