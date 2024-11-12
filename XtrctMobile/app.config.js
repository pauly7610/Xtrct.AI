export default {
  expo: {
    name: "XtrctMobile",
    slug: "XtrctMobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "xtract",
    splash: {
      image: "./assets/MainLogo.png", // Updated path
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.xtract.mobile",
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.xtract.mobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      },
      firebaseConfig: {
        apiKey: "AIzaSyD0BVjAyRhWXXnPomD_yTyXhDEQw7nZJdc",
        authDomain: "task-a117a.firebaseapp.com",
        projectId: "task-a117a",
        storageBucket: "task-a117a.appspot.com",
        messagingSenderId: "45000234974",
        appId: "1:45000234974:web:3264c6958534eab902af4f",
        measurementId: "G-LHQKL5MTGD"
      }
    },
    plugins: [
      "expo-apple-authentication"
      // Remove reanimated from plugins temporarily
    ]
  }
};
