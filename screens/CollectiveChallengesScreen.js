import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get('window').width;

export default function CollectiveChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from('collective_challenges')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Erreur récupération défis collectifs:', error);
      setChallenges([]);
    } else {
      setChallenges(data || []);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {challenges.length === 0 ? (
          <Text style={styles.noChallenges}>Aucun défi collectif pour le moment.</Text>
        ) : (
          challenges.map((challenge) => (
            <LinearGradient
              colors={['#5371ff', '#a259f7']}
              style={styles.challengeCard}
              start={{ x: 0.1, y: 0.15 }}
              end={{ x: 1, y: 0.8 }}
              key={challenge.id}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons name="trophy" size={28} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
              </View>

              <Text style={styles.challengeDesc}>{challenge.description}</Text>

              {/* Barre de progression */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round((challenge.participants_count / (challenge.goal || 1)) * 100)
                      )}%`,
                    },
                  ]}
                />
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
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9fb',
    padding: 12,
  },
  noChallenges: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  challengeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: screenWidth - 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  challengeDesc: {
    fontSize: 14,
    color: '#f0f0f0',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
  },
  participantsText: {
    fontSize: 13,
    color: '#fff',
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  dates: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  exportBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F4FFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  exportText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
