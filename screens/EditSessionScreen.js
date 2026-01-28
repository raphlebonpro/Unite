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
 Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import PlaceSearchField, { GOOGLE_MAPS_API_KEY } from '../components/PlaceSearchField';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  notifySessionUpdatedCreator,
  notifySessionUpdatedParticipants,
  notifySessionDeletedCreator,
  notifySessionDeletedParticipants
} from '../helpers/notifications';

const FONT = Platform.select({ ios: 'System', android: 'Roboto' });

/* ---------- Données sport (identiques à Création) ---------- */
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

 const [selectedDate, setSelectedDate] = useState(new Date());
 const [showCalendar, setShowCalendar] = useState(false);

 const [selectedHour, setSelectedHour] = useState(getClampedDefaultHour());
 const [timePickerVisible, setTimePickerVisible] = useState(false);

 const [title, setTitle] = useState('');
 const [comments, setComments] = useState('');

 const [location, setLocation] = useState('');
 const [latitude, setLatitude] = useState(null);
 const [longitude, setLongitude] = useState(null);

 // Modal Adresse
const [addressModalVisible, setAddressModalVisible] = useState(false);

 // Modals
 const [sportPickerVisible, setSportPickerVisible] = useState(false);
 const [levelPickerVisible, setLevelPickerVisible] = useState(false);

 const insets = useSafeAreaInsets();
 const [kbOpen, setKbOpen] = useState(false);

 const [tempLocation, setTempLocation] = useState('');
 const [tempLat, setTempLat] = useState(null);
 const [tempLng, setTempLng] = useState(null); 

