import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { Share } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ─── Config des sections ──────────────────────────────────────────────────────
// Chaque item a une couleur d'icône et un fond associé pour une lecture immédiate
const SECTIONS = [
  {
    title: 'Mon compte',
    items: [
      {
        key: 'profile',
        label: 'Modifier le profil',
        sub: 'Pseudo, photo, bio',
        icon: 'person-outline',
        lib: 'ion',
        iconColor: '#3888FF',
        iconBg: '#EBF2FF',
        route: 'EditProfile',
      },
      {
        key: 'location',
        label: 'Localisation',
        sub: 'Géolocalisation et zone',
        icon: 'location-outline',
        lib: 'ion',
        iconColor: '#2ECC71',
        iconBg: '#EDFBF3',
        route: 'Location',
      },
      {
        key: 'notifs',
        label: 'Notifications',
        sub: 'Alertes et rappels',
        icon: 'notifications-outline',
        lib: 'ion',
        iconColor: '#FFA726',
        iconBg: '#FFF5E5',
        route: 'AutorisationNotifications',
      },
    ],
  },
  {
    title: 'Informations',
    items: [
      {
        key: 'privacy',
        label: 'Politique de confidentialité',
        icon: 'shield-checkmark-outline',
        lib: 'ion',
        iconColor: '#7367F0',
        iconBg: '#F3F1FF',
        route: 'PrivacyPolicy',
      },
      {
        key: 'terms',
        label: 'Conditions générales',
        icon: 'document-text-outline',
        lib: 'ion',
        iconColor: '#3CD6E6',
        iconBg: '#E5FAFA',
        route: 'Terms',
      },
      {
        key: 'legal',
        label: 'Mentions légales',
        icon: 'information-circle-outline',
        lib: 'ion',
        iconColor: '#888',
        iconBg: '#F2F2F2',
        route: 'MentionsLegales',
      },
      {
  key: 'faq',
  label: 'FAQ & Aide',
  sub: 'Questions fréquentes',
  icon: 'help-circle-outline',
  lib: 'ion',
  iconColor: '#FE5D02',
  iconBg: '#FFF3EE',
  route: 'FAQ',
},
      {
        key: 'feedback',
        label: 'Retour et Signalement',
        icon: 'chatbubble-outline',
        lib: 'ion',
        iconColor: '#E9436D',
        iconBg: '#FFF0F4',
        route: 'FeedbackAndReport',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) Alert.alert('Erreur', error.message);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes tes données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError || !userData?.user) {
                Alert.alert('Erreur', "Impossible de récupérer l'utilisateur.");
                return;
              }
              const user_id = userData.user.id;
              const { data: sessionData } = await supabase.auth.getSession();
              const access_token = sessionData?.session?.access_token;
              if (!access_token) { Alert.alert('Erreur', "Token d'accès introuvable."); return; }

              const response = await fetch(
                'https://vznufgpbrunadydudbix.supabase.co/functions/v1/delete-user',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
                  body: JSON.stringify({ user_id }),
                }
              );
              const result = await response.json();
              if (!response.ok) { Alert.alert('Erreur', result.error || 'Erreur inconnue'); return; }

              await supabase.auth.signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Erreur inconnue');
            }
          },
        },
      ]
    );
  };

// Sans expo-clipboard du tout
const handleShareApp = async () => {
  const shareText =
    "Le sport est fait pour être partagé. Rejoins Unite, la nouvelle app qui connecte les sportifs autour de toi. Le collectif t'attend → https://www.uniteapp.fr";

  await Share.share({ message: shareText });
};

  // ── Item de settings ────────────────────────────────────────────────────
  const SettingsItem = ({ item, isLast }) => (
    <>
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.6}
        onPress={() => navigation.navigate(item.route)}
      >
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={19} color={item.iconColor} />
        </View>

        <View style={styles.itemTexts}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          {item.sub ? <Text style={styles.itemSub}>{item.sub}</Text> : null}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
      </TouchableOpacity>

      {!isLast && <View style={styles.separator} />}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >

        {/* ── Sections ──────────────────────────────────────────────────── */}
        {SECTIONS.map(section => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <SettingsItem
                  key={item.key}
                  item={item}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* ── Partager Unite — mise en avant ────────────────────────────── */}
        <TouchableOpacity
          style={styles.shareCard}
          onPress={handleShareApp}
          activeOpacity={0.88}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FFF0F8' }]}>
            <Ionicons name="share-social-outline" size={19} color="#F62DAE" />
          </View>
          <View style={styles.itemTexts}>
            <Text style={[styles.itemLabel, { color: '#000' }]}>Partager Unite</Text>
            <Text style={styles.itemSub}>Invite tes coéquipiers à rejoindre</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#F62DAE" style={{ opacity: 0.4 }} />
        </TouchableOpacity>

        {/* ── Zone danger ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.card}>

          {/* Déconnexion */}
          <TouchableOpacity style={styles.item} activeOpacity={0.6} onPress={handleLogout}>
            <View style={[styles.iconBox, { backgroundColor: '#F2F2F2' }]}>
              <Ionicons name="log-out-outline" size={19} color="#555" />
            </View>
            <View style={styles.itemTexts}>
              <Text style={styles.itemLabel}>Se déconnecter</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Supprimer */}
          <TouchableOpacity style={styles.item} activeOpacity={0.6} onPress={handleDeleteAccount}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="trash-outline" size={19} color="#EB1E1E" />
            </View>
            <View style={styles.itemTexts}>
              <Text style={[styles.itemLabel, { color: '#EB1E1E' }]}>Supprimer le compte</Text>
              <Text style={styles.itemSub}>Action irréversible</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#EB1E1E" style={{ opacity: 0.3 }} />
          </TouchableOpacity>

        </View>

        {/* ── Version ────────────────────────────────────────────────────── */}
        <Text style={styles.version}>Unite · v1.0.7</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F7FA',
  },
  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('4%'),
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#ABABAB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: wp('1.5%'),
    marginTop: hp('2%'),
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
  },

  // ── Item ──────────────────────────────────────────────────────────────────
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.5%'),
    flexShrink: 0,
  },
  itemTexts: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: wp('3.9%'),
    fontWeight: '600',
    color: '#1A1A1A',
  },
  itemSub: {
    fontSize: wp('3.2%'),
    color: '#BBBBBB',
    fontWeight: '400',
  },

  // ── Séparateur indenté ────────────────────────────────────────────────────
  separator: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginLeft: wp('4%') + 38 + wp('3.5%'),  // aligne avec le texte
  },

  // ── Share card (standalone) ───────────────────────────────────────────────
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderWidth: 1.5,
    borderColor: '#d3d3d3',
    elevation: 2,
  },

  // ── Version ───────────────────────────────────────────────────────────────
  version: {
    textAlign: 'center',
    fontSize: wp('3.2%'),
    color: '#CCCCCC',
    fontWeight: '500',
    marginTop: hp('3%'),
  },
});