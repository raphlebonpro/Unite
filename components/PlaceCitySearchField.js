import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, ScrollView,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';

const extra = (Constants?.expoConfig?.extra) ?? (Constants?.manifest?.extra) ?? {};
export const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  extra?.GOOGLE_MAPS_API_KEY ||
  '';

if (__DEV__ && !GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY manquant.');
}

function dedupe(preds) {
  const seen = new Set();
  return preds.filter((p) => {
    const key = (p.description || '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

export default function PlaceCitySearchField({
  value,
  onChange,
  onPick,
  placeholder = 'Ex : Lyon, Bordeaux, 16e arrondissement',
  boxStyle,
  suggestionContainerStyle,
  autoFocus = false,
}) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [showList, setShowList] = useState(false);

  const inputRef = useRef(null);
  const sessionToken = useRef(uuidv4());
  const closeTimer = useRef(null);
  const blurTimeoutRef = useRef(null);

  const query = useDebounced((value || '').trim(), 180);

  const fetchPredictions = useCallback(async () => {
    if (!showList) { setPredictions([]); return; }
    if (!GOOGLE_MAPS_API_KEY || query.length < 2) { setPredictions([]); return; }
    setLoading(true); setError(null);
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', query);
      url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      url.searchParams.set('sessiontoken', sessionToken.current);
      url.searchParams.set('language', 'fr');
      url.searchParams.set('components', 'country:FR');
      

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        setError(json.status); setPredictions([]); return;
      }

      const items = (json.predictions || []).map((p) => ({
        place_id: p.place_id,
        description: p.description,
        main: p.structured_formatting?.main_text || '',
        secondary: p.structured_formatting?.secondary_text || '',
        types: p.types || [],
      }));
      setPredictions(dedupe(items));
    } catch (e) {
      setError(e.message || 'Erreur'); setPredictions([]);
    } finally { setLoading(false); }
  }, [query, showList]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

const handlePick = useCallback(async (item) => {
  if (closeTimer.current) {
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  try {
    console.log("🧭 Item sélectionné:", item);

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', item.place_id);
    url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('fields', [
      'geometry/location',
      'formatted_address',
      'name',
      'types',
      'address_components',
    ].join(','));

    const res = await fetch(url.toString());
    const json = await res.json();

    console.log("📡 Google Place Details response:", JSON.stringify(json, null, 2));

    // ✅ Ne bloque jamais si status = OK
    if (json.status !== 'OK') {
      console.warn("⚠️ API Google a renvoyé:", json.status);
      setError(json.status);
      return;
    }

    const r = json.result;
    const lat = parseFloat(r.geometry?.location?.lat);
    const lng = parseFloat(r.geometry?.location?.lng);

    // ⚙️ Nettoyage du label comme sur la page création de session
    const pickedLabel = r.formatted_address || item.description || r.name || '';
    const cleanLabel = pickedLabel.replace(/, France$/i, '').trim();

    // ✅ Vérifie seulement que lat/lng existent
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      onPick?.({ description: cleanLabel, lat, lng });
      onChange?.(cleanLabel);

      setPredictions([]);
      setShowList(false);
      setFocused(false);
      inputRef.current?.blur();
      sessionToken.current = uuidv4();
    } else {
      console.warn("⚠️ Coordonnées manquantes:", lat, lng);
    }
  } catch (err) {
    // ❌ Ne plus afficher “Ville introuvable” pour rien
    console.warn("❌ Erreur handlePick:", err);
  }
}, [onPick, onChange]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Input */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[styles.inputBox, boxStyle]}
      >
        <AntDesign name="search1" size={19} color="#8A8C99" style={{ marginRight: 10 }} />
        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={(t) => { onChange?.(t); setShowList(true); }}
          onFocus={() => {
            setFocused(true);
            if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
            setShowList(true);
          }}
onBlur={() => {
  // ⚠️ Empêche la fermeture instantanée quand on tape sur une suggestion
  closeTimer.current = setTimeout(() => {
    if (!focused) {
      setShowList(false);
    }
    closeTimer.current = null;
  }, 300); // ← délai un peu plus long (300 ms)
}}
          style={[styles.input, { color: '#222' }]}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading && <ActivityIndicator size="small" color="#5B4EFF" />}
        {!!value && (
          <TouchableOpacity
            onPress={() => {
              onChange?.('');
              setPredictions([]); setShowList(true);
              inputRef.current?.focus();
            }}
            style={styles.clearBtn}
          >
            <AntDesign name="close" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Suggestions */}
      {showList && (predictions.length > 0 || error) && (
        <View
          style={[styles.suggestBox, suggestionContainerStyle]}
          // si on touche la liste, on annule la fermeture planifiée par onBlur
onTouchStart={() => {
  if (closeTimer.current) {
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }
}}
        >
          {error ? (
            <Text style={styles.errorText}>Autocomplete indisponible ({String(error)}).</Text>
          ) : null}

          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
            {predictions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.row}
                onPress={() => handlePick(item)}
                activeOpacity={0.9}
              >
                <MaterialCommunityIcons name="city" size={18} color="#5B4EFF" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.primary}>{item.main || item.description}</Text>
                  {item.secondary ? <Text numberOfLines={1} style={styles.secondary}>{item.secondary}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
            {loading ? <Text style={styles.loadingText}>Chargement…</Text> : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E7E7ED',
    paddingLeft: 14, paddingRight: 6, height: 56,
  },
  input: { flex: 1, height: 48, fontSize: 15, paddingHorizontal: 0 },
  clearBtn: { paddingHorizontal: 10, height: 48, justifyContent: 'center' },
  suggestBox: {
    position: 'absolute', top: 64, left: 0, right: 0, zIndex: 99,
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }, maxHeight: 280,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F3',
  },
  primary: { fontSize: 15, fontWeight: '700', color: '#1F2430' },
  secondary: { fontSize: 13, color: '#6E768A', marginTop: 2 },
  loadingText: { padding: 10, fontSize: 12, color: '#888', textAlign: 'center' },
  errorText: { padding: 8, color: '#d64545', fontSize: 12, textAlign: 'center' },
});
