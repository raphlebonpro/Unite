// screens/SessionCancelledScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SessionCancelledScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const titleFromNotif = route.params?.title;
  const bodyFromNotif = route.params?.body;

  return (
    <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Ionicons name="close-circle-outline" size={80} color="#d32f2f" style={{ marginBottom: 16 }} />

      <Text style={{ fontSize: 20, fontWeight: '700', color: '#d32f2f', textAlign: 'center', marginBottom: 10 }}>
        Cette session a été annulée
      </Text>

      <Text style={{ fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 30 }}>
        {bodyFromNotif || "Elle a été automatiquement annulée car aucun coéquipier ne s’est joint à toi à temps."}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs', { screen: 'CreateSession' })}
        activeOpacity={0.9}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={['#FF9D3C', '#FF6C4A', '#FF375E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
            🔁 Relancer une session
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
