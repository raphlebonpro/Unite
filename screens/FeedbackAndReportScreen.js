import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { 
  notifyFeedbackConfirmation, 
  notifyNewsletterSubscribed 
} from '../helpers/notifications';

export default function FeedbackScreen({ navigation }) {
  const [rating, setRating] = useState(null);
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [improvement, setImprovement] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [userId, setUserId] = useState(null);

  // Newsletter states
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUserId(data?.user?.id || null);
    };
    fetchUser();
  }, []);

const handleSubmit = async () => {
  if (!rating && !generalFeedback && !improvement && !issueType && !issueDetail) {
    Alert.alert("Merci de remplir au moins un champ !");
    return;
  }

  Alert.alert(
    "Envoyer ce retour",
    "Es-tu sûr de vouloir envoyer ce retour ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Envoyer",
        onPress: async () => {

  // 🔑 Récupère bien l'user avant
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    Alert.alert("Erreur", "Utilisateur non connecté");
    return;
  }

  const { error, data } = await supabase.from('app_feedback').insert([{
    user_id: user.id,       // ✅ toujours passer l'user_id
    rating,
    general_feedback: generalFeedback,
    improvement,
    issue_type: issueType,
    issue_detail: issueDetail,
  }]).select().single();

  if (error) {
    console.log("❌ Supabase insert error (feedback):", error);
    Alert.alert("Erreur", error.message || "Une erreur est survenue.");
  } else {
    // ✅ Envoi mail via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      await fetch(`${baseUrl}/functions/v1/send_feedback_email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          feedbackId: data.id,
          generalFeedback,
          improvement,
          issueType,
          issueDetail,
        }),
      });
    } catch (e) {
      console.error("❌ Erreur envoi email Zoho:", e);
    }

    navigation.goBack();
  }
  await notifyFeedbackConfirmation({ userId: user.id });
  Alert.alert(
            "Merci 🙌",
            "Ton retour a bien été envoyé.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        },
      },
    ]
  );
};

  // Newsletter handler
