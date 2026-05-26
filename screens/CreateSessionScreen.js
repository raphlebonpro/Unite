import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, SafeAreaView, KeyboardAvoidingView,
  Alert, StatusBar, Switch, Modal, ActivityIndicator,
  Keyboard,
} from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import MiniAppBar from '../components/MiniAppBar';
import {
  notifySessionCreated,
  notifyNearbyUsersOnSessionCreated,
  notifyGroupSessionCreatedForMembers,
} from '../helpers/notifications';
import { useNotificationRefresh } from '../context/NotificationContext';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import PlaceSearchField from '../components/PlaceSearchField';

// ─── Calendrier en français ────────────────────────────────────────────────
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

// ─── Sports ────────────────────────────────────────────────────────────────
const sportData = [
  { label: 'Football',        icon: <FontAwesome5 name="futbol" size={hp('2.1%')} color="#3888FF" /> },
  { label: 'Basketball',      icon: <MaterialCommunityIcons name="basketball" size={hp('2.1%')} color="#FFA726" /> },
  { label: 'Tennis',          icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#2ECC71" /> },
  { label: 'Padel',           icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#FFD600" /> },
  { label: 'Running',         icon: <MaterialCommunityIcons name="run-fast" size={hp('2.3%')} color="#E9436D" /> },
  { label: 'Cyclisme',        icon: <MaterialCommunityIcons name="bike" size={hp('2.1%')} color="#3CD6E6" /> },
  { label: 'Natation',        icon: <MaterialCommunityIcons name="swim" size={hp('2.1%')} color="#1469B9" /> },
  { label: 'Musculation',     icon: <MaterialCommunityIcons name="dumbbell" size={hp('2.4%')} color="#7367F0" /> },
  { label: 'Fitness',         icon: <MaterialCommunityIcons name="weight-lifter" size={hp('2.3%')} color="#7C4DFF" /> },
  { label: 'Randonnée/Trail', icon: <MaterialCommunityIcons name="hiking" size={hp('2.1%')} color="#43A047" /> },
  { label: '+ de sports',     icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" /> },
];

const sportIcons = {
  Football:          { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: '#3888FF' },
  Basketball:        { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: '#FFA726' },
  Tennis:            { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: '#2ECC71' },
  Running:           { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  Cyclisme:          { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: '#3CD6E6' },
  Natation:          { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: '#1469B9' },
  Musculation:       { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: '#7367F0' },
  Fitness:           { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#7C4DFF" />, color: '#7C4DFF' },
  Autres:            { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />, color: '#999' },
  Yoga:              { icon: <MaterialCommunityIcons name="yoga" size={18} color="#A259F7" />, color: '#A259F7' },
  Danse:             { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Pilates:           { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },
  Padel:             { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />, color: '#FFD600' },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },
  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
  'Ski de randonnée':{ icon: <MaterialCommunityIcons name="ski-cross-country" size={18} color="#4FC3F7" />, color: '#4FC3F7' },
  'Ski/Snow':        { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: '#32C5FF' },
  VTT:               { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
  Marche:            { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />, color: '#00A676' },
  Kayak:             { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />, color: '#0277BD' },
  Surf:              { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Kitesurf:          { icon: <MaterialCommunityIcons name="kitesurfing" size={18} color="#29B6F6" />, color: '#29B6F6' },
  Windsurf:          { icon: <MaterialCommunityIcons name="windsock" size={18} color="#42A5F5" />, color: '#42A5F5' },
  'Stand Up Paddle': { icon: <MaterialCommunityIcons name="wave" size={18} color="#26A69A" />, color: '#26A69A' },
  Skate:             { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Roller:            { icon: <MaterialCommunityIcons name="roller-skate" size={18} color="#FF8A65" />, color: '#FF8A65' },
  Escalade:          { icon: <MaterialCommunityIcons name="terrain" size={18} color="#689F38" />, color: '#689F38' },
  Parapente:         { icon: <MaterialCommunityIcons name="paragliding" size={18} color="#1976D2" />, color: '#1976D2' },
  CrossFit:          { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie:      { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },
  'Arts Martiaux':   { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },
  Échecs:            { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },
  '+ de sports':     { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

const otherSports = [
  'CrossFit','Yoga','Pilates','Danse','Marche','VTT','Kayak','Surf',
  'Kitesurf','Stand Up Paddle','Ski/Snow','Ski de randonnée','Skate',
  'Roller','Escalade','Parapente','Callisthénie','Arts Martiaux',
  'Tennis de table','Échecs','Autres',
];

const levels = ["Pour s'amuser", 'Débutant', 'Intermédiaire', 'Avancé'];

const levelMeta = {
  "Pour s'amuser": { icon: 'emoticon-happy-outline', color: '#FFA726', bg: '#FFF5E5' },
  'Débutant':      { icon: 'sprout-outline',         color: '#2ECC71', bg: '#EDFBF3' },
  'Intermédiaire': { icon: 'lightning-bolt',         color: '#3888FF', bg: '#EBF2FF' },
  'Avancé':        { icon: 'fire',                   color: '#FE5D02', bg: '#FFF3EE' },
};

// ─── Date helpers ──────────────────────────────────────────────────────────
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function formatDateYYYYMMDD(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function formatTimeHHMM(d) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function combineLocalDateAndTime(dateOnly, timeOnly) {
  const c = new Date(dateOnly);
  c.setHours(timeOnly.getHours(), timeOnly.getMinutes(), 0, 0);
  return c;
}
function formatHour(date) {
  if (!(date instanceof Date)) return 'Heure';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function isAllowedStartTime(d) {
  const h = d.getHours(), m = d.getMinutes();
  return !(h < 5 || h > 22 || (h === 22 && m > 0));
}
function getClampedDefaultHour() {
  const now = new Date();
  const f = new Date(now.getTime() + 60 * 60 * 1000);
  f.setSeconds(0); f.setMilliseconds(0);
  const h = f.getHours();
  if (h < 5) { f.setHours(6, 0, 0, 0); }
  else if (h > 22) { f.setDate(f.getDate() + 1); f.setHours(6, 0, 0, 0); }
  return f;
}

// ─────────────────────────────────────────────────────────────────────────────
const CreateSessionScreen = () => {
  const navigation  = useNavigation();
  const route       = useRoute();
  const groupId     = route.params?.groupId ?? null;
  const isGroupSession = Boolean(groupId);
  const { notifUnseen } = useNotificationRefresh();

  const [selectedSport,  setSelectedSport]  = useState('');
  const [showOtherSports,setShowOtherSports] = useState(false);
  const [selectedLevel,  setSelectedLevel]  = useState('');
  const [sessionLink,    setSessionLink]    = useState('');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedHour,   setSelectedHour]   = useState(getClampedDefaultHour);
  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [showCalendar,   setShowCalendar]   = useState(false);
  const [title,          setTitle]          = useState('');
  const [comments,       setComments]       = useState('');
  const [location,       setLocation]       = useState('');
  const [latitude,       setLatitude]       = useState(null);
  const [longitude,      setLongitude]      = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempLocation,   setTempLocation]   = useState('');
  const [tempLat,        setTempLat]        = useState(null);
  const [tempLng,        setTempLng]        = useState(null);
  const [currentUser,    setCurrentUser]    = useState(null);
  const [isGirlsOnly,    setIsGirlsOnly]    = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(null);
  const [showMaxModal,   setShowMaxModal]   = useState(false);
  const [loadingInit,    setLoadingInit]    = useState(true);
  const [creating,       setCreating]       = useState(false);
  const [sportPickerVisible,  setSportPickerVisible]  = useState(false);
  const [levelPickerVisible,  setLevelPickerVisible]  = useState(false);

  const cameFromMapRef = useRef(false);
  const insets = useSafeAreaInsets();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date();
      const safeHour = new Date(now.getTime() + 60 * 60 * 1000);
      safeHour.setSeconds(0); safeHour.setMilliseconds(0);
      if (safeHour.getHours() < 5) safeHour.setHours(5, 0, 0, 0);
      else if (safeHour.getHours() > 22) {
        const tomorrow = new Date(safeHour);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(5, 0, 0, 0);
        setSelectedDate(tomorrow); setSelectedHour(tomorrow);
      } else {
        setSelectedDate(now); setSelectedHour(safeHour);
      }
      setLoadingInit(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('gender').eq('id', user.id).single();
      setCurrentUser(data);
    })();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      const { data } = await supabase.from('groups').select('sport').eq('id', groupId).single();
      if (data?.sport) { setSelectedSport(data.sport); }
    })();
  }, [groupId]);

  useFocusEffect(useCallback(() => {
    const hasPrefill = Number.isFinite(route.params?.prefillLat) && Number.isFinite(route.params?.prefillLng);
    cameFromMapRef.current = hasPrefill;
    if (hasPrefill) {
      setLatitude(route.params.prefillLat);
      setLongitude(route.params.prefillLng);
      if (route.params?.prefillAddress) setLocation(route.params.prefillAddress);
      requestAnimationFrame(() => navigation.setParams({ prefillLat: undefined, prefillLng: undefined, prefillAddress: undefined }));
    }
  }, [route.params]));

  useFocusEffect(useCallback(() => {
    if (cameFromMapRef.current) return;
    if (!isGroupSession) setSelectedSport('');
    setShowOtherSports(false); setSelectedLevel('');
    setSelectedDate(new Date()); setSelectedHour(getClampedDefaultHour());
    setShowCalendar(false); setTimePickerVisible(false);
    setTitle(''); setComments(''); setAddressModalVisible(false);
    setTempLocation(''); setTempLat(null); setTempLng(null);
    setIsGirlsOnly(false); setMaxParticipants(null);
    setLocation(''); setLatitude(null); setLongitude(null); setSessionLink('');
  }, [route.params?.prefillLat, route.params?.prefillLng, isGroupSession]));

  // ── Création ──────────────────────────────────────────────────────────────
  const handleCreateSession = async () => {
    if (creating) return;
    setCreating(true);
    try {
      if (!selectedSport || !location || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !selectedLevel || !title) {
        Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.'); return;
      }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sessionDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      if (sessionDateOnly < today) { Alert.alert('Erreur', 'Tu ne peux pas créer de session dans le passé.'); return; }
      const now = new Date();
      if (sessionDateOnly.getTime() === today.getTime()) {
        const startLocal = combineLocalDateAndTime(sessionDateOnly, selectedHour);
        if (startLocal < now) { Alert.alert('Erreur', "Tu ne peux pas sélectionner une heure passée pour aujourd'hui."); return; }
      }
      const candidateStart = combineLocalDateAndTime(sessionDateOnly, selectedHour);
      if (!isAllowedStartTime(candidateStart)) { Alert.alert('Heure non autorisée', 'Tu peux sélectionner une heure entre 5h00 et 22h00.'); return; }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { Alert.alert('Session expirée', 'Reconnecte-toi pour créer une session.'); navigation.navigate('Login'); return; }

      const sessionData = {
        sport: selectedSport, location, lat: latitude, lng: longitude,
        level: selectedLevel, date: formatDateYYYYMMDD(selectedDate),
        time: formatTimeHHMM(selectedHour), title, description: comments,
        creator_id: user.id, girls_only: isGirlsOnly,
        max_participants: maxParticipants === null ? null : Number(maxParticipants),
        group_id: isGroupSession ? groupId : null,
        link: sessionLink.trim() || null,
      };

      const { data, error } = await supabase.from('sessions').insert([sessionData]).select().single();
      if (error) { Alert.alert('Erreur', error.message || 'Impossible de créer la session.'); return; }

      const sessionId = data.id;

    // Analytics
(async () => { try { await supabase.from('analytics_events').insert({
  user_id: user.id,
  event_name: 'session_created',
  properties: { sport: selectedSport, level: selectedLevel, is_group: isGroupSession },
  platform: Platform.OS,
}); } catch {} })();

      requestAnimationFrame(() => {
        if (isGroupSession) {
          notifyGroupSessionCreatedForMembers({ groupId, creatorId: user.id, sessionTitle: title, sessionId }).catch(() => {});
        } else {
          notifySessionCreated({ creatorId: user.id, sessionId, title }).catch(() => {});
        }
        notifyNearbyUsersOnSessionCreated({ sessionId, sport: selectedSport, lat: latitude, lng: longitude, creatorId: user.id }).catch(() => {});
      });

      navigation.navigate('MainTabs', { screen: 'Sessions', params: { section: 'upcoming', showCreatedAlert: true } });
    } catch (err) {
      console.error(err); Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setCreating(false);
    }
  };

  const confirmCreateSession = () => {
    Alert.alert('Créer la session ?', 'La session sera visible immédiatement.',
      [{ text: 'Annuler', style: 'cancel' }, { text: 'Créer', onPress: handleCreateSession }],
      { cancelable: true }
    );
  };

  const handleTimeChange = (event, date) => {
    if (Platform.OS === 'android') {
      setTimePickerVisible(false);
      if (event.type !== 'set' || !date) return;
    }
    if (!date) return;
    const combined = combineLocalDateAndTime(selectedDate, date);
    if (!isAllowedStartTime(combined)) { Alert.alert('Heure non autorisée', 'Choisissez une heure entre 5h00 et 22h00.'); return; }
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString() && combined <= now) {
      Alert.alert('Heure invalide', 'Choisissez une heure dans le futur.'); return;
    }
    setSelectedHour(date);
    if (Platform.OS === 'ios') setTimePickerVisible(false);
  };

  const formatDateLabel = (d) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
     .replace(/^\w/, c => c.toUpperCase());

  // ─────────────────────────────────────────────────────────────────────────
  if (loadingInit) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F7FA' }}>
        <ActivityIndicator size="large" color="#FE5D02" />
        <Text style={{ color: '#AAA', marginTop: 12, fontSize: 14 }}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7FA' }}>
      <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />

      {!isGroupSession && (
        <View style={{ zIndex: 999 }}>
          <MiniAppBar
            title="Créer"
            hasNotifications={notifUnseen > 0}
            onProfilePress={() => navigation.navigate('Profile')}
            onNotificationsPress={() => navigation.navigate('Notifications')}
            onLeaderboardPress={() => navigation.navigate('Leaderboard')}
          />
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >

            {/* ── Section : L'essentiel ─────────────────────────────── */}
            <Text style={styles.sectionLabel}>L'essentiel <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

              {/* Sport */}
              <TouchableOpacity style={styles.row} onPress={() => setSportPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: selectedSport ? (sportIcons[selectedSport]?.color + '18') : '#F5F5F7' }]}>
                  {selectedSport
                    ? sportIcons[selectedSport]?.icon
                    : <Ionicons name="bicycle-outline" size={18} color="#AAAAAA" />
                  }
                </View>
                <Text style={[styles.rowValue, !selectedSport && styles.rowPlaceholder]}>
                  {selectedSport || 'Sport'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

              {/* Lieu */}
              <TouchableOpacity
                style={styles.row}
                onPress={() => { setTempLocation(location || ''); setTempLat(latitude); setTempLng(longitude); setAddressModalVisible(true); }}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: location ? '#FFF3EE' : '#F5F5F7' }]}>
                  <Ionicons name="location-outline" size={18} color={location ? '#FE5D02' : '#AAAAAA'} />
                </View>
                <Text style={[styles.rowValue, !location && styles.rowPlaceholder]} numberOfLines={1}>
                  {location || 'Point de rencontre'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

              {/* Niveau */}
              <TouchableOpacity style={styles.row} onPress={() => setLevelPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: selectedLevel ? (levelMeta[selectedLevel]?.bg || '#F5F5F7') : '#F5F5F7' }]}>
                  {selectedLevel
                    ? <MaterialCommunityIcons name={levelMeta[selectedLevel]?.icon} size={18} color={levelMeta[selectedLevel]?.color} />
                    : <Ionicons name="trending-up-outline" size={18} color="#AAAAAA" />
                  }
                </View>
                <Text style={[styles.rowValue, !selectedLevel && styles.rowPlaceholder]}>
                  {selectedLevel || 'Niveau'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

            </View>

            {/* ── Section : Quand ───────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Quand <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

              {/* Date */}
              <TouchableOpacity style={styles.row} onPress={() => setShowCalendar(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#FFF5E5' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#FFA726" />
                </View>
                <Text style={styles.rowValue}>{formatDateLabel(selectedDate)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

              {/* Heure */}
              <TouchableOpacity style={styles.row} onPress={() => setTimePickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#EBF2FF' }]}>
                  <Ionicons name="time-outline" size={18} color="#3888FF" />
                </View>
                <Text style={styles.rowValue}>{formatHour(selectedHour)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

            </View>

            {/* ── Section : Informations ────────────────────────────── */}
            <Text style={styles.sectionLabel}>Informations <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

              {/* Titre */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#F3F1FF' }]}>
                  <Ionicons name="text-outline" size={18} color="#7367F0" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Titre de la session"
                  placeholderTextColor="#C8C8C8"
                  value={title}
                  onChangeText={setTitle}
                  autoCorrect autoCapitalize="sentences"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.sep} />

              {/* Description */}
              <View style={[styles.row, { alignItems: 'flex-start', paddingTop: hp('1.5%') }]}>
                <View style={[styles.rowIcon, { backgroundColor: '#F5F5F7', marginTop: 2 }]}>
                  <Ionicons name="document-text-outline" size={18} color="#AAAAAA" />
                </View>
                <TextInput
                  style={[styles.textInput, { height: hp('9%'), textAlignVertical: 'top' }]}
                  placeholder="Décrivez rapidement le déroulé de la session…"
                  placeholderTextColor="#C8C8C8"
                  value={comments}
                  onChangeText={setComments}
                  multiline
                  autoCorrect autoCapitalize="sentences"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

            </View>

            {/* ── Section : Options ─────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Options <Text style={styles.optional}>(optionnel)</Text></Text>
            <View style={styles.card}>

              {/* Max participants */}
              <TouchableOpacity style={styles.row} onPress={() => setShowMaxModal(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#EDFBF3' }]}>
                  <Ionicons name="people-outline" size={18} color="#2ECC71" />
                </View>
                <Text style={[styles.rowValue, maxParticipants === null && styles.rowPlaceholder]}>
                  {maxParticipants === null ? 'Participants max' : `${maxParticipants} participants max`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

              {/* Lien externe */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#F5F5F7' }]}>
                  <Ionicons name="link-outline" size={18} color="#AAAAAA" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Lien externe"
                  placeholderTextColor="#C8C8C8"
                  value={sessionLink}
                  onChangeText={setSessionLink}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              {/* Filles uniquement */}
              {currentUser?.gender === 'Femme' && (
                <>
                  <View style={styles.sep} />
                  <View style={[styles.row, { paddingRight: wp('4%') }]}>
                    <View style={[styles.rowIcon, { backgroundColor: '#FFF0F4' }]}>
                      <MaterialCommunityIcons name="gender-female" size={18} color="#E9436D" />
                    </View>
                    <Text style={[styles.rowValue, { flex: 1 }]}>Entre filles uniquement</Text>
                    <Switch
                      value={isGirlsOnly}
                      onValueChange={setIsGirlsOnly}
                      trackColor={{ false: '#E8E8EA', true: '#FE5D02' }}
                      thumbColor="#fff"
                      ios_backgroundColor="#E8E8EA"
                    />
                  </View>
                </>
              )}
            </View>
            <View style={{ height: 10 }} />
<View style={styles.stickyBar}>
  <TouchableOpacity style={styles.ctaBtn} onPress={confirmCreateSession} disabled={creating}>
    {creating
      ? <ActivityIndicator color="#fff" />
      : <>
          <Ionicons name="add-circle-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.ctaBtnText}>Créer la session</Text>
        </>
    }
  </TouchableOpacity>
</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Modal Sport ──────────────────────────────────────────────── */}
      <Modal transparent visible={sportPickerVisible} animationType="fade"
        onRequestClose={() => { setSportPickerVisible(false); setShowOtherSports(false); }}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1}
          onPress={() => { setSportPickerVisible(false); setShowOtherSports(false); }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { paddingHorizontal: 0, maxHeight: hp('65%') }]}>
              <Text style={[styles.boxTitle, { paddingHorizontal: wp('5%') }]}>
                {showOtherSports ? 'Autres sports' : 'Choisir un sport'}
              </Text>
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                {(!showOtherSports ? sportData : otherSports.map(l => ({ label: l }))).map((item) => {
                  const label = item.label;
                  const active = selectedSport === label;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.listItem, active && styles.listItemActive]}
                      onPress={() => {
                        if (label === '+ de sports') { setShowOtherSports(true); return; }
                        setSelectedSport(label); setSportPickerVisible(false); setShowOtherSports(false);
                      }}
                    >
                      <View style={{ marginRight: 12 }}>{item.icon || sportIcons[label]?.icon}</View>
                      <Text style={[styles.listItemText, active && styles.listItemTextActive]}>{label}</Text>
                      {active && <View style={styles.check}><AntDesign name="check" size={11} color="#fff" /></View>}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 8 }} />
              </ScrollView>
              <TouchableOpacity
                style={[styles.boxBtn, { marginHorizontal: wp('5%') }]}
                onPress={() => showOtherSports ? setShowOtherSports(false) : setSportPickerVisible(false)}
              >
                <Text style={styles.boxBtnText}>{showOtherSports ? '← Retour' : 'Fermer'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Niveau ─────────────────────────────────────────────── */}
      <Modal transparent visible={levelPickerVisible} animationType="fade" onRequestClose={() => setLevelPickerVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setLevelPickerVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.centeredBox}>
              <Text style={styles.boxTitle}>Niveau</Text>
              {levels.map((level) => {
                const meta = levelMeta[level];
                const active = selectedLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.listItem, active && styles.listItemActive]}
                    onPress={() => { setSelectedLevel(level); setLevelPickerVisible(false); }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.levelIconBox, { backgroundColor: meta.bg }]}>
                      <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <Text style={[styles.listItemText, active && styles.listItemTextActive]}>{level}</Text>
                    {active && <View style={styles.check}><AntDesign name="check" size={11} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
  style={[styles.boxBtn, { marginHorizontal: wp('5%') }]}
  onPress={() => setLevelPickerVisible(false)}
>
  <Text style={styles.boxBtnText}>Fermer</Text>
</TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Calendrier ─────────────────────────────────────────── */}
      <Modal transparent animationType="fade" visible={showCalendar} onRequestClose={() => setShowCalendar(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { paddingHorizontal: wp('3%') }]}>
              <Text style={styles.boxTitle}>Choisir une date</Text>
              <Calendar
                onDayPress={(day) => {
                  const [y, m, d] = day.dateString.split('-').map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                  setShowCalendar(false);
                }}
                markedDates={{ [formatDateYYYYMMDD(selectedDate)]: { selected: true, selectedColor: '#FE5D02' } }}
                minDate={formatDateYYYYMMDD(new Date())}
                theme={{
                  selectedDayBackgroundColor: '#FE5D02',
                  todayTextColor: '#FE5D02',
                  arrowColor: '#FE5D02',
                  textDayFontSize: 15, textMonthFontSize: 15,
                  textDayHeaderFontSize: 12,
                  textDayFontWeight: '500', textMonthFontWeight: '700',
                }}
                style={{ borderRadius: 12, width: '100%' }}
              />
              <TouchableOpacity style={styles.boxBtn} onPress={() => setShowCalendar(false)}>
                <Text style={styles.boxBtnText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Heure ──────────────────────────────────────────────── */}
      {timePickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible={timePickerVisible} animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.centeredBox}>
                  <Text style={styles.boxTitle}>Heure de la session</Text>
                  <DateTimePicker
                    value={selectedHour || new Date()}
                    mode="time" is24Hour display="spinner"
                    onChange={(e, d) => { if (d) setSelectedHour(d); }}
                    style={{ alignSelf: 'center', width: '100%' }}
                  />
                  <TouchableOpacity style={styles.boxBtn} onPress={() => setTimePickerVisible(false)}>
                    <Text style={styles.boxBtnText}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedHour || new Date()}
            mode="time" is24Hour display="spinner"
            onChange={handleTimeChange}
          />
        )
      )}

      {/* ── Modal Max Participants ────────────────────────────────────── */}
      <Modal transparent visible={showMaxModal} animationType="fade" onRequestClose={() => setShowMaxModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMaxModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { paddingHorizontal: 0, maxHeight: hp('55%') }]}>
              <Text style={[styles.boxTitle, { paddingHorizontal: wp('5%') }]}>Participants maximum</Text>
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                {[null, ...Array.from({ length: 20 }, (_, i) => i + 2)].map((num) => {
                  const active = maxParticipants === num;
                  return (
                    <TouchableOpacity
                      key={String(num)}
                      style={[styles.listItem, active && styles.listItemActive]}
                      onPress={() => { setMaxParticipants(num); setShowMaxModal(false); }}
                    >
                      <Ionicons
                        name={num === null ? 'infinite-outline' : 'people-outline'}
                        size={18} color={active ? '#FE5D02' : '#AAAAAA'}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.listItemText, active && styles.listItemTextActive]}>
                        {num === null ? 'Illimité' : `${num} participants`}
                      </Text>
                      {active && <View style={styles.check}><AntDesign name="check" size={11} color="#fff" /></View>}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 8 }} />
              </ScrollView>
              <TouchableOpacity style={[styles.boxBtn, { marginHorizontal: wp('5%') }]} onPress={() => setShowMaxModal(false)}>
                <Text style={styles.boxBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Adresse ─────────────────────────────────────────────── */}
      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.addressOverlay}>
          <SafeAreaView style={styles.addressContainer}>
            <View style={styles.addressHeader}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.addressCloseBtn}>
                <Ionicons name="close" size={18} color="#555" />
              </TouchableOpacity>
              <Text style={styles.addressTitle}>Choisir un lieu</Text>
              <TouchableOpacity
                disabled={!Number.isFinite(tempLat)}
                style={[styles.addressValidateBtn, { opacity: Number.isFinite(tempLat) ? 1 : 0.4 }]}
                onPress={() => {
                  setLocation(tempLocation.trim());
                  setLatitude(tempLat); setLongitude(tempLng);
                  setAddressModalVisible(false);
                }}
              >
                <Text style={styles.addressValidateText}>Valider</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <PlaceSearchField
                autoFocus value={tempLocation}
                onChange={(txt) => { setTempLocation(txt); setTempLat(null); setTempLng(null); }}
                onPick={({ description, lat, lng }) => { setTempLocation(description); setTempLat(lat); setTempLng(lng); }}
                placeholder="Ex : Parc Monceau, Paris"
                boxStyle={styles.addressSearchBox}
                suggestionContainerStyle={styles.addressSuggestions}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </View>
  );
};

