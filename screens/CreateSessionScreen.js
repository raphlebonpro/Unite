import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import MiniAppBar from '../components/MiniAppBar';
import { notifyUser } from '../helpers/notifications';
import { useNotificationRefresh } from '../context/NotificationContext';
import { Calendar } from 'react-native-calendars';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Modal } from 'react-native';
import { ActivityIndicator } from 'react-native';

// ✅ Import corrigé - suppression de moment
import DateTimePicker from "@react-native-community/datetimepicker";

// Autocomplete identique à Home
import PlaceSearchField from '../components/PlaceSearchField';

const FONT = Platform.select({ ios: 'System', android: 'Roboto' });

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
  'Yoga',
  'Padel',
  'Handball',
  'Tennis de table',
  'Volleyball',
  'Badminton',
  'Ski',
  'Snow',
  'Skate',
  'Surf',
  'Escalade',
  'Parapente',
  'CrossFit',
  'Callisthénie',
  'Golf',
  'Arts Martiaux',
  'Boxe',
  'Football américain',
  'Baseball',
  'Danse',
  'Pilate',
  'Échecs',
  'Pétanque',
  'Randonnée/Trail',
  'VTT',
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

/** ---------- Date helpers (local-safe) ---------- */

function clampDate(date, min, max) {
  return new Date(Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()));
}

function buildLimits(date = new Date()) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const minTime = isToday
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0)
    : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0);

  const maxTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 21, 0, 0);
  return { isToday, minTime, maxTime };
}

// ✅ Fonction getClampedDefaultHour corrigée
const getClampedDefaultHour = () => {
  const now = new Date();
  const futureHour = new Date(now.getTime() + 60 * 60 * 1000); // +1 heure
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

const CreateSessionScreen = () => {
  const navigation = useNavigation();
  const { notifUnseen } = useNotificationRefresh();

  const [selectedSport, setSelectedSport] = useState('');
  const [showOtherSports, setShowOtherSports] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState('');

  // ✅ Date/heure corrigées
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const now = new Date();
    const futureHour = new Date(now.getTime() + 60 * 60 * 1000); // +1 heure
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
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Dropdowns
  const [showDropdown, setShowDropdown] = useState({ sport: false, level: false, participants: false });

  // Form
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');

  // Lieu
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Filles uniquement
  const [currentUser, setCurrentUser] = useState(null);
  const [isGirlsOnly, setIsGirlsOnly] = useState(false);
  
  //Loader
  const [loadingInit, setLoadingInit] = useState(true);

  // ✅ useEffect corrigé
  useEffect(() => {
    const initSafeDate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const now = new Date();
      const safeHour = new Date(now.getTime() + 60 * 60 * 1000); // +1h
      safeHour.setSeconds(0);
      safeHour.setMilliseconds(0);
      
      // Vérifier la plage horaire
      if (safeHour.getHours() < 6) {
        safeHour.setHours(6, 0, 0, 0);
      } else if (safeHour.getHours() > 21) {
        const tomorrow = new Date(safeHour);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        setSelectedDate(tomorrow);
        setSelectedHour(tomorrow);
      } else {
        setSelectedDate(now);
        setSelectedHour(safeHour);
      }
      
      setLoadingInit(false);
    };
    initSafeDate();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('gender')
        .eq('id', user.id)
        .single();
      setCurrentUser(data);
    };
    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset du formulaire à l'ouverture (local dates, pas d'ISO)
      setSelectedSport('');
      setShowOtherSports(false);
      setSelectedLevel('');
      setSelectedParticipants('');
      setSelectedDate(new Date());
      setSelectedHour(getClampedDefaultHour());
      setShowCalendar(false);
      hideTimePicker();
      setShowDropdown({ sport: false, level: false, participants: false });
      setTitle('');
      setComments('');
      setLocation('');
      setLatitude(null);
      setLongitude(null);
      setIsGirlsOnly(false);
    }, [])
  );

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const closeAllDropdowns = () => setShowDropdown({ sport: false, level: false, participants: false });
  const toggleDropdown = (key) => setShowDropdown((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCreateSession = async () => {
    if (
      !selectedSport ||
      !location ||
      latitude === null ||
      longitude === null ||
      !selectedLevel ||
      !selectedParticipants ||
      !title
    ) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.');
      return;
    }

    // Date non passée
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    if (sessionDateOnly < today) {
      Alert.alert('Erreur', 'Tu ne peux pas créer de session dans le passé.');
      return;
    }

    // Heure pas dans le passé si c'est aujourd'hui (compare date+heure combinées)
    const now = new Date();
    if (sessionDateOnly.getTime() === today.getTime()) {
      const startLocal = combineLocalDateAndTime(sessionDateOnly, selectedHour);
      if (startLocal < now) {
        Alert.alert('Erreur', "Tu ne peux pas sélectionner une heure passée pour aujourd'hui.");
        return;
      }
    }

    // Validation plage autorisée 06:00–21:00
    const candidateStart = combineLocalDateAndTime(sessionDateOnly, selectedHour);
    if (!isAllowedStartTime(candidateStart)) {
      Alert.alert('Heure non autorisée', 'Tu peux sélectionner une heure uniquement entre 6h00 et 21h00.');
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      Alert.alert('Session expirée', 'Reconnecte-toi pour créer une session.');
      navigation.navigate('Login');
      return;
    }

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
      creator_id: user.id,
      girls_only: isGirlsOnly,
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la session. Réessaie plus tard.');
      return;
    }

    const sessionId = data.id;

    const { error: partError } = await supabase
      .from('session_participants')
      .insert([{ session_id: sessionId, user_id: user.id }]);

    if (partError) {
      Alert.alert(
        'Erreur',
        "La session est créée mais tu n'es pas dans les participants : " + partError.message
      );
    }

    try {
      await notifyUser({
        user_id: user.id,
        title: 'Session créée',
        message: `Ta session ${title} a bien été créée !`,
        type: 'session_created',
        session_id: sessionId,
      });
    } catch (e) {
      console.warn('notifyUser a échoué (non bloquant) :', e?.message || e);
    }

    Alert.alert('Session créée !', 'Ta session a bien été enregistrée.', [
      {
        text: 'OK',
        onPress: () =>
          navigation.navigate('MainTabs', {
            screen: 'Activités',
            params: { tab: 'created' },
          }),
      },
    ]);
  };

