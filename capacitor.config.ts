import { Capacitor } from "@capacitor/core";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eltravieso.com";

const config = {
  appId: "com.eltravieso.app",
  appName: "El Travieso",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? APP_URL,
    cleartext: process.env.CAPACITOR_SERVER_URL?.startsWith("http://") ?? false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
