"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  clipUrl,
  narrationClip,
  selectVoice,
  serverVoiceSnapshot,
  subscribeVoice,
  voiceSnapshot,
} from "@/lib/tts/client";

const SAMPLE = "Cześć! Jestem Twoim lektorem. Zaczynamy lekcję o fotosyntezie.";
const VOICES = Array.from({ length: 10 }, (_, index) => index + 1);

export function VoicePicker({ ready }: { ready: boolean }) {
  const voice = useSyncExternalStore(subscribeVoice, voiceSnapshot, serverVoiceSnapshot);
  const [status, setStatus] = useState<"idle" | "loading" | "failed">("idle");
  const [touched, setTouched] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stopPreview = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const preview = async (index: number) => {
    selectVoice(index);
    setTouched(true);
    stopPreview();
    if (!ready) return;

    setStatus("loading");
    const clip = await narrationClip(SAMPLE, index);
    if (!clip) {
      setStatus("failed");
      return;
    }
    const url = clipUrl(clip);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setStatus("idle");
    audio.onerror = () => setStatus("failed");
    setStatus("idle");
    void audio.play().catch(() => setStatus("failed"));
  };

  return (
    <div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {VOICES.map((index) => {
          const value = index - 1;
          const active = voice === value;
          return (
            <button
              key={index}
              type="button"
              className="chip"
              disabled={!ready}
              onClick={() => void preview(value)}
              title={ready ? `Posłuchaj lektora ${index}` : "Najpierw pobierz model"}
              style={{
                cursor: ready ? "pointer" : "not-allowed",
                opacity: ready ? 1 : 0.5,
                borderColor: active ? "var(--green)" : undefined,
                background: active ? "var(--mint)" : undefined,
                color: active ? "var(--green)" : undefined,
              }}
            >
              Lektor {index}
            </button>
          );
        })}
      </div>
      <p className="small" style={{ margin: "10px 0 0" }}>
        {!ready
          ? "Model lektora nie jest jeszcze pobrany. Uruchom `npm run tts:prepare` w katalogu projektu."
          : status === "loading"
            ? "Nagrywam próbkę…"
            : status === "failed"
              ? "Nie udało się odtworzyć próbki — sprawdź logi serwera."
              : touched
                ? "Kliknij innego lektora, żeby porównać. Wybór zapisuje się w tej przeglądarce."
                : "Kliknij lektora, żeby usłyszeć próbkę. Wybór zapisuje się w tej przeglądarce."}
      </p>
    </div>
  );
}
