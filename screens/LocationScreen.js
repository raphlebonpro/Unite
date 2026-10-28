import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const PARIS_COORDS = { latitude: 48.8566, longitude: 2.3522 };

export default function LocationScreen({ navigation, route }) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus]   = useState(true);

  const onLocationChange = route?.params?.onLocationChange;

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setCheckingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      let userPref = true;
      if (user) {
        const { data: userData } = await supabase
          .from('users').select('geoloc_enabled').eq('id', user.id).single();
        userPref = userData?.geoloc_enabled !== false;
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setLocationEnabled(userPref && hasPermission);
      if ((!userPref || !hasPermission) && typeof onLocationChange === 'function') {
        onLocationChange(PARIS_COORDS);
      }
      setCheckingStatus(false);
    })();
  }, []);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const handleLocationToggle = async (value) => {
    setCheckingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationEnabled(true);
        if (typeof onLocationChange === 'function') {
          const { coords } = await Location.getCurrentPositionAsync({});
          onLocationChange(coords);
        }
        if (user) await supabase.from('users').update({ geoloc_enabled: true }).eq('id', user.id);
      } else {
        setLocationEnabled(false);
        Alert.alert(
          'Localisation refusée',
          "Tu dois autoriser l'accès à la localisation dans les réglages de ton appareil."
        );
        if (typeof onLocationChange === 'function') onLocationChange(PARIS_COORDS);
        if (user) await supabase.from('users').update({ geoloc_enabled: false }).eq('id', user.id);
      }
    } else {
      setLocationEnabled(false);
      if (typeof onLocationChange === 'function') onLocationChange(PARIS_COORDS);
      if (user) await supabase.from('users').update({ geoloc_enabled: false }).eq('id', user.id);
    }
    setCheckingStatus(false);
  };

  // ── Enregistrer ───────────────────────────────────────────────────────────
  const handleSave = () => {
    Alert.alert(
      'Préférence enregistrée',
      locationEnabled
        ? 'La localisation est activée. Tu verras les sessions proches de toi.'
        : 'La localisation est désactivée. Tu es positionné par défaut à Paris.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <View style={styles.container}>

        {/* ── Hero dynamique ───────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <View style={[
            styles.heroIconBox,
            { backgroundColor: locationEnabled ? '#FFF3EE' : '#F5F5F7' },
          ]}>
            <Ionicons
              name={locationEnabled ? 'location' : 'location-outline'}
              size={36}
              color={locationEnabled ? '#FE5D02' : '#BBBBBB'}
            />
          </View>
          <Text style={styles.heroTitle}>
            {locationEnabled ? 'Localisation activée' : 'Localisation désactivée'}
          </Text>
          <Text style={styles.heroSub}>
            {locationEnabled
              ? 'Tu vois les sessions sportives les plus proches de toi.'
              : 'Tu es positionné par défaut à Paris.'}
          </Text>
        </View>

        {/* ── Section label ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Ma préférence</Text>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: locationEnabled ? '#FFF3EE' : '#F5F5F7' }]}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={locationEnabled ? '#FE5D02' : '#BBBBBB'}
              />
            </View>
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Accès à ma position</Text>
              <Text style={styles.rowDesc}>
                Utilisée uniquement pour te proposer les sessions les plus proches.
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: '#E8E8EA', true: '#FE5D02' }}
              thumbColor="#fff"
              ios_backgroundColor="#E8E8EA"
              disabled={checkingStatus}
              style={{ marginLeft: wp('3%') }}
            />
          </View>
        </View>

        {/* ── Note confidentialité ─────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#C0C0C0" style={{ marginRight: 6 }} />
          <Text style={styles.infoText}>
            Ta position reste privée et n'est jamais partagée avec d'autres utilisateurs.
          </Text>
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.ctaBtn, checkingStatus && styles.ctaBtnDisabled]}
          onPress={handleSave}
          disabled={checkingStatus}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>Enregistrer</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#F6F7FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('3%'),
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap: {
    alignItems: 'center',
    marginBottom: hp('3.5%'),
  },
  heroIconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  heroTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: wp('3.5%'),
    color: '#ABABAB',
    textAlign: 'center',
    lineHeight: wp('5%'),
    paddingHorizontal: wp('4%'),
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#ABABAB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: wp('1.5%'),
    marginBottom: hp('1%'),
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: hp('2%'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.5%'),
    flexShrink: 0,
  },
  rowTexts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: wp('3.9%'),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  rowDesc: {
    fontSize: wp('3.2%'),
    color: '#ABABAB',
    fontWeight: '400',
    lineHeight: wp('4.5%'),
  },

  // ── Info ──────────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp('1.5%'),
    marginBottom: hp('3%'),
  },
  infoText: {
    flex: 1,
    fontSize: wp('3.1%'),
    color: '#C0C0C0',
    lineHeight: wp('4.5%'),
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaBtn: {
    height: hp('6%'),
    backgroundColor: '#FE5D02',
    borderRadius: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('4%'),
  },
});
