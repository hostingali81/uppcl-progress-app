import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uppcl.progresstracker',
  appName: 'DVVNL Prgati',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://civilprogress.vercel.app/', // Production URL

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
    },
    NavigationBar: {
      color: '#ffffff',  // White background for navigation bar
      style: 'DARK'      // Dark icons (back, home, recent buttons)
    }
  }
};

export default config;