// Participants max
const [maxParticipants, setMaxParticipants] = useState(null);
const [maxPickerVisible, setMaxPickerVisible] = useState(false);


 useEffect(() => {
 const s = Keyboard.addListener('keyboardDidShow', () => setKbOpen(true));
 const h = Keyboard.addListener('keyboardDidHide', () => setKbOpen(false));
 return () => { s.remove(); h.remove(); };
}, []);


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

     setTitle(data.title || '');
     setComments(data.description || '');
     setLocation(data.location || '');
     setLatitude(Number(data.lat));
     setLongitude(Number(data.lng));

     setMaxParticipants(data.max_participants === null ? null : Number(data.max_participants));

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
    !selectedLevel || !title
  ) {
    Alert.alert('Champs manquants', 'Merci de remplir tous les champs obligatoires.');
    return;
  }

  // validations date/heure (comme Création)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sessionDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  if (sessionDateOnly < today) {
    Alert.alert('Erreur', 'Tu ne peux pas mettre une session dans le passé.');
    return;
  }
  const now = new Date();
  if (sessionDateOnly.getTime() === today.getTime()) {
    const startLocal = combineLocalDateAndTime(sessionDateOnly, selectedHour);
    if (startLocal < now) {
      Alert.alert('Erreur', "Tu ne peux pas sélectionner une heure passée pour aujourd'hui.");
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
    date: formatDateYYYYMMDD(selectedDate),
    time: formatTimeHHMM(selectedHour),
    title,
    description: comments,
    max_participants: maxParticipants === null ? null : Number(maxParticipants),
  };

  const { error } = await supabase.from('sessions').update(sessionData).eq('id', sessionId);
  if (error) {
    setLoading(false);
    Alert.alert('Erreur', error.message || 'Impossible de modifier la session.');
    return;
  }

  // 🔍 Récupérer participants & créateur
  const { data: participantsData } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('session_id', sessionId);

  const { data: sessionInfo } = await supabase
    .from('sessions')
    .select('creator_id, title')
    .eq('id', sessionId)
    .single();

  const participantIds = (participantsData || [])
    .map(p => p.user_id)
    .filter(uid => uid !== sessionInfo?.creator_id);

  // 🔔 Notifications
  await notifySessionUpdatedCreator({
    creatorId: sessionInfo?.creator_id,
    sessionTitle: title,
    sessionId,
  });

  await notifySessionUpdatedParticipants({
    participantIds,
    sessionTitle: title,
    sessionId,
  });

  setLoading(false);

Alert.alert('Session modifiée !', 'Les participants ont été notifiés.', [
  { 
    text: 'OK', 
    onPress: () => navigation.navigate('MainTabs', { 
      screen: 'Sessions', 
      params: { tab: 'created' } 
    }) 
  },
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

          // 🔍 Récupérer participants & infos session
          const { data: participantsData } = await supabase
            .from('session_participants')
            .select('user_id')
            .eq('session_id', sessionId);

          const { data: sessionInfo } = await supabase
            .from('sessions')
            .select('creator_id, title')
            .eq('id', sessionId)
            .single();

          const participantIds = (participantsData || [])
            .map(p => p.user_id)
            .filter(uid => uid !== sessionInfo?.creator_id); // ✅ exclut le créateur

          // 🗑️ Purge liée à la session
          await supabase.from('session_participants').delete().eq('session_id', sessionId);
          await supabase.from('messages').delete().eq('session_id', sessionId);
          await supabase.from('notifications').delete().eq('session_id', sessionId);

          // ❌ Supprimer la session
          const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

          if (error) {
            setLoading(false);
            Alert.alert('Erreur', error.message || 'Impossible de supprimer la session.');
            return;
          }

          // ✅ Réinsérer uniquement les notifs d’annulation
          await notifySessionDeletedCreator({
            creatorId: sessionInfo?.creator_id,
            sessionTitle: sessionInfo?.title || 'Session',
            sessionId,
          });

          await notifySessionDeletedParticipants({
            participantIds,
            sessionTitle: sessionInfo?.title || 'Session',
            sessionId,
          });

          setLoading(false);

          Alert.alert('Session supprimée', 'Tous les participants ont été notifiés.', [
            { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
          ]);
        },
      },
    ]
  );
};

 if (loadingInit) {
   return (
     <SafeAreaView style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' }}>
       <ActivityIndicator
  size={Platform.OS === 'ios' ? 'large' : 50}
  color="#5B4EFF"
/>
       <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>Chargement...</Text>
     </SafeAreaView>
   );
 }


 return (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
  <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
     {location || "Point de rencontre"}
   </Text>
 </TouchableOpacity>


 {location && (latitude === null || longitude === null) && (
   <Text style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
     Sélectionne une suggestion puis valide pour confirmer l’emplacement.
   </Text>
 )}
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

{/* Date — même container + modal que Création */}
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

   <Text style={selectedDate ? styles.inputText : styles.placeholder}>
     {selectedDate
       ? capitalizeFirst(
           selectedDate.toLocaleDateString('fr-FR', {
             weekday: 'long',
             month: 'long',
             day: 'numeric',
           })
         )
       : 'Date de la session…'}
   </Text>
 </TouchableOpacity>

{/* Heure — natif Android, modal iOS */}
<TouchableOpacity 
style={[styles.inlineInput,{flex: 1, flexDirection: 'row', alignItems: 'center',}]}
onPress={showTimePicker}
activeOpacity={0.85}
>
  <Ionicons name="time-outline" size={18} color="#5B5FFF" />
  <Text style={styles.timeText}>
    {selectedHour
      ? `${selectedHour.getHours().toString().padStart(2, '0')}:${selectedHour
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      : 'Heure de la session'}
  </Text>
</TouchableOpacity>
</View>
</View>

{/* Modal Date — identique à Création */}
<Modal
 transparent
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
         [formatDateYYYYMMDD(selectedDate)]: {
           selected: true,
           selectedColor: '#5B4EFF',
         },
       }}
       minDate={formatDateYYYYMMDD(new Date())}
       theme={{
         selectedDayBackgroundColor: '#5B4EFF',
         todayTextColor: '#5B4EFF',
         arrowColor: '#5B4EFF',
         textDayFontFamily: FONT,
         textMonthFontFamily: FONT,
         textDayHeaderFontFamily: FONT,
       }}
       style={styles.calendarBox}
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

{timePickerVisible && (
  Platform.OS === 'ios' ? (
    // ✅ iOS : affiché dans un modal avec bouton
    <Modal
      transparent
      animationType="fade"
      visible={timePickerVisible}
      onRequestClose={hideTimePicker}
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
          <TouchableOpacity
            style={styles.validateButton}
            onPress={() => handleConfirmTime(selectedHour)}
          >
            <Text style={styles.validateText}>Valider</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  ) : (
    // ✅ Android : picker natif directement, sans container ni modal
    <DateTimePicker
      value={selectedHour || new Date()}
      mode="time"
      is24Hour={true}
      display="spinner"
      onChange={(event, date) => {
        if (event.type === 'set' && date) {
          handleConfirmTime(date);
        }
        setTimePickerVisible(false); // ferme après choix ou annulation
      }}
    />
  )
)}
           {/* Niveau (modal) */}
           <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => setLevelPickerVisible(true)}>
                <Ionicons name="trending-up-outline" size={18} color="#5B5FFF" />
             <Text style={styles.levelText}>
               {selectedLevel || "Niveau"}
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

           {/* === Max Participants === */}
<TouchableOpacity
  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
  onPress={() => setMaxPickerVisible(true)}
>
  <Ionicons
    name="people-outline"
    size={18}
    color="#5B5FFF"
    style={{ marginRight: 8 }}
  />
  
  <Text style={maxParticipants === null ? styles.dropdownText : styles.inputText}>
    {maxParticipants === null ? "Nombre maximum de participants" : maxParticipants}
  </Text>
</TouchableOpacity>

{/* === Modal Max Participants === */}
<Modal
  transparent={true}
  visible={maxPickerVisible}
  animationType="fade"
  onRequestClose={() => setMaxPickerVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Nombre maximum</Text>

      <ScrollView style={{ maxHeight: 250, width: "100%" }}>
        
        {/* Illimité */}
        <TouchableOpacity
          style={styles.dropdownItemCentered}
          onPress={() => {
            setMaxParticipants(null);
            setMaxPickerVisible(false);
          }}
        >
          <Text style={styles.dropdownItemTextCentered}>Illimité</Text>
        </TouchableOpacity>

        {/* 2 → 21 */}
        {Array.from({ length: 20 }, (_, i) => i + 2).map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.dropdownItemCentered}
            onPress={() => {
              setMaxParticipants(num);
              setMaxPickerVisible(false);
            }}
          >
            <Text style={styles.dropdownItemTextCentered}>{num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.validateButton}
        onPress={() => setMaxPickerVisible(false)}
      >
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
    marginBottom: 20,
  }}
  onPress={handleCancelSession}
  disabled={loading}
  activeOpacity={0.86}
>
  <LinearGradient
    colors={['#FF5E62', '#FF5E62']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.buttonGradient}
  >
    <Text style={[styles.buttonText, { color: '#fff', fontWeight: 'bold' }]}>
      {loading ? '...' : 'Annuler la session'}
    </Text>
       </LinearGradient>
      </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  </View>
 );
};

/* ---------- Styles alignés avec Création ---------- */
const styles = StyleSheet.create({
 container: {
   paddingHorizontal: 18,
   paddingTop: 12,
   paddingBottom: 10,
   backgroundColor: '#fff',
   paddingBottom: 30,  // respiration propre
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
 width: '100%',
 borderRadius: 12,
 backgroundColor: '#fff',
 elevation: 2,                // Android shadow
 shadowColor: '#000',         // iOS shadow
 shadowOpacity: 0.08,
 shadowRadius: 6,
 shadowOffset: { width: 0, height: 3 },
 marginBottom: 12,
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


export default EditSessionScreen;