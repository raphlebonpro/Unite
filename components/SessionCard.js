import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[
        styles.card,
        {
          borderColor: color + '30',
        },
      ]}
    >
      {/* 🔥 Fond interne teinté propre */}
      <View
        style={[
          styles.innerCard,
          {
            backgroundColor: color + '08',
          },
        ]}
      >
      {/* BADGE GROUPE */}
{session.group?.name && (
  <View style={styles.groupBadge}>
    <Text style={styles.groupBadgeText}>
      Groupe • {session.group.name}
    </Text>
  </View>
)}
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={{ marginRight: 8 }}>{icon}</View>

        <Text style={styles.title} numberOfLines={1}>
          {session.title || session.sport}
        </Text>
      </View>

      {/* META */}
      <View style={styles.metaRow}>
        <View style={[styles.level, { borderColor: color }]}>
          <Text style={[styles.levelText, { color }]}>
            {session.level}
          </Text>
        </View>

<View style={[styles.dateContainer, { backgroundColor: color + '12' }]}>
  <AntDesign name="calendar" size={13} color={color} />
  <Text style={[styles.dateText, { color }]}>
    {formatDateTime(session.date, session.time)}
  </Text>
</View>
      </View>

      {/* LOCATION */}
      {session.location ? (
        <View style={styles.locationRow}>
          <AntDesign name="enviromento" size={14} color={color} />
          <Text style={[styles.location, { color }]} numberOfLines={1}>
            {session.location}
          </Text>
        </View>
      ) : null}
      {/* Accent signature */}
      <View style={[styles.bottomAccent, { backgroundColor: color }]} />
     </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
card: {
  borderRadius: wp('5%'),
  marginBottom: 16,
  marginHorizontal: wp('0.5%'),
  backgroundColor: '#fff',
  borderWidth: 1,
  // iOS shadow
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  // Android shadow calibrée
  elevation: 4,
},
headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: hp('0.9%'),
},
title: {
  fontSize: wp('4%'),
  fontWeight: '800',
  color: '#1C1C1E',
  flex: 1,
},
metaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: hp('0.8%'),
},
level: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#F6F7FA',
  },
levelText: {
  fontSize: wp('3.1%'),
  fontWeight: '700',
},
dateTime: {
  fontSize: wp('3.3%'),
  color: '#6B7280',
  fontWeight: '600',
},
locationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: hp('0.6%'),
},
location: {
  fontSize: wp('3.2%'),
  marginLeft: 6,
  fontWeight: '500',
  opacity: 0.85,
},
dateContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  paddingHorizontal: 11,
  paddingVertical: 5,
  borderRadius: 20,
},
bottomAccent: {
  height: 3,
  width: 40,
  borderRadius: 3,
  marginTop: 12,
},
dateText: {
  fontSize: wp('3.1%'),
  fontWeight: '600',
  marginLeft: 6,
  letterSpacing: 0.2,
},
innerCard: {
  borderRadius: wp('4.2%'),
  padding: wp('4.8%'),
},
groupBadge: {
  alignSelf: 'flex-start',
  backgroundColor: '#EEF0FF',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
  marginBottom: 8,
},
groupBadgeText: {
  fontSize: wp('2.8%'),
  fontWeight: '700',
  color: '#5B4EFF',
  letterSpacing: 0.3,
},
});

export default SessionCard;

