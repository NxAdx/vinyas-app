import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';

// In a real device we'd detect OS locale (e.g. from react-native-localize)
const fallbackLng = 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Required for React Native SQLite / Hermes compatibility often
    resources: {
      en,
      hi
    },
    lng: fallbackLng, 
    fallbackLng,
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