const [sportPickerVisible, setSportPickerVisible] = useState(false);

const [levelPickerVisible, setLevelPickerVisible] = useState(false);

const [participantsPickerVisible, setParticipantsPickerVisible] = useState(false);
const [maxParticipants, setMaxParticipants] = useState(null);

  // ✅ Fonctions TimePicker corrigées
const showTimePicker = () => setTimePickerVisible(true);
const hideTimePicker = () => setTimePickerVisible(false);

  const handleConfirm = (pickedTime) => {
    console.log("🔍 Time picked:", pickedTime);
    
    if (!(pickedTime instanceof Date) || isNaN(pickedTime)) {
      console.log("⚠️ Date invalide reçue du picker:", pickedTime);
      hideTimePicker();
      return;
    }

    // Créer une nouvelle date en combinant la date sélectionnée avec l'heure choisie
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(
      pickedTime.getHours(), 
      pickedTime.getMinutes(), 
      0, 
      0
    );
    
    // Vérifier que l'heure est dans la plage autorisée
    const hour = combinedDateTime.getHours();
    if (hour < 6 || hour > 21) {
      Alert.alert(
        'Heure non autorisée', 
        'Veuillez choisir une heure entre 6h00 et 21h00.'
      );
      hideTimePicker();
      return;
    }
    
    // Vérifier que ce n'est pas dans le passé si c'est aujourd'hui
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (isToday && combinedDateTime <= now) {
      Alert.alert(
        'Heure invalide', 
        'Veuillez choisir une heure dans le futur.'
      );
      hideTimePicker();
      return;
    }
    
    console.log("✅ Heure validée:", combinedDateTime);
    setSelectedHour(combinedDateTime);
    hideTimePicker();
  };

  if (loadingInit) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#5B4EFF" />
        <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <MiniAppBar
        title="Création de session"
        hasNotifications={notifUnseen > 0}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLeaderboardPress={() => navigation.navigate('Leaderboard')}
      />

      {/* Ferme le clavier quand on tape en dehors */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

{/* Sport */}
<TouchableOpacity
  style={[styles.input, { marginTop: 10 }]}
  onPress={() => setSportPickerVisible(true)}
>
  {selectedSport ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ marginRight: 10 }}>
        {sportIcons[selectedSport]?.icon || null}
      </View>
      <Text style={styles.inputText}>{selectedSport}</Text>
    </View>
  ) : (
    <Text style={styles.dropdownText}>Sport...</Text>
  )}
