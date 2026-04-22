import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.keevo.erp',
  appName: 'KEEVO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
