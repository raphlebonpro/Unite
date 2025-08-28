// components/PlaceSearchField.js
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, Platform } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Constants from 'expo-constants';

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
  console.warn('GOOGLE_MAPS_API_KEY manquant. Définis-le dans .env ou extra.GOOGLE_MAPS_API_KEY.');
}

export default function PlaceSearchField({
  value,
  onChange,
  onPick,
  placeholder = 'Où voulez-vous bouger ?',
  componentsCountry = 'country:fr',
  minLength = 2,
  boxStyle,
  suggestionContainerStyle,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // AUTOCOMPLETE
  useEffect(() => {
    let active = true;
    const run = async () => {
      const q = value?.trim() || '';
      if (!GOOGLE_MAPS_API_KEY || q.length < minLength) {
        if (active) setSuggestions([]);
        return;
      }
      try {
        setLoading(true);
        const encoded = encodeURIComponent(q);
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encoded}&key=${GOOGLE_MAPS_API_KEY}&language=fr&types=geocode&components=${componentsCountry}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;
        setSuggestions(Array.isArray(data?.predictions) ? data.predictions : []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(run, 180);
    return () => { active = false; clearTimeout(t); };
  }, [value, componentsCountry, minLength]);

  const handleSuggestionPress = async (placeId, description) => {
    try {
      if (!GOOGLE_MAPS_API_KEY) return;
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;
      const res = await fetch(url);
      const data = await res.json();
      const { lat, lng } = data?.result?.geometry?.location || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      onPick({ description, lat, lng });
      setSuggestions([]);
    } catch {}
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Champ de saisie */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E7E7ED',
          paddingLeft: 14,
          paddingRight: 6,
          height: 56,
          ...(boxStyle || {}),
        }}
      >
        <AntDesign name="search1" size={19} color="#8A8C99" style={{ marginRight: 10 }} />

        {/* Texte affiché quand non focus */}
        {!focused && !!value && (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              position: 'absolute',
              left: 42,
              right: 36,
              fontSize: 14, // ↓ réduit
              color: '#222',
            }}
            pointerEvents="none"
          >
            {value}
          </Text>
        )}

        {/* TextInput réel */}
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={false}
          numberOfLines={1}
          style={{
            flex: 1,
            height: 48,
            fontSize: 15, // ↓ réduit
            paddingHorizontal: 0,
            textAlign: 'left',
            textAlignVertical: 'center',
            includeFontPadding: Platform.OS === 'android' ? true : undefined,
            color: focused ? '#222' : 'transparent',
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {!!value && (
          <TouchableOpacity
            onPress={() => {
              onChange('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            style={{ paddingHorizontal: 10, height: 48, justifyContent: 'center' }}
          >
            <AntDesign name="close" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View
          style={{
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
            maxHeight: 280,
            overflow: 'hidden',
            ...(suggestionContainerStyle || {}),
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F3',
                }}
                onPress={() => handleSuggestionPress(item.place_id, item.description)}
              >
                <Text style={{ fontSize: 14, color: '#222' }} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
            {loading ? (
              <Text style={{ padding: 10, fontSize: 12, color: '#888', textAlign: 'center' }}>
                Chargement…
              </Text>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
