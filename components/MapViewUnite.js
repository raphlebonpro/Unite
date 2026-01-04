import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapViewUnite({
  region,
  sessions = [],
  onSelectSession,
  selectedPoint,
  onLongPress,
  onMapReady,
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={region}
        showsUserLocation
        showsMyLocationButton
        onMapReady={onMapReady}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onLongPress?.({ latitude, longitude });
        }}
      >
        {sessions.map((session) => {
          if (!session.lat || !session.lng) return null;

          return (
<Marker
  key={session.id}
  coordinate={{
    latitude: Number(session.lat),
    longitude: Number(session.lng),
  }}
  onPress={() => onSelectSession?.(session)}
>
  <View
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#E5E7FF',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 6,
    }}
  >
    {session.icon}
  </View>
</Marker>
          );
        })}
        {selectedPoint && (
  <Marker
    coordinate={{
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
    }}
    pinColor="#3F4FFF"
  />
)}
      </MapView>
    </View>
  );
}
