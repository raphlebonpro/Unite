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
  Linking,
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function NotificationsScreen({ navigation }) {
  const [pushEnabled, setPushEnabled]           = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [checkingStatus, setCheckingStatus]     = useState(true);

  // ── Android channel ───────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Unite',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FE5D02',
      });
    }
  }, []);

  // ── Permissions push ──────────────────────────────────────────────────────
  const requestPushPermission = async () => {
    if (!Device.isDevice) {
      Alert.alert('Simulateur', 'Les notifications push ne fonctionnent que sur un vrai appareil.');
      return null;
    }
    let granted = false;
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Autoriser les notifications',
            message: "Unite souhaite t'envoyer des notifications pour tes sessions sportives.",
            buttonPositive: 'Autoriser',
            buttonNegative: 'Refuser',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log('Erreur PermissionsAndroid:', err);
      }
    } else {
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
      const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
      return tokenData.data;
    } catch (e) {
      console.log('Erreur génération token:', e);
      return null;
    }
  };

  // ── Chargement préférences ────────────────────────────────────────────────
  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setCheckingStatus(false);
    const { data } = await supabase
      .from('users')
      .select('notif_push_enabled, notif_email')
      .eq('id', user.id)
      .maybeSingle();
    setPushEnabled(data?.notif_push_enabled ?? true);
    setEmailNotifications(data?.notif_email ?? false);
    setCheckingStatus(false);
  };

  useEffect(() => { loadPreferences(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadPreferences);
    return unsub;
  }, [navigation]);

  // ── Toggle push ───────────────────────────────────────────────────────────
  const handlePushToggle = async (value) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (value) {
      const token = await requestPushPermission();
      if (token) {
        await supabase.from('users')
          .update({ expo_push_token: token, notif_push_enabled: true })
          .eq('id', user.id);
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    } else {
      await supabase.from('users')
        .update({ expo_push_token: null, notif_push_enabled: false })
        .eq('id', user.id);
      setPushEnabled(false);
    }
  };

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('users')
        .update({ notif_email: emailNotifications })
        .eq('id', user.id);
      Alert.alert('Préférences sauvegardées', '', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message || "Impossible d'enregistrer tes préférences.");
    }
  };

  // ── Item toggle ───────────────────────────────────────────────────────────
  const NotifRow = ({ iconName, iconBg, iconColor, title, description, value, onValueChange, disabled }) => (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E8E8EA', true: '#FE5D02' }}
        thumbColor="#fff"
        ios_backgroundColor="#E8E8EA"
        disabled={disabled}
        style={{ marginLeft: wp('3%') }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <View style={styles.container}>

        {/* ── Illustration d'état ──────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <View style={[
            styles.heroIconBox,
            { backgroundColor: pushEnabled ? '#FFF3EE' : '#F5F5F7' },
          ]}>
            <Ionicons
              name={pushEnabled ? 'notifications' : 'notifications-off-outline'}
              size={36}
              color={pushEnabled ? '#FE5D02' : '#BBBBBB'}
            />
          </View>
          <Text style={styles.heroTitle}>
            {pushEnabled ? 'Notifications activées' : 'Notifications désactivées'}
          </Text>
          <Text style={styles.heroSub}>
            Modifie tes préférences à tout moment depuis cette page.
          </Text>
        </View>

        {/* ── Section label ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Mes préférences</Text>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <NotifRow
            iconName="phone-portrait-outline"
            iconBg="#FFF3EE"
            iconColor="#FE5D02"
            title="Notifications push"
            description="Messages, sessions, coéquipiers à proximité."
            value={pushEnabled}
            onValueChange={handlePushToggle}
            disabled={checkingStatus}
          />

          <View style={styles.cardSep} />

          <NotifRow
            iconName="mail-outline"
            iconBg="#EBF2FF"
            iconColor="#3888FF"
            title="Notifications email"
            description="Actualités et nouveautés de Unite."
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            disabled={checkingStatus}
          />
        </View>

        {/* ── Info ─────────────────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={15} color="#C0C0C0" style={{ marginRight: 6 }} />
          <Text style={styles.infoText}>
            Les notifications push nécessitent une autorisation système.
            Si le bouton ne répond pas, vérifie les réglages de ton appareil.
          </Text>
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.ctaBtn, checkingStatus && styles.ctaBtnDisabled]}
          onPress={handleSubmit}
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
  cardSep: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginLeft: wp('4%') + 40 + wp('3.5%'),
  },

  // ── Row ───────────────────────────────────────────────────────────────────
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
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
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
