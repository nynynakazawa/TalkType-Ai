
module.exports = {
    expo: {
      name: "TalkType-Ai",
      slug: "TalkType-Ai",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff"
        }
      },
      web: {
        favicon: "./assets/favicon.png",
        bundler: "metro"
      },
      extra: {
        GPT4O_MINI_API_KEY: "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",
        EXPO_ROUTER_APP_ROOT: "./app"
      },
      plugins: [
        "expo-router"
      ]
    }
  };