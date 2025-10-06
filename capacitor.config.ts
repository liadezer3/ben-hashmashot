import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e22c4ef7ae114b46840057ed84bab907',
  appName: 'shabbat-hag-alarm',
  webDir: 'dist',
  server: {
    url: 'https://e22c4ef7-ae11-4b46-8400-57ed84bab907.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
