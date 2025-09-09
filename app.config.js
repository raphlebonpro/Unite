import 'dotenv/config';

export default {
  expo: {
    name: "Unite",
    slug: "Unite",
    owner: "raphlebon",
    version: "1.0.3",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    updates: { enabled: false },

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      bundleIdentifier: "com.collectif.uniteapp",
      buildNumber: "32",
      icon: "./assets/icon.png",
      supportsTablet: true,
      config: {
       googleMapsApiKey: process.env.IOS_GOOGLE_MAPS_SDK_KEY
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
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
      versionCode: 34,
      adaptiveIcon: {
       foregroundImage: "./assets/adaptive-icon-foreground1.png",
       backgroundImage: "./assets/adaptive-icon-background1.png"
      },
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.ANDROID_GOOGLE_MAPS_SDK_KEY
        }
      },
      softwareKeyboardLayoutMode: "resize"
    },

    web: {
      favicon: "./assets/favicon.png"
    },

    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: { projectId: "1fd6a80b-0337-4744-af25-0bcac83e416e" }
    }
  }
};

