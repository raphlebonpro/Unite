import 'dotenv/config';

export default {
  expo: {
    name: "Unite",
    slug: "Unite",
    owner: "raphlebon",
    version: "1.0.3", // version affichée dans l'app
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    updates: { enabled: false },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      bundleIdentifier: "com.collectif.uniteapp",
      buildNumber: "14", // incrémente à chaque build iOS
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_SDK_KEY // Clé SDK iOS
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,

        // Permissions nécessaires pour éviter les crashs
        NSCameraUsageDescription:
          "Nous utilisons l’appareil photo pour prendre votre photo de profil.",
        NSPhotoLibraryUsageDescription:
          "Nous accédons à votre galerie pour choisir une photo de profil.",
        NSPhotoLibraryAddUsageDescription:
          "Nous enregistrons des images dans votre galerie si vous l’autorisez.",
        NSLocationWhenInUseUsageDescription:
          "Nous utilisons votre position pour afficher les sessions sportives proches."
      }
    },

    android: {
      package: "com.collectif.uniteapp",
      versionCode: 4, // incrémente aussi si tu rebuild pour le Play Store
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleMaps: {
          apiKey: process.env.ANDROID_GOOGLE_MAPS_SDK_KEY // Clé SDK Android
        }
      },
softwareKeyboardLayoutMode: "pan"
},

    web: {
      favicon: "./assets/favicon.png"
    },

    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      eas: { projectId: "1fd6a80b-0337-4744-af25-0bcac83e416e" }
    }
  }
};
