import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, SafeAreaView, KeyboardAvoidingView,
  Alert, StatusBar, Modal, ActivityIndicator, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import PlaceSearchField from '../components/PlaceSearchField';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  notifySessionUpdatedCreator, notifySessionUpdatedParticipants,
  notifySessionDeletedCreator, notifySessionDeletedParticipants,
} from '../helpers/notifications';

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
  return !(h < 6 || h > 21 || (h === 21 && m > 0));
}
function getClampedDefaultHour() {
  const now = new Date();
  const f = new Date(now.getTime() + 60 * 60 * 1000);
  f.setSeconds(0); f.setMilliseconds(0);
  const h = f.getHours();
  if (h < 6) { f.setHours(6, 0, 0, 0); }
  else if (h > 21) { f.setDate(f.getDate() + 1); f.setHours(6, 0, 0, 0); }
  return f;
}
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
const EditSessionScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { sessionId } = route.params || {};

  const [loading,      setLoading]      = useState(false);
  const [loadingInit,  setLoadingInit]  = useState(true);
  const [selectedSport,       setSelectedSport]       = useState('');
  const [showOtherSports,     setShowOtherSports]     = useState(false);
  const [selectedLevel,       setSelectedLevel]       = useState('');
  const [selectedDate,        setSelectedDate]        = useState(new Date());
  const [showCalendar,        setShowCalendar]        = useState(false);
  const [selectedHour,        setSelectedHour]        = useState(getClampedDefaultHour());
  const [timePickerVisible,   setTimePickerVisible]   = useState(false);
  const [title,               setTitle]               = useState('');
  const [comments,            setComments]            = useState('');
  const [location,            setLocation]            = useState('');
  const [latitude,            setLatitude]            = useState(null);
  const [longitude,           setLongitude]           = useState(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempLocation,        setTempLocation]        = useState('');
  const [tempLat,             setTempLat]             = useState(null);
  const [tempLng,             setTempLng]             = useState(null);
  const [maxParticipants,     setMaxParticipants]     = useState(null);
  const [maxPickerVisible,    setMaxPickerVisible]    = useState(false);
  const [sportPickerVisible,  setSportPickerVisible]  = useState(false);
  const [levelPickerVisible,  setLevelPickerVisible]  = useState(false);

  // ── Chargement session ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      setLoadingInit(true);
      const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      if (error || !data) {
        Alert.alert('Erreur', error?.message || "Impossible de charger la session.");
        setLoadingInit(false); return;
      }
      setSelectedSport(data.sport || '');
      setSelectedLevel(data.level || '');
      setTitle(data.title || '');
      setComments(data.description || '');
      setLocation(data.location || '');
      setLatitude(Number(data.lat));
      setLongitude(Number(data.lng));
      setMaxParticipants(data.max_participants === null ? null : Number(data.max_participants));
      const dateOnly = data.date ? new Date(data.date) : new Date();
      setSelectedDate(dateOnly);
      if (data.time) {
        const timeObj = new Date(`${data.date}T${data.time}`);
        setSelectedHour(combineLocalDateAndTime(dateOnly, timeObj));
      } else {
        setSelectedHour(getClampedDefaultHour());
      }
      setLoadingInit(false);
    };
    fetchSession();
  }, [sessionId]);

  // ── Heure ─────────────────────────────────────────────────────────────────
  const handleConfirmTime = (pickedTime) => {
    if (!(pickedTime instanceof Date) || isNaN(pickedTime)) { setTimePickerVisible(false); return; }
    const combined = new Date(selectedDate);
    combined.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
    const now = new Date();
    if (!isAllowedStartTime(combined)) { Alert.alert('Heure non autorisée', 'Choisis entre 06:00 et 21:00.'); setTimePickerVisible(false); return; }
    if (selectedDate.toDateString() === now.toDateString() && combined <= now) {
      Alert.alert('Heure invalide', 'Choisis une heure dans le futur.'); setTimePickerVisible(false); return;
    }
    setSelectedHour(combined); setTimePickerVisible(false);
  };

  // ── Modification ──────────────────────────────────────────────────────────
  const handleEditSession = async () => {
    if (!selectedSport || !location || latitude === null || longitude === null || !selectedLevel || !title) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.'); return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sessionDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    if (sessionDateOnly < today) { Alert.alert('Erreur', 'Tu ne peux pas mettre une session dans le passé.'); return; }
    const now = new Date();
    if (sessionDateOnly.getTime() === today.getTime()) {
      const startLocal = combineLocalDateAndTime(sessionDateOnly, selectedHour);
      if (startLocal < now) { Alert.alert('Erreur', "Tu ne peux pas sélectionner une heure passée pour aujourd'hui."); return; }
    }
    const candidateStart = combineLocalDateAndTime(sessionDateOnly, selectedHour);
    if (!isAllowedStartTime(candidateStart)) { Alert.alert('Heure non autorisée', 'Heure entre 6h00 et 21h00.'); return; }

    setLoading(true);
    const sessionData = {
      sport: selectedSport, location, lat: latitude, lng: longitude,
      level: selectedLevel, date: formatDateYYYYMMDD(selectedDate),
      time: formatTimeHHMM(selectedHour), title, description: comments,
      max_participants: maxParticipants === null ? null : Number(maxParticipants),
    };

    const { error } = await supabase.from('sessions').update(sessionData).eq('id', sessionId);
    if (error) { setLoading(false); Alert.alert('Erreur', error.message || 'Impossible de modifier.'); return; }

    const { data: participantsData } = await supabase.from('session_participants').select('user_id').eq('session_id', sessionId);
    const { data: sessionInfo } = await supabase.from('sessions').select('creator_id, title').eq('id', sessionId).single();
    const participantIds = (participantsData || []).map(p => p.user_id).filter(uid => uid !== sessionInfo?.creator_id);

    await notifySessionUpdatedCreator({ creatorId: sessionInfo?.creator_id, sessionTitle: title, sessionId });
    await notifySessionUpdatedParticipants({ participantIds, sessionTitle: title, sessionId });

    setLoading(false);
    Alert.alert('Session modifiée !', 'Les participants ont été notifiés.', [
      { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Sessions', params: { tab: 'created' } }) },
    ]);
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleCancelSession = async () => {
    Alert.alert(
      'Supprimer la session',
      'Cette action est irréversible. Tous les participants seront notifiés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { data: participantsData } = await supabase.from('session_participants').select('user_id').eq('session_id', sessionId);
            const { data: sessionInfo } = await supabase.from('sessions').select('creator_id, title').eq('id', sessionId).single();
            const participantIds = (participantsData || []).map(p => p.user_id).filter(uid => uid !== sessionInfo?.creator_id);

            await supabase.from('session_participants').delete().eq('session_id', sessionId);
            await supabase.from('messages').delete().eq('session_id', sessionId);
            await supabase.from('notifications').delete().eq('session_id', sessionId);

            const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
            if (error) { setLoading(false); Alert.alert('Erreur', error.message); return; }

            await notifySessionDeletedCreator({ creatorId: sessionInfo?.creator_id, sessionTitle: sessionInfo?.title || 'Session', sessionId });
            await notifySessionDeletedParticipants({ participantIds, sessionTitle: sessionInfo?.title || 'Session', sessionId });

            setLoading(false);
            Alert.alert('Session supprimée', 'Tous les participants ont été notifiés.', [
              { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
            ]);
          },
        },
      ]
    );
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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

            {/* ── L'essentiel ─────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>L'essentiel <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

              <TouchableOpacity style={styles.row} onPress={() => setSportPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: selectedSport ? (sportIcons[selectedSport]?.color + '18') : '#F5F5F7' }]}>
                  {selectedSport ? sportIcons[selectedSport]?.icon : <Ionicons name="bicycle-outline" size={18} color="#AAAAAA" />}
                </View>
                <Text style={[styles.rowValue, !selectedSport && styles.rowPlaceholder]}>{selectedSport || 'Sport'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

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

              <TouchableOpacity style={styles.row} onPress={() => setLevelPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: selectedLevel ? (levelMeta[selectedLevel]?.bg || '#F5F5F7') : '#F5F5F7' }]}>
                  {selectedLevel
                    ? <MaterialCommunityIcons name={levelMeta[selectedLevel]?.icon} size={18} color={levelMeta[selectedLevel]?.color} />
                    : <Ionicons name="trending-up-outline" size={18} color="#AAAAAA" />
                  }
                </View>
                <Text style={[styles.rowValue, !selectedLevel && styles.rowPlaceholder]}>{selectedLevel || 'Niveau'}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

            </View>

            {/* ── Quand ───────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Quand <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

              <TouchableOpacity style={styles.row} onPress={() => setShowCalendar(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#FFF5E5' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#FFA726" />
                </View>
                <Text style={styles.rowValue}>
                  {capitalizeFirst(selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

              <View style={styles.sep} />

              <TouchableOpacity style={styles.row} onPress={() => setTimePickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#EBF2FF' }]}>
                  <Ionicons name="time-outline" size={18} color="#3888FF" />
                </View>
                <Text style={styles.rowValue}>{formatHour(selectedHour)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

            </View>

            {/* ── Informations ────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Informations <Text style={styles.required}>*</Text></Text>
            <View style={styles.card}>

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

              <View style={[styles.row, { alignItems: 'flex-start', paddingTop: hp('1.5%') }]}>
                <View style={[styles.rowIcon, { backgroundColor: '#F5F5F7', marginTop: 2 }]}>
                  <Ionicons name="document-text-outline" size={18} color="#AAAAAA" />
                </View>
                <TextInput
                  style={[styles.textInput, { height: hp('9%'), textAlignVertical: 'top' }]}
                  placeholder="Décrivez rapidement le déroulé…"
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

            {/* ── Options ─────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Options <Text style={styles.optional}>(optionnel)</Text></Text>
            <View style={styles.card}>

              <TouchableOpacity style={styles.row} onPress={() => setMaxPickerVisible(true)} activeOpacity={0.7}>
                <View style={[styles.rowIcon, { backgroundColor: '#EDFBF3' }]}>
                  <Ionicons name="people-outline" size={18} color="#2ECC71" />
                </View>
                <Text style={[styles.rowValue, maxParticipants === null && styles.rowPlaceholder]}>
                  {maxParticipants === null ? 'Participants max' : `${maxParticipants} participants max`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
              </TouchableOpacity>

            </View>

            {/* ── Danger zone ─────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Zone de danger</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={handleCancelSession}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#FFF0F0' }]}>
                  <Ionicons name="trash-outline" size={18} color="#EB1E1E" />
                </View>
                <Text style={[styles.rowValue, { color: '#EB1E1E' }]}>Supprimer la session</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFAAAA" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 12 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Barre CTA sticky ─────────────────────────────────────────── */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleEditSession}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaBtnText}>Enregistrer les modifications</Text>
          }
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity style={[styles.boxBtn, { marginHorizontal: wp('5%') }]} onPress={() => setLevelPickerVisible(false)}>
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
                  textDayFontSize: 15, textMonthFontSize: 15, textDayHeaderFontSize: 12,
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
          <Modal transparent visible animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.centeredBox}>
                  <Text style={styles.boxTitle}>Heure de la session</Text>
                  <DateTimePicker
                    value={selectedHour || new Date()} mode="time" is24Hour display="spinner"
                    onChange={(e, d) => { if (d) setSelectedHour(d); }}
                    style={{ alignSelf: 'center', width: '100%' }}
                  />
                  <TouchableOpacity style={styles.boxBtn} onPress={() => handleConfirmTime(selectedHour)}>
                    <Text style={styles.boxBtnText}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedHour || new Date()} mode="time" is24Hour display="spinner"
            onChange={(event, date) => {
              if (event.type === 'set' && date) handleConfirmTime(date);
              else setTimePickerVisible(false);
            }}
          />
        )
      )}

      {/* ── Modal Max Participants ────────────────────────────────────── */}
      <Modal transparent visible={maxPickerVisible} animationType="fade" onRequestClose={() => setMaxPickerVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMaxPickerVisible(false)}>
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
                      onPress={() => { setMaxParticipants(num); setMaxPickerVisible(false); }}
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
              <TouchableOpacity style={[styles.boxBtn, { marginHorizontal: wp('5%') }]} onPress={() => setMaxPickerVisible(false)}>
                <Text style={styles.boxBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Adresse ─────────────────────────────────────────────── */}
      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={() => setAddressModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.addressHeader}>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.addressCloseBtn}>
                <Ionicons name="close" size={18} color="#555" />
              </TouchableOpacity>
              <Text style={styles.addressTitle}>Choisir un lieu</Text>
              <TouchableOpacity
                disabled={!Number.isFinite(tempLat)}
                style={[styles.addressValidateBtn, { opacity: Number.isFinite(tempLat) ? 1 : 0.4 }]}
                onPress={() => { setLocation(tempLocation.trim()); setLatitude(tempLat); setLongitude(tempLng); setAddressModalVisible(false); }}
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
                boxStyle={{ marginTop: 12, marginHorizontal: 16 }}
                suggestionContainerStyle={{ flex: 1, marginTop: 8, paddingHorizontal: 16 }}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </View>
  );
};

