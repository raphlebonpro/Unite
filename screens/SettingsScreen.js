import React, { useLayoutEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, AntDesign, Entypo, FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { Share } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Clipboard } from 'react-native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Erreur', error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Supprimer le compte',
      "Attention, cette action est irréversible.\n\nConfirmer la suppression du compte ?",
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
              if (!access_token) {
                Alert.alert("Erreur", "Token d'accès introuvable.");
                return;
              }
              console.log("Suppression user_id :", user_id);

              const response = await fetch('https://vznufgpbrunadydudbix.supabase.co/functions/v1/delete-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify({ user_id }),
              });

              const result = await response.json();
              console.log("Résultat delete-user:", result);

              if (!response.ok) {
                Alert.alert('Erreur', result.error || 'Erreur inconnue');
                return;
              }

              await supabase.auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignUp' }],
              });
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Erreur inconnue');
            }
          },
        },
      ]
    );
  };

const handleShareApp = async () => {
  if (Platform.OS === 'android') {
    // ✅ Copy-to-clipboard pour Android (pas de bug layout)
    await Clipboard.setString('🔥 Découvre Unite : https://testflight.apple.com/join/aWMTGZnf');
    Alert.alert('Copié !', 'Le lien a été copié dans le presse-papier');
  } else {
    // ✅ Share API normal pour iOS
    await Share.share({
      message: `🔥 Découvre Unite : l'app qui te connecte à des sportifs de tous niveaux pour bouger et partager le sport autour de toi ! Rejoins la bêta ici : https://testflight.apple.com/join/aWMTGZnf`
    });
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Text style={styles.sectionHeader}>Compte</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={<AntDesign name="user" size={22} color="#1976d2" />}
            label="Modifier le profil"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ItemSeparator />
          <SettingsItem
            icon={<Entypo name="location-pin" size={22} color="#43b97f" />}
            label="Localisation"
            onPress={() => navigation.navigate('Location')}
          />
          <ItemSeparator />
          <SettingsItem
            icon={<Feather name="bell" size={22} color="#faad14" />}
            label="Notifications"
            onPress={() => navigation.navigate('AutorisationNotifications')}
          />
        </View>

        <Text style={styles.sectionHeader}>Général</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={<AntDesign name="questioncircleo" size={21} color="#888" />}
            label="Politique de confidentialité"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <ItemSeparator />
          <SettingsItem
            icon={<FontAwesome name="shield" size={21} color="#888" />}
            label="Conditions générales"
            onPress={() => navigation.navigate('Terms')}
          />
          <ItemSeparator />
          <SettingsItem
           icon={<Feather name="message-square" size={21} color="#888" />}
           label="Retour et Signalement"
           onPress={() => navigation.navigate('FeedbackAndReport')}
          />
          <ItemSeparator />

          <SettingsItem
            icon={<Feather name="share" size={21} color="#1976d2" />}
            label="Partager Unite"
            onPress={handleShareApp}
          />
        </View>

        <View style={styles.cardAction}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={handleDeleteAccount}
          >
            <Feather name="trash-2" size={18} color="#fff" />
            <Text style={styles.deleteText}>Supprimer le compte</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ItemSeparator = () => (
  <View style={{ height: 1, backgroundColor: '#f0f0f3', marginLeft: 54 }} />
);

const SettingsItem = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.item}
    activeOpacity={0.6}
    onPress={onPress}
  >
    <View style={styles.iconBox}>{icon}</View>
    <Text style={styles.itemText}>{label}</Text>
    <AntDesign name="right" size={16} color="#bbb" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fa',
  },
  scrollContainer: {
    padding: wp('4.7%'),
    paddingBottom: hp('2.2%'),
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  sectionHeader: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    marginLeft: wp('1.5%'),
    marginTop: hp('1.1%'),
    marginBottom: hp('1.2%'),
    letterSpacing: 0.2,
    color: '#555',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    paddingVertical: hp('0.45%'),
    shadowColor: '#191A20',
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.08,
    shadowRadius: wp('2.1%'),
    elevation: 2,
    marginBottom: hp('2.5%'),
  },
  cardAction: {
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    paddingVertical: hp('2.3%'),
    paddingHorizontal: wp('5.2%'),
    marginTop: hp('1.3%'),
    shadowColor: '#191A20',
    shadowOffset: { width: 0, height: hp('0.25%') },
    shadowOpacity: 0.07,
    shadowRadius: wp('1.9%'),
    elevation: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3.5%'),
  },
  iconBox: {
    width: wp('9.3%'),
    height: wp('9.3%'),
    borderRadius: wp('4.65%'),
    backgroundColor: '#f1f4f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.6%'),
  },
  itemText: {
    flex: 1,
    fontSize: wp('4.1%'),
    color: '#222',
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#222',
    borderRadius: wp('3.3%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    marginBottom: hp('1.1%'),
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: wp('1.7%'),
    fontSize: wp('4%'),
    letterSpacing: 0.1,
  },
  deleteBtn: {
    backgroundColor: '#ff5a5f',
    borderRadius: wp('3.3%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    marginTop: hp('0.4%'),
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: wp('1.7%'),
    fontSize: wp('4%'),
    letterSpacing: 0.1,
  },
});

export default SettingsScreen;

