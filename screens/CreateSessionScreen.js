import React, { useState, useCallback, useEffect,useRef } from 'react';
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
import {
  notifySessionCreated,
  notifyNearbyUsersOnSessionCreated,
  notifyGroupSessionCreatedForMembers,
} from '../helpers/notifications';
import { useNotificationRefresh } from '../context/NotificationContext';
import { Calendar } from 'react-native-calendars';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Modal } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

// ✅ Import corrigé - suppression de moment
import DateTimePicker from "@react-native-community/datetimepicker";

// Autocomplete identique à Home
import PlaceSearchField from '../components/PlaceSearchField';

const FONT = Platform.select({ ios: 'System', android: 'Roboto' });

const sportData = [
  { label: 'Football', icon: <FontAwesome5 name="futbol" size={hp('2.1%')} color="#3888FF" /> },
  { label: 'Basketball', icon: <MaterialCommunityIcons name="basketball" size={hp('2.1%')} color="#FFA726" /> },
  { label: 'Tennis', icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#2ECC71" /> },
  { label: 'Padel', icon: <MaterialCommunityIcons name="tennis" size={hp('2.1%')} color="#FFD600" /> },
  { label: 'Running', icon: <MaterialCommunityIcons name="run-fast" size={hp('2.3%')} color="#E9436D" /> },
  { label: 'Cyclisme', icon: <MaterialCommunityIcons name="bike" size={hp('2.1%')} color="#3CD6E6" /> },
  { label: 'Natation', icon: <MaterialCommunityIcons name="swim" size={hp('2.1%')} color="#1469B9" /> },
  { label: 'Musculation', icon: <MaterialCommunityIcons name="dumbbell" size={hp('2.4%')} color="#7367F0" /> },
  { label: 'Fitness', icon: <MaterialCommunityIcons name="weight-lifter" size={hp('2.3%')} color="#7C4DFF" /> },
  { label: 'Randonnée/Trail', icon: <MaterialCommunityIcons name="hiking" size={hp('2.1%')} color="#43A047" /> },
  { label: '+ de sports', icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
];

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: '#3888FF' },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: '#FFA726' },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: '#2ECC71' },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: '#E9436D' },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: '#3CD6E6' },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: '#1469B9' },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: '#7367F0' },
  Fitness: { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#7C4DFF" />, color: '#7C4DFF' },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />,color: '#999',},

  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={18} color="#A259F7" />, color: '#A259F7' },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Pilates: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },

  Padel: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />, color: '#FFD600' },
  'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },

  'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
  'Ski de randonnée': { icon: <MaterialCommunityIcons name="ski-cross-country" size={18} color="#4FC3F7" />, color: '#4FC3F7' },
  'Ski/Snow': { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: '#32C5FF' },

  VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
  Marche: { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />, color: '#00A676' },
  Kayak: { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />, color: '#0277BD' },

  Surf: { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26C6DA" />, color: '#26C6DA' },
  Kitesurf: { icon: <MaterialCommunityIcons name="kitesurfing" size={18} color="#29B6F6" />, color: '#29B6F6' },
  Windsurf: { icon: <MaterialCommunityIcons name="windsock" size={18} color="#42A5F5" />, color: '#42A5F5' },
  'Stand Up Paddle': { icon: <MaterialCommunityIcons name="wave" size={18} color="#26A69A" />, color: '#26A69A' },

  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: '#EB984E' },
  Roller: { icon: <MaterialCommunityIcons name="roller-skate" size={18} color="#FF8A65" />, color: '#FF8A65' },

  Escalade: { icon: <MaterialCommunityIcons name="terrain" size={18} color="#689F38" />, color: '#689F38' },
  Parapente: { icon: <MaterialCommunityIcons name="paragliding" size={18} color="#1976D2" />, color: '#1976D2' },

  CrossFit: { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#536DFE" />, color: '#536DFE' },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: '#26A69A' },

  'Arts Martiaux': { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: '#FF3D00' },

  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },

  '+ de sports': { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

const otherSports = [
  'CrossFit',
  'Yoga',
  'Pilates',
  'Danse',
  'Marche',
  'VTT',
  'Kayak',
  'Surf',
  'Kitesurf',
  'Stand Up Paddle',
  'Ski/Snow',
  'Ski de randonnée',
  'Skate',
  'Roller',
  'Escalade',
  'Parapente',
  'Callisthénie',
  'Arts Martiaux',
  'Tennis de table',
  'Échecs',
  'Autres'
];

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

function formatHour(date) {
  if (!(date instanceof Date)) return 'Heure';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isAllowedStartTime(localDate) {
  const h = localDate.getHours();
  const m = localDate.getMinutes();
  if (h < 6) return false;
  if (h > 21) return false;
  if (h === 21 && m > 0) return false;
  return true;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // rayon Terre en km
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CreateSessionScreen = () => {
  const navigation = useNavigation();
const route = useRoute();
const groupId = route.params?.groupId ?? null;
const isGroupSession = Boolean(groupId);
const prefillLat = route.params?.prefillLat;
const prefillLng = route.params?.prefillLng;
const prefillAddress = route.params?.prefillAddress;

  const { notifUnseen } = useNotificationRefresh();

  const [selectedSport, setSelectedSport] = useState('');
  const [showOtherSports, setShowOtherSports] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');

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

// Lieu choisi (valeur finale du formulaire)
const [location, setLocation] = useState('');
const [latitude, setLatitude] = useState(null);
const [longitude, setLongitude] = useState(null);

// ---- Adresse (modal) ----
const [addressModalVisible, setAddressModalVisible] = useState(false);
const [tempLocation, setTempLocation] = useState('');
const [tempLat, setTempLat] = useState(null);
const [tempLng, setTempLng] = useState(null);

// Filles uniquement
const [currentUser, setCurrentUser] = useState(null);
const [isGirlsOnly, setIsGirlsOnly] = useState(false);

//Participants max
const [maxParticipants, setMaxParticipants] = useState(null); 
const [showMaxModal, setShowMaxModal] = useState(false);
  
//Loader
const [loadingInit, setLoadingInit] = useState(true);

const insets = useSafeAreaInsets();
const [kbOpen, setKbOpen] = useState(false);

const [creating, setCreating] = useState(false);

const [groupSport, setGroupSport] = useState(null);

useEffect(() => {
  const s = Keyboard.addListener('keyboardDidShow', () => setKbOpen(true));
  const h = Keyboard.addListener('keyboardDidHide', () => setKbOpen(false));
  return () => { s.remove(); h.remove(); };
}, []);

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

useEffect(() => {
  if (!cameFromMapRef.current) return;

  setLatitude(prefillLat);
  setLongitude(prefillLng);

  if (prefillAddress && prefillAddress !== 'Chargement...') {
    setLocation(prefillAddress);
  }

  requestAnimationFrame(() => {
    navigation.setParams({
      prefillLat: undefined,
      prefillLng: undefined,
      prefillAddress: undefined,
    });
  });
}, []);

useFocusEffect(
  useCallback(() => {
    // 👉 SI on arrive depuis la map, on NE RESET PAS le lieu
if (cameFromMapRef.current) {
  return;
}
 if (!isGroupSession) {
      setSelectedSport('');
    }
    // 🔁 Reset normal uniquement quand navigation classique
    setShowOtherSports(false);
    setSelectedLevel('');
    setSelectedDate(new Date());
    setSelectedHour(getClampedDefaultHour());
    setShowCalendar(false);
    hideTimePicker();
    setShowDropdown({ sport: false, level: false, participants: false });
    setTitle('');
    setComments('');
    setAddressModalVisible(false);
    setTempLocation('');
    setTempLat(null);
    setTempLng(null);
    setIsGirlsOnly(false);
    setMaxParticipants (null);
    setLocation('');
    setLatitude(null);
    setLongitude(null);
  }, [prefillLat, prefillLng,isGroupSession])
);

const handleResetForm = () => {
  setSelectedSport('');
  setShowOtherSports(false);
  setSelectedLevel('');
  setSelectedDate(new Date());
  setSelectedHour(getClampedDefaultHour());
  setShowCalendar(false);
  hideTimePicker();
  setShowDropdown({ sport: false, level: false, participants: false });
  setTitle('');
  setComments('');
  setAddressModalVisible(false);
  setTempLocation('');
  setTempLat(null);
  setTempLng(null);
  setIsGirlsOnly(false);

  setLocation('');
  setLatitude(null);
  setLongitude(null);
};

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const closeAllDropdowns = () => setShowDropdown({ sport: false, level: false, participants: false });
  const toggleDropdown = (key) => setShowDropdown((prev) => ({ ...prev, [key]: !prev[key] }));

  const cameFromMapRef = useRef(false);

useFocusEffect(
  useCallback(() => {
    const hasPrefill =
      Number.isFinite(route.params?.prefillLat) &&
      Number.isFinite(route.params?.prefillLng);

    cameFromMapRef.current = hasPrefill;

    if (hasPrefill) {
      setLatitude(route.params.prefillLat);
      setLongitude(route.params.prefillLng);

      if (route.params?.prefillAddress) {
        setLocation(route.params.prefillAddress);
      }

      // 🔥 nettoyage des params pour éviter les effets fantômes
      requestAnimationFrame(() => {
        navigation.setParams({
          prefillLat: undefined,
          prefillLng: undefined,
          prefillAddress: undefined,
        });
      });
    }
  }, [route.params])
);

useEffect(() => {
  if (!groupId) return;

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('sport')
      .eq('id', groupId)
      .single();

    if (!error && data?.sport) {
      setGroupSport(data.sport);
      setSelectedSport(data.sport); // ✅ préremplissage
    }
  };

  fetchGroup();
}, [groupId]);

const handleCreateSession = async () => {
  if (creating) return;
  setCreating(true);

  try {
    // 🔒 Vérifications champs obligatoires
    if (
      !selectedSport ||
      !location ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !selectedLevel ||
      !title
    ) {
      Alert.alert(
        'Champs manquants',
        'Merci de remplir tous les champs obligatoires.'
      );
      return;
    }

    // 📅 Date non passée
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    if (sessionDateOnly < today) {
      Alert.alert('Erreur', 'Tu ne peux pas créer de session dans le passé.');
      return;
    }

    // ⏰ Heure valide si aujourd’hui
    const now = new Date();
    if (sessionDateOnly.getTime() === today.getTime()) {
      const startLocal = combineLocalDateAndTime(
        sessionDateOnly,
        selectedHour
      );
      if (startLocal < now) {
        Alert.alert(
          'Erreur',
          "Tu ne peux pas sélectionner une heure passée pour aujourd'hui."
        );
        return;
      }
    }

    // ⏱️ Plage horaire autorisée
    const candidateStart = combineLocalDateAndTime(
      sessionDateOnly,
      selectedHour
    );
    if (!isAllowedStartTime(candidateStart)) {
      Alert.alert(
        'Heure non autorisée',
        'Tu peux sélectionner une heure uniquement entre 6h00 et 21h00.'
      );
      return;
    }

    // 👤 Utilisateur connecté
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      Alert.alert(
        'Session expirée',
        'Reconnecte-toi pour créer une session.'
      );
      navigation.navigate('Login');
      return;
    }

    // 📦 Données session
    const sessionData = {
      sport: selectedSport,
      location,
      lat: latitude,
      lng: longitude,
      level: selectedLevel,
      date: formatDateYYYYMMDD(selectedDate),
      time: formatTimeHHMM(selectedHour),
      title,
      description: comments,
      creator_id: user.id,
      girls_only: isGirlsOnly,
      max_participants:
        maxParticipants === null ? null : Number(maxParticipants),
        group_id: isGroupSession ? groupId : null,
    };

    // 🚀 Insertion Supabase
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de créer la session.'
      );
      return;
    }

    const sessionId = data.id;

// 🔔 Notifications (UNE SEULE FOIS)
requestAnimationFrame(() => {
  if (isGroupSession) {
    notifyGroupSessionCreatedForMembers({
      groupId,
      creatorId: user.id,
      sessionTitle: title,
      sessionId,
    }).catch(() => {});
  } else {
    notifySessionCreated({
      creatorId: user.id,
      sessionId,
      title,
    }).catch(() => {});
  }

  notifyNearbyUsersOnSessionCreated({
    sessionId,
    sport: selectedSport,
    lat: latitude,
    lng: longitude,
    creatorId: user.id,
  }).catch(() => {});
});

// 🧭 Navigation IMMÉDIATE
navigation.navigate('MainTabs', {
  screen: 'Sessions',
  params: { tab: 'created', showCreatedAlert: true },
});

  } catch (err) {
    console.error(err);
    Alert.alert('Erreur', 'Une erreur est survenue.');
  } finally {
    // 🛡️ Sécurité absolue
    setCreating(false);
  }
};

