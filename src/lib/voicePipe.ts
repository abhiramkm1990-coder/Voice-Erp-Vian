import { useState, useRef, useCallback, useEffect } from 'react';
import { speakText, stopSpeech } from './speech';

export interface UseWhisperSTTOptions {
  defaultLang?: 'ml' | 'en' | 'hi';
  onTranscript?: (transcript: string) => void;
}

// Global reference for currently playing audio so it can be stopped instantly
let activeAudioElement: HTMLAudioElement | null = null;

export const stopAudioPlayback = () => {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch (_) {}
    activeAudioElement = null;
  }
  stopSpeech();
};

/**
 * Converts a Blob to a base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        const base64data = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64data);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
};

export interface STTFormData {
  audioBase64?: string;
  blob?: Blob;
  lang?: 'ml' | 'en' | 'hi' | string;
  mimeType?: string;
  userOpenAiKey?: string;
}

/**
 * Handles uploading the recorded audio blob/form data to the STT API.
 * 1. Correctly awaits the blob upload
 * 2. Properly stringifies the form data / payload
 * 3. Checks and handles server response status before attempting to access the transcript text
 */
export async function handleSendMessage(
  input: Blob | FormData | STTFormData,
  lang: 'ml' | 'en' | 'hi' | string = 'ml'
): Promise<string> {
  let audioBase64 = '';
  let mimeType = 'audio/webm';
  let targetLang = lang;
  let userOpenAiKey: string | undefined;

  // 1. Correctly await the blob upload & preparation
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    mimeType = input.type || 'audio/webm';
    audioBase64 = await blobToBase64(input);
  } else if (typeof FormData !== 'undefined' && input instanceof FormData) {
    const file = input.get('file') || input.get('audio') || input.get('blob');
    if (file && file instanceof Blob) {
      mimeType = file.type || 'audio/webm';
      audioBase64 = await blobToBase64(file);
    } else if (typeof input.get('audioBase64') === 'string') {
      audioBase64 = input.get('audioBase64') as string;
    }
    const formLang = input.get('lang');
    if (typeof formLang === 'string') targetLang = formLang;
    const key = input.get('userOpenAiKey');
    if (typeof key === 'string') userOpenAiKey = key;
  } else if (typeof input === 'object' && input !== null) {
    const obj = input as STTFormData;
    if (obj.blob instanceof Blob) {
      mimeType = obj.blob.type || obj.mimeType || 'audio/webm';
      audioBase64 = await blobToBase64(obj.blob);
    } else if (obj.audioBase64) {
      audioBase64 = obj.audioBase64;
    }
    if (obj.lang) targetLang = obj.lang;
    if (obj.mimeType) mimeType = obj.mimeType;
    if (obj.userOpenAiKey) userOpenAiKey = obj.userOpenAiKey;
  }

  // Check stored keys as fallback
  if (!userOpenAiKey && typeof window !== 'undefined') {
    userOpenAiKey = localStorage.getItem('OPENAI_API_KEY') || undefined;
  }
  const userGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || undefined : undefined;

  // 2. Properly stringify the form data / payload into request body
  const payload: Record<string, any> = {
    audioBase64,
    lang: targetLang,
    mimeType,
  };
  if (userOpenAiKey) {
    payload.userOpenAiKey = userOpenAiKey;
  }
  if (userGeminiKey) {
    payload.userGeminiKey = userGeminiKey;
  }
  const body = JSON.stringify(payload);

  console.log('[STT] Sending audio upload to /api/stt, base64 size =', audioBase64.length);

  // Await the upload request
  const res = await fetch('/api/stt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  console.log('[STT] /api/stt response status =', res.status, res.statusText);

  // 3. Check and handle server response status BEFORE accessing the transcript text
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.warn(`[STT] Server returned error status ${res.status}:`, errorBody);
    throw new Error(`Server returned error status ${res.status}: ${errorBody || res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const nonJsonText = await res.text().catch(() => '');
    console.warn('[STT] /api/stt returned non-JSON response:', res.status, nonJsonText.slice(0, 150));
    throw new Error(`Expected JSON response, received: ${contentType}`);
  }

  // Correctly interpret the resulting text object rather than the entire response stream
  const data = await res.json();
  console.log('[STT] /api/stt parsed text object:', data);

  // Access transcript text safely from the parsed text object
  if (data && typeof data === 'object') {
    if (typeof data.text === 'string' && data.text.trim()) {
      return data.text.trim();
    }
    if (typeof data.transcript === 'string' && data.transcript.trim()) {
      return data.transcript.trim();
    }
    if (data.transcript && typeof data.transcript === 'object' && typeof (data.transcript as any).text === 'string') {
      return (data.transcript as any).text.trim();
    }
  } else if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  return '';
}

export const useWhisperSTT = (options?: UseWhisperSTTOptions) => {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const browserRecognitionRef = useRef<any>(null);
  const browserTranscriptRef = useRef<string>('');
  const speechDetectedRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const activeLangRef = useRef<'ml' | 'en' | 'hi'>(options?.defaultLang || 'ml');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch (_) {}
      try {
        if (browserRecognitionRef.current) {
          browserRecognitionRef.current.stop();
        }
      } catch (_) {}
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (_) {}
    };
  }, []);

  const stop = useCallback(() => {
    console.log('[STT] Stopping recording...');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current.stop();
      } catch (_) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('[STT] Error stopping MediaRecorder:', e);
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(
    async (lang: 'ml' | 'en' | 'hi' = options?.defaultLang || 'ml') => {
      console.log('[STT] Starting recording in language:', lang);
      activeLangRef.current = lang;
      setListening(true);
      setTranscribing(false);
      setTranscript('');
      setAudioLevel(0);
      chunksRef.current = [];
      browserTranscriptRef.current = '';
      speechDetectedRef.current = false;

      // Stop any ongoing audio playback first
      stopAudioPlayback();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // 1. Setup AudioContext Analyser for real-time visualizer & VAD
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            let silenceStart = 0;

            const checkAudioLevel = () => {
              if (!analyser) return;
              analyser.getByteFrequencyData(dataArray);

              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              const normalized = Math.min(100, Math.round((avg / 128) * 100));
              setAudioLevel(normalized);

              // Voice Activity Detection (VAD)
              if (normalized > 14) {
                // Speech volume detected
                speechDetectedRef.current = true;
                silenceStart = 0;
              } else if (speechDetectedRef.current) {
                // User was speaking, now paused
                if (silenceStart === 0) {
                  silenceStart = Date.now();
                } else if (Date.now() - silenceStart > 1300) {
                  // User paused for 1.3 seconds -> automatically stop and process!
                  console.log('[STT VAD] Speech ended (1.3s silence detected), auto-submitting audio.');
                  stop();
                  return;
                }
              }

              animFrameRef.current = requestAnimationFrame(checkAudioLevel);
            };

            animFrameRef.current = requestAnimationFrame(checkAudioLevel);
          }
        } catch (audioErr) {
          console.warn('[STT] Web Audio Analyser setup failed:', audioErr);
        }

        // 2. Setup browser Web Speech Recognition in parallel for instant fallback
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRec) {
            const recognition = new SpeechRec();
            browserRecognitionRef.current = recognition;
            recognition.lang = lang === 'ml' ? 'ml-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event: any) => {
              const fullText = Array.from(event.results)
                .map((r: any) => r[0]?.transcript || '')
                .join(' ')
                .trim();
              if (fullText) {
                browserTranscriptRef.current = fullText;
                speechDetectedRef.current = true;
                setTranscript(fullText);
              }
            };

            recognition.onerror = (err: any) => {
              console.log('[STT Browser Recognition] Event:', err.error);
            };

            recognition.start();
          }
        } catch (recErr) {
          console.log('[STT Browser Recognition] unavailable or permission denied:', recErr);
        }

        // 3. Setup MediaRecorder
        let mime = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mime = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mime = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mime = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mime = 'audio/ogg';
          }
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log('[STT] MediaRecorder stopped. Processing collected audio chunks...');
          // Stop media stream tracks
          try {
            stream.getTracks().forEach((t) => t.stop());
          } catch (_) {}
          streamRef.current = null;

          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
              audioContextRef.current.close();
            } catch (_) {}
          }

          setListening(false);
          setAudioLevel(0);

          const blob = new Blob(chunksRef.current, { type: mime });
          console.log('[STT] Captured blob size:', blob.size, 'bytes, type:', blob.type);

          // If recording was empty or instant click with no speech
          if (blob.size < 400) {
            console.warn('[STT] Captured blob is too small, checking browser transcript...');
            const fallbackTxt = browserTranscriptRef.current.trim();
            if (fallbackTxt) {
              setTranscript(fallbackTxt);
              options?.onTranscript?.(fallbackTxt);
            }
            return;
          }

          setTranscribing(true);

          try {
            // Correctly awaits the blob upload and transcription via handleSendMessage
            const finalTranscription = await handleSendMessage(blob, activeLangRef.current);

            if (finalTranscription) {
              console.log('[STT] Final transcription:', finalTranscription);
              setTranscript(finalTranscription);
              options?.onTranscript?.(finalTranscription);
            } else if (browserTranscriptRef.current && browserTranscriptRef.current.trim()) {
              console.log('[STT] Using browser transcription fallback:', browserTranscriptRef.current);
              const fallback = browserTranscriptRef.current.trim();
              setTranscript(fallback);
              options?.onTranscript?.(fallback);
            } else {
              console.warn('[STT] No transcript could be generated from either Whisper or browser.');
            }
          } catch (err) {
            console.error('[STT] handleSendMessage failed:', err);
            // Fallback to browser recognition transcript if fetch failed
            const fallbackTxt = browserTranscriptRef.current.trim();
            if (fallbackTxt) {
              setTranscript(fallbackTxt);
              options?.onTranscript?.(fallbackTxt);
            }
          } finally {
            setTranscribing(false);
          }
        };

        // Collect audio chunks every 250ms
        mediaRecorder.start(250);

        // Maximum recording safety timeout (15 seconds)
        silenceTimerRef.current = setTimeout(() => {
          console.log('[STT] 15s max recording timeout reached, stopping.');
          stop();
        }, 15000);
      } catch (err) {
        console.error('[STT] Microphone access failed:', err);
        setListening(false);
        setTranscribing(false);
      }
    },
    [options, stop]
  );

  return {
    start,
    stop,
    listening,
    transcribing,
    transcript,
    audioLevel,
    handleSendMessage,
  };
};

/**
 * Strips markdown symbols, code blocks, emojis, and formatting for clean natural speech
 * to prevent TTS audio clicking, stuttering, or playback clipping.
 */
export const sanitizeTextForSpeech = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  let clean = text;

  // 1. Remove multi-line code blocks
  clean = clean.replace(/```[\s\S]*?```/g, ' ');

  // 2. Remove inline code ticks while preserving code text
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // 3. Remove markdown images
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, ' ');

  // 4. Remove markdown links, keeping readable link text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 5. Remove markdown headers (#, ##, ###, etc.)
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // 6. Remove blockquote arrows (> )
  clean = clean.replace(/^>\s+/gm, '');

  // 7. Remove markdown horizontal rules (---, ***, ___)
  clean = clean.replace(/^[-*_]{3,}\s*$/gm, ' ');

  // 8. Remove bold, italic, and emphasis tokens (***, **, *, ___, __, _)
  clean = clean.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
  clean = clean.replace(/\*([^*]+)\*/g, '$1');
  clean = clean.replace(/___([^_]+)___/g, '$1');
  clean = clean.replace(/__([^_]+)__/g, '$1');
  clean = clean.replace(/_([^_]+)_/g, '$1');

  // 9. Remove strikethrough (~~text~~)
  clean = clean.replace(/~~([^~]+)~~/g, '$1');

  // 10. Strip HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // 11. Strip list markers (-, *, +, 1., 2.)
  clean = clean.replace(/^\s*[-*+]\s+/gm, '');
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');

  // 12. Replace markdown table pipes with commas/natural pauses
  clean = clean.replace(/\|/g, ', ');

  // 13. Remove isolated markdown symbols and brackets that cause audio pops and clipping
  clean = clean.replace(/[#*~`^><\[\]{}\\/]/g, ' ');

  // 14. Remove all emojis and pictographs
  clean = clean.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ''
  );

  // 15. Normalize spaces and newlines
  clean = clean.replace(/\s+/g, ' ').trim();

  // 16. Ensure natural terminal punctuation to avoid clipping final phoneme
  if (clean && !/[.!?]$/.test(clean)) {
    clean += '.';
  }

  return clean;
};

