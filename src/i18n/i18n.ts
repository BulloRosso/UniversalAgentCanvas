// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n instance
const initI18n = async () => {
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        hy: {
          translation: {
            // Control Panel
            "homework": "Խնդրում եմ սկանավորեք ձեր տնային աշխատանքը",
            "tutor": "ԱԹ ուսուցիչ",
            "controlPanel": "Բարի գալուստ",
            "kiTutor": "ԱԲ ուսուցիչ",
            "enterUrl": "Մուտքագրեք URL",
            "displayAsVideo": "Ցուցադրել որպես տեսանյութ",
            "displayAsWebpage": "Ցուցադրել որպես վեբ էջ",
            "youtubeUrlDetected": "✓ YouTube URL-ը հայտնաբերված է",
            "pasteYoutubeUrl": "YouTube տեսանյութերի համար տեղադրեք YouTube-ի URL-ը",
            "selectLanguage": "Ընտրեք լեզուն",

            // Canvas
            "content": "Բովանդակություն",
            "youtubePlayer": "YouTube նվագարկիչ",
            "videoPlayer": "Տեսանյութի նվագարկիչ",
            "webContent": "Վեբ բովանդակություն",
            "loading": "Բեռնվում է...",
            "loadingVideo": "Տեսանյութը բեռնվում է...",
            "loadingWebpage": "Վեբ էջը բեռնվում է...",
            "noContent": "Բովանդակություն չկա",
            "error": "Սխալ",
            "invalidYoutubeUrl": "Անվավեր YouTube URL",
            "pressEscToExit": "Սեղմեք ESC՝ ամբողջական էկրանից դուրս գալու համար",

            // Languages
            "armenian": "Հայերեն",
            "english": "English",
            "german": "Deutsch",

            // Input pane
            "chat.input.placeholder": "Խնդրում եմ մուտքագրել հարց",

             // Chat messages
            "welcomeMessage": "Բարի գալուստ! Ես ձեր AI օգնականն եմ: Դուք կարող եք տեղադրել ցանկացած YouTube URL կամ վեբ էջի URL, և ես այն ցուցադրելու եմ ձեզ համար: Օգնություն է հարկավո՞ր: Պարզապես հարցրեք!",
            "selectLesson": "Ընտրեք դասը",
              "loadingLecture": "Բեռնվում է...",
              "lectureLoadError": "Սխալ՝ դասախոսության բեռնման ժամանակ",
          }
        },
        en: {
          translation: {
            // Control Panel
            "tutor": "AI Tutor",
            "homework": "Please scan for your homework",
            "controlPanel": "Control Panel",
            "kiTutor": "AI Tutor",
            "enterUrl": "Enter URL",
            "displayAsVideo": "Display as Video",
            "displayAsWebpage": "Display as Webpage",
            "youtubeUrlDetected": "✓ YouTube URL detected",
            "pasteYoutubeUrl": "For YouTube videos, paste a YouTube video URL",
            "selectLanguage": "Select Language",

            // Canvas
            "content": "Welcome",
            "youtubePlayer": "YouTube Player",
            "videoPlayer": "Video Player",
            "webContent": "Web Content",
            "loading": "Loading...",
            "loadingVideo": "Loading video...",
            "loadingWebpage": "Loading webpage...",
            "noContent": "No content loaded",
            "error": "Error",
            "invalidYoutubeUrl": "Invalid YouTube URL",
            "pressEscToExit": "Press ESC to exit fullscreen",

            // Input pane
            "chat.input.placeholder": "Please type a question",
            
            // Languages
            "armenian": "Armenian",
            "english": "English",
            "german": "German",

            // Chat messages
            "welcomeMessage": "Willkommen! Ich bin Ihr KI-Assistent. Sie können eine beliebige YouTube-URL oder Webseiten-URL einfügen, und ich werde sie für Sie anzeigen. Brauchen Sie Hilfe? Fragen Sie einfach!",

            "selectLesson": "Select Lesson",
              "loadingLecture": "Loading lecture...",
              "lectureLoadError": "Error loading lecture",

          }
        },
        de: {
          translation: {
            "tutor": "AI Tutor",
            // Control Panel
            "homework": "Euer Link für die Hausaufgaben - bitte scannen",
            "controlPanel": "Kontrollzentrum",
            "kiTutor": "KI Professor",
            "enterUrl": "URL eingeben",
            "displayAsVideo": "Als Video anzeigen",
            "displayAsWebpage": "Als Webseite anzeigen",
            "youtubeUrlDetected": "✓ YouTube-URL erkannt",
            "pasteYoutubeUrl": "Fügen Sie für YouTube-Videos eine YouTube-Video-URL ein",
            "selectLanguage": "Sprache auswählen",

            // Canvas
            "content": "Willkommen",
            "youtubePlayer": "YouTube-Player",
            "videoPlayer": "Video-Player",
            "webContent": "Web-Inhalt",
            "loading": "Wird geladen...",
            "loadingVideo": "Video wird geladen...",
            "loadingWebpage": "Webseite wird geladen...",
            "noContent": "Kein Inhalt geladen",
            "error": "Fehler",
            "invalidYoutubeUrl": "Ungültige YouTube-URL",
            "pressEscToExit": "ESC drücken, um Vollbild zu verlassen",

            // Input pane
            "chat.input.placeholder": "Bitte gib eine Frage ein",
            
            // Languages
            "armenian": "Armenisch",
            "english": "Englisch",
            "german": "Deutsch",

            // Chat messages
            "welcomeMessage": "Welcome! I am your AI assistant. You can paste any YouTube URL or webpage URL, and I will display it for you. Need help? Just ask!",

            "selectLesson": "Lektion auswählen",
              "loadingLecture": "Vorlesung wird geladen...",
              "lectureLoadError": "Fehler beim Laden der Vorlesung",
          }
        }
      },
      lng: 'hy', // default language
      fallbackLng: 'hy',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false // This is important
      }
    });
};

initI18n();

export default i18n;