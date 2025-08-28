import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function CollectiveChallengesScreen() {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from('collective_challenges')
      .select('*')
      .order('start_date', { ascending: false });
    setChallenges(data || []);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 26 }}>
      {challenges.map((challenge) => (
        <LinearGradient
          colors={['#5371ff', '#a259f7']}
          style={styles.challengeCard}
          start={{ x: 0.1, y: 0.15 }}
          end={{ x: 1, y: 0.8 }}
          key={challenge.id}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <MaterialCommunityIcons name="trophy" size={28} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
          </View>
          <Text style={styles.challengeDesc}>{challenge.description}</Text>

          {/* Barre de progression */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${Math.min(100, Math.round((challenge.participants_count / (challenge.goal || 1)) * 100))}%`
            }]} />
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.participantsText}>
              {challenge.participants_count} / {challenge.goal} participants
            </Text>
            <Text style={styles.rewardText}>🎁 {challenge.reward}</Text>
          </View>
          <Text style={styles.dates}>
            {formatDate(challenge.start_date)} — {formatDate(challenge.end_date)}
          </Text>
        </LinearGradient>
      ))}
    </ScrollView>
  );
}

// Utilitaire date simple (personnalise selon ton besoin)
function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: undefined });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 14, // plus d'espace en haut !
    paddingHorizontal: 10 // pour avoir du padding à gauche/droite
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#ff8269',
    marginBottom: 13,
    marginLeft: 7,
    marginTop: 3,
  },
challengeCard: {
    borderRadius: 18, // passe à 18
    padding: 11, // passe à 11 au lieu de 15
    marginBottom: 10, // passe à 10
    marginHorizontal: 2,
    width: screenWidth - 34, // réduit un peu l'écart
    alignSelf: 'center',
    elevation: 2,
    shadowColor: "#6371FF",
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 }
  },
  challengeTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  challengeDesc: {
    fontSize: 13.5,
    color: '#f4f4f4',
    marginBottom: 7,
    lineHeight: 19,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
    marginTop: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
    marginTop: 2,
  },
  participantsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12.5,
    marginRight: 3,
  },
  rewardText: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 2,
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  dates: {
    fontSize: 12,
    color: '#ececec',
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 1,
    fontWeight: '500'
  }
});