export const cleanTextForSpeech = sanitizeTextForSpeech;

/**
 * Plays response using ElevenLabs multilingual TTS stream,
 * specifically requesting eleven_multilingual_v2 and treating input as Malayalam,
 * with seamless fallback to browser Web Speech API
 */
export const playEleven = async (
  text: string,
  lang: 'ml' | 'en' | 'hi' = 'ml',
  onStart?: () => void,
  onEnd?: () => void,
  customElevenKey?: string
): Promise<void> => {
  stopAudioPlayback();

  // Sanitize markdown and special symbols before sending for synthesis
  const cleanedText = sanitizeTextForSpeech(text);
  if (!cleanedText) {
    onEnd?.();
    return;
  }

  // Treat input text as Malayalam ('ml') unless explicitly requested as English
  const effectiveLang: 'ml' | 'en' = lang === 'en' ? 'en' : 'ml';
  const storedElevenKey = typeof window !== 'undefined' ? localStorage.getItem('ELEVENLABS_API_KEY') : null;
  const userElevenKey = (customElevenKey && customElevenKey.trim()) || (storedElevenKey && storedElevenKey.trim()) || undefined;

  try {
    const payload: Record<string, any> = {
      text: cleanedText,
      lang: effectiveLang,
    };
    if (userElevenKey) {
      payload.userElevenKey = userElevenKey;
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';

    // Check if backend returned JSON (indicating missing key or fallback requirement)
    if (contentType.includes('application/json')) {
      const data = await res.json();
      console.log('[TTS] Backend returned JSON signal (fallback to browser SpeechSynthesis):', data.message || data.error);
      speakText(cleanedText, effectiveLang, onStart, onEnd);
      return;
    }

    if (!res.ok) {
      console.warn('[TTS] Non-OK status from ElevenLabs endpoint:', res.status, '- using browser speech synthesis');
      speakText(cleanedText, effectiveLang, onStart, onEnd);
      return;
    }

    // ElevenLabs audio stream received!
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudioElement = audio;

    return new Promise<void>((resolve) => {
      audio.onplay = () => {
        onStart?.();
      };

      audio.onended = () => {
        activeAudioElement = null;
        URL.revokeObjectURL(url);
        onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        console.warn('[TTS] Audio element error, falling back to browser SpeechSynthesis:', e);
        activeAudioElement = null;
        URL.revokeObjectURL(url);
        speakText(cleanedText, effectiveLang, onStart, onEnd);
        resolve();
      };

      audio.play().catch((playErr) => {
        console.warn('[TTS] audio.play() blocked or failed, falling back to browser speech:', playErr);
        activeAudioElement = null;
        URL.revokeObjectURL(url);
        speakText(cleanedText, effectiveLang, onStart, onEnd);
        resolve();
      });
    });
  } catch (err) {
    console.error('[TTS] Network/playback error, falling back to browser SpeechSynthesis:', err);
    speakText(cleanedText, effectiveLang, onStart, onEnd);
  }
};