const handleNewsletter = async () => {
  if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
    Alert.alert('Erreur', "Veuillez saisir une adresse e-mail valide.");
    return;
  }
  Alert.alert(
    "S’inscrire à la newsletter",
    `Souhaites-tu t’inscrire à la newsletter avec cette adresse ?\n\n${newsletterEmail}`,
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "S’inscrire",
        onPress: async () => {
  setNewsletterLoading(true);

  // 🔑 Récupère aussi l'user si dispo
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('newsletter_subscribers').insert([{
    email: newsletterEmail,
    user_id: user?.id || null,
  }]);

  setNewsletterLoading(false);

if (error) {
  if (error.code === '23505') {
    Alert.alert("Déjà inscrit", "Cette adresse email est déjà inscrite à la newsletter Unite.");
  } else {
    console.log("❌ Supabase insert error (newsletter):", error);
    Alert.alert("Erreur", "L'inscription a échoué. Réessaye plus tard.");
  }
} else {
    // ✅ Envoi notif après succès
    await notifyNewsletterSubscribed({
      userId: user?.id,
      email: newsletterEmail,
    });
    setNewsletterEmail('');
Alert.alert(
            "Inscription réussie",
            "Tu es bien inscrit(e) à la newsletter Unite."
          );
        }
        },
      },
    ]
  );
};

  return (
<KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#FAFAFF' }}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={60}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>

            {/* CARD 1 : Feedback */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vos retours nous intéressent !</Text>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRating(n)}
                    style={[
                      styles.starWrapper,
                      rating === n && styles.starSelectedWrapper
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={rating >= n ? "star" : "star-outline"}
                      size={32}
                      color={rating >= n ? '#FF914D' : '#ECECEC'}
                      style={{
                        textShadowColor: rating >= n ? '#FFCFAD' : undefined,
                        textShadowRadius: 3,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.inputLarge}
                placeholder="Détaillez votre expérience..."
                placeholderTextColor="#AAA"
                value={generalFeedback}
                onChangeText={setGeneralFeedback}
                multiline
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

            {/* CARD 2 : Suggestions */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={21} color="#FF914D" /> Suggestions ou améliorations
              </Text>
              <TextInput
                style={styles.inputLarge}
                placeholder="Vos idées, vos besoins..."
                placeholderTextColor="#AAA"
                value={improvement}
                onChangeText={setImprovement}
                multiline
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

            {/* CARD 3 : Signaler un problème */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF914D" /> Signaler un problème
              </Text>
              <View style={styles.chipRow}>
                {[
                  {type: 'Bug', icon: 'bug-outline'},
                  {type: 'Sécurité', icon: 'shield-lock-outline'},
                  {type: 'Comportement', icon: 'account-alert-outline'},
                  {type: 'Autre', icon: 'dots-horizontal-circle-outline'},
                ].map(({type, icon}) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, issueType === type && styles.chipSelected]}
                    onPress={() => setIssueType(type)}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={17}
                      color={issueType === type ? '#fff' : '#FF914D'}
                      style={{marginRight: 4}}
                    />
                    <Text style={[
                      styles.chipText,
                      issueType === type && { color: '#fff' }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.inputLarge, { minHeight: 80, maxHeight: 160 }]}
                placeholder="Expliquez le problème (obligatoire si un problème sélectionné)"
                placeholderTextColor="#AAA"
                value={issueDetail}
                onChangeText={setIssueDetail}
                multiline
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

{/* BUTTON : Envoyer mon retour */}
<View style={styles.card}>
  <TouchableOpacity
    style={styles.fullWidthBtnWrap}
    activeOpacity={0.90}
    onPress={handleSubmit}
  >
    <View
      style={[styles.fullWidthGradientBtn, {backgroundColor: '#FE5D02'}]}
    >
      <Text style={styles.fullWidthGradientBtnText}>Envoyer mon retour</Text>
    </View>
  </TouchableOpacity>
</View>

{/* CARD 4 : Newsletter */}
<View style={styles.card}>
  <LinearGradient
    colors={['#654ea3', '#2196f3']}
    start={{ x: 0.08, y: 0.2 }}
    end={{ x: 1, y: 1 }}
    style={styles.newsletterGradient}
  >
    <View style={{ alignItems: 'center', marginBottom: 12 }}>
      <Ionicons name="mail-unread-outline" size={38} color="#fff" style={{ marginBottom: 4 }} />
    </View>
    <Text style={styles.newsletterTitleV2}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Recevez toutes les actus de Unite</Text>
    </Text>
    <Text style={styles.newsletterSubtitleV2}>
      Inscrivez-vous à la newsletter pour être au courant des nouveautés, évènements et évolutions de l’appli.
    </Text>
    <View style={styles.newsletterRowV2}>
<TextInput
  style={styles.newsletterInputV2}
  placeholder="Adresse e-mail"
  placeholderTextColor="#EEE"
  keyboardType="email-address"
  value={newsletterEmail}
  onChangeText={setNewsletterEmail}
  autoCapitalize="none"
  autoCorrect={true}
  textContentType="emailAddress"
  selectionColor="#fff"
  color="#fff"
/>
      <TouchableOpacity
        style={styles.newsletterBtnV2}
        onPress={handleNewsletter}
        disabled={newsletterLoading}
        activeOpacity={0.9}
      >
        <View
          style={[styles.newsletterBtnGradientV2, {backgroundColor:'#FE5D02'}]}
        >
          <Text style={styles.newsletterBtnTextV2}>
            {newsletterLoading ? "..." : "M’inscrire"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </LinearGradient>
 </View>
</View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

const COMPACT = 0.95;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: hp('4%'),
    backgroundColor: '#FAFAFF',
  },
  container: {
    width: '100%',
    maxWidth: wp('97%'),
    alignSelf: 'center',
    paddingTop: Platform.OS === 'android' ? hp('1.7%') : hp('1.2%'),
    paddingHorizontal: wp('3%'),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    padding: wp('4%'),
    marginVertical: hp('0.7%'),
    shadowColor: '#232323',
    shadowOffset: { width: 0, height: hp('0.6%') },
    shadowOpacity: 0.09,
    shadowRadius: wp('3%'),
    elevation: 3,
  },
  cardTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: '#232323',
    textAlign: 'center',
    marginBottom: hp('1.2%'),
    letterSpacing: 0.09,
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#232323',
    marginBottom: hp('0.8%'),
    letterSpacing: 0.07,
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: hp('0.5%'),
    marginTop: hp('0.1%'),
  },
  starWrapper: {
    paddingHorizontal: wp('0.8%'),
    borderRadius: wp('3.5%'),
  },
  starSelectedWrapper: {
    backgroundColor: '#FFF0E6',
  },
  inputLarge: {
    width: '100%',
    backgroundColor: '#faf9f7',
    borderRadius: wp('3.2%'),
    minHeight: hp('6%'),
    padding: wp('2.5%'),
    marginBottom: hp('0.5%'),
    fontSize: wp('4%'),
    color: '#232323',
    marginTop: hp('0.3%'),
    borderWidth: 1,
    borderColor: '#F6F6F6',
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('1.2%'),
    marginBottom: hp('1%'),
    marginTop: hp('0.2%'),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('3.2%'),
    borderWidth: 1.2,
    borderColor: '#FF914D',
    backgroundColor: '#fff',
    marginRight: wp('1.8%'),
    marginBottom: hp('0.7%'),
    shadowColor: '#FF914D',
    shadowOffset: { width: 0, height: hp('0.2%') },
    shadowOpacity: 0.06,
    shadowRadius: wp('0.7%'),
  },
  chipText: {
    color: '#FF914D',
    fontWeight: '700',
    fontSize: wp('3.4%'),
    marginLeft: wp('0.3%'),
  },
  chipSelected: {
    backgroundColor: '#FF914D',
    borderColor: '#FF914D',
    shadowColor: '#FF914D',
    shadowOffset: { width: 0, height: hp('0.2%') },
    shadowOpacity: 0.13,
    shadowRadius: wp('1%'),
  },
  fullWidthBtnWrap: {
    width: '100%',
    borderRadius: wp('4%'),
    overflow: 'hidden',
  },
  fullWidthGradientBtn: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('5%'),
    marginHorizontal: 15,
  },
  fullWidthGradientBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('4%'),
    letterSpacing: 0.10,
  },
  newsletterGradient: {
    width: '100%',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    padding: wp('4.8%'),
    justifyContent: 'center',
  },
  newsletterTitleV2: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: '#fff',
    marginBottom: hp('1%'),
    textAlign: 'center',
    letterSpacing: 0.06,
  },
  newsletterSubtitleV2: {
    fontSize: wp('3.3%'),
    color: '#fff',
    marginBottom: hp('1.6%'),
    textAlign: 'center',
  },
  newsletterRowV2: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.7%'),
  },
  newsletterInputV2: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('2.6%'),
    borderWidth: 0,
    padding: wp('2.3%'),
    fontSize: wp('3.3%'),
    marginRight: wp('1.5%'),
    color: '#fff',
  },
  newsletterBtnV2: {
    borderRadius: wp('2.6%'),
    overflow: 'hidden',
    width: wp('22%'),
  },
  newsletterBtnGradientV2: {
    width: '100%',
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    borderRadius: wp('2.6%'),
  },
  newsletterBtnTextV2: {
    color: '#fff',
    fontWeight: '800',
    fontSize: wp('3.3%'),
  },
});
