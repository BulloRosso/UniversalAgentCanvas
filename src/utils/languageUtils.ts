// src/utils/languageUtils.ts
export const getVoiceRecognitionLanguage = (i18nLang: string): string => {
  // Map i18n language codes to speech recognition language codes
  const languageMap: { [key: string]: string } = {
    en: 'en-US',    // English (United States)
    'en-US': 'en-US',
    de: 'de-DE',    // German (Germany)
    'de-DE': 'de-DE',
    hy: 'hy-AM',    // Armenian
    'hy-AM': 'hy-AM'
  };

  return languageMap[i18nLang] || 'en-US'; // Default to en-US if no mapping found
};

// Supported languages for speech recognition
export const supportedVoiceLanguages = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'de-DE', label: 'German' },
  { code: 'hy-AM', label: 'Armenian' }
];