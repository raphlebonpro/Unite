import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const NotificationsScreen = ({ navigation }) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const scaleAnim = new Animated.Value(pushEnabled ? 1 : 0.96);

  useEffect(() => {
    (async () => {
      if (!Device.isDevice) return setCheckingStatus(false);
      const { status } = await Notifications.getPermissionsAsync();
      setPushEnabled(status === 'granted');
      setCheckingStatus(false);

      // Récupère préférences actuelles de l'utilisateur dans Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('notif_activity, notif_email')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setPushEnabled(data.notif_activity ?? false);
          setEmailNotifications(data.notif_email ?? false);
        }
      }
    })();
  }, []);

  const handlePushToggle = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
        Alert.alert(
          "Notifications désactivées",
          "Tu dois autoriser les notifications dans les réglages du téléphone pour les recevoir."
        );
      }
    } else {
      setPushEnabled(false);
      Alert.alert(
        "Notifications désactivées",
        "Tu ne recevras plus aucune notification push de Unite. Tu pourras réactiver à tout moment."
      );
    }
    Animated.spring(scaleAnim, {
      toValue: value ? 1 : 0.96,
      useNativeDriver: true,
      speed: 12,
    }).start();
  };

  const handleEmailToggle = (value) => {
    setEmailNotifications(value);
  };

  // ➜ MODIFIE ICI POUR LOGUER TOUT LE RETOUR SUPABASE !
  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from('users')
        .update({
          notif_activity: pushEnabled,
          notif_email: emailNotifications,
        })
        .eq('id', user.id);

      if (error) {
        // ➜ Logue l’erreur détaillée
        console.log("Erreur update notif:", error);
        throw new Error(error.message || error.details || "Erreur lors de l'enregistrement");
      }

      Alert.alert(
        "Préférences enregistrées",
        "Tes préférences de notifications ont bien été sauvegardées.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible d'enregistrer tes préférences.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MaterialCommunityIcons
        name={pushEnabled ? "bell-ring" : "bell-off-outline"}
        size={44}
        color={pushEnabled ? "#43b97f" : "#bababa"}
        style={{ alignSelf: 'center', marginTop: 12, marginBottom: 6 }}
      />
      <Text style={styles.subtitle}>
        Active les notifications pour profiter pleinement de Unite.
        <Text style={{ color: '#1976d2', fontWeight: '600' }}> Tu pourras modifier ce choix à tout moment.</Text>
      </Text>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Notifications Push</Text>
            <Text style={styles.cardDescription}>
              Sois alerté instantanément de toute activité (messages, sessions, rappels…) et reste connecté à ta communauté.
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
        {!pushEnabled &&
          <Text style={styles.disabledText}>
            Notifications push désactivées. Tu ne recevras plus aucun rappel, ni message en temps réel.
          </Text>
        }
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Notifications Email</Text>
            <Text style={styles.cardDescription}>
              Reçois conseils, nouveautés et offres exclusives par e-mail depuis <Text style={{ color: '#1976d2' }}>contact@uniteapp.fr</Text>.
            </Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={handleEmailToggle}
            trackColor={{ false: '#e4e5ed', true: '#1976d2' }}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            ios_backgroundColor="#e4e5ed"
          />
        </View>
        {!emailNotifications &&
          <Text style={styles.disabledText}>
            Tu ne recevras plus nos emails d'information, conseils ou promos.
          </Text>
        }
      </View>

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
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
};

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

export default NotificationsScreen;
