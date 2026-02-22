import React, { useRef, useEffect } from 'react';
import { Platform, StyleSheet, View, InteractionManager } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapViewUnite({
  region,
  sessions = [],
  onSelectSession,
  selectedPoint,
  onLongPress,
  onMapReady,
  gpsEnabled,
  userLocation,
}) {

  const [isReady, setIsReady] = React.useState(false);

  // 🚫 garde absolue
  if (!region) {
    return <View style={StyleSheet.absoluteFill} />;
  }

  const handleSessionPress = (session) => {
    // 🔥 ANDROID SAFE
    InteractionManager.runAfterInteractions(() => {
      onSelectSession?.(session);
    });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
<MapView
  style={StyleSheet.absoluteFill}
  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
  region={{
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: region.latitudeDelta ?? 0.05,
    longitudeDelta: region.longitudeDelta ?? 0.05,
  }}
  onMapReady={onMapReady}
  onLongPress={(e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onLongPress?.({ latitude, longitude });
  }}
>
        {/* 📍 SESSIONS */}
        {sessions.map((session) => {
          if (
            !session?.id ||
            !Number.isFinite(Number(session.lat)) ||
            !Number.isFinite(Number(session.lng))
          ) {
            return null;
          }

          return (
            <Marker
              key={`session-${session.id}`}
              coordinate={{
                latitude: Number(session.lat),
                longitude: Number(session.lng),
              }}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation(); // 👈 CRITIQUE
                handleSessionPress(session);
              }}
            >
              {/* ✅ Marker React custom */}
              <View style={styles.sessionMarker}>
                {session.icon}
              </View>
            </Marker>
          );
        })}

        {/* 📌 Point sélectionné */}
        {selectedPoint && (
          <Marker
            coordinate={{
              latitude: selectedPoint.latitude,
              longitude: selectedPoint.longitude,
            }}
            pinColor="#3F4FFF"
          />
        )}

        {/* 🔵 GPS utilisateur */}
        {gpsEnabled && userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            tracksViewChanges={false}
          >
            <View style={styles.userDot} />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionMarker: {
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
  },
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
