import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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

function formatDate(date) {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  } catch { return date; }
}
function formatTime(time) {
  if (!time) return '';
  try {
    if (time.length === 5) return time;
    const d = new Date(time);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return time; }
}

function SessionCardHome({ session, onPress, disabled }) {
  const { icon, color } = sportIcons[session.sport] || sportIcons.Autres;

  return (
    <View style={[styles.card, { shadowColor: color }]}>
      {/* CONTENU (pousse le bouton en bas) */}
      <View style={styles.content}>
        {/* Icône + titre */}
        <View style={styles.headerRow}>
          <View style={{ marginRight: 7 }}>{icon}</View>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {session.title || session.sport}
          </Text>
        </View>

        {/* Niveau + date + heure */}
        <View style={styles.metaRow}>
          <View style={[styles.level, { borderColor: color }]}>
            <Text style={[styles.levelText, { color }]}>{session.level}</Text>
          </View>
          <Text style={styles.dateTime}>
            {formatDate(session.date)} · <Text style={{ color }}>{formatTime(session.time)}</Text>
          </Text>
        </View>

        {/* Description (peut grandir/rétrécir mais ne pousse pas le bouton) */}
        <Text style={styles.desc} numberOfLines={2} ellipsizeMode="tail">
          {session.description}
        </Text>
      </View>

      {/* BOUTON collé en bas */}
<TouchableOpacity
  disabled={disabled}
  style={[
    styles.button,
    {
      backgroundColor: disabled ? '#D0D0D0' : color,
      opacity: disabled ? 0.7 : 1
    }
  ]}
  activeOpacity={disabled ? 1 : 0.93}
  onPress={disabled ? null : onPress}
>
  <Text
    style={[
      styles.buttonText,
      disabled ? { color: '#555' } : {}
    ]}
  >
    Voir Session
  </Text>
</TouchableOpacity>
    </View>
  );
}

export default React.memo(SessionCardHome);

const styles = StyleSheet.create({
  card: {
    width: wp('56%'),
    minHeight: hp('19%'),
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('3.2%'),
    borderRadius: wp('4.5%'),
    backgroundColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.08,
    shadowRadius: wp('2.5%'),
    shadowOffset: { width: 0, height: hp('0.4%') },
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
content: {
  flex: 1,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.2%'),
    width: '100%',
  },
title: {
  fontSize: wp('4%'),
  fontWeight: '700',
  color: '#22272F',
  letterSpacing: 0.03,
  flexShrink: 1,
  maxWidth: '100%',
  textAlign: 'center',
},
metaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp('0.4%'),
  marginBottom: hp('0.2%'),
  width: '100%',
},
  level: {
    borderRadius: wp('1.9%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.18%'),
    borderWidth: 1,
    marginRight: wp('1.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp('9.5%'),
    backgroundColor: "#F6F7FA"
  },
  levelText: {
    fontWeight: 'bold',
    fontSize: wp('3.1%'),
    letterSpacing: 0.07,
  },
  dateTime: {
    fontSize: wp('3.2%'),
    color: '#43494e',
    fontWeight: '600',
  },
desc: {
  fontSize: wp('3.1%'),
  color: '#757A87',
  marginTop: hp('0.6%'),
  fontWeight: '500',
  lineHeight: hp('2%'),
  flexShrink: 1,
  flexGrow: 1,
  textAlign: 'center',
},
  button: {
    borderRadius: wp('1.9%'),
    paddingVertical: hp('1%'),
    alignItems: 'center',
    width: '100%',
    marginTop: hp('0.8%'),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
    letterSpacing: 0.07,
  },
});