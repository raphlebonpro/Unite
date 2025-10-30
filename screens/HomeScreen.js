import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList,
Dimensions, Platform, SafeAreaView, ScrollView, Alert, Modal, ActivityIndicator,  Pressable,
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
import { useNavigation, useRoute, useFocusEffect, useIsFocused } from '@react-navigation/native';
import MiniAppBar from '../components/MiniAppBar';
import SessionCardHome from '../components/SessionCardHome';
import { getDistance } from 'geolib';
import { useNotificationRefresh } from '../context/NotificationContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '../mapboxConfig';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientTitle from '../components/GradientTitle';
import { Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import SessionGroupCard from '../components/SessionGroupCard';

const GOOGLE_MAPS_API_KEY =
Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ??
Constants.manifest?.extra?.GOOGLE_MAPS_API_KEY ??
'';
const PARIS_COORDS = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.05, longitudeDelta: 0.05 };

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
{ label: 'Running', icon: <MaterialCommunityIcons name="run-fast" size={hp('2.3%')} color="#E9436D" />, color: "#E9436D" },
{ label: 'Cyclisme', icon: <MaterialCommunityIcons name="bike" size={hp('2.1%')} color="#3CD6E6" /> },
{ label: 'Natation', icon: <MaterialCommunityIcons name="swim" size={hp('2.1%')} color="#1469B9" /> },
{ label: "Musculation", icon: <MaterialCommunityIcons name="dumbbell" size={hp('2.4%')} color="#7367F0"/>},
{ label: 'Autres', icon: <Ionicons name="ellipsis-horizontal" size={hp('2.2%')} color="#999" /> },
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
 Rugby: { icon: <MaterialCommunityIcons name="rugby" size={18} color="#8E44AD" />, color: '#8E44AD' },
 Volleyball: { icon: <MaterialCommunityIcons name="volleyball" size={18} color="#E57373" />, color: '#E57373' },
 Badminton: { icon: <MaterialCommunityIcons name="badminton" size={18} color="#49beb7" />, color: '#49beb7' },
 Triathlon: { icon: <MaterialCommunityIcons name="medal" size={18} color="#FF9800" />, color: '#FF9800' },
 'Randonnée/Trail': { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: '#43A047' },
 VTT: { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: '#009688' },
 Marche: { icon: <MaterialCommunityIcons name="walk" size={18} color="#00A676" />, color: '#00A676' },
 Kayak: { icon: <MaterialCommunityIcons name="kayaking" size={18} color="#0277BD" />, color: '#0277BD' },
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
 'Tennis de table': { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: '#00B8D4' },
 Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
 Pilate: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: '#BA68C8' },
 Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: '#4E342E' },
 Pétanque: { icon: <MaterialCommunityIcons name="bowling" size={18} color="#757575" />, color: '#757575' },
 '+ de sports': { icon: <MaterialCommunityIcons name="plus-circle" size={22} color="#1877F2" />, color: '#1877F2' },
};

const otherSports = [
 'Yoga',
 'Padel',
 'Handball',
 'Rugby',
 'Volleyball',
 'Badminton',
 'Triathlon',
 'Randonnée/Trail',
 'VTT',
 'Marche',
 'Kayak',
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
 'Tennis de table',
 'Danse',
 'Pilate',
 'Échecs',
 'Pétanque',
];

const { width } = Dimensions.get('window');

const APPBAR_H = 56;
const SEARCH_H = 44;
const CHIPS_H  = 40;

const HomeScreen = () => {
const navigation = useNavigation();
const route = useRoute();
const isFocused = useIsFocused();
const user = { avatar_url: null };
const { notifUnseen } = useNotificationRefresh();

const [region, setRegion] = useState(null);
const [myLocation, setMyLocation] = useState(null);
const [sessions, setSessions] = useState([]);
const [selectedSessionId, setSelectedSessionId] = useState(null);
const [selectedLevel, setSelectedLevel] = useState('');
const [selectedDate, setSelectedDate] = useState(null);
const [selectedSport, setSelectedSport] = useState('');
const [search, setSearch] = useState('');
const [suggestions, setSuggestions] = useState([]);
const [showLevelModal, setShowLevelModal] = useState(false);
const [showCalendar, setShowCalendar] = useState(false);
const [showMoreSports, setShowMoreSports] = useState(false);
const [is3D, setIs3D] = useState(false);

const mapRef = useRef(null);
const flatListRef = useRef(null);
const cameraRef = useRef(null);

const insets = useSafeAreaInsets();

// Ces valeurs dépendent de insets -> calculées à l'intérieur du composant

const [appBarH, setAppBarH] = useState(56);

const SEARCH_TOP  = insets.top + appBarH + 10;
const CHIPS_TOP   = SEARCH_TOP + SEARCH_H + 15;
const FILTERS_TOP = CHIPS_TOP + CHIPS_H + 5;


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
        await supabase.auth.signOut();
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      geolocPref = userData?.geoloc_enabled !== false;

      if (!geolocPref) {
        setRegion(PARIS_COORDS);
        setMyLocation(PARIS_COORDS);
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setRegion(PARIS_COORDS);
          setMyLocation(PARIS_COORDS);
        } else {
          let location = await Location.getCurrentPositionAsync({});
          const initialRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(initialRegion);
          setMyLocation(initialRegion);

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
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  })();
}, [navigation]);

