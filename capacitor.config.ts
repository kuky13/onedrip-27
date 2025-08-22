import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c3a6a8a8ef0a4c63b2592ec5e9bd4572',
  appName: 'OneDrip',
  webDir: 'dist',
  server: {
    url: 'https://c3a6a8a8-ef0a-4c63-b259-2ec5e9bd4572.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;