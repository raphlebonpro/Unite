import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export function ReportUserButton({ reportedUserId, currentUserId, autoOpen = false }) {
  const [modal, setModal] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setModal(true);
    }
  }, [autoOpen]);

  const handleSend = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: currentUserId,
          reported_user_id: reportedUserId,
          reason,
          details
        }]);

      if (error) throw error;

      Alert.alert("Merci", "Le signalement a bien été transmis.");
      setModal(false);
      setReason('');
      setDetails('');
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de signaler");
    }

    setLoading(false);
  };

  return (
    <Modal visible={modal} animationType="slide" transparent>
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.25)",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 22,
          width: "85%"
        }}>
          <Text style={{ fontWeight: "bold", fontSize: 17, marginBottom: 12 }}>
            Signaler un utilisateur
          </Text>

          <TextInput
            placeholder="Motif (obligatoire)"
            value={reason}
            onChangeText={setReason}
            style={{
              borderBottomWidth: 1,
              borderColor: "#eee",
              marginBottom: 12,
              padding: 5
            }}
            maxLength={60}
          />

          <TextInput
            placeholder="Détails (optionnel)"
            value={details}
            onChangeText={setDetails}
            style={{
              borderBottomWidth: 1,
              borderColor: "#eee",
              marginBottom: 18,
              padding: 5
            }}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={{
              backgroundColor: reason ? "#d92e3f" : "#ccc",
              borderRadius: 10,
              padding: 11,
              alignItems: "center"
            }}
            disabled={!reason || loading}
            onPress={handleSend}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignSelf: "center", marginTop: 16 }}
            onPress={() => setModal(false)}
          >
            <Text style={{ color: "#777" }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