// --- Fetch initial + au focus, puis polling 5s quand visible ---
useFocusEffect(
  useCallback(() => {
    let isActive = true;
    const load = async () => {
      if (!isActive) return;
      await fetchSessions();
    };
    load();

    // Polling 5s tant que l’écran est focus
    const id = setInterval(() => {
      if (isActive) fetchSessions();
    }, 5000);

    return () => {
      isActive = false;
      clearInterval(id);
    };
  }, [fetchSessions])
);

// --- (Optionnel) écoute temps réel INSERT/UPDATE pour réactivité instantanée
useEffect(() => {
  const channel = supabase
    .channel('public:sessions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      fetchSessions();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [fetchSessions]);

// --- Autocomplete robuste ---
useEffect(() => {
  const run = async () => {
    if (!search || search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const encoded = encodeURIComponent(search.trim());
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=fr&types=geocode&components=country:fr`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data?.predictions) ? data.predictions : []);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };
  run();
}, [search]);

const [heading, setHeading] = useState(0);

useEffect(() => {
  let subscription;
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      subscription = await Location.watchHeadingAsync((data) => {
        setHeading(data.trueHeading); // angle en degrés (0 = Nord)
      });
    }
  })();
  return () => {
    if (subscription) subscription.remove();
  };
}, []);

const focusOnSession = (session) => {
  if (!session?.lat || !session?.lng) return;

  const lat = Number(session.lat);
  const lng = Number(session.lng);

  // 👉 Zoom caméra
  cameraRef.current?.setCamera({
    centerCoordinate: [lng, lat],
    zoomLevel: 16,
    animationDuration: 1000,
  });

  // 👉 Scroll FlatList sur la carte correspondante
  const index = filteredSessions.findIndex((s) => s.id === session.id);
  if (index !== -1 && flatListRef.current) {
    flatListRef.current.scrollToIndex({ index, animated: true });
  }
};

const pulseAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);

const handleSuggestionPress = async (placeId, description) => {
  try {
    Keyboard.dismiss();
    setSuggestions([]);
    setSearch(description);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;
    const res = await fetch(url);
    const data = await res.json();

    const { lat, lng } = data?.result?.geometry?.location || {};
    if (typeof lat !== 'number' || typeof lng !== 'number') return;

    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    setRegion(newRegion);

    // ✅ Mapbox → on contrôle la caméra
    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 13,
      animationDuration: 1000,
    });

    setTimeout(() => Keyboard.dismiss(), 150);
  } catch (e) {
    console.error('Place details error:', e);
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

const clearFilters = async () => {
  setSelectedSport('');
  setSelectedLevel('');
  setSelectedDate(null);
  setSearch('');
  setSuggestions([]);

  const coords = await getFastLocation();
  if (!coords) {
    // fallback Paris si GPS KO
    setRegion(PARIS_COORDS);
    setMyLocation(PARIS_COORDS);
    cameraRef.current?.setCamera({
      centerCoordinate: [PARIS_COORDS.longitude, PARIS_COORDS.latitude],
      zoomLevel: 13,
      animationDuration: 800,
    });
    return;
  }

  const currentCoords = {
    ...coords,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  setRegion(currentCoords);
  setMyLocation(currentCoords);

  // 🔥 instantané, fluide
  cameraRef.current?.setCamera({
    centerCoordinate: [coords.longitude, coords.latitude],
    zoomLevel: 15,
    animationDuration: 800,
  });
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

function getDirectionCone(lat, lng, heading, distance = 0.0008, spread = 60) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Angles gauche/droite
  const left = toRad(heading - spread / 2);
  const right = toRad(heading + spread / 2);

  // Conversion degrés -> coordonnées (distance en mètres)
  const latOffset = (d, angle) => (d / 111320) * Math.cos(angle);
  const lngOffset = (d, angle) =>
    (d / (111320 * Math.cos(toRad(lat)))) * Math.sin(angle);

  const leftPoint = [
    lng + lngOffset(distance, left),
    lat + latOffset(distance, left),
  ];
  const rightPoint = [
    lng + lngOffset(distance, right),
    lat + latOffset(distance, right),
  ];

  // Polygon fermé
  return [[
    [lng, lat],   // centre
    leftPoint,    // point gauche
    rightPoint,   // point droit
    [lng, lat],   // retour au centre
  ]];
}

const today = new Date().toISOString().split('T')[0];

const isNoFilter =
  !selectedSport &&
  !selectedLevel &&
  (!selectedDate || selectedDate === today) &&
  !search;

let filteredSessions = [];

if (isNoFilter && region) {
  filteredSessions = [...sessions]
    .filter(session => isSessionInFuture(session))
    .map(session => ({
      ...session,
      distance: getDistance(
        { latitude: region.latitude, longitude: region.longitude },
        { latitude: Number(session.lat), longitude: Number(session.lng) }
      )
    }))
    .sort((a, b) => a.distance - b.distance);
} else {
  filteredSessions = sessions.filter(session => {
    if (!isSessionInFuture(session)) return false;
    if (selectedSport && session.sport !== selectedSport) return false;
    if (selectedLevel && session.level !== selectedLevel) return false;
    if (selectedDate && session.date !== selectedDate) return false;
    if (search && session.location && !session.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}


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
<TouchableOpacity style={styles.midFilterChip} onPress={() => setShowCalendar(true)}>
<Text style={styles.midChipText}>
  {formatDateLabel(selectedDate)}
</Text>
<AntDesign name="calendar" size={wp('3.5%')} style={{ marginLeft: wp('1.2%'), color: "#666" }} />
</TouchableOpacity>

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    {region ? (
      <MapboxGL.MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/mapbox/streets-v12"
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={15}
          centerCoordinate={[region.longitude, region.latitude]}
          pitch={is3D ? 60 : 0}
          bearing={is3D ? 20 : 0}
        />

        {/* Bâtiments en 3D */}
        {is3D && (
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceID="composite"
            sourceLayerID="building"
            style={{
              fillExtrusionColor: "#aaa",
              fillExtrusionHeight: ["get", "height"],
              fillExtrusionBase: ["get", "min_height"],
              fillExtrusionOpacity: 0.6,
            }}
          />
        )}

        {/* Sessions */}
        {filteredSessions.map((session, idx) => {
          const lat = Number(session.lat);
          const lng = Number(session.lng);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

          const sIcon = sportIcons[session.sport] || sportIcons["Autres"];

          return (
            <MapboxGL.PointAnnotation
              key={session.id || idx}
              id={`session-${session.id || idx}`}
              coordinate={[lng, lat]}
              onSelected={() => focusOnSession(session)}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 30,
                  padding: 6,
                  borderWidth: 1.5,
                  borderColor: "#f2f2f2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {React.cloneElement(sIcon.icon, { size: 22 })}
              </View>
            </MapboxGL.PointAnnotation>
          );
        })}

        {/* ✅ Point GPS orange dégradé */}
        {myLocation && (
          <>
            {/* Halo diffus orange */}
            <MapboxGL.ShapeSource
              id="gps-orange-halo"
              shape={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [myLocation.longitude, myLocation.latitude],
                },
              }}
            >
              <MapboxGL.CircleLayer
                id="gps-orange-halo-layer"
                style={{
                  circleRadius: 28,
                  circleColor: "rgba(255,140,0,0.25)", // orange clair
                  circleBlur: 12,
                }}
              />
            </MapboxGL.ShapeSource>

            {/* Point central orange */}
            <MapboxGL.ShapeSource
              id="gps-orange-center"
              shape={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [myLocation.longitude, myLocation.latitude],
                },
              }}
            >
              <MapboxGL.CircleLayer
                id="gps-orange-center-layer"
                style={{
                  circleRadius: 8,
                  circleColor: '#339CFF',
                  circleStrokeWidth: 2,
                  circleStrokeColor: "#fff", // contour blanc
                }}
              />
            </MapboxGL.ShapeSource>
          </>
        )}
      </MapboxGL.MapView>
    ) : (
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
          zIndex: 1,
        }}
      >
        <ActivityIndicator
          size={Platform.OS === "ios" ? "large" : 50}
          color="#3F4FFF"
        />
        <Text
          style={{
            color: "#999",
            fontSize: wp("3.8%"),
            marginTop: hp("2.5%"),
          }}
        >
          Chargement de la carte…
        </Text>
      </View>
    )}

{/* Toggle 2D/3D */}
<TouchableOpacity
  style={{
    position: "absolute",
    bottom: hp("34%"), // 👈 plus haut que le bouton ma position
    right: wp("6%"),
    backgroundColor: "#fff",
    borderRadius: wp("6.5%"),
    padding: wp("3%"),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 200,
  }}
  onPress={() => setIs3D(!is3D)}
  activeOpacity={0.8}
>
  {is3D ? (
    <MaterialCommunityIcons
      name="cube-outline"
      size={wp("6%")}
      color="#3F4FFF"
    />
  ) : (
    <MaterialCommunityIcons
      name="square-outline"
      size={wp("6%")}
      color="#3F4FFF"
    />
  )}
</TouchableOpacity>


    {/* AppBar */}
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, zIndex: 30,
    }}>
      <MiniAppBar
        title="Accueil"
        profileUri={user?.avatar_url}
        hasNotifications={notifUnseen > 0}
        onProfilePress={() => navigation.navigate('Profile')}
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
    value={search}
    onChangeText={setSearch}
    style={{
      flex: 1,
      fontSize: wp('3.8%'),
      color: '#222',
      paddingVertical: 0,
    }}
    placeholderTextColor="#666"
  />

  {/* ❌ Petite croix pour effacer le champ */}
  {search.length > 0 && (
    <TouchableOpacity
      onPress={() => {
        setSearch('');
        setSuggestions([]);
        clearFilters(); // 👈 recentre aussi la carte proprement
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

    {/* Chips sports */}
    <View style={{ position: 'absolute', top: CHIPS_TOP, left: 0, right: 0, zIndex: 998, flexDirection: 'row', paddingHorizontal: wp('2.5%') }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sportData.map((sport) => (
          <TouchableOpacity
            key={sport.label}
            style={[
              styles.midChip,
              selectedSport === sport.label && styles.midChipSelected,
            ]}
            onPress={() => setSelectedSport(selectedSport === sport.label ? '' : sport.label)}
            activeOpacity={0.88}
          >
            {React.cloneElement(sport.icon, { size: wp('3.8%') })}
            <Text style={[
              styles.midChipText,
              selectedSport === sport.label && { color: '#fff' }
            ]}>
              {sport.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.midChip, { borderColor: '#DDD', backgroundColor: '#F3F4F8', marginRight: wp('1.5%') }]}
          onPress={() => setShowMoreSports(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={wp('5%')} color="#1877F2" style={{ marginRight: wp('0.5%') }} />
          <Text style={[styles.midChipText, { color: "#1877F2" }]}>de sports</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>

    {/* Modal autres sports */}
    <Modal
      visible={showMoreSports}
      animationType="fade"
      transparent
      onRequestClose={() => setShowMoreSports(false)}
    >
      <View style={styles.modalBackground}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowMoreSports(false)}
        />
        <View style={styles.sportsPanel}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Autres sports</Text>
            <TouchableOpacity onPress={() => setShowMoreSports(false)}>
              <AntDesign name="closecircleo" size={wp('5.5%')} color="#888" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp('55%') }}>
            {otherSports.map((sport) => {
              const iconObj = sportIcons[sport] || sportIcons["Autres"];
              return (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.moreSportsItem,
                    selectedSport === sport && { backgroundColor: "#e9f0ff" }
                  ]}
                  onPress={() => {
                    setSelectedSport(sport);
                    setShowMoreSports(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.moreSportIconBox, { backgroundColor: (iconObj.color || "#DDD") + "16" }]}>
                    {React.cloneElement(iconObj.icon, { size: wp('4.5%') })}
                  </View>
                  <Text style={[
                    styles.moreSportsText,
                    selectedSport === sport && { color: "#3f4fff", fontWeight: "700" }
                  ]}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowMoreSports(false)} />
      </View>
    </Modal>

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
      <TouchableOpacity style={styles.midFilterChip} onPress={() => setShowLevelModal(true)}>
        <Text style={[
          styles.midChipText,
          selectedLevel ? { color: "#3F4FFF" } : {}
        ]}>
          {selectedLevel || 'Niveau'}
        </Text>
        <AntDesign name="down" size={wp('3.2%')} style={{ marginLeft: wp('1%'), color: selectedLevel ? "#3F4FFF" : "#666" }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.midFilterChip} onPress={() => setShowCalendar(!showCalendar)}>
        <Text style={styles.midChipText}>{selectedDate}</Text>
        <AntDesign name="calendar" size={wp('3.5%')} style={{ marginLeft: wp('1.2%'), color: "#666" }} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.midClearChip} onPress={clearFilters}>
        <AntDesign name="close" size={wp('3.4%')} color="#1877F2" />
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
            style={styles.pickerModalCancel}
          >
            <Text style={styles.pickerModalCancelText}>Annuler</Text>
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
{/* Bouton Créer une session */}
<TouchableOpacity
  onPress={() => navigation.navigate('Créer')}
  style={{
    position: 'absolute',
    bottom: hp('21%'), // 👈 juste au-dessus des cartes
    left: wp('5%'),
    zIndex: 60,
    backgroundColor: '#fff', // ✅ fond blanc
    borderRadius: 20,
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('3.5%'),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  }}
  activeOpacity={0.85}
>
  <Text
    style={{
      color: '#3F4FFF', // 🎨 bleu foncé
      fontWeight: '700',
      fontSize: wp('3.3%'),
      textAlign: 'center',
    }}
  >
    + Créer une session
  </Text>
</TouchableOpacity>


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
          navigation.navigate('GroupDetail', { groupId: item.group_id })
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
  <View style={styles.noSessionContainerCompact}>
    <LinearGradient
      colors={['#F7F8FF', '#FFFFFF']}
      style={styles.noSessionCompactGradient}
    >
      <MaterialCommunityIcons
        name="map-search-outline"
        size={wp('8%')}
        color="#3F4FFF"
        style={{ marginBottom: hp('0.8%') }}
      />

      <Text style={styles.noSessionCompactTitle}>Aucune session trouvée</Text>

      <Text style={styles.noSessionCompactSubtitle}>
        Essaie un autre sport ou élargis ta recherche
      </Text>

      <TouchableOpacity
        style={styles.noSessionButton}
        activeOpacity={0.85}
        onPress={clearFilters}
      >
        <LinearGradient
          colors={['#3F4FFF', '#7A5CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.noSessionButtonGradient}
        >
          <Text style={styles.noSessionButtonText}>Effacer tous les filtres</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  </View>
)}

{/* Ma position */}
{region && (
<TouchableOpacity
  style={styles.myLocationBtn}
  onPress={async () => {
    const coords = await getFastLocation();
    if (!coords) return;

    const currentCoords = {
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    setRegion(currentCoords);
    setMyLocation(coords);

    cameraRef.current?.setCamera({
      centerCoordinate: [coords.longitude, coords.latitude],
      zoomLevel: 15,
      animationDuration: 800,
    });
  }}
  activeOpacity={0.8}
>
  <MaterialIcons name="my-location" size={wp('6.2%')} color="#3F4FFF" />
</TouchableOpacity>
)}
  </SafeAreaView>
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
   height: hp('4%'),
 },
 midClearChipText: {
   color: "#1877F2",
   fontSize: wp('3.4%'),
   fontWeight: '500',
   marginLeft: wp('1%'),
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


// si pas déjà présent
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
  noSessionContainerCompact: {
    position: 'absolute',
    bottom: hp('2%'), // 👈 encore plus bas
    left: wp('6%'),
    right: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  noSessionCompactGradient: {
    width: '100%',
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSessionCompactTitle: {
    fontSize: wp('3.9%'),
    fontWeight: '600',
    color: '#2E2E2E',
    textAlign: 'center',
  },
  noSessionCompactSubtitle: {
    fontSize: wp('3.3%'),
    color: '#777',
    textAlign: 'center',
    marginTop: hp('0.5%'),
    marginBottom: hp('1.2%'),
  },
  noSessionButton: {
    marginTop: hp('0.5%'),
    borderRadius: wp('5%'),
    overflow: 'hidden',
  },
  noSessionButtonGradient: {
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('5%'),
  },
  noSessionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.6%'),
    textAlign: 'center',
  },
});