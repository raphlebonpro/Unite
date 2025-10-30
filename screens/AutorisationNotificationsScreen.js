import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function NotificationsScreen({ navigation }) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  // ✅ Android channel obligatoire
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Unite',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6C4A',
      });
    }
  }, []);

  // ✅ Gère les permissions push (sans rebuild Android)
  const requestPushPermission = async () => {
    if (!Device.isDevice) {
      Alert.alert('Simulateur', 'Les notifications push ne fonctionnent que sur un vrai appareil.');
      return null;
    }

    let granted = false;

    // 🔹 Cas Android → on force la demande manuelle sans rebuild
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Autoriser les notifications',
            message: 'Unite souhaite t’envoyer des notifications pour tes sessions sportives.',
            buttonPositive: 'Autoriser',
            buttonNegative: 'Refuser',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log('⚠️ Erreur PermissionsAndroid:', err);
      }
    } else {
      // 🔹 Cas iOS classique
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    }

    if (!granted) {
      Alert.alert(
        'Notifications désactivées',
        "Active-les manuellement dans les paramètres de ton téléphone.",
        [
          { text: 'Ouvrir les paramètres', onPress: () => Linking.openSettings() },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {}
      );
      console.log('📲 Token Expo:', tokenData.data);
      return tokenData.data;
    } catch (e) {
      console.log('❌ Erreur génération token:', e);
      return null;
    }
  };

  // 🔹 Charge les préférences utilisateur
  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setCheckingStatus(false);

    const { data, error } = await supabase
      .from('users')
      .select('notif_push_enabled, notif_email')
      .eq('id', user.id)
      .maybeSingle();

    if (error) console.log('❌ Erreur Supabase:', error);

    // ✅ applique les préférences stockées
    setPushEnabled(data?.notif_push_enabled ?? true);
    setEmailNotifications(data?.notif_email ?? false);
    setCheckingStatus(false);
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // 🔁 Rafraîchit les préférences au retour sur la page
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadPreferences);
    return unsub;
  }, [navigation]);

  // ✅ Activation/désactivation du push
  const handlePushToggle = async (value) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (value) {
      const token = await requestPushPermission();
      if (token) {
        const { error } = await supabase
          .from('users')
          .update({
            expo_push_token: token,
            notif_push_enabled: true,
          })
          .eq('id', user.id);

        if (error) console.log('❌ Erreur update token:', error);
        else console.log('✅ Token enregistré avec succès');
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    } else {
      const { error } = await supabase
        .from('users')
        .update({
          expo_push_token: null,
          notif_push_enabled: false,
        })
        .eq('id', user.id);

      if (error) console.log('❌ Erreur désactivation push:', error);
      else console.log('🚫 Push désactivé');
      setPushEnabled(false);
    }

    Animated.spring(scaleAnim, {
      toValue: value ? 1 : 0.96,
      useNativeDriver: true,
      speed: 12,
    }).start();
  };

  // ✅ Sauvegarde les préférences email + goBack
  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({ notif_email: emailNotifications })
        .eq('id', user.id);

      Alert.alert('Succès', 'Tes préférences ont bien été sauvegardées.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible d’enregistrer tes préférences.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MaterialCommunityIcons
        name={pushEnabled ? 'bell-ring' : 'bell-off-outline'}
        size={44}
        color={pushEnabled ? '#43b97f' : '#bababa'}
        style={{ alignSelf: 'center', marginTop: 50, marginBottom: 6 }}
      />
      <Text style={styles.subtitle}>
        Active les notifications pour profiter pleinement de Unite.
        <Text style={{ color: '#FF6C4A', fontWeight: '600' }}>
          {' '}Tu pourras modifier ce choix à tout moment.
        </Text>
      </Text>

      {/* Push */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Notifications Push</Text>
            <Text style={styles.cardDescription}>
              Sois alerté dès qu’un coéquipier t’envoie un message ou crée une session près de toi.
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#e4e5ed', true: '#43b97f' }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
              ios_backgroundColor="#e4e5ed"
              disabled={checkingStatus}
            />
          </Animated.View>
        </View>
      </View>

      {/* Email */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Notifications Email</Text>
            <Text style={styles.cardDescription}>
              Reste informé des nouveautés de Unite.
              <Text style={{ color: '#FF6C4A' }}> Pas de spam, juste de l’énergie positive.</Text>
            </Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: '#e4e5ed', true: '#43b97f' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            ios_backgroundColor="#e4e5ed"
          />
        </View>
      </View>

      {/* Bouton Enregistrer */}
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={checkingStatus}>
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
});