</TouchableOpacity>

{/* Modal Sport */}
<Modal
  transparent={true}
  visible={sportPickerVisible}
  animationType="fade"
  onRequestClose={() => setSportPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
      <Text style={styles.modalTitle}>
        {showOtherSports ? "Autres sports" : "Choisir un sport"}
      </Text>

      <ScrollView style={{ width: '100%' }}>
        {!showOtherSports ? (
          // Liste principale
          sportData.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.dropdownItem}
              onPress={() => {
                if (item.label === '+ de sports') {
                  setShowOtherSports(true); // 👉 reste ouvert et affiche la liste secondaire
                } else {
                  setSelectedSport(item.label);
                  setSportPickerVisible(false);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 10 }}>{item.icon}</View>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          // Liste secondaire
          otherSports.map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedSport(label);
                setShowOtherSports(false);
                setSportPickerVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 10 }}>{sportIcons[label]?.icon}</View>
                <Text style={styles.dropdownItemText}>{label}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Boutons bas du modal */}
      {showOtherSports ? (
        <TouchableOpacity
          style={styles.validateButton}
          onPress={() => setShowOtherSports(false)}
        >
          <Text style={styles.validateText}>Retour</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.validateButton}
          onPress={() => setSportPickerVisible(false)}
        >
          <Text style={styles.validateText}>Fermer</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</Modal>

            {/* Lieu */}
            <View style={{ marginTop: 5 }}>
              <PlaceSearchField
                value={location}
                onChange={(txt) => {
                  setLocation(txt);
                }}
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

            {/* Date */}
            <TouchableOpacity style={styles.input} onPress={() => setShowCalendar(true)}>
              <Text style={styles.inputText}>
                {capitalizeFirst(
                  selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                )}
              </Text>
            </TouchableOpacity>

          {showCalendar && (
              <View
                style={{
                  marginTop: 5,
                  marginBottom: 15,
                  borderRadius: 16,
                  overflow: 'hidden',
                  alignSelf: 'center',
                }}
              >
                <Calendar
                  onDayPress={(day) => {
                    const [y, m, d] = day.dateString.split('-').map(Number);
                    setSelectedDate(new Date(y, m - 1, d));
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [formatDateYYYYMMDD(selectedDate)]: { selected: true, selectedColor: '#5B4EFF' },
                  }}
                  minDate={formatDateYYYYMMDD(new Date())}
                  theme={{
                    selectedDayBackgroundColor: '#5B4EFF',
                    todayTextColor: '#5B4EFF',
                    arrowColor: '#5B4EFF',
                  }}
                  style={{
                    borderRadius: 15,
                    width: 340,
                    elevation: 4,
                    backgroundColor: '#fff',
                  }}
                />
              </View>
            )}

            {/* ✅ Heure corrigée */}
<TouchableOpacity
  style={styles.input}
  onPress={() => setTimePickerVisible(true)}
>
<Text style={selectedHour ? styles.inputText : styles.placeholder}>
  {selectedHour
    ? `${selectedHour.getHours().toString().padStart(2, '0')}:${selectedHour.getMinutes().toString().padStart(2, '0')}`
    : "Heure de la session..."}
</Text>
</TouchableOpacity>

{/* ✅ Modal custom style iOS */}
<Modal
  transparent={true}
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
    if (date) {
      setSelectedHour(date);
    }
  }}
/>
      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setTimePickerVisible(false)}
      >
        <Text style={styles.validateText}>Valider</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            {/* Niveau */}
{/* Niveau */}
<TouchableOpacity
  style={styles.input}
  onPress={() => setLevelPickerVisible(true)}
>
  <Text style={selectedLevel ? styles.inputText : styles.dropdownText}>
    {selectedLevel || "Niveau..."}
  </Text>
</TouchableOpacity>