export default CreateSessionScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
  },

  // ── Section labels ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: wp('3%'), fontWeight: '700', color: '#ABABAB',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginLeft: wp('1.5%'), marginTop: hp('2%'), marginBottom: hp('1%'),
  },
  required: { color: '#FF3B30', fontWeight: '700' },
  optional: { fontSize: wp('2.8%'), color: '#C0C0C0', fontWeight: '400', textTransform: 'none' },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sep: {
    height: 1, backgroundColor: '#F5F5F7',
    marginLeft: wp('4%') + 40 + wp('3.5%'),
  },

  // ── Rows ──────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: hp('1.6%'), paddingHorizontal: wp('4%'),
    minHeight: hp('7%'),
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: wp('3.5%'), flexShrink: 0,
  },
  rowValue: { flex: 1, fontSize: wp('4%'), fontWeight: '500', color: '#1A1A1A' },
  rowPlaceholder: { color: '#C8C8C8', fontWeight: '400' },

  // ── TextInput inline ──────────────────────────────────────────────────────
  textInput: {
    flex: 1, fontSize: wp('4%'), color: '#1A1A1A',
    padding: 0, fontWeight: '400',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
ctaBtn: {
  height: hp('5%'),
  backgroundColor: '#FE5D02',
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp('1.5%'),
  marginHorizontal: 20,
  flexDirection: 'row',
},
  ctaBtnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('4.2%') },

