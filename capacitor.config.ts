import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uppcl.progresstracker',
  appName: 'UPPCL Progress',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://dvvnl.vercel.app', // Production URL
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: false  // Content status bar ke neeche nahi jayega
    }
  }
};

export default config;

