import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sportIcons = {
  Football: { icon: <FontAwesome5 name="futbol" size={18} color="#3888FF" />, color: "#3888FF" },
  Basketball: { icon: <MaterialCommunityIcons name="basketball" size={18} color="#FFA726" />, color: "#FFA726" },
  Tennis: { icon: <MaterialCommunityIcons name="tennis" size={18} color="#2ECC71" />, color: "#2ECC71" },
  Running: { icon: <MaterialCommunityIcons name="run-fast" size={18} color="#E9436D" />, color: "#E9436D" },
  Cyclisme: { icon: <MaterialCommunityIcons name="bike" size={18} color="#3CD6E6" />, color: "#3CD6E6" },
  Natation: { icon: <MaterialCommunityIcons name="swim" size={18} color="#1469B9" />, color: "#1469B9" },
  Musculation: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#7367F0" />, color: "#7367F0"},
  Yoga: { icon: <MaterialCommunityIcons name="yoga" size={20} color="#A259F7" />, color: "#A259F7"},
  Padel: { icon: <MaterialCommunityIcons name="tennis" size={20} color="#EAD406" />, color: "#EAD406"},
  Handball: { icon: <MaterialCommunityIcons name="handball" size={18} color="#F57C00" />, color: "#F57C00" },
  Autres:  {icon: <Ionicons name="ellipsis-horizontal" size={19} color="#999" />, color:"#999"  },
  "Tennis de table": { icon: <MaterialCommunityIcons name="table-tennis" size={18} color="#00B8D4" />, color: "#00B8D4" },
  Volleyball: { icon: <MaterialCommunityIcons name="volleyball" size={18} color="#E57373" />, color: "#E57373" },
  Badminton: { icon: <MaterialCommunityIcons name="badminton" size={18} color="#49beb7" />, color: "#49beb7" },
  Ski: { icon: <MaterialCommunityIcons name="ski" size={18} color="#32C5FF" />, color: "#32C5FF" },
  Snow: { icon: <MaterialCommunityIcons name="snowboard" size={18} color="#5f95de" />, color: "#5f95de" },
  Skate: { icon: <MaterialCommunityIcons name="skateboard" size={18} color="#EB984E" />, color: "#EB984E" },
  Surf: { icon: <MaterialCommunityIcons name="wave" size={18} color="#26C6DA" />, color: "#26C6DA" },
  Escalade: { icon: <MaterialCommunityIcons name="hiking" size={18} color="#689F38" />, color: "#689F38" },
  Parapente: { icon: <MaterialCommunityIcons name="parachute" size={18} color="#1976D2" />, color: "#1976D2" },
  CrossFit: { icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#536DFE" />, color: "#536DFE" },
  Callisthénie: { icon: <MaterialCommunityIcons name="arm-flex" size={18} color="#26A69A" />, color: "#26A69A" },
  Golf: { icon: <MaterialCommunityIcons name="golf" size={18} color="#43A047" />, color: "#43A047" },
  "Arts Martiaux": { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#FF3D00" />, color: "#FF3D00" },
  Boxe: { icon: <MaterialCommunityIcons name="boxing-glove" size={18} color="#C62828" />, color: "#C62828" },
  "Football américain": { icon: <MaterialCommunityIcons name="football" size={18} color="#FF7043" />, color: "#FF7043" },
  Baseball: { icon: <MaterialCommunityIcons name="baseball" size={18} color="#FFD600" />, color: "#FFD600" },
  Danse: { icon: <MaterialCommunityIcons name="human-female-dance" size={18} color="#F48FB1" />, color: "#F48FB1" },
  Pilate: { icon: <MaterialCommunityIcons name="meditation" size={18} color="#BA68C8" />, color: "#BA68C8" },
  Échecs: { icon: <MaterialCommunityIcons name="chess-queen" size={18} color="#4E342E" />, color: "#4E342E" },
  Pétanque: { icon: <MaterialCommunityIcons name="bowling" size={18} color="#757575" />, color: "#757575" },
  "Randonnée/Trail": { icon: <MaterialCommunityIcons name="hiking" size={18} color="#43A047" />, color: "#43A047" },
  "VTT": { icon: <MaterialCommunityIcons name="bike" size={18} color="#009688" />, color: "#009688" },
  Voile: { icon: <MaterialCommunityIcons name="sail-boat" size={18} color="#1976D2" />, color: "#1976D2" },
  Autres: { icon: <Ionicons name="ellipsis-horizontal" size={18} color="#BBB" />, color: "#BBB" },
};

function formatDateTime(date, time) {
  if (!date) return '';
  let label = '';
  try {
    let d = new Date(date);
    if (time && typeof time === "string" && time.length === 5) {
      const [hh, mm] = time.split(':');
      d.setHours(Number(hh));
      d.setMinutes(Number(mm));
    }
    label = d.toLocaleString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {}
  return label;
}

const SessionCard = ({ session, onPress }) => {
  const { icon, color } = sportIcons[session.sport] || sportIcons.Autres;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.89} onPress={onPress}>
      {/* Icône sport + titre + niveau */}
      <View style={styles.row1}>
        <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
          {icon}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{session.title || session.sport}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {session.level ? <AntDesign name="star" size={13} color="#ffc66e" /> : null}
            <Text style={{ color: '#6066AD', fontWeight: '600', marginLeft: 4 }}>{session.level || ''}</Text>
          </Text>
        </View>
      </View>

      {/* Lieu + date/heure */}
      <View style={styles.row2}>
        <AntDesign name="enviromento" size={15} color="#A7A6D7" />
        <Text style={styles.place} numberOfLines={1}>{session.location}</Text>
      </View>
      <View style={styles.row2}>
        <AntDesign name="calendar" size={14} color="#7D78F8" />
        <Text style={styles.date}>{formatDateTime(session.date, session.time)}</Text>
      </View>

      {/* Voir session */}
<LinearGradient
  colors={['#7D78F8', '#6D6AFF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.button}
>
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{ width: '100%', alignItems: 'center' }}
  >
    <Text style={styles.buttonTxt}>Voir Session</Text>
  </TouchableOpacity>
</LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: wp('5%'),         // ~19 sur 390px
    padding: wp('4.1%'),            // ~16
    marginBottom: hp('2%'),         // ~17
    elevation: 4,
    shadowColor: "#d1d0fd",
    shadowOpacity: 0.10,
    shadowRadius: wp('2.7%'),       // ~10
    shadowOffset: { width: 0, height: hp('0.38%') }, // ~3
    marginHorizontal: wp('0.3%'),   // ~1
    minWidth: wp('60%'),            // ~230 sur 390px
  },
  row1: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: hp('0.85%'),      // ~7
  },
  iconCircle: {
    width: wp('10.5%'),             // ~41
    height: wp('10.5%'),            // ~41
    borderRadius: wp('5.4%'),       // ~21
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F4F4FF',
    borderWidth: 1, 
    borderColor: '#E5E5F8',
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: wp('4.2%'),           // ~16.5
    color: '#21213A' 
  },
  meta: { 
    fontSize: wp('3.4%'),           // ~13.2
    color: "#6565ad", 
    marginTop: hp('0.25%'),         // ~2
    marginLeft: wp('0.5%'),         // ~2
    fontWeight: '500' 
  },
  row2: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: hp('0.24%'),         // ~2
    marginBottom: hp('0.24%'),      // ~2
  },
  place: { 
    fontSize: wp('3.5%'),           // ~13.7
    color: '#7E7EA7', 
    marginLeft: wp('1.8%'),         // ~7
    fontWeight: '500', 
    flex: 1 
  },
  date: { 
    fontSize: wp('3.5%'),           // ~13.6
    color: '#7D78F8', 
    marginLeft: wp('1.8%'),         // ~7
    fontWeight: '600' 
  },
  button: {
    borderRadius: wp('3.5%'),       // ~13
    paddingVertical: hp('1.1%'),    // ~9
    marginTop: hp('1.2%'),          // ~10
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: "#7D78F8",
    shadowOpacity: 0.14,
    shadowRadius: wp('2%'),         // ~8
  },
  buttonTxt: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: wp('3.9%'),           // ~15
    letterSpacing: 0.3 
  },
});

export default SessionCard;

