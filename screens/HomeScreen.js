import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList,
  Dimensions, Platform, ScrollView, Alert, Modal,
  ActivityIndicator, Pressable, Image, Animated,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import {
  AntDesign, FontAwesome5, MaterialCommunityIcons, Ionicons,
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
import { useAppForeground } from '../context/AppForegroundContext';

// ─── Calendrier en français ───────────────────────────────────────────────────
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

const APPBAR_H   = 56;
const SEARCH_H   = 46;
const SEARCH_TOP   = APPBAR_H + (Platform.OS === 'ios' ? 2 : 10);
const FILTERS_TOP  = SEARCH_TOP + SEARCH_H + 8;

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ??
  Constants.manifest?.extra?.GOOGLE_MAPS_API_KEY ?? '';

const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
const PARIS_REGION = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.20, longitudeDelta: 0.20 };

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

const levelData = [
  { label: "Pour s'amuser", icon: 'emoticon-happy-outline', color: '#FFA726', bg: '#FFF5E5' },
  { label: 'Débutant',      icon: 'sprout-outline',         color: '#2ECC71', bg: '#EDFBF3' },
  { label: 'Intermédiaire', icon: 'lightning-bolt',         color: '#3888FF', bg: '#EBF2FF' },
  { label: 'Avancé',        icon: 'fire',                   color: '#FE5D02', bg: '#FFF3EE' },
];

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const { notifUnseen } = useNotificationRefresh();

  const [region, setRegion]                         = useState(null);
  const [myLocation, setMyLocation]                 = useState(null);
  const [sessions, setSessions]                     = useState([]);
  const [selectedLevel, setSelectedLevel]           = useState('');
  const [selectedDate, setSelectedDate]             = useState(null);
  const [selectedSport, setSelectedSport]           = useState('');
  const [inputValue, setInputValue]                 = useState('');
  const [searchQuery, setSearchQuery]               = useState('');
  const [suggestions, setSuggestions]               = useState([]);
  const [searchFocused, setSearchFocused]           = useState(false);
  const [showLevelModal, setShowLevelModal]         = useState(false);
  const [showCalendar, setShowCalendar]             = useState(false);
  const [mapReady, setMapReady]                     = useState(false);
  const [sportPickerVisible, setSportPickerVisible] = useState(false);
  const [showOtherSports, setShowOtherSports]       = useState(false);
  const [pressedPoint, setPressedPoint]             = useState(null);
  const [gpsEnabled, setGpsEnabled]                 = useState(true);
  const [regionSource, setRegionSource]             = useState('gps');
  const [locationBounds, setLocationBounds]         = useState(null);
  const [showLongPressHint, setShowLongPressHint]   = useState(false);

  const hasLongPressed  = useRef(false);
  const firstHintShown  = useRef(false);
  const hintOpacity     = useRef(new Animated.Value(0)).current;
  const flatListRef     = useRef(null);
  const searchBarAnim   = useRef(new Animated.Value(0)).current;
  const insets          = useSafeAreaInsets();

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('sessions').select('*, groups (id, name)').order('date', { ascending: true });
    if (error) { setSessions([]); return; }
    setSessions(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { await supabase.auth.signOut(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
        const { data: userData, error: userDataError } = await supabase
          .from('users').select('geoloc_enabled').eq('id', user.id).single();
        if (userDataError) { setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER); return; }
        const geolocPref = userData?.geoloc_enabled !== false;
        if (!geolocPref) {
          setGpsEnabled(false); setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setGpsEnabled(false); setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER);
          } else {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
            setMyLocation({ latitude, longitude });
            await supabase.from('users').update({ last_lat: latitude, last_lng: longitude }).eq('id', user.id);
          }
        }
      } catch { setGpsEnabled(false); setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER); }
    })();
  }, [navigation]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) return '';
      const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=fr`);
      const data = await res.json();
      return (data.status === 'OK' && data.results?.length) ? data.results[0].formatted_address : '';
    } catch { return ''; }
  };

  useFocusEffect(useCallback(() => { fetchSessions(); }, [fetchSessions]));

  useAppForeground(fetchSessions);

  useEffect(() => {
    const ch = supabase.channel('public:sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchSessions()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchSessions]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) { setSuggestions([]); return; }
    const run = async () => {
      try {
        const res  = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchQuery.trim())}&key=${GOOGLE_MAPS_API_KEY}&language=fr`);
        const data = await res.json();
        setSuggestions(Array.isArray(data?.predictions) ? data.predictions : []);
      } catch { setSuggestions([]); }
    };
    run();
  }, [searchQuery]);

  const handleSuggestionPress = async (placeId, description) => {
    try {
      Keyboard.dismiss(); setSuggestions([]);
      setInputValue(description); setSearchQuery(''); setSearchFocused(false);
      const res  = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=fr`);
      const data = await res.json();
      const geometry = data?.result?.geometry;
      if (!geometry?.location || !geometry?.viewport) return;
      const { lat, lng } = geometry.location;
      const { northeast, southwest } = geometry.viewport;
      const latDelta = Math.abs(northeast.lat - southwest.lat) * 1.2;
      const lngDelta = Math.abs(northeast.lng - southwest.lng) * 1.2;
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: Math.min(Math.max(latDelta, 0.02), 0.8), longitudeDelta: Math.min(Math.max(lngDelta, 0.02), 0.8) });
      setLocationBounds({ north: northeast.lat, south: southwest.lat, east: northeast.lng, west: southwest.lng });
      setRegionSource('manual');
    } catch (e) { console.error(e); }
  };

  const getFastLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const last = await Location.getLastKnownPositionAsync({});
      if (last?.coords) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
      const fresh = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Platform.OS === 'android' ? Location.Accuracy.Low : Location.Accuracy.Balanced, maximumAge: 10000, timeout: 5000 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      return fresh?.coords ? { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude } : null;
    } catch { return null; }
  };

  const fadeInHint  = () => Animated.timing(hintOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  const fadeOutHint = () => Animated.timing(hintOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();

  const clearFilters = async () => {
    setSelectedSport(''); setSelectedLevel(''); setSelectedDate(null);
    setInputValue(''); setSearchQuery(''); setSuggestions([]); setLocationBounds(null);
    hasAdjustedZoom.current = false;
    if (!gpsEnabled) { setRegionSource('default'); setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER); return; }
    setRegionSource('gps');
    const coords = await getFastLocation();
    if (!coords) { setRegion(PARIS_REGION); setMyLocation(PARIS_CENTER); return; }
    setRegion({ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    setMyLocation(coords);
  };

  function isSessionInFuture(session) {
    if (!session.date || !session.time) return false;
    try { return new Date(`${session.date}T${session.time.slice(0, 5)}`) > new Date(); } catch { return false; }
  }

  const getAdaptiveDelta = (sessions) => {
    if (!sessions?.length) return 0.85;
    const nearest = Math.min(...sessions.map(s => s.distance));
    if (nearest < 1000) return 0.06; if (nearest < 3000) return 0.10;
    if (nearest < 8000) return 0.18; if (nearest < 20000) return 0.30;
    return 0.45;
  };

  const filteredSessions = useMemo(() => {
    if (!region || !sessions.length) return [];
    return sessions
      .filter(isSessionInFuture)
      .map(session => {
        const sessionDateTime = new Date(`${session.date}T${session.time.slice(0, 5)}`);
        const distance = getDistance(
          { latitude: region.latitude, longitude: region.longitude },
          { latitude: Number(session.lat), longitude: Number(session.lng) }
        );
        return { ...session, sessionDateTime, distance };
      })
      .filter(session => {
        if (!locationBounds) return true;
        const lat = Number(session.lat), lng = Number(session.lng);
        return lat >= locationBounds.south && lat <= locationBounds.north && lng >= locationBounds.west && lng <= locationBounds.east;
      })
      .filter(session => {
        if (selectedSport && session.sport !== selectedSport) return false;
        if (selectedLevel && session.level !== selectedLevel) return false;
        if (selectedDate  && session.date  !== selectedDate)  return false;
        return true;
      })
      .sort((a, b) => a.distance !== b.distance ? a.distance - b.distance : a.sessionDateTime - b.sessionDateTime);
  }, [sessions, region, selectedSport, selectedLevel, selectedDate, locationBounds]);

  const hasAdjustedZoom = useRef(false);

  useEffect(() => {
    if (!region || !filteredSessions || hasAdjustedZoom.current || regionSource !== 'gps') return;
    setRegion(prev => ({ ...prev, latitudeDelta: getAdaptiveDelta(filteredSessions), longitudeDelta: getAdaptiveDelta(filteredSessions) }));
    hasAdjustedZoom.current = true;
  }, [filteredSessions, region, regionSource]);

  useEffect(() => {
    if (hasLongPressed.current) return;
    let interval;
    const showHint = (dur) => {
      if (hasLongPressed.current) return;
      setShowLongPressHint(true); fadeInHint();
      setTimeout(() => { fadeOutHint(); setTimeout(() => setShowLongPressHint(false), 300); }, dur);
    };
    if (!firstHintShown.current) { firstHintShown.current = true; showHint(5000); }
    interval = setInterval(() => showHint(5000), 60000);
    return () => clearInterval(interval);
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
      .map(s => ({ id: s.id, lat: Number(s.lat), lng: Number(s.lng), sport: sportIcons[s.sport] ? s.sport : 'Autres' }));
  }, [filteredSessions]);

  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchBarAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchBarAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const searchBorderColor = searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['#F0F0F4', '#FE5D02'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* CARTE */}
      {region && (
        <MapViewUnite
          key={`${region.latitude}-${region.longitude}-${region.latitudeDelta}`}
          region={region}
          sessions={normalizedSessions.map(s => ({ ...s, icon: sportIcons[s.sport]?.icon || sportIcons.Autres.icon }))}
          gpsEnabled={gpsEnabled}
          userLocation={myLocation}
          onMapReady={() => setMapReady(true)}
          onSelectSession={(session) => navigation.navigate('SessionDetail', { sessionId: session.id })}
          selectedPoint={pressedPoint}
          onLongPress={async ({ latitude, longitude }) => {
            setPressedPoint({ latitude, longitude, address: "Chargement…" });
            const address = await reverseGeocode(latitude, longitude);
            setPressedPoint({ latitude, longitude, address: address || 'Adresse inconnue' });
          }}
        />
      )}

      {/* OVERLAY LOADING */}
      {!mapReady && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 50} color="#FE5D02" />
          <Text style={{ marginTop: hp('2%'), color: '#999', fontSize: wp('3.8%') }}>Chargement de la carte…</Text>
        </View>
      )}

      {/* APPBAR */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <MiniAppBar
          centerComponent={
            <Image source={require('../assets/UniteLogo.png')} resizeMode="contain"
              style={{ height: 120, width: 100, transform: [{ translateY: Platform.OS === 'ios' ? -1.5 : 0 }] }}
            />
          }
          onNotificationsPress={() => navigation.navigate('Notifications')}
          onLeaderboardPress={() => navigation.navigate('LeaderBoard')}
        />
      </View>

      {/* SEARCH BAR */}
      <View style={{ position: 'absolute', top: SEARCH_TOP, left: wp('4%'), right: wp('4%'), zIndex: 999 }}>
        <Animated.View style={[styles.searchBar, { borderColor: searchBorderColor }]}>
          <Ionicons
            name={searchFocused ? 'location' : 'search-outline'}
            size={wp('4.2%')}
            color={searchFocused || inputValue.length > 0 ? '#FE5D02' : '#B0B4BA'}
            style={{ marginRight: wp('2.5%') }}
          />
          <TextInput
            placeholder="Où voulez-vous bouger ?"
            value={inputValue}
            onChangeText={(text) => { setInputValue(text); setSearchQuery(text); }}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            style={styles.searchInput}
            placeholderTextColor="#C0C0C0"
            returnKeyType="search"
          />
          {inputValue.length > 0 && (
            <TouchableOpacity
              onPress={() => { setInputValue(''); setSearchQuery(''); setSuggestions([]); clearFilters(); Keyboard.dismiss(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.searchClearBtn}
              activeOpacity={0.6}
            >
              <AntDesign name="close" size={wp('2.8%')} color="#888" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            <FlatList
              data={suggestions}
              keyExtractor={item => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item.place_id, item.description)}
                >
                  <Ionicons name="location-outline" size={14} color="#FE5D02" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{item.description}</Text>
                </TouchableOpacity>
              )}
              style={{ width: '100%' }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>

      {suggestions.length > 0 && (
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
          onPress={() => { Keyboard.dismiss(); setSuggestions([]); }}
        />
      )}

      {/* ── FILTER CHIPS — ScrollView horizontal pour éviter le débordement ── */}
      <View style={styles.filterRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRowContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={[styles.chip, selectedSport && styles.chipActive]} onPress={() => setSportPickerVisible(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="run-fast" size={wp('3%')} color={selectedSport ? '#FE5D02' : '#888'} style={{ marginRight: 3 }} />
            <Text style={[styles.chipText, selectedSport && styles.chipTextActive]} numberOfLines={1}>{selectedSport || 'Sport'}</Text>
            <AntDesign name={selectedSport ? 'up' : 'down'} size={wp('2.5%')} style={{ marginLeft: 2, color: selectedSport ? '#FE5D02' : '#BBB' }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, selectedLevel && styles.chipActive]} onPress={() => setShowLevelModal(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="lightning-bolt" size={wp('3%')} color={selectedLevel ? '#FE5D02' : '#888'} style={{ marginRight: 3 }} />
            <Text style={[styles.chipText, selectedLevel && styles.chipTextActive]} numberOfLines={1}>{selectedLevel || 'Niveau'}</Text>
            <AntDesign name={selectedLevel ? 'up' : 'down'} size={wp('2.5%')} style={{ marginLeft: 2, color: selectedLevel ? '#FE5D02' : '#BBB' }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.chip, selectedDate && styles.chipActive]} onPress={() => setShowCalendar(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar-outline" size={wp('3%')} color={selectedDate ? '#FE5D02' : '#888'} style={{ marginRight: 3 }} />
            <Text style={[styles.chipText, selectedDate && styles.chipTextActive]} numberOfLines={1}>{selectedDate ? formatDateLabel(selectedDate) : 'Date'}</Text>
            <AntDesign name={selectedDate ? 'up' : 'down'} size={wp('2.5%')} style={{ marginLeft: 2, color: selectedDate ? '#FE5D02' : '#BBB' }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.chipClear} onPress={clearFilters} activeOpacity={0.7}>
            <AntDesign name="close" size={wp('2.5%')} color="#888" />
            <Text style={styles.chipClearText}>Effacer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* MODAL NIVEAU */}
      <Modal visible={showLevelModal} transparent animationType="fade" onRequestClose={() => setShowLevelModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowLevelModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.centeredBox}>
              <Text style={styles.centeredBoxTitle}>Niveau</Text>
              {levelData.map(({ label, icon, color, bg }) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.centeredItem, selectedLevel === label && styles.centeredItemActive]}
                  onPress={() => { setSelectedLevel(label); setShowLevelModal(false); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.centeredItemIcon, { backgroundColor: bg }]}>
                    <MaterialCommunityIcons name={icon} size={18} color={color} />
                  </View>
                  <Text style={[styles.centeredItemText, selectedLevel === label && styles.centeredItemTextActive]}>{label}</Text>
                  {selectedLevel === label && <View style={styles.check}><AntDesign name="check" size={11} color="#fff" /></View>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.boxBtn} onPress={() => setShowLevelModal(false)}>
  <Text style={styles.boxBtnText}>Fermer</Text>
</TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL CALENDRIER */}
      <Modal transparent animationType="fade" visible={showCalendar} onRequestClose={() => setShowCalendar(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { paddingHorizontal: wp('3%') }]}>
              <Text style={styles.centeredBoxTitle}>Choisir une date</Text>
              <Calendar
                onDayPress={(day) => { setSelectedDate(day.dateString); setShowCalendar(false); }}
                markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#FE5D02' } } : {}}
                minDate={new Date().toISOString().slice(0, 10)}
                theme={{
                  selectedDayBackgroundColor: '#FE5D02',
                  todayTextColor: '#FE5D02',
                  arrowColor: '#FE5D02',
                  textDayFontSize: 15,
                  textMonthFontSize: 15,
                  textDayHeaderFontSize: 12,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                  'stylesheet.calendar.header': {
                    dayTextAtIndex0: { color: '#E9436D' },
                    dayTextAtIndex6: { color: '#E9436D' },
                  },
                }}
                style={{ borderRadius: 12, width: '100%' }}
              />
              <TouchableOpacity style={styles.boxBtn} onPress={() => setShowCalendar(false)}>
                <Text style={styles.boxBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SPORT */}
      <Modal transparent visible={sportPickerVisible} animationType="fade"
        onRequestClose={() => { setSportPickerVisible(false); setShowOtherSports(false); }}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1}
          onPress={() => { setSportPickerVisible(false); setShowOtherSports(false); }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { paddingHorizontal: 0, maxHeight: hp('65%') }]}>
              <Text style={[styles.centeredBoxTitle, { paddingHorizontal: wp('5%') }]}>
                {showOtherSports ? 'Autres sports' : 'Choisir un sport'}
              </Text>
              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                {(!showOtherSports ? sportData : otherSports.map(l => ({ label: l }))).map((item) => {
                  const label = item.label;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.sportItem, selectedSport === label && styles.sportItemActive]}
                      onPress={() => {
                        if (label === '+ de sports') { setShowOtherSports(true); return; }
                        setSelectedSport(label); setSportPickerVisible(false); setShowOtherSports(false);
                      }}
                    >
                      <View style={{ marginRight: 12 }}>{item.icon || sportIcons[label]?.icon}</View>
                      <Text style={[styles.sportItemText, selectedSport === label && styles.sportItemTextActive]}>{label}</Text>
                      {selectedSport === label && <View style={styles.check}><AntDesign name="check" size={11} color="#fff" /></View>}
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

      {/* SESSIONS */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: hp('2%'), zIndex: 50 }}>
        <View style={{ shadowColor: '#000', shadowOpacity: 0.11, shadowRadius: hp('1.8%'), shadowOffset: { width: 0, height: hp('0.6%') }, elevation: 8 }}>
          <FlatList
            ref={flatListRef}
            horizontal
            data={filteredSessions}
            keyExtractor={item => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: wp('2.5%'), paddingRight: wp('2.5%') }}
            ItemSeparatorComponent={() => <View style={{ width: wp('2.5%') }} />}
            renderItem={({ item }) => item.group_id ? (
              <SessionGroupCard session={item} onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })} />
            ) : (
              <SessionCardHome session={item} onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })} />
            )}
          />
        </View>
      </View>

      {/* NO SESSION */}
      {filteredSessions.length === 0 && (
        <View style={styles.noSessionContainer}>
          <LinearGradient colors={['#F9FAFF', '#FFFFFF']} style={styles.noSessionGradient}>
            <MaterialCommunityIcons name="map-search-outline" size={wp('6%')} color="#FE5D02" style={{ marginBottom: hp('0.6%') }} />
            <Text style={styles.noSessionTitle}>Aucune session trouvée</Text>
            <Text style={styles.noSessionSub}>Essaie un autre sport ou élargis ta recherche</Text>
            <TouchableOpacity style={styles.noSessionBtn} activeOpacity={0.85} onPress={clearFilters}>
              <View style={[styles.noSessionBtnInner, { backgroundColor: '#FE5D02' }]}>
                <Text style={styles.noSessionBtnText}>Effacer tous les filtres</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* CARD LONG PRESS */}
      {pressedPoint && (
        <View style={styles.pressedCard}>
          <View style={styles.pressedCardAccent} />
          <View style={styles.pressedCardContent}>
            <View style={styles.pressedCardLeft}>
              <View style={styles.pressedCardIconBox}>
                <Ionicons name="location" size={20} color="#FE5D02" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pressedCardLabel}>Emplacement sélectionné</Text>
                <Text style={styles.pressedCardAddress} numberOfLines={2}>{pressedPoint.address}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setPressedPoint(null)} hitSlop={10} style={styles.pressedCardClose}>
              <AntDesign name="close" size={16} color="#AAA" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.pressedCardBtn}
            activeOpacity={0.88}
            onPress={() => {
              navigation.navigate('Créer', {
                prefillLat: pressedPoint.latitude,
                prefillLng: pressedPoint.longitude,
                prefillAddress: pressedPoint.address,
              });
              setPressedPoint(null);
            }}
          >
            <Ionicons name="add-circle-outline" size={17} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.pressedCardBtnText}>Créer une session ici</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOUTON "CRÉER ICI" — hint permanent, visible en bas à gauche ─────
           Disparaît quand une card pressedPoint est déjà affichée            */}
{!pressedPoint && (
  <TouchableOpacity
    style={[
      styles.pinHintBtn,
      { bottom: hp('2%') + insets.bottom + hp(Platform.OS === 'android' ? '20%' : '14%') }
    ]}
    activeOpacity={0.82}
    onPress={() => Alert.alert(
      'Créer ici',
      "Fais un appui long n'importe où sur la carte pour créer une session à cet endroit précis.",
      [{ text: 'OK' }]
    )}
  >
    <MaterialCommunityIcons name="gesture-tap-hold" size={18} color="#555" style={{ marginRight: 5 }} />
    <Text style={styles.pinHintBtnText}>Créer ici</Text>
  </TouchableOpacity>
)}
    </View>
  );
};

export default HomeScreen;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
    height: SEARCH_H,
    paddingHorizontal: wp('4%'),
  },
  searchInput: {
    flex: 1, fontSize: wp('3.7%'), color: '#1A1A1A',
    paddingVertical: 0, fontWeight: '400',
  },
  searchClearBtn: {
    marginLeft: wp('1.5%'),
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F0F0F4',
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionBox: {
    position: 'absolute', top: SEARCH_H + 6,
    left: 0, right: 0,
    zIndex: 9999, elevation: 12,
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    maxHeight: hp('38%'), overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: hp('1.5%'), paddingHorizontal: wp('4%'),
    borderBottomWidth: 1, borderBottomColor: '#F5F5F7',
  },
  suggestionText: { flex: 1, fontSize: wp('3.7%'), color: '#222' },

  // ── Filtres — ScrollView horizontal ──────────────────────────────────────
  filterRowWrap: {
    position: 'absolute', top: FILTERS_TOP, left: 0, right: 0,
    zIndex: 997,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: 2,
  },

  // ── Chips — identiques à doc 15 ────────────────────────────────────────
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    paddingHorizontal: wp('2.9%'),
    paddingVertical: hp('0.85%'),
    marginRight: wp('1.8%'),
    height: hp('3.9%'),
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipActive: { backgroundColor: '#FFF3EE', borderColor: '#FE5D02' },
  chipText: { fontSize: wp('3.1%'), color: '#555', fontWeight: '600', maxWidth: wp('18%') },
  chipTextActive: { color: '#FE5D02' },
  chipClear: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 22, paddingHorizontal: wp('2.6%'), paddingVertical: hp('0.85%'),
    height: hp('3.4%'),
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chipClearText: { color: '#888', fontSize: wp('2.7%'), fontWeight: '600', marginLeft: 3 },

  // ── Modals ────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  centeredBox: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingTop: hp('2.5%'), paddingBottom: hp('2%'),
    paddingHorizontal: wp('5%'),
    width: wp('88%'),
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  centeredBoxTitle: { fontSize: wp('4.4%'), fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: hp('1.8%') },
  centeredItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp('1.5%'), borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  centeredItemActive: { backgroundColor: '#FFF8F5' },
  centeredItemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: wp('3.5%'), flexShrink: 0 },
  centeredItemText: { flex: 1, fontSize: wp('4%'), fontWeight: '500', color: '#222' },
  centeredItemTextActive: { color: '#FE5D02', fontWeight: '700' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FE5D02', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  boxBtn: { height: hp('4.5%'), backgroundColor: '#FE5D02', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: hp('1.5%'), },
  boxBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.9%') },
  sportItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp('1.5%'), paddingHorizontal: wp('5%'), borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  sportItemActive: { backgroundColor: '#FFF8F5' },
  sportItemText: { flex: 1, fontSize: wp('3.9%'), fontWeight: '500', color: '#222' },
  sportItemTextActive: { color: '#FE5D02', fontWeight: '700' },

  // ── No session ────────────────────────────────────────────────────────────
  noSessionContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? hp('2.5%') : hp('1.5%'), left: wp('7%'), right: wp('7%'), backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5, zIndex: 1, overflow: 'hidden' },
  noSessionGradient: { width: '100%', paddingVertical: hp('2.5%'), paddingHorizontal: wp('6%'), borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  noSessionTitle: { fontSize: wp('4.2%'), fontWeight: '700', color: '#1E1E1E', textAlign: 'center', marginBottom: hp('0.4%') },
  noSessionSub: { fontSize: wp('3.4%'), color: '#6E6E6E', textAlign: 'center', marginBottom: hp('1.4%'), lineHeight: hp('2.2%') },
  noSessionBtn: { borderRadius: wp('5%'), overflow: 'hidden' },
  noSessionBtnInner: { borderRadius: wp('5%'), paddingVertical: hp('1.3%'), paddingHorizontal: wp('7%'), alignItems: 'center', justifyContent: 'center', minWidth: wp('55%') },
  noSessionBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%'), textAlign: 'center' },

  // ── Card long press ───────────────────────────────────────────────────────
  pressedCard: {
    position: 'absolute',
    bottom: hp('3%'), left: wp('5%'), right: wp('5%'),
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 14, zIndex: 100,
  },
  pressedCardAccent: { height: 3, backgroundColor: '#FE5D02' },
  pressedCardContent: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: hp('1.4%'), paddingHorizontal: wp('4%'), paddingBottom: hp('1%') },
  pressedCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  pressedCardIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center', marginRight: wp('3%'), flexShrink: 0, marginTop: 2 },
  pressedCardLabel: { fontSize: wp('2.9%'), fontWeight: '600', color: '#FE5D02', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  pressedCardAddress: { fontSize: wp('3.5%'), color: '#333', fontWeight: '500', lineHeight: wp('4.8%') },
  pressedCardClose: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: wp('2%') },
  pressedCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FE5D02', marginHorizontal: wp('4%'), marginBottom: hp('1.4%'), borderRadius: 12, height: hp('5.5%') },
  pressedCardBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%') },

  // ── Bouton "Créer ici" permanent ──────────────────────────────────────────
pinHintBtn: {
  position: 'absolute',
  left: wp('4%'),
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderRadius: 22,
  paddingVertical: hp('0.9%'),
  paddingHorizontal: wp('3.5%'),
  zIndex: 60,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  shadowColor: '#000', shadowOpacity: 0.10,
  shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  elevation: 4,
},
  pinHintBtnText: { fontSize: wp('3.3%'), fontWeight: '600', color: '#444' },

  // ── Long press hint animé ─────────────────────────────────────────────────
  longPressHint: {
    position: 'absolute', bottom: hp('25%'), alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    zIndex: 10000, elevation: 30,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  longPressHintText: { fontSize: 12, fontWeight: '600', color: '#333' },
});
