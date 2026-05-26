import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, Animated, InteractionManager } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// ─── Marqueur pin sélectionné — animé ─────────────────────────────────────────
const SelectedPointMarker = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <Animated.View style={[styles.selectedWrap, { transform: [{ scale }] }]}>
      <Animated.View style={[
        styles.selectedPulse,
        { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
      ]} />
      <View style={styles.selectedPin}>
        <View style={styles.selectedPinDot} />
      </View>
      <View style={styles.selectedShadow} />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
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
  if (!region) return <View style={StyleSheet.absoluteFill} />;

  const handleSessionPress = (session) => {
    InteractionManager.runAfterInteractions(() => { onSelectSession?.(session); });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={{
          latitude:      region.latitude,
          longitude:     region.longitude,
          latitudeDelta: region.latitudeDelta  ?? 0.05,
          longitudeDelta:region.longitudeDelta ?? 0.05,
        }}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        onMapReady={onMapReady}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onLongPress?.({ latitude, longitude });
        }}
      >
        {sessions.map((session) => {
          if (!session?.id || !Number.isFinite(Number(session.lat)) || !Number.isFinite(Number(session.lng))) return null;
          return (
            <Marker
              key={`session-${session.id}`}
              coordinate={{ latitude: Number(session.lat), longitude: Number(session.lng) }}
              tracksViewChanges={false}
              onPress={(e) => { e.stopPropagation(); handleSessionPress(session); }}
            >
              <View style={styles.sessionMarker}>{session.icon}</View>
            </Marker>
          );
        })}

        {selectedPoint && (
          <Marker
            key={`${selectedPoint.latitude}-${selectedPoint.longitude}`}
            coordinate={{ latitude: selectedPoint.latitude, longitude: selectedPoint.longitude }}
            tracksViewChanges
            anchor={{ x: 0.5, y: 1 }}
          >
            <SelectedPointMarker />
          </Marker>
        )}

        {gpsEnabled && userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.userWrap}>
              <View style={styles.userPulse} />
              <View style={styles.userDot} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionMarker: {
    width: 42, height: 42, borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#EAEAEA',
    shadowColor: '#000', shadowOpacity: 0.14,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  selectedWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 48, height: 60,
  },
  selectedPulse: {
    position: 'absolute',
    bottom: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F62DAE',
  },
  selectedPin: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F62DAE',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#F62DAE',
    shadowOpacity: 0.5,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 4,
  },
  selectedPinDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#fff',
  },
  selectedShadow: {
    width: 12, height: 4, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: -2,
  },
  userWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  userPulse: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(24,119,242,0.18)',
  },
  userDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#1877F2',
    borderWidth: 2.5, borderColor: '#FFFFFF',
    shadowColor: '#1877F2', shadowOpacity: 0.4,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
