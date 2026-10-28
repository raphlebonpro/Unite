import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// ─── Données FAQ ──────────────────────────────────────────────────────────────
const FAQ_DATA = [
  {
    category: 'Sessions',
    icon: 'flash-outline',
    color: '#FE5D02',
    bg: '#FFF3EE',
    items: [
      {
        q: 'Comment créer une session ?',
        a: 'Appuie sur l\'onglet "Créer" en bas de l\'écran. Remplis les champs obligatoires : sport, lieu, niveau, titre et date. Ta session sera visible immédiatement par les sportifs proches de toi.',
      },
      {
        q: 'Comment rejoindre une session ?',
        a: 'Depuis l\'onglet "Explorer", navigue sur la carte ou parcours la liste des sessions proches. Appuie sur une session pour voir les détails, puis sur "Rejoindre la session". Tu recevras une confirmation.',
      },
      {
        q: 'Puis-je limiter le nombre de participants ?',
        a: 'Oui. Lors de la création, dans la section "Options", tu peux définir un nombre maximum de participants. Une fois la capacité atteinte, la session est automatiquement fermée.',
      },
      {
        q: 'Comment annuler ou modifier une session que j\'ai créée ?',
        a: 'Va dans l\'onglet "Sessions", retrouve ta session dans "À venir", puis appuie sur "Modifier". Tu peux y changer les informations ou annuler la session — les participants seront automatiquement notifiés.',
      },
      {
        q: 'Qu\'est-ce qu\'une session "filles uniquement" ?',
        a: 'Les créatrices de sessions peuvent activer cette option pour réserver la session aux femmes uniquement. Elle n\'apparaît que si ton genre est renseigné comme "Femme" dans ton profil.',
      },
    ],
  },
  {
    category: 'Groupes',
    icon: 'people-outline',
    color: '#7367F0',
    bg: '#F3F1FF',
    items: [
      {
        q: 'Quelle est la différence entre une session et un groupe ?',
        a: 'Une session est un événement ponctuel : un créneau, un lieu, une date. Un groupe est une communauté permanente (club, amis, association) qui peut organiser des sessions récurrentes et avoir son propre chat.',
      },
      {
        q: 'Comment rejoindre un groupe privé ?',
        a: 'Les groupes "Sur demande" nécessitent une demande d\'adhésion que l\'admin doit valider. Les groupes "Fermés" fonctionnent uniquement par invitation. Les groupes "Ouverts" sont accessibles à tous immédiatement.',
      },
      {
        q: 'Comment créer un groupe ?',
        a: 'Depuis l\'onglet "Explorer", puis "Groupes", appuie sur le bouton de création. Choisis le type (Communauté, Club, Association…), le sport principal, la confidentialité et donne-lui un nom.',
      },
    ],
  },
  {
    category: 'Compte & Profil',
    icon: 'person-outline',
    color: '#3888FF',
    bg: '#EBF2FF',
    items: [
      {
        q: 'Comment modifier mon profil ?',
        a: 'Va dans Paramètres > Modifier le profil. Tu peux changer ton pseudo, ta photo, ta bio, tes sports favoris et tes disponibilités.',
      },
      {
        q: 'Mon profil est-il visible par tous ?',
        a: 'Seules les informations publiques sont visibles : pseudo, photo, bio, sports et niveau. Ton email, ta date de naissance et ta localisation précise ne sont jamais affichés.',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Va dans Paramètres > Supprimer le compte. Cette action est irréversible : toutes tes données (sessions, messages, historique) sont définitivement supprimées.',
      },
    ],
  },
  {
    category: 'Géolocalisation',
    icon: 'location-outline',
    color: '#2ECC71',
    bg: '#EDFBF3',
    items: [
      {
        q: 'Pourquoi Unite a besoin de ma localisation ?',
        a: 'Ta position permet d\'afficher les sessions sportives proches de toi en temps réel. Sans localisation activée, tu ne peux pas voir les sessions ni en créer avec un lieu précis.',
      },
      {
        q: 'Ma position exacte est-elle visible par les autres ?',
        a: 'Non. Les autres utilisateurs voient uniquement la localisation des sessions (lieu de rendez-vous). Ta position en temps réel n\'est jamais partagée publiquement.',
      },
      {
        q: 'Comment modifier mes préférences de géolocalisation ?',
        a: 'Va dans Paramètres > Localisation. Tu peux y ajuster le rayon de recherche et gérer les autorisations. Tu peux aussi modifier les permissions directement dans les réglages de ton téléphone.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: 'notifications-outline',
    color: '#FFA726',
    bg: '#FFF5E5',
    items: [
      {
        q: 'Quelles notifications vais-je recevoir ?',
        a: 'Tu es notifié quand quelqu\'un rejoint ta session, quand une session à laquelle tu participes approche (rappel 2h avant), quand quelqu\'un t\'envoie un message ou une invitation, et lors des nouvelles sessions proches de toi.',
      },
      {
        q: 'Comment désactiver les notifications ?',
        a: 'Va dans Paramètres > Notifications. Tu peux désactiver les notifications push globalement ou les gérer depuis les réglages de ton téléphone.',
      },
    ],
  },
  {
    category: 'Sécurité & Modération',
    icon: 'shield-checkmark-outline',
    color: '#E9436D',
    bg: '#FFF0F4',
    items: [
      {
        q: 'Comment signaler un utilisateur ou une session ?',
        a: 'Sur le profil d\'un utilisateur ou sur une session, appuie sur les trois points en haut à droite et sélectionne "Signaler". Chaque signalement est examiné manuellement.',
      },
      {
        q: 'Comment bloquer un utilisateur ?',
        a: 'Depuis le profil de l\'utilisateur, appuie sur les trois points > "Bloquer". Un utilisateur bloqué ne peut plus voir tes sessions ni te contacter.',
      },
      {
        q: 'Les messages sont-ils modérés ?',
        a: 'Oui. Un système automatique analyse les messages en temps réel et bloque les contenus insultants ou inappropriés. Les liens sont également filtrés pour protéger les utilisateurs.',
      },
    ],
  },
];

// ─── Composant item FAQ (accordéon) ──────────────────────────────────────────
const FAQItem = ({ item, isLast }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQ}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#BBBBBB"
          style={{ flexShrink: 0, marginLeft: 8 }}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.faqA}>
          <Text style={styles.faqAText}>{item.a}</Text>
        </View>
      )}
      {!isLast && <View style={styles.sep} />}
    </>
  );
};

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function FAQScreen() {
  const [search, setSearch] = useState('');

  const filtered = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Barre de recherche ──────────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color="#C0C0C0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans la FAQ…"
            placeholderTextColor="#C8C8C8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Catégories ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color="#E0E0E0" />
            <Text style={styles.emptyText}>Aucun résultat pour "{search}"</Text>
          </View>
        ) : (
          filtered.map(cat => (
            <View key={cat.category}>
              {/* Header catégorie */}
              <View style={styles.catHeader}>
                <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon} size={16} color={cat.color} />
                </View>
                <Text style={styles.catTitle}>{cat.category}</Text>
              </View>

              {/* Items */}
              <View style={styles.card}>
                {cat.items.map((item, idx) => (
                  <FAQItem
                    key={idx}
                    item={item}
                    isLast={idx === cat.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {/* ── Contact support ─────────────────────────────────────────── */}
        <View style={styles.contactCard}>
          <View style={styles.contactLeft}>
            <Text style={styles.contactTitle}>Tu n'as pas trouvé ta réponse ?</Text>
            <Text style={styles.contactSub}>L'équipe Unite te répond rapidement.</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:support@uniteapp.fr')}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={styles.contactBtnText}>Contacter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: hp('2%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FA' },
  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: wp('4%'),
    height: hp('5.5%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#EBEBEB',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: '#1A1A1A',
    paddingVertical: 0,
  },

  // ── Catégorie header ──────────────────────────────────────────────────────
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    marginLeft: wp('1%'),
  },
  catIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  // ── FAQ item ──────────────────────────────────────────────────────────────
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
  },
  faqQ: {
    flex: 1,
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: hp('2.6%'),
  },
  faqA: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('1.8%'),
    paddingTop: hp('0.3%'),
  },
  faqAText: {
    fontSize: wp('3.6%'),
    color: '#666',
    lineHeight: hp('2.5%'),
    fontWeight: '400',
  },
  sep: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginLeft: wp('4%'),
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
    gap: 12,
  },
  emptyText: {
    fontSize: wp('3.8%'),
    color: '#BBBBBB',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Contact card ──────────────────────────────────────────────────────────
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: wp('4%'),
    marginTop: hp('3%'),
    borderWidth: 1,
    borderColor: '#EBEBEB',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactLeft: { flex: 1, gap: 3 },
  contactTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  contactSub: {
    fontSize: wp('3.2%'),
    color: '#BBBBBB',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FE5D02',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: 12,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
});
