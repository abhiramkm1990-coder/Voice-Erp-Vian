import { useState, useRef, useCallback } from 'react';

export const useWhisperSTT = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setListening(true);
    setTranscript('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Always release mic and reset UI regardless of fetch outcome
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) {
          console.warn('[STT] Blank recording (no chunks)');
          setListening(false);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const result = reader.result as string;
            // FileReader readAsDataURL produces "data:audio/webm;base64,..."
            const base64data = result.includes(',') ? result.split(',')[1] : result;
            console.log('[STT] posting /api/stt, base64 length=', base64data?.length, 'blob size=', blob.size);

            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64data, lang: 'ml' }),
            });
            console.log('[STT] response status=', res.status);
            const data = await res.json();
            console.log('[STT] response data=', data);

            if (data.transcript) {
              const txt = typeof data.transcript === 'string'
                ? data.transcript
                : (data.transcript?.text || data.transcript?.transcript || '');
              console.log('[STT] transcript=', txt);
              setTranscript(txt);
            } else {
              console.warn('[STT] missing transcript field');
            }
          } catch (err) {
            console.error('[STT] Request/parse failed:', err);
          } finally {
            setListening(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('[STT] Mic start error:', err);
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // Force-stop stream if stop() missed
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
  }, []);

  return { start, stop, listening, transcript };
};

export const playEleven = async (text: string, lang: 'ml' | 'en' = 'ml') => {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) throw new Error('TTS fetch failed: ' + res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[TTS] Playback Error:', error);
  }
};
