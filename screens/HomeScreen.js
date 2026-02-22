import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList,
Dimensions, Platform, SafeAreaView, ScrollView, Alert, Modal, ActivityIndicator,  Pressable, Image, Animated,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Calendar } from 'react-native-calendars';
import {
AntDesign,
FontAwesome5,
MaterialCommunityIcons,
Ionicons,
MaterialIcons, 
} from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MiniAppBar from '../components/MiniAppBar';
import SessionCardHome from '../components/SessionCardHome';
import { getDistance } from 'geolib';
import { useNotificationRefresh } from '../context/NotificationContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Keyboard } from 'react-native';
import SessionGroupCard from '../components/SessionGroupCard';
import MapViewUnite from '../components/MapViewUnite';

const APPBAR_H = 56;
const SEARCH_H = 44;

// espace réel, maîtrisé, sans bloc fantôme
const SEARCH_TOP =
  APPBAR_H + (Platform.OS === 'ios' ? 2 : 10);
const FILTERS_TOP = SEARCH_TOP + SEARCH_H + 10;

const GOOGLE_MAPS_API_KEY =
Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ??
Constants.manifest?.extra?.GOOGLE_MAPS_API_KEY ??
'';
const PARIS_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
};

const PARIS_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.20,
  longitudeDelta: 0.20,
}

const levelOptions = [
"Pour s'amuser",
'Débutant',
'Intermédiaire',
'Avancé',
];

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

  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: '#536DFE' },
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

const { width } = Dimensions.get('window');

const HomeScreen = () => {
const navigation = useNavigation();
const route = useRoute();
const user = { avatar_url: null };
const { notifUnseen } = useNotificationRefresh();

const [region, setRegion] = useState(null);
const [myLocation, setMyLocation] = useState(null);
const [sessions, setSessions] = useState([]);
const [selectedSessionId, setSelectedSessionId] = useState(null);
const [selectedLevel, setSelectedLevel] = useState('');
const [selectedDate, setSelectedDate] = useState(null);
const [selectedSport, setSelectedSport] = useState('');
const [inputValue, setInputValue] = useState('');   // ce que l’utilisateur tape
const [searchQuery, setSearchQuery] = useState(''); // ce qui déclenche l’autocomplete
const [suggestions, setSuggestions] = useState([]);
const [showLevelModal, setShowLevelModal] = useState(false);
const [showCalendar, setShowCalendar] = useState(false);

const [mapReady, setMapReady] = useState(false);

const [sportPickerVisible, setSportPickerVisible] = useState(false);
const [showOtherSports, setShowOtherSports] = useState(false);

const [pressedPoint, setPressedPoint] = useState(null);

const [gpsEnabled, setGpsEnabled] = useState(true);

const [regionSource, setRegionSource] = useState('gps');

const [locationBounds, setLocationBounds] = useState(null);

const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

const [showLongPressHint, setShowLongPressHint] = useState(false);
const hasLongPressed = useRef(false);
const firstHintShown = useRef(false);

const hintOpacity = useRef(new Animated.Value(0)).current;

const flatListRef = useRef(null);

const insets = useSafeAreaInsets();

  // --- FETCH SESSIONS (utilisé partout) ---
const fetchSessions = useCallback(async () => {
const { data, error } = await supabase
  .from('sessions')
  .select(`
    *,
    groups (
      id,
      name
    )
  `)
  .order('date', { ascending: true });

  if (error) {
    console.error('Erreur fetch sessions:', error);
    setSessions([]);
    return;
  }
  setSessions(data || []);
}, []);

// --- Bootstrapping / géoloc + sécurité user ---
useEffect(() => {
  (async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut();
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      let geolocPref = true;
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('geoloc_enabled')
        .eq('id', user.id)
        .single();

if (userDataError) {
  console.warn('User data error, fallback Paris:', userDataError.message);

  // fallback safe
  setRegion(PARIS_REGION);
  setMyLocation(PARIS_CENTER);
  return;
}

      geolocPref = userData?.geoloc_enabled !== false;

      if (!geolocPref) {
        setGpsEnabled(false);
        setRegion(PARIS_REGION);
        setMyLocation(PARIS_CENTER);
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsEnabled(false);
          setRegion(PARIS_REGION);
          setMyLocation(PARIS_CENTER);
        } else {
let location = await Location.getCurrentPositionAsync({});
const { latitude, longitude } = location.coords;

const initialRegion = {
  latitude,
  longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

setRegion(initialRegion);
setMyLocation({
  latitude,
  longitude,
});
          await supabase
            .from('users')
            .update({
              last_lat: location.coords.latitude,
              last_lng: location.coords.longitude,
            })
            .eq('id', user.id);
        }
      }
    } catch (err) {
  console.warn('Bootstrap error, fallback Paris:', err);
  setGpsEnabled(false);
  setRegion(PARIS_REGION);
  setMyLocation(PARIS_CENTER);
}
  })();
}, [navigation]);

