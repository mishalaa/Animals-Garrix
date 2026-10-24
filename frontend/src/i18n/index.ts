import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import bn from './bn';
import en from './en';

export type Lang = 'en' | 'bn';
const LANG_KEY = 'petpassport.lang';

const deviceLang: Lang = getLocales()[0]?.languageCode === 'bn' ? 'bn' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Restore the language the user picked last time. */
export async function restoreLanguage() {
  try {
    const saved = (await AsyncStorage.getItem(LANG_KEY)) as Lang | null;
    if (saved && saved !== i18n.language) await i18n.changeLanguage(saved);
  } catch {
    // ignore
  }
}

export async function setLanguage(lang: Lang) {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export default i18n;
