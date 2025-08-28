import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { View, StyleSheet, Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBMfgMxiCRhVLnumIdJukUpEg1g0VPV7Ao';

const PlacePicker = ({ onPlaceSelected }) => {
  return (
    <View style={styles.autocompleteContainer}>
      <GooglePlacesAutocomplete
        placeholder="Où voulez-vous bouger ?"
        fetchDetails={true}
        minLength={2}
        enablePoweredByContainer={false}
        onPress={(data, details = null) => {
          if (!details) return;
          const location = {
            address: data.description,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          };
          onPlaceSelected(location);
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'fr',
          types: 'geocode',
        }}
        textInputProps={{
          placeholderTextColor: '#999',
        }}
        predefinedPlaces={[]}
        styles={{
          textInputContainer: {
            borderTopWidth: 0,
            borderBottomWidth: 0,
            backgroundColor: 'transparent',
          },
          textInput: {
            height: 48,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            fontSize: 16,
            backgroundColor: '#fff',
          },
          listView: {
            position: 'absolute',
            top: 50,
            zIndex: 10,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            elevation: 5,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  autocompleteContainer: {
    position: 'relative',
    zIndex: 100, // très important pour que la liste suggestions passe au-dessus
    marginBottom: 60, // espace pour éviter que la liste soit coupée
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 16 : 8,
  },
});

export default PlacePicker;