const [sportPickerVisible, setSportPickerVisible] = useState(false);

const [levelPickerVisible, setLevelPickerVisible] = useState(false);

  // ✅ Fonctions TimePicker corrigées
const showTimePicker = () => setTimePickerVisible(true);
const hideTimePicker = () => setTimePickerVisible(false);

const confirmCreateSession = () => {
  Alert.alert(
    'Créer la session ?',
    'La session sera visible immédiatement.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Créer',
        onPress: handleCreateSession,
      },
    ],
    { cancelable: true }
  );
};

  const handleConfirm = (pickedTime) => {
    console.log("🔍 Time picked:", pickedTime)

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
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}
    >
      <ActivityIndicator
        size={Platform.OS === 'ios' ? 'large' : 50}
        color="#5B4EFF"
      />
      <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>
        Chargement...
      </Text>
    </SafeAreaView>
  );
}

return (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />

    {/* MiniAppBar FIXE */}
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

    {/* CONTENU STABLE — DOIT TOUJOURS ÊTRE DANS UN View flex:1 */}
<SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

{/* Sport */}
<TouchableOpacity
  style={[
    styles.input,
    { marginTop: 10, flexDirection: 'row', alignItems: 'center' }
  ]}
  onPress={() => setSportPickerVisible(true)}
>

  {/* Icône par défaut UNIQUEMENT si aucun sport sélectionné */}
  {!selectedSport && (
    <Ionicons
      name="fitness" 
      size={18}
      color="#5B5FFF"
      style={{ marginRight: 8 }}
    />
  )}

  {selectedSport ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {sportIcons[selectedSport]?.icon}
      <Text style={[styles.inputText, { marginLeft: 6 }]}>
        {selectedSport}
      </Text>
    </View>
  ) : (
    <Text style={styles.dropdownText}>Sport</Text>
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
<TouchableOpacity
  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
  activeOpacity={0.85}
  onPress={() => {
    setTempLocation(location || '');
    setTempLat(latitude);
    setTempLng(longitude);
    setAddressModalVisible(true);
  }}
>
  <Ionicons
    name="location-outline"
    size={18}
    color="#5B5FFF"
    style={{ marginRight: 8 }}
  />

  <Text style={location ? styles.inputText : styles.dropdownText}>
    {location || 'Point de rencontre'}
  </Text>
</TouchableOpacity>
</View>

{/* Modal Adresse */}
<Modal
  visible={addressModalVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setAddressModalVisible(false)}
>
  <View style={styles.addressOverlay}>

    <SafeAreaView style={styles.addressFullscreenContainer}>

      {/* HEADER */}
      <View style={styles.addressHeader}>
        <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
          <Ionicons name="close" size={26} color="#444" />
        </TouchableOpacity>

        <Text style={styles.addressTitle}>Choisir un lieu</Text>

        <TouchableOpacity
          disabled={!Number.isFinite(tempLat)}
          onPress={() => {
            setLocation(tempLocation.trim());
            setLatitude(tempLat);
            setLongitude(tempLng);
            setAddressModalVisible(false);
          }}
          style={[
            styles.addressValidateBtn,
            { opacity: Number.isFinite(tempLat) ? 1 : 0.4 },
          ]}
        >
          <Text style={styles.addressValidateText}>Valider</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH + LIST */}
      <View style={{ flex: 1 }}>
        <PlaceSearchField
          autoFocus
          value={tempLocation}
          onChange={(txt) => {
            setTempLocation(txt);
            setTempLat(null);
            setTempLng(null);
          }}
          onPick={({ description, lat, lng }) => {
            setTempLocation(description);
            setTempLat(lat);
            setTempLng(lng);
          }}
          placeholder="Ex : Parc Monceau, Paris"
          boxStyle={styles.addressSearchBox}
          suggestionContainerStyle={styles.addressSuggestions}
          keyboardShouldPersistTaps="handled"
        />
      </View>

    </SafeAreaView>
  </View>
</Modal>

{/* Date */}
<View style={{ marginTop: 5 }}>
  <View style={styles.rowTwoCols}>
<TouchableOpacity
  style={[styles.inlineInput, {  flex: 2, flexDirection: 'row', alignItems: 'center' }]}
  activeOpacity={0.85}
  onPress={() => setShowCalendar(true)}
>
  <Ionicons
    name="calendar-outline"
    size={18}
    color="#5B5FFF"
    style={{ marginRight: 8 }}
  />

  <Text style={styles.inputText}>
    {capitalizeFirst(
      selectedDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    )} 
  </Text> 
</TouchableOpacity>

  {/* HEURE */}
  <TouchableOpacity
    style={[styles.inlineInput,{ flex: 1, flexDirection: 'row', alignItems: 'center',}]}
    onPress={() => setTimePickerVisible(true)}
    activeOpacity={0.85}
  >
    <Ionicons name="time-outline" size={18} color="#5B5FFF" />
    <Text style={styles.timeText}>
      {formatHour(selectedHour)}
    </Text>
  </TouchableOpacity>
</View>
</View>

{/* Modal Date */}
<Modal
  transparent={true}
  animationType="fade"
  visible={showCalendar}
  onRequestClose={() => setShowCalendar(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Choisir une date</Text>

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
          borderRadius: 12,
          backgroundColor: '#fff',
          elevation: 2,
        }}
      />

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setShowCalendar(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

  {/* NIVEAU */}
  <TouchableOpacity
    style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
    onPress={() => setLevelPickerVisible(true)}
    activeOpacity={0.85}
  >
    <Ionicons name="trending-up-outline" size={18} color="#5B5FFF" />
    <Text style={styles.levelText}>
      {selectedLevel ? selectedLevel : 'Niveau'}
    </Text>
  </TouchableOpacity>

{/* iOS → modal custom avec titre + bouton valider */}
{Platform.OS === 'ios' && timePickerVisible && (
  <Modal
    transparent
    visible={timePickerVisible}
    animationType="fade"
    onRequestClose={hideTimePicker}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Heure de la session</Text>

        <DateTimePicker
          value={selectedHour || new Date()}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(event, date) => {
            if (date) setSelectedHour(date);
          }}
        />

        <TouchableOpacity
          style={styles.validateButton}
          onPress={hideTimePicker}
        >
          <Text style={styles.validateText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

{/* Android → modal simple avec uniquement le spinner */}
{Platform.OS === 'android' && timePickerVisible && (
  <Modal
    transparent
    visible={timePickerVisible}
    animationType="fade"
    onRequestClose={hideTimePicker}
  >
    <DateTimePicker
      value={selectedHour || new Date()}
      mode="time"
      is24Hour
      display="spinner"
      onChange={(event, date) => {
        if (event.type === 'set' && date) {
          setSelectedHour(date);
          hideTimePicker(); // ✅ ferme le modal après sélection
        } else if (event.type === 'dismissed') {
          hideTimePicker(); // ✅ ferme si l'utilisateur annule
        }
      }}
    />
  </Modal>
)}

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

{/* Max Participants */}
<TouchableOpacity
  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
  onPress={() => {
    setMaxParticipants(null);
    setShowMaxModal(true);
  }}
>
  <Ionicons
    name="people-outline"
    size={18}
    color="#5B5FFF"
    style={{ marginRight: 8 }}
  />

  <Text
    style={maxParticipants === null ? styles.dropdownText : styles.inputText}
  >
    {maxParticipants === null
      ? 'Nombre maximum de participants'
      : maxParticipants === 0
      ? 'Illimité'
      : `${maxParticipants}`}
  </Text>
</TouchableOpacity>

{/* Modal Max Participants */}
<Modal
  transparent={true}
  visible={showMaxModal}
  animationType="fade"
  onRequestClose={() => setShowMaxModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Nombre maximum</Text>

      <ScrollView style={{ maxHeight: 250, width: '100%' }}>
        
        {/* Illimité */}
        <TouchableOpacity
          style={styles.dropdownItem}
          onPress={() => {
            setMaxParticipants(null);
            setShowMaxModal(false);
          }}
        >
          <Text style={styles.dropdownItemText}>Illimité</Text>
        </TouchableOpacity>

        {/* 2 → 21 */}
        {Array.from({ length: 20 }, (_, i) => i + 2).map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.dropdownItem}
            onPress={() => {
              setMaxParticipants(num);
              setShowMaxModal(false);
            }}
          >
            <Text style={styles.dropdownItemText}>{num}</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setShowMaxModal(false)}
      >
        <Text style={styles.validateText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

            {/* Titre */}
            <TextInput
              style={[styles.input, styles.inputText]}
              placeholder="Titre de la session"
              placeholderTextColor="#bababa"
              value={title}
              onChangeText={setTitle}
              autoCorrect
              autoCapitalize="sentences"
              spellCheck
              autoComplete="off"
              returnKeyType="done"
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
              style={{ borderRadius: 16, overflow: 'hidden', marginTop: 12, marginBottom: 20, alignSelf: 'center', }}
              onPress={confirmCreateSession}
            >
              <LinearGradient
                colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, { width: '90%' }]}
              >
                <Text style={styles.buttonText}>Créer une session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
     justifyContent: 'flex-start',
    marginBottom: 18,
    position: 'relative',
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
    marginBottom: 18,
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
   paddingHorizontal: 70,
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
addressOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
},
addressFullscreenContainer: {
  flex: 1,
  backgroundColor: '#fff',
  paddingTop: 8,
},
addressHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
addressTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#111',
},
addressValidateBtn: {
  backgroundColor: '#5B5FFF',
  paddingHorizontal: 18,
  paddingVertical: 8,
  borderRadius: 8,
},
addressValidateText: {
  color: '#fff',
  fontWeight: '600',
},
addressSearchBox: {
  marginTop: 12,
  marginHorizontal: 16,
},
addressSuggestions: {
  flex: 1,
  marginTop: 8,
  paddingHorizontal: 16,
},
  calendarBox: {
  borderRadius: 12,
  width: '99%',
  backgroundColor: '#fff',
  elevation: 2, // ombre Android
  shadowColor: '#000', // ombre iOS
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  width: '100%',
  marginBottom: 12,
},
  addressCancelText: { fontWeight: '600', color: '#444' },
selectorContainer: {
    backgroundColor: "#F3F3F3",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 18,
  },
  selectorLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    fontWeight: "500",
  },
  selectorValueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
  /* === MODAL === */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    maxHeight: "70%",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#222",
  },
rowTwoCols: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 5,
  marginBottom: 18,
},
timeContainer: {
  flex: 1,
  height: 52,                 // même hauteur que input
  borderRadius: 12,           // même radius que input
  backgroundColor: '#fff',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 14,      // 🔑 clé de l’alignement
  borderWidth: 1,
  borderColor: '#E7E7ED',
},
levelContainer: {
  flex: 1,
  height: 52,
  borderRadius: 12,
  backgroundColor: '#fff',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: '#E7E7ED',
},
timeText: {
  fontSize: 15,
  color: '#333',
  marginLeft: 8,
},
levelText: {
  fontSize: 15,
  color: '#333',
  marginLeft: 8,
},
inlineInput: {
  flex: 1,
  height: 52,
  borderWidth: 1,
  borderColor: '#E7E7ED',
  borderRadius: 12,
  paddingHorizontal: 14,
  backgroundColor: '#fff',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
});

export default CreateSessionScreen;
