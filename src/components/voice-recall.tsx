"use client";

import { useEffect, useRef, useState } from "react";
import { MicIcon, SparkIcon } from "@/components/icons";

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function scoreTranscript(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const unique = new Set(words.map((word) => word.toLowerCase())).size;
  const variety = unique / words.length;
  const fillers = words.filter((word) => /^(yyy|eee|no|jakby|wiesz)$/i.test(word)).length;
  const lengthScore = Math.min(1, words.length / 70) * 60;
  const varietyScore = Math.min(1, variety / 0.62) * 25;
  const fillerPenalty = Math.min(15, fillers * 3);
  return Math.max(5, Math.min(100, Math.round(lengthScore + varietyScore + 15 - fillerPenalty)));
}

export function VoiceRecall({
  action,
  topics,
}: {
  action: (formData: FormData) => Promise<void>;
  topics: string[];
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    const globalWindow = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Ctor = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "pl-PL";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalRef.current = `${finalRef.current} ${text}`.trim();
        else interim = `${interim} ${text}`.trim();
      }
      setTranscript(`${finalRef.current} ${interim}`.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      setError("Mikrofon niedostępny. Możesz wpisać odpowiedź ręcznie.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  useEffect(() => {
    if (!listening) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [listening]);

  const start = () => {
    setError(null);
    if (!recognitionRef.current) {
      setError("Ta przeglądarka nie obsługuje rozpoznawania mowy. Wpisz odpowiedź w polu poniżej.");
      return;
    }
    finalRef.current = "";
    setTranscript("");
    setSeconds(0);
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      setError("Nie udało się włączyć mikrofonu. Spróbuj ponownie.");
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const score = scoreTranscript(transcript);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <select
          className="select"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          style={{ maxWidth: 260 }}
        >
          {topics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={listening ? "btn btn-coral" : "btn btn-primary"}
          onClick={listening ? stop : start}
        >
          <MicIcon width={15} height={15} /> {listening ? `Zatrzymaj (${mmss})` : "Nagraj odpowiedź"}
        </button>
        <span className="chip">{words} słów</span>
        {transcript ? <span className={score >= 70 ? "chip chip-green" : "chip chip-gold"}>Ocena wstępna: {score}</span> : null}
      </div>

      <textarea
        className="textarea"
        rows={4}
        value={transcript}
        onChange={(event) => {
          setTranscript(event.target.value);
          finalRef.current = event.target.value;
        }}
        placeholder="Wytłumacz temat na głos — transkrypcja pojawi się tutaj. Możesz też pisać ręcznie."
      />

      {error ? (
        <p className="small" style={{ margin: 0, color: "var(--coral)" }}>
          {error}
        </p>
      ) : null}

      <form action={action} className="between" style={{ gap: 10, flexWrap: "wrap" }}>
        <input type="hidden" name="topic" value={topic} />
        <input type="hidden" name="transcript" value={transcript} />
        <input type="hidden" name="score" value={String(transcript ? score : 0)} />
        <span className="small" style={{ flex: 1, minWidth: 200 }}>
          <SparkIcon width={12} height={12} /> Nagranie zostaje na twoim komputerze. Zapisujemy tylko transkrypcję i ocenę.
        </span>
        <button type="submit" className="btn btn-gold" disabled={!transcript.trim()}>
          Zapisz i oceń
        </button>
      </form>
    </div>
  );
}
