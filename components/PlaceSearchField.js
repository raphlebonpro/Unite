import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';

const extra =
  (Constants?.expoConfig?.extra) ??
  (Constants?.manifest?.extra) ??
  {};

export const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  extra?.GOOGLE_MAPS_API_KEY ||
  '';

if (__DEV__ && !GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY manquant. Définis-le dans .env (.env.local) ou extra.GOOGLE_MAPS_API_KEY.');
}

const ICON_BY_TYPE = {
  establishment: 'office-building',
  point_of_interest: 'map-marker',
  museum: 'bank',
  park: 'tree',
  stadium: 'stadium-variant',
  gym: 'dumbbell',
  store: 'storefront-outline',
  supermarket: 'cart-outline',
  restaurant: 'silverware-fork-knife',
  cafe: 'coffee-outline',
  bar: 'glass-wine',
  lodging: 'bed-king-outline',
  transit_station: 'bus-stop-covered',
  airport: 'airplane',
  train_station: 'train',
  school: 'school-outline',
  university: 'school-outline',
  courthouse: 'scale-balance',
  city_hall: 'town-hall',
  tourist_attraction: 'camera',
  church: 'church',
  mosque: 'mosque',
  hindu_temple: 'temple-hindu',
  synagogue: 'synagogue',
  route: 'road-variant',
  street_address: 'map-marker-outline',
  premise: 'home-city-outline',
  subpremise: 'home-outline',
  geocode: 'map-search-outline',
  default: 'map-marker-outline',
};

// ───────── Utils ─────────
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
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Props :
 * value, onChange, onPick({ description, lat, lng, place_id })
 */