export default EditSessionScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('1%'),
  },

  sectionLabel: {
    fontSize: wp('3%'), fontWeight: '700', color: '#ABABAB',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginLeft: wp('1.5%'), marginTop: hp('2%'), marginBottom: hp('1%'),
  },
  required: { color: '#FF3B30', fontWeight: '700' },
  optional: { fontSize: wp('2.8%'), color: '#C0C0C0', fontWeight: '400', textTransform: 'none' },

  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sep: {
    height: 1, backgroundColor: '#F5F5F7',
    marginLeft: wp('4%') + 40 + wp('3.5%'),
  },

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

  textInput: {
    flex: 1, fontSize: wp('4%'), color: '#1A1A1A',
    padding: 0, fontWeight: '400',
  },

  // ── Sticky bar ────────────────────────────────────────────────────────────
ctaBtn: {
  height: hp('5%'),
  backgroundColor: '#FE5D02',
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp('2%'),
  marginBottom: hp('2.5%'),
  marginHorizontal: 20,
},
  ctaBtnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('4.2%') },

stickyBar: {
  paddingHorizontal: wp('4.5%'),
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
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp('1.5%'), paddingHorizontal: wp('5%'), borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  listItemActive: { backgroundColor: '#FFF8F5' },
  listItemText: { flex: 1, fontSize: wp('3.9%'), fontWeight: '500', color: '#222' },
  listItemTextActive: { color: '#FE5D02', fontWeight: '700' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FE5D02', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  levelIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: wp('3.5%'), flexShrink: 0 },

  // ── Modal adresse ─────────────────────────────────────────────────────────
  addressHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp('4.5%'), paddingVertical: hp('1.5%'),
    borderBottomWidth: 1, borderBottomColor: '#F0F0F2',
  },
  addressCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  addressTitle: { fontSize: wp('4.3%'), fontWeight: '700', color: '#111' },
  addressValidateBtn: { backgroundColor: '#FE5D02', paddingHorizontal: wp('4%'), paddingVertical: hp('0.9%'), borderRadius: 12 },
  addressValidateText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%') },
});