{/* Modal Niveau */}
<Modal
  transparent={true}
  visible={levelPickerVisible}
  animationType="fade"
  onRequestClose={() => setLevelPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Choisir un niveau</Text>
      
      <ScrollView style={{ maxHeight: 250, width: '100%' }}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={styles.dropdownItem}
            onPress={() => {
              setSelectedLevel(level);
              setLevelPickerVisible(false);
            }}
          >
            <Text style={styles.dropdownItemText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setLevelPickerVisible(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            {/* Participants */}
<TouchableOpacity
  style={styles.input}
  onPress={() => setParticipantsPickerVisible(true)}
>
  <Text style={maxParticipants ? styles.inputText : styles.dropdownText}>
    {maxParticipants ? `${maxParticipants} participants` : "Participants max..."}
  </Text>
</TouchableOpacity>

{/* Modal Participants */}
<Modal
  transparent={true}
  visible={participantsPickerVisible}
  animationType="fade"
  onRequestClose={() => setParticipantsPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Participants maximum</Text>
      
      <ScrollView style={{ maxHeight: 250, width: '100%' }}>
        {Array.from({ length: 14 }, (_, i) => i + 2).map((p) => (
          <TouchableOpacity
            key={p}
            style={styles.dropdownItem}
            onPress={() => {
              setMaxParticipants(p);
              setSelectedParticipants(String(p)); // ⚡️ garde la compatibilité avec ta logique supabase
              setParticipantsPickerVisible(false);
            }}
          >
            <Text style={styles.dropdownItemText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setParticipantsPickerVisible(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            {showDropdown.participants && (
              <>
                <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={closeAllDropdowns} />
                <View style={{ zIndex: 99 }}>
                  {participants.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedParticipants(String(p));
                        toggleDropdown('participants');
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

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
              onSubmitEditing={Keyboard.dismiss} // ferme au "Retour"
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
              onSubmitEditing={Keyboard.dismiss} // ferme au "Retour"
            />

            {/* Filles uniquement */}
            {currentUser?.gender === 'Femme' && (
              <View
                style={[
                  styles.input,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 56,
                    paddingRight: 14,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="gender-female" size={20} color="#ea5e6d" style={{ marginRight: 4 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#ea5e6d' }}>
                    Session entre filles uniquement
                  </Text>
                </View>
                <Switch
                  value={isGirlsOnly}
                  onValueChange={setIsGirlsOnly}
                  trackColor={{ false: '#ccc', true: '#ea5e6d' }}
                  thumbColor={isGirlsOnly ? '#fff' : '#bababa'}
                  style={{ marginLeft: 12 }}
                />
              </View>
            )}

            {/* CTA créer */}
            <TouchableOpacity
              style={{ borderRadius: 16, overflow: 'hidden', marginTop: 12, marginBottom: 30 }}
              onPress={handleCreateSession}
            >
              <LinearGradient
                colors={['#ff9966', '#ff5e62']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Créer une session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appBar: {
    height: hp('6%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp('0.13%') },
    shadowOpacity: 0.07,
    shadowRadius: wp('0.8%'),
    marginBottom: hp('1%'),
  },
  appBarTitle: {
    fontSize: hp('2.3%'),
    fontWeight: 'bold',
    color: '#222',
    fontFamily: FONT,
    textAlign: 'center',
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
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
  },
  dropdown: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E7E7ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#F0F0F3',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#222',
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
  },
  placesModal: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    zIndex: 999,
    justifyContent: 'flex-start',
    elevation: 16,
    padding: wp('4.8%'),
  },
  closePlacesModal: {
    marginTop: hp('1.2%'),
    alignSelf: 'flex-end',
    paddingHorizontal: wp('4.8%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('3.7%'),
  },
  timeButton: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  marginTop: 10,
  backgroundColor: '#fff',
},

timeButtonText: {
  fontSize: 16,
  color: '#333',
},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // fond semi-transparent
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
  },
  dropdownItem: {
  paddingVertical: 12,
  justifyContent: 'center',
  alignItems: 'center',   // ✅ centre horizontalement
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
dropdownItemText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
  textAlign: 'center',   // ✅ centre aussi le texte
},
});

export default CreateSessionScreen;