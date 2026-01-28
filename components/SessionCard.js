import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

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

