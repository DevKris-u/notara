"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/lesson/types";
import { drawBoard } from "@/lib/lesson/render";
import { clipUrl, narrationClip, storedVoice, type Clip } from "@/lib/tts/client";
import {
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  TargetIcon,
  VolumeIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons";

type Camera = { x: number; y: number; scale: number };
type LektorState = "idle" | "loading" | "ready" | "off";

const DEFAULT_CAMERA: Camera = { x: 500, y: 380, scale: 0.8 };

/** How long the board waits for the narrator before drawing on without it. */
const LEKTOR_TIMEOUT_MS = 30000;

/** Breathing room between steps so the last syllable is never clipped. */
const STEP_GAP_MS = 420;

function focusCamera(focus: { x: number; y: number; w: number; h: number }, view: { w: number; h: number }): Camera {
  const pad = 110;
  const scale = Math.min(view.w / (focus.w + pad), view.h / (focus.h + pad), 1.45);
  return {
    x: focus.x + focus.w / 2,
    y: focus.y + focus.h / 2,
    scale: Math.max(0.28, scale),
  };
}

export function BoardPlayer({
  lesson,
  initialStep = 0,
  autoStart = false,
}: {
  lesson: Lesson;
  initialStep?: number;
  autoStart?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(Math.min(initialStep, lesson.steps.length - 1));
  const [playing, setPlaying] = useState(autoStart);
  const [muted, setMuted] = useState(false);
  const [follow, setFollow] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lektor, setLektor] = useState<LektorState>("idle");
  const [durations, setDurations] = useState<Record<number, number>>({});

  const stepRef = useRef(step);
  const playingRef = useRef(playing);
  const mutedRef = useRef(muted);
  const followRef = useRef(follow);
  const speedRef = useRef(speed);
  const timeRef = useRef(0);
  const holdRef = useRef(false);
  const stepDurRef = useRef(lesson.steps[Math.min(initialStep, lesson.steps.length - 1)]?.durMs ?? 6000);
  const clipsRef = useRef(new Map<number, Clip>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const prepTokenRef = useRef(0);
  const camRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const targetRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const viewRef = useRef({ w: 900, h: 540 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const fontsRef = useRef({ hand: '"Caveat", cursive', sans: 'system-ui, sans-serif' });
  const lastRef = useRef(0);

  const totalMs = useMemo(
    () => lesson.steps.reduce((sum, s, index) => sum + (durations[index] ?? s.durMs), 0),
    [lesson.steps, durations],
  );
  const doneMs = useMemo(
    () => lesson.steps.slice(0, step).reduce((sum, s, index) => sum + (durations[index] ?? s.durMs), 0) + elapsed,
    [lesson.steps, durations, step, elapsed],
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    followRef.current = follow;
  }, [follow]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* ------------------------------------------------------------- narrator -- */

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  /** Last resort when Supertonic is unavailable: the browser's own Polish voice. */
  const speakFallback = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      if (mutedRef.current || !text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pl-PL";
      utterance.rate = 0.82 * speedRef.current;
      utterance.pitch = 1;
      const polish = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pl"));
      if (polish) utterance.voice = polish;
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const startAudio = useCallback(
    (clip: Clip, narration = "") => {
      // Only one voice may speak: stop the browser fallback before Supertonic starts.
      cancelSpeech();
      stopAudio();
      const url = clipUrl(clip);
      audioUrlRef.current = url;

      const audio = new Audio();
      audio.preload = "auto";
      audio.preservesPitch = true;
      audio.playbackRate = speedRef.current;
      audio.src = url;
      audioRef.current = audio;

      // Keep the element parked at the drawing's position, even while muted or
      // paused, so resuming never restarts the sentence from the beginning.
      const seek = () => {
        const resumeAt = timeRef.current / 1000;
        if (resumeAt <= 0.08) return;
        try {
          audio.currentTime = resumeAt;
        } catch {
          /* metadata not ready yet — loadedmetadata fires this again */
        }
      };
      audio.addEventListener("loadedmetadata", seek, { once: true });
      seek();

      audio.addEventListener("error", () => {
        if (audioRef.current !== audio) return;
        console.warn("[tts] playback failed", audio.error?.code ?? "unknown");
        if (mutedRef.current || !playingRef.current) return;
        // A damaged or missing clip should not leave the step silent.
        stopAudio();
        speakFallback(narration);
      });

      if (mutedRef.current || !playingRef.current) return;

      void audio.play().catch((error) => {
        console.warn("[tts] playback blocked", error);
      });
    },
    [cancelSpeech, speakFallback, stopAudio],
  );

  const ensureClip = useCallback(
    async (index: number): Promise<Clip | null> => {
      const current = lesson.steps[index];
      if (!current?.narration) return null;
      const hit = clipsRef.current.get(index);
      if (hit) return hit;

      const clip = await narrationClip(current.narration, storedVoice());
      if (!clip) return null;

      clipsRef.current.set(index, clip);
      setDurations((prev) =>
        prev[index] === clip.durationMs ? prev : { ...prev, [index]: Math.round(clip.durationMs) },
      );
      return clip;
    },
    [lesson.steps],
  );

  const resolveStep = useCallback(
    async (index: number) => {
      const current = lesson.steps[index];
      if (!current) return;
      const token = ++prepTokenRef.current;

      holdRef.current = true;
      setLektor("loading");

      const pending = ensureClip(index);

      // Wait for the clip, but never leave the board frozen forever. When the
      // wait runs out we keep drawing silently — the alternative, handing the
      // step to the browser's own voice, is how two narrators ended up talking
      // over each other at two different speeds.
      const outcome = await Promise.race([
        pending.then((clip) => ({ clip })),
        new Promise<{ late: true }>((resolve) => {
          window.setTimeout(() => resolve({ late: true }), LEKTOR_TIMEOUT_MS);
        }),
      ]);
      if (token !== prepTokenRef.current) return;

      if ("late" in outcome) {
        stepDurRef.current = current.durMs;
        holdRef.current = false;
        setLektor("loading");
        void pending.then((clip) => {
          if (!clip || token !== prepTokenRef.current) return;
          stepDurRef.current = Math.max(stepDurRef.current, clip.durationMs);
          setLektor("ready");
          startAudio(clip, current.narration);
        });
        return;
      }

      const clip = outcome.clip;
      if (clip) {
        stepDurRef.current = clip.durationMs;
        setLektor("ready");
        startAudio(clip, current.narration);
      } else {
        stepDurRef.current = current.durMs;
        setLektor("off");
        if (!mutedRef.current) speakFallback(current.narration);
      }
      holdRef.current = false;
    },
    [ensureClip, lesson.steps, speakFallback, startAudio],
  );

  const focusStep = useCallback(
    (index: number) => {
      const focus = lesson.steps[index]?.focus;
      if (!focus) return;
      targetRef.current = focusCamera(focus, viewRef.current);
    },
    [lesson.steps],
  );

  const goToStep = useCallback(
    (index: number, keepPlaying = true) => {
      const next = Math.max(0, Math.min(lesson.steps.length - 1, index));
      cancelSpeech();
      stopAudio();
      stepRef.current = next;
      setStep(next);
      timeRef.current = 0;
      setElapsed(0);
      setEnded(false);
      if (followRef.current) focusStep(next);
      playingRef.current = keepPlaying;
      setPlaying(keepPlaying);
      if (keepPlaying) void resolveStep(next);
    },
    [cancelSpeech, focusStep, lesson.steps.length, resolveStep, stopAudio],
  );

  /* ---------------- resize ---------------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const apply = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      viewRef.current = { w: rect.width, h: rect.height };
      const focus = lesson.steps[stepRef.current]?.focus;
      if (focus && followRef.current) targetRef.current = focusCamera(focus, viewRef.current);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [lesson.steps]);

  /* ---------------- fonts + initial camera ---------------- */
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const hand = styles.getPropertyValue("--font-hand").trim();
    const sans = styles.getPropertyValue("--font-sans").trim();
    if (hand) fontsRef.current.hand = hand;
    if (sans) fontsRef.current.sans = sans;
    const view = viewRef.current;
    const start = lesson.steps[stepRef.current]?.focus;
    if (start) {
      const cam = focusCamera(start, view);
      camRef.current = cam;
      targetRef.current = cam;
    }
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        lastRef.current = 0;
      });
    }
  }, [lesson.steps]);

  /* ---------------- browser speech voices ---------------- */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  /* ---------------- prefetch narration, starting at the current step ---------------- */
  useEffect(() => {
    let cancelled = false;
    const start = stepRef.current;
    const order: number[] = [];
    for (let index = start; index < lesson.steps.length; index++) order.push(index);
    for (let index = 0; index < start; index++) order.push(index);

    const run = async () => {
      for (const index of order) {
        if (cancelled) return;
        await ensureClip(index);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [ensureClip, lesson.steps.length]);

  /* ---------------- first play / resume ---------------- */
  useEffect(() => {
    if (!playing) {
      cancelSpeech();
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      // Resuming must continue the sentence, not restart it.
      try {
        audio.currentTime = timeRef.current / 1000;
      } catch {
        /* metadata not ready yet */
      }
      void audio.play().catch(() => undefined);
      return;
    }
    void resolveStep(stepRef.current);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* ---------------- tempo also drives audio playback ---------------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  /* ---------------- unmount ---------------- */
  useEffect(
    () => () => {
      stopAudio();
      cancelSpeech();
    },
    [cancelSpeech, stopAudio],
  );

  /* ---------------- animation loop ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let uiClock = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min(64, now - lastRef.current);
      lastRef.current = now;

      const index = stepRef.current;
      const current = lesson.steps[index];
      if (!current) return;

      if (playingRef.current && !holdRef.current) {
        const audio = audioRef.current;
        if (audio && !audio.paused && !audio.ended && audio.readyState >= 2) {
          // The audio clock is the master, so the drawing and the voice cannot drift apart.
          timeRef.current = audio.currentTime * 1000;
        } else {
          timeRef.current += dt * speedRef.current;
        }

        if (timeRef.current >= stepDurRef.current + STEP_GAP_MS) {
          if (index < lesson.steps.length - 1) {
            timeRef.current = 0;
            stepRef.current = index + 1;
            setStep(index + 1);
            setElapsed(0);
            if (followRef.current) focusStep(index + 1);
            holdRef.current = true;
            cancelSpeech();
            stopAudio();
            void resolveStep(index + 1);
          } else {
            timeRef.current = stepDurRef.current;
            playingRef.current = false;
            setPlaying(false);
            setEnded(true);
            cancelSpeech();
            stopAudio();
          }
        }
        uiClock += dt;
        if (uiClock > 120) {
          uiClock = 0;
          setElapsed(timeRef.current);
        }
      }

      // camera smoothing
      const cam = camRef.current;
      const target = targetRef.current;
      cam.x += (target.x - cam.x) * 0.11;
      cam.y += (target.y - cam.y) * 0.11;
      cam.scale += (target.scale - cam.scale) * 0.11;

      // paint
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { w, h } = viewRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fffdf7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // dot grid
      const grid = 30 * cam.scale;
      const ox = ((-cam.x * cam.scale + w / 2) % grid + grid) % grid;
      const oy = ((-cam.y * cam.scale + h / 2) % grid + grid) % grid;
      ctx.fillStyle = "rgba(20,33,28,0.09)";
      for (let x = ox; x < w; x += grid) {
        for (let y = oy; y < h; y += grid) {
          ctx.beginPath();
          ctx.arc(x * dpr, y * dpr, 0.9 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.setTransform(
        dpr * cam.scale,
        0,
        0,
        dpr * cam.scale,
        dpr * (w / 2 - cam.x * cam.scale),
        dpr * (h / 2 - cam.y * cam.scale),
      );

      const dur = stepDurRef.current;
      drawBoard(
        ctx,
        lesson.steps.map((s) => s.ops),
        index,
        Math.min(timeRef.current, dur),
        dur,
        { hand: fontsRef.current.hand, sans: fontsRef.current.sans },
      );
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [lesson.steps, cancelSpeech, focusStep, resolveStep, stopAudio]);

  /* ---------------- interactions ---------------- */
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    const cam = targetRef.current;
    targetRef.current = { ...cam, x: cam.x - dx / cam.scale, y: cam.y - dy / cam.scale };
    camRef.current = { ...targetRef.current };
    if (followRef.current) {
      followRef.current = false;
      setFollow(false);
    }
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    const cam = targetRef.current;
    const next: Camera = { ...cam, scale: Math.min(2.4, Math.max(0.2, cam.scale * factor)) };
    targetRef.current = next;
    camRef.current = next;
  };

  const zoomBy = (factor: number) => {
    const cam = targetRef.current;
    const next = { ...cam, scale: Math.min(2.4, Math.max(0.2, cam.scale * factor)) };
    targetRef.current = next;
    camRef.current = next;
    if (followRef.current) {
      followRef.current = false;
      setFollow(false);
    }
  };

  const followCurrent = () => {
    followRef.current = true;
    setFollow(true);
    focusStep(stepRef.current);
  };

  const togglePlay = () => {
    const next = !playingRef.current;
    if (!next) {
      audioRef.current?.pause();
      cancelSpeech();
    }
    if (next && ended) {
      timeRef.current = 0;
      setElapsed(0);
      setEnded(false);
      stopAudio();
    }
    playingRef.current = next;
    setPlaying(next);
    if (next) {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.currentTime = timeRef.current / 1000;
        } catch {
          /* metadata not ready yet */
        }
        void audio.play().catch(() => undefined);
      }
    }
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      cancelSpeech();
      audioRef.current?.pause();
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = timeRef.current / 1000;
      void audio.play().catch(() => undefined);
      return;
    }
    void ensureClip(stepRef.current).then((clip) => {
      if (clip) {
        stepDurRef.current = Math.max(stepDurRef.current, clip.durationMs);
        startAudio(clip, lesson.steps[stepRef.current]?.narration ?? "");
      } else if (playingRef.current) {
        speakFallback(lesson.steps[stepRef.current]?.narration ?? "");
      }
    });
  };

  const restart = () => {
    cancelSpeech();
    stopAudio();
    followRef.current = true;
    setFollow(true);
    stepRef.current = 0;
    setStep(0);
    timeRef.current = 0;
    setElapsed(0);
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
    focusStep(0);
    void resolveStep(0);
  };

  const progress = Math.min(100, Math.round((doneMs / Math.max(1, totalMs)) * 100));
  const remaining = Math.max(0, Math.ceil((totalMs - doneMs) / 1000));

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="wb-stage" ref={wrapRef} style={{ height: "clamp(320px, 56vh, 580px)", position: "relative" }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          style={{ display: "block", width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
        />

        <div className="wb-toolbar">
          <button type="button" className="wb-tool" onClick={togglePlay} data-on={playing}>
            {playing ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
            {playing ? "Pauza" : ended ? "Powtórz" : "Odtwórz"}
          </button>
          <button
            type="button"
            className="wb-tool"
            onClick={toggleMute}
            data-on={!muted}
            title={muted ? "Włącz lektora" : "Wycisz lektora"}
          >
            {muted ? <MuteIcon width={14} height={14} /> : <VolumeIcon width={14} height={14} />}
            {muted ? "Wycisz." : "Głos"}
          </button>
          <button type="button" className="wb-tool" onClick={followCurrent} data-on={follow} title="Wróć do bieżącego kroku">
            <TargetIcon width={14} height={14} /> Śledź
          </button>
          <button type="button" className="wb-tool" onClick={() => zoomBy(0.9)} title="Pomniejsz">
            <ZoomOutIcon width={14} height={14} />
          </button>
          <button type="button" className="wb-tool" onClick={() => zoomBy(1.1)} title="Powiększ">
            <ZoomInIcon width={14} height={14} />
          </button>
          <button
            type="button"
            className="wb-tool"
            onClick={() => {
              setZoom(1);
              window.print();
            }}
            title="Eksportuj tablicę do PDF (drukuj → zapisz jako PDF)"
          >
            <DownloadIcon width={14} height={14} /> PDF
          </button>
          <button type="button" className="wb-tool" onClick={restart} title="Od początku">
            <RepeatIcon width={14} height={14} />
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            right: 14,
            display: "flex",
            gap: 10,
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <span className="chip chip-solid" style={{ background: "rgba(255,253,248,.94)" }}>
            Krok {step + 1} / {lesson.steps.length}
          </span>
          <div className="progress" style={{ flex: 1, background: "rgba(255,253,248,.8)" }}>
            <span style={{ width: `${progress}%` }} />
          </div>
          {lektor === "loading" ? (
            <span className="chip" style={{ background: "rgba(255,253,248,.94)" }}>
              Lektor pisze…
            </span>
          ) : lektor === "off" ? (
            <span className="chip" style={{ background: "rgba(255,253,248,.94)" }} title="Model TTS niedostępny — czyta przeglądarka">
              Głos zapasowy
            </span>
          ) : null}
          <span className="chip" style={{ background: "rgba(255,253,248,.94)" }}>
            ⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </span>
        </div>

        {ended ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(20,33,28,.28)",
              display: "grid",
              placeItems: "center",
              padding: 20,
            }}
            className="no-print"
          >
            <div className="card" style={{ maxWidth: 380, textAlign: "center" }}>
              <div style={{ fontSize: 30 }}>🎉</div>
              <h3 style={{ fontSize: 22, margin: "6px 0" }}>Lekcja skończona</h3>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>
                Zostało {lesson.takeaways.length} rzeczy do zapamiętania. Sprawdź się, zanim uznasz temat za zamknięty.
              </p>
              <div className="row" style={{ justifyContent: "center" }}>
                <button type="button" className="btn btn-sm" onClick={restart}>
                  <RepeatIcon width={14} height={14} /> Powtórz
                </button>
                <Link href={`/practice?topic=${encodeURIComponent(lesson.title)}`} className="btn btn-sm btn-primary">
                  Zrób quiz
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="between" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-sm" onClick={() => goToStep(step - 1, playing)} disabled={step === 0}>
            <ChevronLeft width={14} height={14} /> Wstecz
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => goToStep(step + 1, playing)}
            disabled={step >= lesson.steps.length - 1}
          >
            Dalej <ChevronRight width={14} height={14} />
          </button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="small">Tempo</span>
          {[0.75, 1, 1.25, 1.5].map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              style={{
                cursor: "pointer",
                borderColor: speed === value ? "var(--green)" : undefined,
                background: speed === value ? "var(--mint)" : undefined,
                color: speed === value ? "var(--green)" : undefined,
              }}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>

      <p className="small no-print" style={{ margin: 0 }}>
        Przeciągnij tablicę, żeby się rozejrzeć. Kółko myszy lub przyciski ± zmieniają powiększenie.
      </p>
      <span style={{ display: "none" }}>{zoom}</span>
    </div>
  );
}
