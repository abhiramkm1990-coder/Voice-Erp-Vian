import { WAILanguage } from '../types';

export interface SpeechRecognitionHookOptions {
  language: WAILanguage;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export const getLanguageCode = (lang: WAILanguage): string => {
  switch (lang) {
    case 'ml':
      return 'ml-IN';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-US';
  }
};

// Check if browser supports Web Speech API
export const isSpeechRecognitionSupported = (): boolean => {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// Voice synthesis helper with fluent voice selection & fallback
export const speakText = (
  text: string,
  lang: WAILanguage = 'en',
  onStart?: () => void,
  onEnd?: () => void
) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    onEnd?.();
    return;
  }

  // Safely stop any ongoing speech without throwing error events
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    // ignore
  }

  // Strip Markdown, emojis, bullets, and brackets for fluid speech playback
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`/g, '')
    .replace(/#/g, '')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/•/g, '')
    .replace(/-/g, ' ')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  const doSpeak = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLangCode = getLanguageCode(lang);
      utterance.lang = targetLangCode;
      
      // Locked strictly to pitch 1.0, rate 0.85 for Malayalam fluid natural human speech cadence
      utterance.rate = lang === 'ml' ? 0.85 : 0.95;
      utterance.pitch = 1.0;

      // Find best natural voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        let matchedVoice = null;

        if (lang === 'ml') {
          // Prioritize exact Malayalam voice (ml-IN, Google മലയാളം, or ml)
          matchedVoice = voices.find(
            (v) =>
              v.lang.toLowerCase() === 'ml-in' ||
              v.lang.toLowerCase().includes('ml') ||
              v.name.toLowerCase().includes('malayalam') ||
              v.name.toLowerCase().includes('മലയാളം')
          );
          
          // Fallback to Indian English/Hindi voice if explicit ml voice is absent in browser
          if (!matchedVoice) {
            matchedVoice = voices.find(
              (v) =>
                v.lang.toLowerCase().includes('hi-in') ||
                v.lang.toLowerCase().includes('en-in') ||
                v.name.toLowerCase().includes('india')
            );
          }
        } else {
          matchedVoice = voices.find(
            (v) =>
              v.lang === targetLangCode ||
              v.lang.replace('_', '-').startsWith(targetLangCode)
          );
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (e: any) => {
        if (e && e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis state event:', e.error || e);
        }
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis play skipped:', err);
      onEnd?.();
    }
  };

  // 50ms buffer prevents Chrome/Safari cancellation race condition after cancel()
  setTimeout(doSpeak, 50);
};

export const stopSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};
