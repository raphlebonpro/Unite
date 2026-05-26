import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Alert, ActivityIndicator,
  Modal, Platform, Switch, StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PlaceSearchField from '../components/PlaceSearchField';

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS = [
  { key: 'lundi',     short: 'L' },
  { key: 'mardi',     short: 'M' },
  { key: 'mercredi',  short: 'M' },
  { key: 'jeudi',     short: 'J' },
  { key: 'vendredi',  short: 'V' },
  { key: 'samedi',    short: 'S' },
  { key: 'dimanche',  short: 'D' },
];

const LEVELS = ["Pour s'amuser", 'Débutant', 'Intermédiaire', 'Avancé'];

const FREQUENCY_OPTIONS = [
  { value: 'weekly',    label: 'Chaque semaine',    icon: 'repeat-outline' },
  { value: 'biweekly',  label: '1 semaine/2', icon: 'git-compare-outline' },
];

const sportIcons = {
  Football:           { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />,                       color: '#3888FF' },
  Basketball:         { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />,         color: '#FFA726' },
  Tennis:             { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />,             color: '#2ECC71' },
  Running:            { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />,           color: '#E9436D' },
  Cyclisme:           { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />,               color: '#3CD6E6' },
  Natation:           { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />,               color: '#1469B9' },
  Musculation:        { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />,           color: '#7367F0' },
  Fitness:            { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#7C4DFF" />,      color: '#7C4DFF' },
  Padel:              { icon: <MaterialCommunityIcons name="tennis" size={18} color="#FFD600" />,             color: '#FFD600' },
  'Randonnée/Trail':  { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />,             color: '#43A047' },
  Yoga:               { icon: <MaterialCommunityIcons name="yoga" size={18} color="#A259F7" />,               color: '#A259F7' },
  CrossFit:           { icon: <MaterialCommunityIcons name="weight-lifter" size={18} color="#536DFE" />,      color: '#536DFE' },
  Danse:              { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: '#F48FB1' },
  Escalade:           { icon: <MaterialCommunityIcons name="terrain" size={18} color="#689F38" />,            color: '#689F38' },
  Surf:               { icon: <MaterialCommunityIcons name="surfing" size={18} color="#26C6DA" />,            color: '#26C6DA' },
  'Arts Martiaux':    { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />,       color: '#FF3D00' },
  Autres:             { icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />,                 color: '#999'    },
};

const ALL_SPORTS = Object.keys(sportIcons);

const levelMeta = {
  "Pour s'amuser": { icon: 'emoticon-happy-outline', color: '#FFA726', bg: '#FFF5E5' },
  'Débutant':      { icon: 'sprout-outline',          color: '#2ECC71', bg: '#EDFBF3' },
  'Intermédiaire': { icon: 'lightning-bolt',          color: '#3888FF', bg: '#EBF2FF' },
  'Avancé':        { icon: 'fire',                    color: '#FE5D02', bg: '#FFF3EE' },
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateRoutineScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { groupId } = route.params;

  const [title,          setTitle]          = useState('');
  const [sport,          setSport]          = useState('');
  const [level,          setLevel]          = useState('');
  const [selectedDays,   setSelectedDays]   = useState([]);
  const [timeH,          setTimeH]          = useState('');
  const [timeM,          setTimeM]          = useState('');
  const minuteRef = useRef(null);
  const [frequency,      setFrequency]      = useState('weekly');
  const [location,       setLocation]       = useState('');
  const [lat,            setLat]            = useState(null);
  const [lng,            setLng]            = useState(null);
  const [maxParticipants,setMaxParticipants] = useState('');
  const [isPublic,       setIsPublic]       = useState(false);
  const [loading,        setLoading]        = useState(false);

  const [sportModalVisible,   setSportModalVisible]   = useState(false);
  const [levelModalVisible,   setLevelModalVisible]   = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [tempLocation,        setTempLocation]        = useState('');
  const [tempLat,             setTempLat]             = useState(null);
  const [tempLng,             setTempLng]             = useState(null);

  const canCreate = title.trim() && sport && selectedDays.length > 0 && timeH.length === 2 && timeM.length === 2;

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // ── Création ──
  const handleCreate = async () => {
    if (!canCreate) return;

    // Validation heure
    const DAY_TO_INT = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0 };
    const h = parseInt(timeH, 10);
    const m = parseInt(timeM, 10);
    if (isNaN(h) || isNaN(m) || h < 5 || h > 22 || m < 0 || m > 59) {
      return Alert.alert('Heure invalide', 'Saisis une heure entre 05:00 et 22:00.');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

      const { data, error } = await supabase.from('group_routines').insert([{
        group_id:       groupId,
        title:          title.trim(),
        sport,
        level:          level || null,
        location:       location || null,
        lat:            lat || null,
        lng:            lng || null,
        days_of_week:   selectedDays.map(d => DAY_TO_INT[d]),
        time:           timeFormatted,
        frequency,
        max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        is_public:      isPublic,
        created_by:     user.id,
        active:         true,
      }]).select('id').single();

      if (error) throw error;

      // Générer les prochaines séances (8 semaines)
      await generateUpcomingSessions(data.id, selectedDays, timeFormatted, frequency);

      Alert.alert('Routine créée !', 'Les prochaines séances ont été planifiées.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de créer la routine.');
    } finally {
      setLoading(false);
    }
  };

  // ── Génération des séances ──
  const generateUpcomingSessions = async (routineId, days, timeStr, freq) => {
    const dayMap = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0 };
    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeksToGenerate = 8;
    const weeksInterval = freq === 'biweekly' ? 2 : 1;

    for (let week = 0; week < weeksToGenerate; week += weeksInterval) {
      for (const day of days) {
        const targetDay = dayMap[day];
        const date = new Date(today);
        const currentDay = date.getDay();
        let daysUntil = (targetDay - currentDay + 7) % 7;
        if (daysUntil === 0 && week === 0) daysUntil = 7;
        date.setDate(today.getDate() + daysUntil + week * 7);

        sessions.push({
          routine_id: routineId,
          date: date.toISOString().slice(0, 10),
          status: 'scheduled',
        });
      }
    }

    if (sessions.length > 0) {
      await supabase.from('group_routine_sessions').insert(sessions);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FA" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section : L'essentiel ── */}
        <Text style={styles.sectionLabel}>L'essentiel <Text style={styles.required}>*</Text></Text>
        <View style={styles.card}>

          {/* Titre */}
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#F3F1FF' }]}>
              <Ionicons name="text-outline" size={18} color="#7367F0" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Nom de la routine"
              placeholderTextColor="#C8C8C8"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          <View style={styles.sep} />

          {/* Sport */}
          <TouchableOpacity style={styles.row} onPress={() => setSportModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: sport ? (sportIcons[sport]?.color + '18') : '#F5F5F7' }]}>
              {sport ? sportIcons[sport]?.icon : <Ionicons name="bicycle-outline" size={18} color="#AAAAAA" />}
            </View>
            <Text style={[styles.rowValue, !sport && styles.rowPlaceholder]}>
              {sport || 'Sport'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
          </TouchableOpacity>

          <View style={styles.sep} />

          {/* Niveau */}
          <TouchableOpacity style={styles.row} onPress={() => setLevelModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: level ? (levelMeta[level]?.bg || '#F5F5F7') : '#F5F5F7' }]}>
              {level
                ? <MaterialCommunityIcons name={levelMeta[level]?.icon} size={18} color={levelMeta[level]?.color} />
                : <Ionicons name="trending-up-outline" size={18} color="#AAAAAA" />
              }
            </View>
            <Text style={[styles.rowValue, !level && styles.rowPlaceholder]}>
              {level || 'Niveau (optionnel)'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
          </TouchableOpacity>

        </View>

        {/* ── Section : Quand ── */}
        <Text style={styles.sectionLabel}>Quand <Text style={styles.required}>*</Text></Text>
        <View style={styles.card}>

          {/* Jours de la semaine */}
          <View style={[styles.row, { paddingBottom: hp('1.5%') }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFF5E5' }]}>
              <Ionicons name="calendar-outline" size={18} color="#FFA726" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowValue, { marginBottom: 10 }]}>Jours</Text>
              <View style={styles.daysRow}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.dayBtn, selectedDays.includes(d.key) && styles.dayBtnActive]}
                    onPress={() => toggleDay(d.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayBtnText, selectedDays.includes(d.key) && styles.dayBtnTextActive]}>
                      {d.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedDays.length > 0 && (
                <Text style={styles.daysLabel}>
                  {selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sep} />

          {/* Heure */}
<View style={styles.row}>
  <View style={[styles.rowIcon, { backgroundColor: '#EBF2FF' }]}>
    <Ionicons name="time-outline" size={18} color="#3888FF" />
  </View>
  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <TextInput
      style={[styles.textInput, styles.timeBox]}
      placeholder="HH"
      placeholderTextColor="#C8C8C8"
      value={timeH}
      onChangeText={(t) => {
        const v = t.replace(/\D/g, '').slice(0, 2);
        setTimeH(v);
        if (v.length === 2) minuteRef.current?.focus();
      }}
      keyboardType="numeric"
      maxLength={2}
      returnKeyType="next"
    />
    <Text style={{ fontSize: 20, fontWeight: '700', color: '#C8C8C8' }}>:</Text>
    <TextInput
      ref={minuteRef}
      style={[styles.textInput, styles.timeBox]}
      placeholder="MM"
      placeholderTextColor="#C8C8C8"
      value={timeM}
      onChangeText={(t) => setTimeM(t.replace(/\D/g, '').slice(0, 2))}
      keyboardType="numeric"
      maxLength={2}
      returnKeyType="done"
    />
  </View>
</View>

          <View style={styles.sep} />

          {/* Fréquence */}
          <View style={[styles.row, { paddingBottom: hp('1.5%') }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#EDFBF3' }]}>
              <Ionicons name="repeat-outline" size={18} color="#2ECC71" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowValue, { marginBottom: 10 }]}>Fréquence</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {FREQUENCY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.freqBtn, frequency === opt.value && styles.freqBtnActive]}
                    onPress={() => setFrequency(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon} size={14} color={frequency === opt.value ? '#FE5D02' : '#999'} style={{ marginRight: 6 }} />
                    <Text style={[styles.freqBtnText, frequency === opt.value && styles.freqBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

        </View>

        {/* ── Section : Lieu ── */}
        <Text style={styles.sectionLabel}>Lieu <Text style={styles.optional}>(optionnel)</Text></Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => { setTempLocation(location); setTempLat(lat); setTempLng(lng); setAddressModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: location ? '#FFF3EE' : '#F5F5F7' }]}>
              <Ionicons name="location-outline" size={18} color={location ? '#FE5D02' : '#AAAAAA'} />
            </View>
            <Text style={[styles.rowValue, !location && styles.rowPlaceholder]} numberOfLines={1}>
              {location || 'Point de rendez-vous'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D0D0D0" />
          </TouchableOpacity>
        </View>

        {/* ── Section : Options ── */}
        <Text style={styles.sectionLabel}>Options <Text style={styles.optional}>(optionnel)</Text></Text>
        <View style={styles.card}>

          {/* Max participants */}
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#EDFBF3' }]}>
              <Ionicons name="people-outline" size={18} color="#2ECC71" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Participants max (illimité par défaut)"
              placeholderTextColor="#C8C8C8"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          <View style={styles.sep} />

          {/* Visible publiquement */}
          <View style={[styles.row, { paddingRight: wp('4%') }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#EBF2FF' }]}>
              <Ionicons name="earth-outline" size={18} color="#3888FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowValue}>Visible publiquement</Text>
              <Text style={styles.rowSub}>Les non-membres peuvent voir cette routine</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#E8E8EA', true: '#FE5D02' }}
              thumbColor="#fff"
              ios_backgroundColor="#E8E8EA"
            />
          </View>

        </View>

        {/* ── CTA ── */}
        <View style={styles.stickyBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, !canCreate && styles.ctaBtnDisabled]}
            onPress={handleCreate}
            disabled={loading || !canCreate}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="repeat-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.ctaBtnText}>Créer la routine</Text>
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modal Sport ── */}
      <Modal transparent visible={sportModalVisible} animationType="fade" onRequestClose={() => setSportModalVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSportModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.centeredBox, { maxHeight: hp('65%'), paddingHorizontal: 0 }]}>
              <Text style={[styles.boxTitle, { paddingHorizontal: wp('5%') }]}>Sport</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {ALL_SPORTS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.listItem, sport === s && styles.listItemActive]}
                    onPress={() => { setSport(s); setSportModalVisible(false); }}
                  >
                    <View style={{ marginRight: 12 }}>{sportIcons[s]?.icon}</View>
                    <Text style={[styles.listItemText, sport === s && styles.listItemTextActive]}>{s}</Text>
                    {sport === s && <View style={styles.check}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
                  </TouchableOpacity>
                ))}
                <View style={{ height: 8 }} />
              </ScrollView>
              <TouchableOpacity style={[styles.boxBtn, { marginHorizontal: wp('5%') }]} onPress={() => setSportModalVisible(false)}>
                <Text style={styles.boxBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Niveau ── */}
      <Modal transparent visible={levelModalVisible} animationType="fade" onRequestClose={() => setLevelModalVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setLevelModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.centeredBox}>
              <Text style={styles.boxTitle}>Niveau</Text>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.listItem, level === l && styles.listItemActive]}
                  onPress={() => { setLevel(l); setLevelModalVisible(false); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.levelIconBox, { backgroundColor: levelMeta[l]?.bg }]}>
                    <MaterialCommunityIcons name={levelMeta[l]?.icon} size={18} color={levelMeta[l]?.color} />
                  </View>
                  <Text style={[styles.listItemText, level === l && styles.listItemTextActive]}>{l}</Text>
                  {level === l && <View style={styles.check}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.boxBtn, { marginHorizontal: wp('5%') }]} onPress={() => setLevelModalVisible(false)}>
                <Text style={styles.boxBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Adresse ── */}
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
                  setLat(tempLat);
                  setLng(tempLng);
                  setAddressModalVisible(false);
                }}
              >
                <Text style={styles.addressValidateText}>Valider</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <PlaceSearchField
                autoFocus
                value={tempLocation}
                onChange={(txt) => { setTempLocation(txt); setTempLat(null); setTempLng(null); }}
                onPick={({ description, lat, lng }) => { setTempLocation(description); setTempLat(lat); setTempLng(lng); }}
                placeholder="Ex : Stade Municipal, Paris"
                boxStyle={styles.addressSearchBox}
                suggestionContainerStyle={styles.addressSuggestions}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FA' },
  scroll: {
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
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
  rowSub: { fontSize: wp('3%'), color: '#BBBBBB', fontWeight: '400', marginTop: 2 },

  textInput: {
    flex: 1, fontSize: wp('4%'), color: '#1A1A1A',
    padding: 0, fontWeight: '400',
  },

  // ── Jours ──
  daysRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F7', borderWidth: 1, borderColor: '#E8E8E8',
    alignItems: 'center', justifyContent: 'center',
  },
  dayBtnActive: { backgroundColor: '#FE5D02', borderColor: '#FE5D02' },
  dayBtnText:   { fontSize: wp('3.5%'), fontWeight: '700', color: '#999' },
  dayBtnTextActive: { color: '#fff' },
  daysLabel:    { fontSize: wp('3.2%'), color: '#FE5D02', fontWeight: '600', marginTop: 8 },
  timeBox: { flex: 0, width: 48, textAlign: 'center', fontSize: wp('5%'), fontWeight: '700', color: '#1A1A1A', borderBottomWidth: 2, borderBottomColor: '#E8E8E8', paddingBottom: 2,},

  // ── Fréquence ──
  freqBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E8E8E8', backgroundColor: '#F5F5F7',
  },
  freqBtnActive: { backgroundColor: '#FFF3EE', borderColor: '#FE5D02' },
  freqBtnText:   { fontSize: wp('3.2%'), fontWeight: '600', color: '#999' },
  freqBtnTextActive: { color: '#FE5D02' },

  // ── CTA ──
  stickyBar: {
    paddingHorizontal: wp('4%'), borderRadius: 20, marginTop: 10,
    paddingTop: hp('1%'), paddingBottom: hp('2%'),
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F2',
  },
  ctaBtn: {
    height: hp('5%'), backgroundColor: '#FE5D02', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: hp('1.5%'), marginHorizontal: 20, flexDirection: 'row',
  },
  ctaBtnDisabled: { backgroundColor: '#FDB490' },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('4.2%') },

  // ── Modals ──
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp('5%'),
  },
  centeredBox: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingTop: hp('2.5%'), paddingBottom: hp('2%'), paddingHorizontal: wp('5%'),
    width: wp('88%'),
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  boxTitle: { fontSize: wp('4.4%'), fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: hp('1.8%') },
  boxBtn: {
    height: hp('4.5%'), backgroundColor: '#FE5D02', borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: hp('1.5%'), marginHorizontal: 20,
  },
  boxBtnText: { color: '#fff', fontWeight: '700', fontSize: wp('3.9%') },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: hp('1.5%'), paddingHorizontal: wp('5%'),
    borderBottomWidth: 1, borderBottomColor: '#F5F5F7',
  },
  listItemActive: { backgroundColor: '#FFF8F5' },
  listItemText:   { flex: 1, fontSize: wp('3.9%'), fontWeight: '500', color: '#222' },
  listItemTextActive: { color: '#FE5D02', fontWeight: '700' },
  check: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FE5D02',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  levelIconBox: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', marginRight: wp('3.5%'), flexShrink: 0,
  },

  // ── Adresse ──
  addressOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  addressContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  addressHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp('4.5%'), paddingBottom: hp('1.5%'),
    borderBottomWidth: 1, borderBottomColor: '#F0F0F2',
  },
  addressCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  addressTitle:        { fontSize: wp('4.3%'), fontWeight: '700', color: '#111' },
  addressValidateBtn:  { backgroundColor: '#FE5D02', paddingHorizontal: wp('4%'), paddingVertical: hp('0.9%'), borderRadius: 12 },
  addressValidateText: { color: '#fff', fontWeight: '700', fontSize: wp('3.6%') },
  addressSearchBox:    { marginTop: 12, marginHorizontal: 16 },
  addressSuggestions:  { flex: 1, marginTop: 8, paddingHorizontal: 16 },
});
