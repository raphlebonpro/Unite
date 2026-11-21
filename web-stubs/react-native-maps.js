import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import Map, { Marker as MbMarker } from 'react-map-gl/mapbox'; // v8 ; en v7 : 'react-map-gl'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const toZoom = (d) => Math.log2(360 / (d || 0.05));

const MapView = React.forwardRef(
  ({ style, region, initialRegion, children, onMapReady, onRegionChangeComplete }, ref) => {
    const mapRef = useRef(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (r) =>
        mapRef.current?.flyTo({ center: [r.longitude, r.latitude], zoom: toZoom(r.longitudeDelta) }),
      fitToCoordinates: () => {},
    }));

    // Prévient l'écran dès le montage : c'est ce qui lève le voile "Chargement de la carte"
    useEffect(() => {
      onMapReady?.();
    }, []);

    const r = region || initialRegion || { latitude: 48.8566, longitude: 2.3522, longitudeDelta: 0.2 };

    return (
      <View style={style}>
        <Map
          ref={mapRef}
          mapLib={mapboxgl}
          mapboxAccessToken={TOKEN}
          initialViewState={{ latitude: r.latitude, longitude: r.longitude, zoom: toZoom(r.longitudeDelta) }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          style={{ width: '100%', height: '100%' }}
          onError={(e) => console.log('>>> Mapbox erreur :', e?.error?.message)}
          onMoveEnd={(e) => {
            const { latitude, longitude, zoom } = e.viewState;
            const delta = 360 / Math.pow(2, zoom);
            onRegionChangeComplete?.({ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta });
          }}
        >
          {children}
        </Map>
      </View>
    );
  }
);

export const Marker = ({ coordinate, children, onPress }) => (
  <MbMarker
    latitude={coordinate.latitude}
    longitude={coordinate.longitude}
    anchor="bottom"
    color="#FE5D02"
    onClick={(e) => {
      e.originalEvent?.stopPropagation();
      onPress?.({ stopPropagation: () => {}, nativeEvent: {} });
    }}
  >
    {children}
  </MbMarker>
);

export const Callout = () => null;
export const Circle = () => null;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
export default MapView;
