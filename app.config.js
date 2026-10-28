import dotenv from "dotenv";
dotenv.config();

export default {
  expo: {
    name: "Unite",
    slug: "Unite",
    owner: "raphlebon",
    version: "1.1.9",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: false,

    updates: {
      enabled: false,
      checkAutomatically: "ON_ERROR_RECOVERY",
      fallbackToCacheTimeout: 0,
    },

    runtimeVersion: "1.0.0",

    icon: "./assets/icon1.png",

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    scheme: "unite",

    ios: {
      bundleIdentifier: "com.uniteapp.collectif",
      buildNumber: "138",
      icon: "./assets/icon1.png",
      supportsTablet: false,
      associatedDomains: ["applinks:uniteapp.fr"],
      infoPlist: {
        CFBundleDevelopmentRegion: "fr",
        CFBundleLocalizations: ["fr"],
        ITSAppUsesNonExemptEncryption: false,
        UIRequiresFullScreen: true,
        "UISupportedInterfaceOrientations~ipad": [],
        NSCameraUsageDescription:
          "Nous utilisons l’appareil photo pour prendre votre photo de profil.",
        NSPhotoLibraryUsageDescription:
          "Nous accédons à votre galerie pour choisir une photo de profil.",
        NSPhotoLibraryAddUsageDescription:
          "Nous enregistrons des images dans votre galerie si vous l’autorisez.",
        NSLocationWhenInUseUsageDescription:
          "Nous utilisons votre position pour afficher les sessions sportives proches.",
        UIBackgroundModes: ["remote-notification"],
      },
    },

    android: {
      package: "com.uniteapp.collectif",
      versionCode: 88,
      supportsTablet: false,
      forceDarkAllowed: false,
      blockedDeviceModels: ["*Tab*", "*Pad*", "*Tablet*"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground1.png",
        backgroundImage: "./assets/adaptive-icon-background1.png",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS",
        "WAKE_LOCK",
      ],
      googleServicesFile: "./google-services.json",
      softwareKeyboardLayoutMode: "resize",
      useNextNotificationsApi: true,

config: {
  googleMaps: {
    apiKey: process.env.ANDROID_GOOGLE_MAPS_SDK_KEY,
  },
},
intentFilters: [
    {
      action: "VIEW",
      autoVerify: true,
      data: [
        {
          scheme: "https",
          host: "uniteapp.fr",
          pathPrefix: "/session"
        }
      ],
      category: ["BROWSABLE", "DEFAULT"]
    }
  ],
     },

    web: {
      favicon: "./assets/favicon.png",
    },

plugins: [
  [
    "expo-notifications",
    {
      icon: "./assets/notification-icon.png",
      color: "#FF6C4A",
      useNextNotificationsApi: true,
    },
  ],
  [
    "react-native-fbsdk-next",
    {
      appID: "1182529240410223",
      clientToken: "3c16f4d1a7b1c9b0a520ee7f36ceeeea",
      displayName: "Unite",
      scheme: "fb1182529240410223"
    }
  ]
],
  
    extra: {
      ANDROID_GOOGLE_MAPS_SDK_KEY: process.env.ANDROID_GOOGLE_MAPS_SDK_KEY,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: { projectId: "1fd6a80b-0337-4744-af25-0bcac83e416e" },
    },
  },
};