const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) return '';

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${latitude},${longitude}` +
      `&key=${GOOGLE_MAPS_API_KEY}` +
      `&language=fr`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.length) {
      return '';
    }

    return data.results[0].formatted_address;
  } catch (e) {
    console.warn('reverseGeocode error:', e);
    return '';
  }
};

// --- Fetch initial + au focus, puis polling 5s quand visible ---
useFocusEffect(
  useCallback(() => {
    fetchSessions();
  }, [fetchSessions])
);

// --- (Optionnel) écoute temps réel INSERT/UPDATE pour réactivité instantanée
useEffect(() => {
  const channel = supabase
    .channel('public:sessions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      fetchSessions();
    })
    .subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Realtime sessions connecté');
  }
});

  return () => { supabase.removeChannel(channel); };
}, [fetchSessions]);

// --- Autocomplete robuste ---
useEffect(() => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    setSuggestions([]);
    return;
  }

  const run = async () => {
    try {
      const encoded = encodeURIComponent(searchQuery.trim());
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data?.predictions) ? data.predictions : []);
    } catch {
      setSuggestions([]);
    }
  };

  run();
}, [searchQuery]);

const handleSuggestionPress = async (placeId, description) => {
  try {
    Keyboard.dismiss();
    setSuggestions([]);

    // 🔒 met à jour l’input MAIS PAS la query autocomplete
    setInputValue(description);
    setSearchQuery(''); // ⛔ stop net l’autocomplete

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;
    const res = await fetch(url);
    const data = await res.json();

    const geometry = data?.result?.geometry;
    if (!geometry?.location || !geometry?.viewport) return;

    const { lat, lng } = geometry.location;
    const { northeast, southwest } = geometry.viewport;

const latDelta = Math.abs(northeast.lat - southwest.lat) * 1.2;
const lngDelta = Math.abs(northeast.lng - southwest.lng) * 1.2;

setRegion({
  latitude: lat,
  longitude: lng,
  latitudeDelta: Math.min(Math.max(latDelta, 0.02), 0.8),
  longitudeDelta: Math.min(Math.max(lngDelta, 0.02), 0.8),
});

    setLocationBounds({
      north: northeast.lat,
      south: southwest.lat,
      east: northeast.lng,
      west: southwest.lng,
    });

    setRegionSource('manual');
  } catch (e) {
    console.error(e);
  }
};

// ✅ Géoloc rapide et optimisée (Android-friendly)
const getFastLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn("❌ Permission localisation refusée");
      return null;
    }

    // 1️⃣ Récupère la dernière position connue (instantané sur Android)
    const last = await Location.getLastKnownPositionAsync({});
    if (last?.coords) {
      // Retourne tout de suite cette position (instantané)
      return {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      };
    }

    // 2️⃣ Sinon, récupère une position plus précise (en tâche courte)
    const fresh = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'android'
          ? Location.Accuracy.Low // ⚡️ évite d’activer le GPS complet
          : Location.Accuracy.Balanced,
        maximumAge: 10000, // accepte une position vieille de 10s
        timeout: 5000, // 5 secondes max
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]);

    if (fresh?.coords) {
      return {
        latitude: fresh.coords.latitude,
        longitude: fresh.coords.longitude,
      };
    }

    return null;
  } catch (e) {
    console.warn('getFastLocation error:', e.message);
    return null;
  }
};

const fadeInHint = () => {
  Animated.timing(hintOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start();
};

const fadeOutHint = () => {
  Animated.timing(hintOpacity, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start();
};

const clearFilters = async () => {
  setSelectedSport('');
  setSelectedLevel('');
  setSelectedDate(null);
  setInputValue('');
  setSearchQuery('');
  setSuggestions([]);
  setLocationBounds(null);

  hasAdjustedZoom.current = false;

  // 🚫 SI GPS REFUSÉ → TOUJOURS PARIS
  if (!gpsEnabled) {
    setRegionSource('default');
    setRegion(PARIS_REGION);
    setMyLocation(PARIS_CENTER);
    return;
  }

  // ✅ GPS autorisé → on peut recentrer
  setRegionSource('gps');

  const coords = await getFastLocation();
  if (!coords) {
    setRegion(PARIS_REGION);
    setMyLocation(PARIS_CENTER);
    return;
  }

  setRegion({
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  setMyLocation(coords);
};


function formatTime(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

function isSessionInFuture(session) {
  if (!session.date || !session.time) return false;
  try {
    const sessionDateTime = new Date(
      `${session.date}T${session.time.length === 5 ? session.time : session.time.slice(0, 5)}`
    );
    return sessionDateTime > new Date();
  } catch {
    return false;
  }
}

const getAdaptiveDelta = (sessions) => {
  if (!sessions || sessions.length === 0) return 0.85; // zone très vide

  const nearest = Math.min(...sessions.map(s => s.distance));

  if (nearest < 1000) return 0.06;    // ultra local
  if (nearest < 3000) return 0.10;
  if (nearest < 8000) return 0.18;
  if (nearest < 20000) return 0.30;

  return 0.45; // campagne
};

const today = new Date().toISOString().split('T')[0];

const filteredSessions = useMemo(() => {
  if (!region || !sessions.length) return [];

  const enriched = sessions
    .filter(isSessionInFuture)
    .map(session => {
      const sessionDateTime = new Date(
        `${session.date}T${session.time.length === 5 ? session.time : session.time.slice(0, 5)}`
      );

      const distance = getDistance(
        { latitude: region.latitude, longitude: region.longitude },
        { latitude: Number(session.lat), longitude: Number(session.lng) }
      );

      return { ...session, sessionDateTime, distance };
    })

    // ✅ FILTRAGE GÉOGRAPHIQUE STRICT
    .filter(session => {
      if (!locationBounds) return true;

      const lat = Number(session.lat);
      const lng = Number(session.lng);

      return (
        lat >= locationBounds.south &&
        lat <= locationBounds.north &&
        lng >= locationBounds.west &&
        lng <= locationBounds.east
      );
    })

    // ✅ filtres métier
    .filter(session => {
      if (selectedSport && session.sport !== selectedSport) return false;
      if (selectedLevel && session.level !== selectedLevel) return false;
      if (selectedDate && session.date !== selectedDate) return false;
      return true;
    })

    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.sessionDateTime - b.sessionDateTime;
    });

  return enriched;
}, [
  sessions,
  region,
  selectedSport,
  selectedLevel,
  selectedDate,
  locationBounds,
]);

  const hasAdjustedZoom = useRef(false);

useEffect(() => {
  if (
    !region ||
    !filteredSessions ||
    hasAdjustedZoom.current ||
    regionSource !== 'gps'
  ) {
    return;
  }

  const delta = getAdaptiveDelta(filteredSessions);

  setRegion(prev => ({
    ...prev,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }));

  hasAdjustedZoom.current = true;
}, [filteredSessions, region, regionSource]);

useEffect(() => {
  if (hasLongPressed.current) return;

  let hideTimeout;
  let interval;

const showHint = (duration) => {
  if (hasLongPressed.current) return;

  setShowLongPressHint(true);
  fadeInHint();

  setTimeout(() => {
    fadeOutHint();

    setTimeout(() => {
      setShowLongPressHint(false);
    }, 300); // durée du fade-out
  }, duration);
};

  // 🔥 Premier affichage → 10s
  if (!firstHintShown.current) {
    firstHintShown.current = true;
    showHint(5000);
  }

  // 🔁 Puis toutes les 60s → 5s
  interval = setInterval(() => {
    showHint(5000);
  }, 60000);

  return () => {
    clearTimeout(hideTimeout);
    clearInterval(interval);
  };
}, []);

useEffect(() => {
  if (route.params?.showCongrats) {
    Alert.alert('Félicitations !', 'Votre compte a bien été créé');
    navigation.setParams({ showCongrats: undefined });
  }
}, [route.params?.showCongrats, navigation]);

const formatDateLabel = (dateStr) => {
if (!dateStr) return 'Date';
const d = new Date(dateStr);
if (isNaN(d)) return 'Date';
return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

const normalizedSessions = useMemo(() => {
  return filteredSessions
    .filter(s => Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
    .map(s => ({
      id: s.id,
      lat: Number(s.lat),
      lng: Number(s.lng),
      sport: sportIcons[s.sport] ? s.sport : 'Autres',
    }));
}, [filteredSessions]);

return (
<View style={{ flex: 1, backgroundColor: "#fff" }}>
  {/* 🗺️ 1. LA CARTE — TOUJOURS RENDUE */}
{region && (
<MapViewUnite
  key={`${region.latitude}-${region.longitude}-${region.latitudeDelta}`}
  region={region}
    sessions={normalizedSessions.map(s => ({
      ...s,
      icon: sportIcons[s.sport]?.icon || sportIcons.Autres.icon,
    }))}
    gpsEnabled={gpsEnabled}
    userLocation={myLocation}
    onMapReady={() => setMapReady(true)}
    onSelectSession={(session) =>
      navigation.navigate("SessionDetail", { sessionId: session.id })
    }
    selectedPoint={pressedPoint}
    onLongPress={async ({ latitude, longitude }) => {
      setPressedPoint({
        latitude,
        longitude,
        address: 'Chargement de l’adresse…',
      });

      const address = await reverseGeocode(latitude, longitude);

      setPressedPoint({
        latitude,
        longitude,
        address: address || 'Adresse inconnue',
      });
    }}
  />
)}

  {/* ⏳ 2. OVERLAY — SEULEMENT SI LA MAP N’EST PAS PRÊTE */}
  {!mapReady && (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F7F8FA",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <ActivityIndicator
        size={Platform.OS === "ios" ? "large" : 50}
        color="#3F4FFF"
      />
      <Text
        style={{
          marginTop: hp("2%"),
          color: "#999",
          fontSize: wp("3.8%"),
        }}
      >
        Chargement de la carte…
      </Text>
    </View>
  )}

    {/* AppBar */}
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, zIndex: 30,
    }}>
<MiniAppBar
  centerComponent={
    <Image
      source={require('../assets/UniteLogo.png')}
      resizeMode="contain"
      style={{
        height: 120,
        width: 100,
        transform: [{ translateY: Platform.OS === 'ios' ? -1.5 : 0 }],
      }}
    />
  }
  onNotificationsPress={() => navigation.navigate('Notifications')}
  onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
/>
    </View>

<View
 style={{
   position: 'absolute',
   top: SEARCH_TOP,
   left: wp('4%'),
   right: wp('4%'),
   zIndex: 999,
 }}
>
<View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: hp('0.6%'),
    shadowOffset: { width: 0, height: hp('0.3%') },
    height: SEARCH_H,
    paddingHorizontal: wp('5%'),
  }}
>
  {/* 🔍 Icône recherche */}
  <AntDesign
    name="search1"
    size={wp('4.5%')}
    color="#8A8C99"
    style={{ marginRight: wp('3%') }}
  />

  {/* Champ texte */}
  <TextInput
    placeholder="Où voulez-vous bouger ?"
  value={inputValue}
  onChangeText={(text) => {
    setInputValue(text);
    setSearchQuery(text); // 🔥 autocomplete UNIQUEMENT ici
  }}
    style={{
      flex: 1,
      fontSize: wp('3.8%'),
      color: '#222',
      paddingVertical: 0,
    }}
    placeholderTextColor="#666"
  />

  {/* ❌ Petite croix pour effacer le champ */}
  {inputValue.length > 0 && (
<TouchableOpacity
  onPress={() => {
    setInputValue('');
    setSearchQuery('');
    setSuggestions([]);
    clearFilters();
    Keyboard.dismiss();
  }}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  style={{ marginLeft: wp('1.5%') }}
  activeOpacity={0.6}
>
  <AntDesign name="closecircle" size={wp('4.3%')} color="#999" />
</TouchableOpacity>
  )}
</View>
</View>

{suggestions.length > 0 && (
  <Pressable
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 998, // juste sous les suggestions
    }}
    onPress={() => {
      Keyboard.dismiss();
      setSuggestions([]);
    }}
  />
)}
    {/* Suggestions */}
{suggestions.length > 0 && (
 <View style={{
   position: 'absolute',
   top: SEARCH_TOP + SEARCH_H + 10,   // juste sous l’input
   left: '5%',
   width: '90%',
   zIndex: 9999,
   elevation: 12,
   backgroundColor: '#fff',
   borderRadius: wp('4%'),
   shadowColor: "#000",
   shadowOpacity: 0.17,
   shadowRadius: hp('0.8%'),
   shadowOffset: { width: 0, height: hp('0.6%') },
   paddingVertical: hp('0.2%'),
   maxHeight: hp('40%'),
   overflow: 'hidden',
 }}>
        <FlatList
          data={suggestions}
          keyExtractor={item => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                paddingVertical: hp('1.6%'),
                paddingHorizontal: wp('5%'),
                borderBottomWidth: 1,
                borderBottomColor: "#F2F2F2"
              }}
              onPress={() => handleSuggestionPress(item.place_id, item.description)}
            >
              <Text style={{ fontSize: wp('3.8%'), color: "#222" }}>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={{ width: '100%' }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    )}

    {/* Filtres */}
<View style={{
 position: 'absolute',
 top: FILTERS_TOP,
 left: 0,
 right: 0,
 zIndex: 997,
 flexDirection: 'row',
 justifyContent: 'center',
 alignItems: 'center',
 paddingHorizontal: wp('2.5%'),
}}>
<TouchableOpacity
  style={styles.midFilterChip}
  onPress={() => setSportPickerVisible(true)}
>
  <Text
    style={[
      styles.midChipText,
      selectedSport ? { color: "#3F4FFF" } : {},
    ]}
  >
    {selectedSport || 'Sport'}
  </Text>
  <AntDesign
    name="down"
    size={wp('3.2%')}
    style={{
      marginLeft: wp('1%'),
      color: selectedSport ? "#3F4FFF" : "#666",
    }}
  />
</TouchableOpacity>

      <TouchableOpacity style={styles.midFilterChip} onPress={() => setShowLevelModal(true)}>
        <Text style={[
          styles.midChipText,
          selectedLevel ? { color: "#3F4FFF" } : {}
        ]}>
          {selectedLevel || 'Niveau'}
        </Text>
        <AntDesign name="down" size={wp('3.2%')} style={{ marginLeft: wp('1%'), color: selectedLevel ? "#3F4FFF" : "#666" }} />
      </TouchableOpacity>
<TouchableOpacity
  style={styles.midFilterChip}
  onPress={() => setShowCalendar(true)}
>
  <Text
    style={[
      styles.midChipText,
      selectedDate ? { color: '#3F4FFF' } : {},
    ]}
  >
    {selectedDate ? formatDateLabel(selectedDate) : 'Date'}
  </Text>

  <AntDesign
    name="down"
    size={wp('3.2%')}
    style={{
      marginLeft: wp('1%'),
      color: selectedDate ? '#3F4FFF' : '#666',
    }}
  />
</TouchableOpacity>
      <TouchableOpacity style={styles.midClearChip} onPress={clearFilters}>
        <AntDesign name="close" size={wp('2.4%')} color="#1877F2" />
        <Text style={styles.midClearChipText}>Effacer</Text>
      </TouchableOpacity>
    </View>

    {/* Modal niveau */}
    <Modal
      visible={showLevelModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLevelModal(false)}
    >
      <TouchableOpacity style={styles.pickerModalOverlay} activeOpacity={1} onPress={() => setShowLevelModal(false)}>
        <View style={styles.pickerModalBox}>
          <Text style={styles.pickerModalTitle}>Choisis ton niveau</Text>
          {levelOptions.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.pickerModalOption,
                selectedLevel === level && styles.pickerModalOptionSelected
              ]}
              onPress={() => {
                setSelectedLevel(level);
                setShowLevelModal(false);
              }}
            >
              <Text style={[
                styles.pickerModalOptionText,
                selectedLevel === level && styles.pickerModalOptionTextSelected
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowLevelModal(false)}
            style={styles.validateButton}
          >
            <Text style={styles.validateText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

{/* Modal Calendrier — même pattern que Création/Edit */}
<Modal
transparent
animationType="fade"
visible={showCalendar}
onRequestClose={() => setShowCalendar(false)}
>
<View style={styles.modalOverlay}>
  <View style={styles.calendarModalBox}>
    <Text style={styles.modalTitle}>Choisir une date</Text>

    <Calendar
      onDayPress={(day) => {
        setSelectedDate(day.dateString);
        setShowCalendar(false);
      }}
      markedDates={
        selectedDate
          ? { [selectedDate]: { selected: true, selectedColor: '#3f4fff' } }
          : {}
      }
      minDate={new Date().toISOString().slice(0,10)}
      theme={{
        selectedDayBackgroundColor: '#3f4fff',
        todayTextColor: '#3f4fff',
        arrowColor: '#3f4fff',
        textDayFontSize: 18,
        textMonthFontSize: 20,
        textDayHeaderFontSize: 15,
      }}
      style={styles.calendarBoxHome}   // ⇦ container élargi
    />

    <TouchableOpacity
      style={styles.validateButton}
      onPress={() => setShowCalendar(false)}
      activeOpacity={0.9}
    >
      <Text style={styles.validateText}>Fermer</Text>
    </TouchableOpacity>
  </View>
</View>
</Modal>

{/* Sessions + bouton créer */}
<View
  style={{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: hp('2%'),
    zIndex: 50,
  }}
>

  {/* Liste des sessions */}
  <View
    style={{
      shadowColor: '#000',
      shadowOpacity: 0.11,
      shadowRadius: hp('1.8%'),
      shadowOffset: { width: 0, height: hp('0.6%') },
      elevation: 8,
    }}
  >
    <FlatList
      ref={flatListRef}
      horizontal
      data={filteredSessions}
      keyExtractor={item => String(item.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: wp('2.5%'),
        paddingRight: wp('2.5%'),
      }}
      ItemSeparatorComponent={() => <View style={{ width: wp('2.5%') }} />}
renderItem={({ item }) => {
if (item.group_id) {
  return (
    <SessionGroupCard
      session={item}
      onPress={() =>
        navigation.navigate('SessionDetail', { sessionId: item.id })
      }
    />
  );
}
  return (
    
<SessionCardHome
  session={item}
  onPress={() =>
    navigation.navigate('SessionDetail', { sessionId: item.id })
  }
/>

  );
}}
    />
  </View>
</View>

{filteredSessions.length === 0 && (
  <View style={styles.noSessionContainerFixed}>
    <LinearGradient
      colors={['#F9FAFF', '#FFFFFF']}
      style={styles.noSessionGradientFixed}
    >
      <MaterialCommunityIcons
        name="map-search-outline"
        size={wp('6%')}
        color="#FE5D02"
        style={{ marginBottom: hp('0.6%') }}
      />

      <Text style={styles.noSessionTitleFixed}>Aucune session trouvée</Text>
      <Text style={styles.noSessionSubtitleFixed}>Essaie un autre sport ou élargis ta recherche</Text>

      <TouchableOpacity
        style={styles.noSessionButtonFixed}
        activeOpacity={0.85}
        onPress={clearFilters}
      >
        <View
          style={[styles.noSessionButtonGradientFixed, {backgroundColor: '#FE5D02'}]}
        >
          <Text style={styles.noSessionButtonTextFixed}>Effacer tous les filtres</Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  </View>
)}
<Modal
  transparent
  visible={sportPickerVisible}
  animationType="fade"
  onRequestClose={() => {
    setSportPickerVisible(false);
    setShowOtherSports(false);
  }}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
      <Text style={styles.modalTitle}>
        {showOtherSports ? 'Autres sports' : 'Choisir un sport'}
      </Text>

      <ScrollView style={{ width: '100%' }}>
        {!showOtherSports ? (
          sportData.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.dropdownItem}
              onPress={() => {
                if (item.label === '+ de sports' || item.label === 'Autres') {
                  setShowOtherSports(true);
                } else {
                  setSelectedSport(item.label);
                  setSportPickerVisible(false);
                  setShowOtherSports(false);
                }
              }}
            >
              <View style={{ 
  flexDirection: 'row', 
  alignItems: 'center',
  justifyContent: 'center',
}}>
                <View style={{ marginRight: 10 }}>{item.icon}</View>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          otherSports.map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedSport(label);
                setSportPickerVisible(false);
                setShowOtherSports(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 10 }}>
                  {sportIcons[label]?.icon}
                </View>
                <Text style={styles.dropdownItemText}>{label}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
{pressedPoint && (
  <View style={styles.createFromMapCard}>

    {/* HEADER : titre + croix */}
    <View style={styles.createFromMapHeader}>
      <Text
        style={styles.createFromMapTitle}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        Emplacement sélectionné
      </Text>

      <TouchableOpacity
        onPress={() => setPressedPoint(null)}
        hitSlop={10}
      >
        <AntDesign name="close" size={18} color="#999" />
      </TouchableOpacity>
    </View>

    {/* Adresse */}
    <Text
      style={styles.createFromMapAddress}
      numberOfLines={2}
    >
      {pressedPoint.address}
    </Text>

    {/* Bouton centré */}
    <TouchableOpacity
      activeOpacity={0.9}
      style={{ alignSelf: 'center', marginTop: hp('1.4%') }}
      onPress={() => {
        navigation.navigate('Créer', {
          prefillLat: pressedPoint.latitude,
          prefillLng: pressedPoint.longitude,
          prefillAddress: pressedPoint.address,
        });
        setPressedPoint(null);
      }}
    >
      <View
        style={[styles.createFromMapButton, {backgroundColor: '#FE5D02'}]}
      >
        <Text style={styles.createFromMapButtonText}>
          Créer une session
        </Text>
      </View>
    </TouchableOpacity>
  </View>
)}
{showLongPressHint && (
  <Animated.View
    style={[
      styles.longPressHint,
      { opacity: hintOpacity }
    ]}
  >
    <MaterialCommunityIcons
      name="gesture-tap-hold"
      size={16}
      color="#555"
      style={{ marginRight: 6 }}
    />
    <Text style={styles.longPressHintText}>
      Appui long sur la carte pour créer une session
    </Text>
  </Animated.View>
)}

  </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
 floatingRow1: {
   position: 'absolute',
   top: hp('8.2%'),
   left: wp('4%'),
   right: wp('4%'),
   zIndex: 999,
   elevation: 9,
   backgroundColor: '#fff',
   borderRadius: wp('4%'),
   shadowColor: "#000",
   shadowOpacity: 0.10,
   shadowRadius: hp('1%'),
   shadowOffset: { width: 0, height: hp('0.4%') },
   paddingHorizontal: wp('2.5%'),
   paddingVertical: hp('0.8%'),
 },
 floatingSearchInput: {
   fontSize: wp('3.8%'),
   color: "#222",
   backgroundColor: 'transparent',
   borderRadius: 0,
   paddingHorizontal: 0,
   paddingVertical: hp('1.4%'),
   height: hp('5.5%'),
 },
 floatingRow2: {
   position: 'absolute',
   top: hp('15%'),
   left: wp('1.5%'),
   right: wp('1.5%'),
   zIndex: 998,
   flexDirection: 'row',
   backgroundColor: 'rgba(255,255,255,0.98)',
   borderRadius: wp('4%'),
   paddingVertical: hp('0.7%'),
   paddingHorizontal: wp('2%'),
   elevation: 6,
   shadowColor: "#000",
   shadowOpacity: 0.09,
   shadowRadius: hp('0.8%'),
 },
 midChip: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#F4F3FF',
   borderRadius: wp('4%'),
   paddingHorizontal: wp('3%'),
   paddingVertical: hp('0.8%'),
   marginRight: wp('2%'),
   marginBottom: hp('0.3%'),
   elevation: 1,
   height: hp('4%'),
 },
 midChipSelected: {
   backgroundColor: '#3F4FFF',
 },
 midChipText: {
   fontSize: wp('3.5%'),
   color: '#222',
   fontWeight: '500',
   marginLeft: wp('1.2%'),
 },
 floatingRow3: {
   position: 'absolute',
   top: hp('22%'),
   left: wp('4%'),
   right: wp('4%'),
   zIndex: 997,
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff',
   borderRadius: wp('4%'),
   paddingHorizontal: wp('2%'),
   paddingVertical: hp('1%'),
   elevation: 7,
   shadowColor: "#000",
   shadowOpacity: 0.10,
   shadowRadius: hp('0.9%'),
   shadowOffset: { width: 0, height: hp('0.4%') },
 },
 midFilterChip: {
   backgroundColor: '#F2F2F7',
   borderRadius: wp('3.5%'),
   paddingHorizontal: wp('3%'),
   paddingVertical: hp('0.8%'),
   flexDirection: 'row',
   alignItems: 'center',
   marginRight: wp('2%'),
   elevation: 1,
   height: hp('4%'),
 },
 midClearChip: {
   backgroundColor: '#F3F8FF',
   borderRadius: wp('3.5%'),
   paddingHorizontal: wp('2.8%'),
   paddingVertical: hp('0.8%'),
   flexDirection: 'row',
   alignItems: 'center',
   elevation: 0,
   height: hp('3%'),
 },
 midClearChipText: {
   color: "#1877F2",
   fontSize: wp('2.4%'),
   fontWeight: '500',
   marginLeft: wp('1%'),
   transform: [
    { translateY: Platform.OS === 'android' ? -1 : 0 }
  ],
 },
 suggestionItem: {
   padding: hp('1.3%'),
   borderBottomWidth: 1,
   borderBottomColor: '#eee',
   backgroundColor: "#fff",
 },
 suggestionsList: {
   maxHeight: hp('22%'),
   marginBottom: hp('1%'),
   borderRadius: wp('3%'),
   overflow: 'hidden',
   marginHorizontal: wp('5%'),
 },
 calendarWrapperTop: {
   marginTop: hp('1.2%'),
   backgroundColor: '#fff',
   borderRadius: wp('4%'),
   elevation: 3,
   shadowColor: '#000',
   shadowOpacity: 0.08,
   shadowRadius: hp('1%'),
   padding: wp('2.5%'),
   alignSelf: 'center',
   zIndex: 9999,
   position: "absolute",
   top: hp('31%'),
   left: wp('4%'),
   right: wp('4%'),
 },
 levelModalBox: {
   position: 'absolute',
   bottom: 0,
   left: 0,
   right: 0,
   backgroundColor: '#fff',
   borderTopLeftRadius: wp('6%'),
   borderTopRightRadius: wp('6%'),
   paddingVertical: hp('2%'),
   elevation: 14,
   shadowColor: '#000',
   shadowOpacity: 0.13,
   shadowRadius: hp('2.5%'),
   paddingBottom: hp('4%'),
 },
 levelModalItem: {
   alignItems: 'center',
   paddingVertical: hp('2%'),
   borderBottomWidth: 1,
   borderBottomColor: '#f3f3f3',
 },
 pin: {
   width: wp('11%'),
   height: wp('11%'),
   borderRadius: wp('5.5%'),
   borderWidth: 3,
   backgroundColor: "#fff",
   alignItems: 'center',
   justifyContent: 'center',
   shadowOpacity: 0.12,
   shadowRadius: hp('0.8%'),
   shadowOffset: { width: 0, height: hp('0.4%') },
   elevation: 5,
 },
 calloutBox: {
   backgroundColor: "#fff",
   padding: wp('3.5%'),
   borderRadius: wp('3.5%'),
   minWidth: wp('55%'),
   elevation: 6,
   shadowColor: '#000',
   shadowOpacity: 0.13,
   shadowRadius: hp('1%'),
   shadowOffset: { width: 0, height: hp('0.4%') },
 },
 calloutTitle: { fontWeight: "bold", fontSize: wp('4%'), color: "#222" },
 calloutMeta: { color: "#555", fontSize: wp('3.2%'), marginBottom: hp('0.7%') },
 calloutDesc: { color: "#888", fontSize: wp('3.2%'), marginBottom: hp('1.2%') },
 calloutBtn: {
   backgroundColor: "#3F4FFF",
   borderRadius: wp('3%'),
   paddingHorizontal: wp('4.5%'),
   paddingVertical: hp('0.9%'),
   alignItems: "center",
   marginTop: hp('0.4%'),
 },
 calloutBtnTxt: { color: "#fff", fontWeight: "bold" },
 cardPin: {
   width: wp('7%'),
   height: wp('7%'),
   borderRadius: wp('3.5%'),
   marginRight: wp('1.8%'),
   alignItems: 'center',
   justifyContent: 'center',
   borderWidth: 2,
 },
 myLocationBtn: {
   position: "absolute",
   bottom: hp('27%'),
   right: wp('6%'),
   backgroundColor: "#fff",
   borderRadius: wp('6.5%'),
   padding: wp('3%'),
   shadowColor: "#000",
   shadowOpacity: 0.15,
   shadowRadius: hp('1,1%'),
   shadowOffset: { width: 0, height: hp('0.3%') },
   elevation: 10,
   zIndex: 100,
 },
 modalBackground: {
   flex: 1,
   backgroundColor: 'rgba(18,24,38,0.17)',
   justifyContent: 'center',
   alignItems: 'center',
   paddingTop: hp('9%'),
   paddingBottom: hp('4.5%'),
 },
 sportsPanel: {
   width: '89%',
   backgroundColor: '#fff',
   borderRadius: wp('6%'),
   paddingVertical: hp('2%'),
   paddingHorizontal: wp('3.5%'),
   alignSelf: 'center',
   shadowColor: '#26305A',
   shadowOffset: { width: 0, height: hp('1%') },
   shadowOpacity: 0.11,
   shadowRadius: hp('3%'),
   elevation: 15,
   maxHeight: hp('55%'),
 },
 modalHeader: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   paddingBottom: hp('0.9%'),
   marginBottom: hp('0.5%'),
   borderBottomWidth: 1,
   borderColor: '#f1f3fa',
 },
 modalTitle: {
   fontSize: wp('4.8%'),
   fontWeight: 'bold',
   color: "#25326B",
   letterSpacing: 0.1
 },
 moreSportsItem: {
   flexDirection: "row",
   alignItems: "center",
   paddingVertical: hp('1.6%'),
   paddingHorizontal: wp('1.2%'),
   borderRadius: wp('2.5%'),
   marginBottom: hp('0.2%'),
 },
 moreSportIconBox: {
   width: wp('8.5%'),
   height: wp('8.5%'),
   borderRadius: wp('3%'),
   alignItems: 'center',
   justifyContent: 'center',
   marginRight: wp('3.5%'),
   backgroundColor: '#f4f5f7',
 },
 moreSportsText: {
   fontSize: wp('4%'),
   color: '#222',
   fontWeight: '500'
 },
 pickerModalOverlay: {
   flex: 1,
   backgroundColor: 'rgba(30,32,56,0.17)',
   justifyContent: 'center',
   alignItems: 'center',
   zIndex: 1000,
 },
 pickerModalBox: {
   width: '83%',
   backgroundColor: '#fff',
   borderRadius: wp('5%'),
   paddingTop: hp('2.2%'),
   paddingBottom: hp('1.5%'),
   paddingHorizontal: wp('4.2%'),
   alignItems: 'center',
   shadowColor: '#000',
   shadowOpacity: 0.13,
   shadowOffset: { width: 0, height: hp('0.9%') },
   shadowRadius: hp('2.3%'),
   elevation: 8,
 },
 pickerModalTitle: {
   fontSize: wp('4.2%'),
   fontWeight: '600',
   color: '#2A297A',
   marginBottom: hp('1.7%'),
 },
 pickerModalOption: {
   width: '100%',
   paddingVertical: hp('1.6%'),
   borderRadius: wp('2.5%'),
   alignItems: 'center',
   marginBottom: hp('0.5%'),
 },
 pickerModalOptionSelected: {
   backgroundColor: '#eef1ff',
 },
 pickerModalOptionText: {
   fontSize: wp('4%'),
   color: '#222',
   fontWeight: '500',
   letterSpacing: 0.08,
 },
 pickerModalOptionTextSelected: {
   color: '#3f4fff',
   fontWeight: 'bold',
 },
 pickerModalCancel: {
   marginTop: hp('0.9%'),
   paddingVertical: hp('1%'),
   paddingHorizontal: wp('4.5%'),
   borderRadius: wp('3%'),
 },
 pickerModalCancelText: {
   color: '#888',
   fontWeight: '600',
   fontSize: wp('4%'),
 },
 calendarModalBox: {
 width: '85%',
 backgroundColor: '#fff',
 borderRadius: 16,
 paddingVertical: 16,
 paddingHorizontal: 14,
 alignItems: 'center',
 shadowColor: '#000',
 shadowOpacity: 0.15,
 shadowRadius: 12,
 shadowOffset: { width: 0, height: 6 },
 elevation: 8,
},
calendarBoxHome: {
 width: '92%',
 borderRadius: 12,
 backgroundColor: '#fff',
 elevation: 3,          // Android shadow
 shadowColor: '#000',   // iOS shadow
 shadowOpacity: 0.08,
 shadowRadius: 6,
 shadowOffset: { width: 0, height: 3 },
 marginBottom: 12,
 alignSelf: 'center',
},
modalOverlay: {
 flex: 1,
 backgroundColor: 'rgba(0,0,0,0.4)',
 justifyContent: 'center',
 alignItems: 'center',
},
modalTitle: {
 fontSize: 18,
 fontWeight: '700',
 marginBottom: 10,
 color: '#000',
},
validateButton: {
 marginTop: 6,
 backgroundColor: '#3F4FFF',
 paddingVertical: 10,
 paddingHorizontal: 28,
 borderRadius: 10,
},
validateText: {
 color: '#fff',
 fontSize: 16,
 fontWeight: '700',
},
noSessionContainerFixed: {
  position: 'absolute',
  bottom: Platform.OS === 'ios' ? hp('2.5%') : hp('1.5%'), // ⬇️ on descend le container sur Android
  left: wp('7%'),
  right: wp('7%'),
  backgroundColor: '#fff',
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
  zIndex: 1,
  overflow: 'hidden',
},
noSessionGradientFixed: {
  width: '100%',
  paddingVertical: hp('2.5%'), // ✅ légèrement réduit
  paddingHorizontal: wp('6%'),
  borderRadius: 24,
  justifyContent: 'center',
  alignItems: 'center',
},
noSessionTitleFixed: {
  fontSize: wp('4.2%'),
  fontWeight: '700',
  color: '#1E1E1E',
  textAlign: 'center',
  marginBottom: hp('0.4%'),
},
noSessionSubtitleFixed: {
  fontSize: wp('3.4%'),
  color: '#6E6E6E',
  textAlign: 'center',
  marginBottom: hp('1.4%'),
  lineHeight: hp('2.2%'),
},
noSessionButtonFixed: {
  borderRadius: wp('5%'),
  overflow: 'hidden',
},
noSessionButtonGradientFixed: {
  borderRadius: wp('5%'),
  paddingVertical: hp('1.3%'),
  paddingHorizontal: wp('7%'),
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: wp('55%'),
},
noSessionButtonTextFixed: {
  color: '#fff',
  fontWeight: '700',
  fontSize: wp('3.6%'),
  textAlign: 'center',
},
modalContainer: {
  width: '85%',
  backgroundColor: '#fff',
  borderRadius: 20,
  paddingVertical: hp('2%'),
  paddingHorizontal: wp('4%'),
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 10,
},
dropdownItemText: {
  fontSize: wp('4%'),
  color: '#222',
  fontWeight: '500',
  textAlign: 'center',
},
dropdownItem: {
  width: '100%',
  paddingVertical: hp('1.6%'),
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
  alignItems: 'center',
},
createFromMapCard: {
  position: 'absolute',
  bottom: hp('10%'),
  left: wp('5%'),
  right: wp('5%'),
  backgroundColor: '#fff',
  borderRadius: 18,
  paddingVertical: hp('1.6%'),
  paddingHorizontal: wp('4%'),
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 12,
  zIndex: 100,
},
createFromMapHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: hp('0.6%'),
},
createFromMapTitle: {
  fontSize: wp('3.8%'),
  fontWeight: '700',
  color: '#222',
  flex: 1,
  marginRight: wp('2%'),
  textAlign: 'center',
},
createFromMapAddress: {
  fontSize: wp('3.4%'),
  color: '#666',
  lineHeight: wp('4.4%'),
  marginBottom: hp('1.2%'),
  textAlign: 'center',
},
createFromMapButton: {
  borderRadius: 14,
  paddingVertical: hp('1.2%'),
  paddingHorizontal: wp('6%'),
  alignItems: 'center',
  justifyContent: 'center',
},
createFromMapButtonText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: wp('3.4%'),
},
hintOverlay: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 paddingTop: hp('8%'),
 backgroundColor: 'transparent',
},
longPressHint: {
 position: 'absolute',
 bottom: hp('25%'),
 alignSelf: 'center',
 backgroundColor: 'rgba(255,255,255,0.97)',
 paddingHorizontal: 12,
 paddingVertical: 8,
 borderRadius: 14,
 flexDirection: 'row',
 alignItems: 'center',
 zIndex: 10000,
 elevation: 30,
 shadowColor: '#000',
 shadowOpacity: 0.18,
 shadowRadius: 10,
 shadowOffset: { width: 0, height: 4 },
},
longPressHintText: {
 fontSize: 12,
 fontWeight: '600',
 color: '#333',
},
});
