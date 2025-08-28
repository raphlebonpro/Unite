import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import PlaceSearchField from '../components/PlaceSearchField';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const FONT = Platform.select({ ios: 'System', android: 'Roboto' });

/* ---------- Données sport (identiques à Création) ---------- */
const sportData = [
  { label: 'Football', icon: <FontAwesome5 name="futbol" size={17} color="#3888FF" /> },
  { label: 'Basketball', icon: <MaterialCommunityIcons name="basketball" size={17} color="#FFA726" /> },
  { label: 'Tennis', icon: <MaterialCommunityIcons name="tennis" size={17} color="#2ECC71" /> },
  { label: 'Running', icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  { label: 'Cyclisme', icon: <MaterialCommunityIcons name="bike" size={17} color="#3CD6E6" /> },
  { label: 'Natation', icon: <MaterialCommunityIcons name="swim" size={17} color="#1469B9" /> },
  { label: 'Musculation', icon: <MaterialCommunityIcons name="dumbbell" size={20} color="#7367F0" /> },
  { label: 'Autres', icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" /> },
  { label: '+ de sports', icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" /> },
];

const otherSports = [
  'Yoga','Padel','Handball','Tennis de table','Volleyball','Badminton','Ski','Snow','Skate','Surf','Escalade',
  'Parapente','CrossFit','Callisthénie','Golf','Arts Martiaux','Boxe','Football américain','Baseball','Danse',
  'Pilate','Échecs','Pétanque','Randonnée/Trail','VTT'
];

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: '#3888FF' },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: '#FFA726' },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: '#2ECC71' },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: '#3CD6E6' },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: '#1469B9' },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: '#7367F0' },
  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={20} color="#A259F7" />, color: '#A259F7' },
  Padel: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />, color: '#FFD600' },
  Handball: { icon: <MaterialCommunityIcons name="handball" size={18} color="#F57C00" />, color: '#F57C00' },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />, color: '#999' },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },
  Volleyball: { icon: <MaterialCommunityIcons name="volleyball" size={18} color="#E57373" />, color: '#E57373' },
  Badminton: { icon: <MaterialCommunityIcons name="badminton" size={18} color="#49beb7" />, color: '#49beb7' },
  Ski: { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: '#32C5FF' },
  Snow: { icon: <MaterialCommunityIcons name="snowboard" size={18} color="#5f95de" />, color: '#5f95de' },
  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Surf: { icon: <MaterialCommunityIcons name="wave" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Escalade: { icon: <MaterialCommunityIcons name="hiking" size={18} color="#689F38" />, color: '#689F38' },
  Parapente: { icon: <MaterialCommunityIcons name="parachute" size={18} color="#1976D2" />, color: '#1976D2' },
  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },
  Golf: { icon: <MaterialCommunityIcons name="golf" size={18} color="#43A047" />, color: '#43A047' },
  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },
  Boxe: { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#C62828" />, color: '#C62828' },
  'Football américain': { icon: <MaterialCommunityIcons name="football" size={18} color="#FF7043" />, color: '#FF7043' },
  Baseball: { icon: <MaterialCommunityIcons name="baseball" size={18} color="#FFD600" />, color: '#FFD600' },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Pilate: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },
  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },
  Pétanque: { icon: <MaterialCommunityIcons name="bowling" size={18} color="#757575" />, color: '#757575' },
  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
  VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
  '+ de sports': { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

const levels = ["Pour s'amuser", 'Débutant', 'Intermédiaire', 'Avancé'];
const participants = Array.from({ length: 14 }, (_, i) => i + 2);

/* ---------- Helpers date/heure (identiques à Création) ---------- */
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function formatDateYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatTimeHHMM(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function combineLocalDateAndTime(dateOnly, timeOnly) {
  const combined = new Date(dateOnly);
  combined.setHours(timeOnly.getHours(), timeOnly.getMinutes(), 0, 0);
  return combined;
}
function isAllowedStartTime(localDate) {
  const h = localDate.getHours();
  const m = localDate.getMinutes();
  if (h < 6) return false;
  if (h > 21) return false;
  if (h === 21 && m > 0) return false;
  return true;
}
const getClampedDefaultHour = () => {
  const now = new Date();
  const futureHour = new Date(now.getTime() + 60 * 60 * 1000);
  futureHour.setSeconds(0);
  futureHour.setMilliseconds(0);
  const hour = futureHour.getHours();
  if (hour < 6) {
    futureHour.setHours(6, 0, 0, 0);
  } else if (hour > 21) {
    const tomorrow = new Date(futureHour);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    return tomorrow;
  }
  return futureHour;
};

const EditSessionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params || {};

  // États UI
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  // Champs
  const [selectedSport, setSelectedSport] = useState('');
  const [showOtherSports, setShowOtherSports] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(null); // affichage
  const [selectedParticipants, setSelectedParticipants] = useState(''); // compat Supabase (string)

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedHour, setSelectedHour] = useState(getClampedDefaultHour());
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');

  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Modals
  const [sportPickerVisible, setSportPickerVisible] = useState(false);
  const [levelPickerVisible, setLevelPickerVisible] = useState(false);
  const [participantsPickerVisible, setParticipantsPickerVisible] = useState(false);

  // Charger la session
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      setLoadingInit(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        Alert.alert('Erreur', error?.message || "Impossible de charger la session.");
        setLoadingInit(false);
        return;
      }

      setSelectedSport(data.sport || '');
      setSelectedLevel(data.level || '');
      setSelectedParticipants(String(data.participants_max || ''));
      setMaxParticipants(data.participants_max || null);

      setTitle(data.title || '');
      setComments(data.description || '');
      setLocation(data.location || '');
      setLatitude(Number(data.lat));
      setLongitude(Number(data.lng));

      // Dates/heures locales et sûres
      const dateOnly = data.date ? new Date(data.date) : new Date();
      const timeObj = data.time ? new Date(`${data.date}T${data.time}`) : getClampedDefaultHour();
      // combine proprement
      setSelectedDate(dateOnly);
      if (data.time) {
        const combined = combineLocalDateAndTime(dateOnly, timeObj);
        setSelectedHour(combined);
      } else {
        setSelectedHour(getClampedDefaultHour());
      }

      setLoadingInit(false);
    };
    fetchSession();
  }, [sessionId]);

  const capitalizeFirst = (str) => (!str ? '' : str.charAt(0).toUpperCase() + str.slice(1));

  /* ----- TimePicker handlers (style Création) ----- */
  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);

  const handleConfirmTime = (pickedTime) => {
    if (!(pickedTime instanceof Date) || isNaN(pickedTime)) {
      hideTimePicker();
      return;
    }
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    if (!isAllowedStartTime(combinedDateTime)) {
      Alert.alert('Heure non autorisée', 'Choisis entre 06:00 et 21:00.');
      hideTimePicker();
      return;
    }
    if (isToday && combinedDateTime <= now) {
      Alert.alert('Heure invalide', 'Choisis une heure dans le futur.');
      hideTimePicker();
      return;
    }

    setSelectedHour(combinedDateTime);
    hideTimePicker();
  };

  /* ----- Edit session ----- */
  const handleEditSession = async () => {
    if (
      !selectedSport || !location || latitude === null || longitude === null ||
      !selectedLevel || !selectedParticipants || !title
    ) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.');
      return;
    }

    // validations date/heure (comme Création)
    const today = new Date(); today.setHours(0,0,0,0);
    const sessionDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    if (sessionDateOnly < today) {
      Alert.alert('Erreur', 'Tu ne peux pas mettre une session dans le passé.');
      return;
    }
    const now = new Date();
    if (sessionDateOnly.getTime() === today.getTime()) {
      const startLocal = combineLocalDateAndTime(sessionDateOnly, selectedHour);
      if (startLocal < now) {
        Alert.alert('Erreur',"Tu ne peux pas sélectionner une heure passée pour aujourd'hui.");
        return;
      }
    }
    const candidateStart = combineLocalDateAndTime(sessionDateOnly, selectedHour);
    if (!isAllowedStartTime(candidateStart)) {
      Alert.alert('Heure non autorisée', 'Heure uniquement entre 6h00 et 21h00.');
      return;
    }

    setLoading(true);

    const sessionData = {
      sport: selectedSport,
      location,
      lat: latitude,
      lng: longitude,
      level: selectedLevel,
      participants_max: parseInt(String(selectedParticipants), 10),
      date: formatDateYYYYMMDD(selectedDate),
      time: formatTimeHHMM(selectedHour),
      title,
      description: comments,
    };

    const { error } = await supabase.from('sessions').update(sessionData).eq('id', sessionId);
    if (error) {
      setLoading(false);
      Alert.alert('Erreur', error.message || 'Impossible de modifier la session.');
      return;
    }

    // Notifier les participants (hors organisateur)
    const { data: participantsData } = await supabase
      .from('sessions_participant') // ⚠️ adapte si ta table est `session_participants`
      .select('user_id')
      .eq('session_id', sessionId);

    const { data: sessionInfo } = await supabase
      .from('sessions')
      .select('creator_id, title')
      .eq('id', sessionId)
      .single();

    const notifTitle = 'Session modifiée';
    const notifBody = `La session "${title}" a été modifiée.`;

    const notificationRows = (participantsData || [])
      .filter(({ user_id }) => user_id !== sessionInfo?.creator_id)
      .map(({ user_id }) => ({
        user_id,
        title: notifTitle,
        body: notifBody,
        type: 'session_updated',
        session_id: sessionId,
        is_read: false,
        created_at: new Date().toISOString(),
      }));

    if (notificationRows.length > 0) {
      await supabase.from('notifications').insert(notificationRows);
    }

    setLoading(false);
    Alert.alert('Session modifiée !', 'Les participants ont été notifiés.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleCancelSession = async () => {
    Alert.alert(
      'Annuler la session',
      'Es-tu sûr de vouloir supprimer définitivement cette session ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            // notif avant suppression
            const { data: participantsData } = await supabase
              .from('sessions_participant') // ⚠️ adapte si besoin
              .select('user_id')
              .eq('session_id', sessionId);

            const { data: sessionInfo } = await supabase
              .from('sessions')
              .select('creator_id, title')
              .eq('id', sessionId)
              .single();

            const notifTitle = 'Session annulée';
            const notifBody = `La session "${sessionInfo?.title || title}" a été annulée.`;

            const rows = (participantsData || [])
              .filter(({ user_id }) => user_id !== sessionInfo?.creator_id)
              .map(({ user_id }) => ({
                user_id,
                title: notifTitle,
                body: notifBody,
                type: 'session_cancelled',
                session_id: sessionId,
                is_read: false,
                created_at: new Date().toISOString(),
              }));

            if (rows.length > 0) await supabase.from('notifications').insert(rows);

            // purge
            await supabase.from('sessions_participant').delete().eq('session_id', sessionId);
            await supabase.from('messages').delete().eq('session_id', sessionId);
            await supabase.from('notifications').delete().eq('session_id', sessionId);

            const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
            setLoading(false);

            if (error) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer la session.');
              return;
            }
            Alert.alert('Session supprimée', 'Tous les participants ont été notifiés.', [
              { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
            ]);
          }
        }
      ]
    );
  };

  if (loadingInit) {
    return (
      <SafeAreaView style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' }}>
        <ActivityIndicator size="large" color="#5B4EFF" />
        <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

            {/* Sport (style Création avec modal) */}
            <TouchableOpacity style={[styles.input, { marginTop: 10 }]} onPress={() => setSportPickerVisible(true)}>
              {selectedSport ? (
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <View style={{ marginRight: 10 }}>{sportIcons[selectedSport]?.icon || null}</View>
                  <Text style={styles.inputText}>{selectedSport}</Text>
                </View>
              ) : (
                <Text style={styles.dropdownText}>Sport...</Text>
              )}
            </TouchableOpacity>

            {/* Modal Sport */}
            <Modal
              transparent
              visible={sportPickerVisible}
              animationType="fade"
              onRequestClose={() => setSportPickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
                  <Text style={styles.modalTitle}>
                    {showOtherSports ? "Autres sports" : "Choisir un sport"}
                  </Text>

                  <ScrollView style={{ width:'100%' }}>
                    {!showOtherSports ? (
                      sportData.map((item) => (
                        <TouchableOpacity
                          key={item.label}
                          style={styles.dropdownItemCentered}
                          onPress={() => {
                            if (item.label === '+ de sports') {
                              setShowOtherSports(true);
                            } else {
                              setSelectedSport(item.label);
                              setSportPickerVisible(false);
                            }
                          }}
                        >
                          <View style={{ flexDirection:'row', alignItems:'center' }}>
                            <View style={{ marginRight:10 }}>{item.icon}</View>
                            <Text style={styles.dropdownItemTextCentered}>{item.label}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      otherSports.map((label) => (
                        <TouchableOpacity
                          key={label}
                          style={styles.dropdownItemCentered}
                          onPress={() => {
                            setSelectedSport(label);
                            setShowOtherSports(false);
                            setSportPickerVisible(false);
                          }}
                        >
                          <View style={{ flexDirection:'row', alignItems:'center' }}>
                            <View style={{ marginRight:10 }}>{sportIcons[label]?.icon}</View>
                            <Text style={styles.dropdownItemTextCentered}>{label}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>

                  {showOtherSports ? (
                    <TouchableOpacity style={styles.validateButton} onPress={() => setShowOtherSports(false)}>
                      <Text style={styles.validateText}>Retour</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.validateButton} onPress={() => setSportPickerVisible(false)}>
                      <Text style={styles.validateText}>Fermer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Modal>

            {/* Localisation (identique) */}
            <View style={{ marginTop: 5 }}>
              <PlaceSearchField
                value={location}
                onChange={(txt) => setLocation(txt)}
                onPick={({ description, lat, lng }) => {
                  setLocation(description);
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                placeholder="Ex : Parc Monceau, Paris"
                boxStyle={styles.input}
              />
              {location && (latitude === null || longitude === null) && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  Sélectionne une suggestion pour valider l'emplacement.
                </Text>
              )}
            </View>

            {/* Date (calendrier style Création) */}
            <TouchableOpacity style={styles.input} onPress={() => setShowCalendar(true)}>
              <Text style={styles.inputText}>
                {capitalizeFirst(
                  selectedDate.toLocaleDateString('fr-FR', {
                    weekday:'long', year:'numeric', month:'long', day:'numeric',
                  })
                )}
              </Text>
            </TouchableOpacity>

            {showCalendar && (
              <View style={{ marginTop:5, marginBottom:15, borderRadius:16, overflow:'hidden', alignSelf:'center' }}>
                <Calendar
                  onDayPress={(day) => {
                    const [y,m,d] = day.dateString.split('-').map(Number);
                    setSelectedDate(new Date(y, m - 1, d));
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [formatDateYYYYMMDD(selectedDate)]: { selected:true, selectedColor:'#5B4EFF' },
                  }}
                  minDate={formatDateYYYYMMDD(new Date())}
                  theme={{ selectedDayBackgroundColor:'#5B4EFF', todayTextColor:'#5B4EFF', arrowColor:'#5B4EFF' }}
                  style={{ borderRadius:15, width:340, elevation:4, backgroundColor:'#fff' }}
                />
              </View>
            )}

            {/* Heure (modal + spinner, style Création) */}
            <TouchableOpacity style={styles.input} onPress={showTimePicker}>
              <Text style={selectedHour ? styles.inputText : styles.placeholder}>
                {selectedHour
                  ? `${selectedHour.getHours().toString().padStart(2,'0')}:${selectedHour.getMinutes().toString().padStart(2,'0')}`
                  : "Heure de la session..."}
              </Text>
            </TouchableOpacity>

            <Modal
              transparent
              visible={timePickerVisible}
              animationType="fade"
              onRequestClose={() => setTimePickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Heure de la session</Text>
                  <DateTimePicker
                    value={selectedHour || new Date()}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setSelectedHour(date);
                    }}
                  />
                  <TouchableOpacity style={styles.validateButton} onPress={() => handleConfirmTime(selectedHour)}>
                    <Text style={styles.validateText}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Niveau (modal) */}
            <TouchableOpacity style={styles.input} onPress={() => setLevelPickerVisible(true)}>
              <Text style={selectedLevel ? styles.inputText : styles.dropdownText}>
                {selectedLevel || "Niveau..."}
              </Text>
            </TouchableOpacity>

            <Modal
              transparent
              visible={levelPickerVisible}
              animationType="fade"
              onRequestClose={() => setLevelPickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Choisir un niveau</Text>
                  <ScrollView style={{ maxHeight: 250, width:'100%' }}>
                    {levels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={styles.dropdownItemCentered}
                        onPress={() => {
                          setSelectedLevel(level);
                          setLevelPickerVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemTextCentered}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.validateButton} onPress={() => setLevelPickerVisible(false)}>
                    <Text style={styles.validateText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Participants (modal) */}
            <TouchableOpacity style={styles.input} onPress={() => setParticipantsPickerVisible(true)}>
              <Text style={maxParticipants ? styles.inputText : styles.dropdownText}>
                {maxParticipants ? `${maxParticipants} participants` : "Participants max..."}
              </Text>
            </TouchableOpacity>

            <Modal
              transparent
              visible={participantsPickerVisible}
              animationType="fade"
              onRequestClose={() => setParticipantsPickerVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Participants maximum</Text>
                  <ScrollView style={{ maxHeight: 250, width:'100%' }}>
                    {participants.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={styles.dropdownItemCentered}
                        onPress={() => {
                          setMaxParticipants(p);
                          setSelectedParticipants(String(p));
                          setParticipantsPickerVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemTextCentered}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.validateButton} onPress={() => setParticipantsPickerVisible(false)}>
                    <Text style={styles.validateText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Titre */}
            <TextInput
              style={[styles.input, styles.inputText]}
              placeholder="Titre de la session..."
              placeholderTextColor="#bababa"
              value={title}
              onChangeText={setTitle}
              autoCorrect
              autoCapitalize="sentences"
              spellCheck
              autoComplete="off"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />

            {/* Description */}
            <TextInput
              style={[styles.input, styles.inputText, { height: 110, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Décrivez rapidement le déroulé de la session..."
              placeholderTextColor="#bababa"
              value={comments}
              onChangeText={setComments}
              multiline
              autoCorrect
              autoCapitalize="sentences"
              spellCheck
              autoComplete="off"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />

            {/* CTA Modifier */}
            <TouchableOpacity
              style={{ borderRadius: 16, overflow: 'hidden', marginTop: 12, marginBottom: 12 }}
              onPress={handleEditSession}
              disabled={loading}
            >
              <LinearGradient
                colors={['#6dd5ed', '#2193b0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{loading ? '...' : 'Modifier la session'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* CTA Annuler la session */}
            <TouchableOpacity
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 40,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ff5e62'
              }}
              onPress={handleCancelSession}
              disabled={loading}
              activeOpacity={0.86}
            >
              <LinearGradient
                colors={['#ff5e62', '#ff9966']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, { opacity: 0.93 }]}
              >
                <Text style={[styles.buttonText, { color: '#fff', fontWeight: 'bold' }]}>
                  {loading ? '...' : 'Annuler la session'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------- Styles alignés avec Création ---------- */
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    minHeight: hp('100%'),
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E7E7ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inputText: {
    fontSize: 15,
    color: '#333',
    fontFamily: FONT,
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    fontFamily: FONT,
  },
  buttonGradient: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT,
  },
  placeholder: {
    fontSize: 15,
    color: '#bababa',
    fontFamily: FONT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
    fontFamily: FONT,
  },
  validateButton: {
    marginTop: 10,
    backgroundColor: '#3A6BFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  validateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT,
  },
  dropdownItemCentered: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    width: '100%',
  },
  dropdownItemTextCentered: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    fontFamily: FONT,
  },
});

export default EditSessionScreen;
