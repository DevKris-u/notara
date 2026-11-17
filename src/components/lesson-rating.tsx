"use client";

import { useCallback, useSyncExternalStore } from "react";

const LABELS = ["Nie wyszło", "Było ok", "Świetnie"];
const EVENT = "notara:rating-change";

export function LessonRating({ boardId }: { boardId: string }) {
  const key = `notara:rating:${boardId}`;

  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener(EVENT, notify);
    window.addEventListener("storage", notify);
    return () => {
      window.removeEventListener(EVENT, notify);
      window.removeEventListener("storage", notify);
    };
  }, []);

  const stored = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) ?? "",
    () => "",
  );
  const value = stored === "" ? null : Number(stored);

  const rate = (next: number) => {
    window.localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="label">Jak ci poszło z tym tematem?</span>
      <div className="row" style={{ gap: 6 }}>
        {LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={value === index ? "chip chip-green" : "chip"}
            style={{ cursor: "pointer" }}
            onClick={() => rate(index)}
          >
            {label}
          </button>
        ))}
      </div>
      {value !== null ? (
        <p className="small" style={{ margin: 0 }}>
          {value === 2
            ? "Super. Sprawdź się quizem, żeby to utrwalić."
            : value === 1
              ? "Dobrze. Wróć do tablicy za 2 dni — powtórka zrobi różnicę."
              : "To normalne. Obejrzyj lekcję jeszcze raz i dopytaj na tablicy."}
        </p>
      ) : null}
    </div>
  );
}