stickyBar: {
  paddingHorizontal: wp('4%'),
  borderRadius: 20,
  marginTop: 10,
  paddingTop: hp('1%'),
  paddingBottom: hp('2%'),
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#F0F0F2',
},

  // ── Modals ────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp('5%'),
  },
  centeredBox: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingTop: hp('2.5%'), paddingBottom: hp('2%'), paddingHorizontal: wp('5%'),
    width: wp('88%'),
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  boxTitle: { fontSize: wp('4.4%'), fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: hp('1.8%') },
  boxBtn: { height: hp('4.5%'), backgroundColor: '#FE5D02', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: hp('1.5%'), marginHorizontal: 20, },
  boxBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.9%') },

  // ── List items (sport, niveau, participants) ───────────────────────────────
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp('1.5%'), paddingHorizontal: wp('5%'), borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  listItemActive: { backgroundColor: '#FFF8F5' },
  listItemText: { flex: 1, fontSize: wp('3.9%'), fontWeight: '500', color: '#222' },
  listItemTextActive: { color: '#FE5D02', fontWeight: '700' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FE5D02', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  levelIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: wp('3.5%'), flexShrink: 0 },

  // ── Modal Adresse ─────────────────────────────────────────────────────────
  addressOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  addressContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  addressHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp('4.5%'), paddingBottom: hp('1.5%'),
    borderBottomWidth: 1, borderBottomColor: '#F0F0F2',
  },
  addressCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  addressTitle: { fontSize: wp('4.3%'), fontWeight: '700', color: '#111' },
  addressValidateBtn: { backgroundColor: '#FE5D02', paddingHorizontal: wp('4%'), paddingVertical: hp('0.9%'), borderRadius: 12 },
  addressValidateText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%') },
  addressSearchBox: { marginTop: 12, marginHorizontal: 16 },
  addressSuggestions: { flex: 1, marginTop: 8, paddingHorizontal: 16 },
});