export default function PlaceSearchField({
  value,
  onChange,
  onPick,
  placeholder = 'Où voulez-vous bouger ?',
  componentsCountry = 'country:fr',
  minLength = 2,
  boxStyle,
  suggestionContainerStyle,
  locationBias,
  strictBounds = false,
  autoFocus = false,
}) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const closeTimer = useRef(null);

  // contrôle d’ouverture
  const [showList, setShowList] = useState(false);

  const lastPickedRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const [sessionToken, setSessionToken] = useState(() => uuidv4());

  const query = useDebounced((value || '').trim(), 180);

  const compsParam = useMemo(() => (componentsCountry || 'country:fr'), [componentsCountry]);

  // ───────── Autocomplete
  const fetchPredictions = useCallback(async () => {
    setError(null);

    if (!showList) { setPredictions([]); return; }

    const q = query;
    if (!GOOGLE_MAPS_API_KEY || q.length < minLength) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', q);
      url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      url.searchParams.set('sessiontoken', sessionToken);
      url.searchParams.set('language', 'fr');
      url.searchParams.set('components', compsParam);

      // bias
      const hasLat = Number.isFinite(locationBias?.lat);
      const hasLng = Number.isFinite(locationBias?.lng);
      const hasRadius = Number.isFinite(locationBias?.radiusMeters) && locationBias.radiusMeters > 0;
      if (hasLat && hasLng) {
        url.searchParams.set('location', `${locationBias.lat},${locationBias.lng}`);
        if (hasRadius) {
          const radius = Math.min(50000, Math.max(1, Math.floor(locationBias.radiusMeters)));
          url.searchParams.set('radius', String(radius));
        }
        if (strictBounds && hasRadius) {
          url.searchParams.set('strictbounds', 'true');
        }
      }

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        setError(`${json.status}${json.error_message ? `: ${json.error_message}` : ''}`);
        setPredictions([]);
        setLoading(false);
        return;
      }

      const items = (json.predictions || []).map((p) => {
        const primary = p.structured_formatting?.main_text || p.description;
        const secondary = p.structured_formatting?.secondary_text || '';
        const types = p.types || [];
        const bestType = types[0] || 'default';
        return {
          place_id: p.place_id,
          description: p.description,
          primary,
          secondary,
          types,
          bestType,
          icon: ICON_BY_TYPE[bestType] || ICON_BY_TYPE.default,
        };
      });

      setPredictions(dedupe(items));
    } catch (e) {
      setError(e?.message || 'Erreur');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [query, compsParam, locationBias, strictBounds, sessionToken, minLength, showList]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  // ───────── Details
  const fetchDetails = useCallback(async (place_id) => {
    if (!GOOGLE_MAPS_API_KEY || !place_id) return null;
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.set('place_id', place_id);
      url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      url.searchParams.set('sessiontoken', sessionToken);
      url.searchParams.set('language', 'fr');
      url.searchParams.set('fields', [
        'geometry/location',
        'formatted_address',
        'name',
      ].join(','));

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.status !== 'OK') return null;

      const r = json.result;

      return {
        description: r.formatted_address || r.name,
        lat: r.geometry?.location?.lat ?? null,
        lng: r.geometry?.location?.lng ?? null,
      };
    } catch {
      return null;
    }
  }, [sessionToken]);

  // ───────── SUGGESTION PRESS (corrigé)
  const handleSuggestionPress = useCallback(async (item) => {

    const details = await fetchDetails(item.place_id);
    const pickedLabel = details?.description || item.description;

    // met à jour l'input
    onChange?.(pickedLabel);

    // envoie les lat/lng au parent (CreateSession)
    onPick?.({
      description: pickedLabel,
      lat: details?.lat ?? null,
      lng: details?.lng ?? null,
      place_id: item.place_id,
    });

    // ferme la liste sans blur
    setPredictions([]);
    setShowList(false);

    lastPickedRef.current = pickedLabel;

    // surtout pas de blur (c'était la cause du bug)
    // inputRef.current?.blur();  <-- supprimé

    setSessionToken(uuidv4());
  }, [fetchDetails, onPick, onChange]);

  // ───────── UI
  return (
    <View style={{ position: 'relative' }}>
      {/* Input */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[styles.inputBox, boxStyle]}
      >
        <AntDesign name="search1" size={19} color="#8A8C99" style={{ marginRight: 10 }} />

        {!focused && !!value && (
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.readOnlyText} pointerEvents="none">
            {value}
          </Text>
        )}

        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={(t) => {
            onChange?.(t);
            lastPickedRef.current = null;
            setShowList(true);
            if (t.length < minLength) setPredictions([]);
          }}
          onFocus={() => {
            setFocused(true);
            setShowList(true);
          }}
          onBlur={() => {
            setFocused(false);
            closeTimer.current = setTimeout(() => {
              setShowList(false);
              closeTimer.current = null;
            }, 150);
          }}
          style={[styles.input, { color: focused ? '#222' : 'transparent' }]}
        />

        {loading && <ActivityIndicator size="small" color="#5B4EFF" />}
        {!!value && (
          <TouchableOpacity
            onPress={() => {
              onChange?.('');
              lastPickedRef.current = null;
              setPredictions([]);
              setShowList(true);
              inputRef.current?.focus();
            }}
            style={styles.clearBtn}
          >
            <AntDesign name="close" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Suggestions */}
      {showList && (predictions.length > 0 || (error && query.length >= minLength)) && (
        <View
          style={[styles.suggestBox, suggestionContainerStyle]}
          onTouchStart={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
          }}
        >
          {error && <Text style={styles.errorText}>Autocomplete indisponible ({String(error)}).</Text>}

          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
            {predictions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.row}
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.9}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={item.icon} size={18} color="#5B4EFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.primary}>{item.primary}</Text>
                  {item.secondary ? (
                    <Text numberOfLines={1} style={styles.secondary}>{item.secondary}</Text>
                  ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E7ED',
    paddingLeft: 14,
    paddingRight: 6,
    height: 56,
  },
  readOnlyText: {
    position: 'absolute',
    left: 42,
    right: 36,
    fontSize: 14,
    color: '#222',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    paddingHorizontal: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: Platform.OS === 'android' ? true : undefined,
  },
  clearBtn: { paddingHorizontal: 10, height: 48, justifyContent: 'center' },
  suggestBox: {
    position: 'absolute',
    top: 56 + 8,
    left: 0,
    right: 0,
    zIndex: 99,
    elevation: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    paddingVertical: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  primary: { fontSize: 15, fontWeight: '700', color: '#1F2430' },
  secondary: { fontSize: 13, color: '#6E768A', marginTop: 2 },
  loadingText: { padding: 10, fontSize: 12, color: '#888', textAlign: 'center' },
  errorText: { padding: 8, color: '#d64545', fontSize: 12, textAlign: 'center' },
});
