"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckIcon, ChevronLeft, RepeatIcon, SparkIcon } from "@/components/icons";

export type DeckCard = { id: string; front: string; back: string; box: number; due_at: string };

export function FlashcardDeck({
  setId,
  title,
  cards,
  action,
}: {
  setId: string;
  title: string;
  cards: DeckCard[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);
  const [pending, start] = useTransition();

  const card = cards[index];
  const finished = index >= cards.length;

  const review = (isKnown: boolean) => {
    if (!card) return;
    const data = new FormData();
    data.set("card_id", card.id);
    data.set("set_id", setId);
    data.set("known", isKnown ? "1" : "0");
    if (isKnown) setKnown((value) => value + 1);
    else setAgain((value) => value + 1);
    setFlipped(false);
    setIndex((value) => value + 1);
    start(() => {
      void action(data);
    });
  };

  if (finished) {
    const pct = Math.round((known / cards.length) * 100);
    return (
      <div className="stack" style={{ gap: 14 }}>
        <div className="card" style={{ padding: 22 }}>
          <span className="label">Koniec zestawu</span>
          <h2 style={{ fontSize: 26, margin: "4px 0 4px" }}>
            {known} z {cards.length} umiesz
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
            {pct >= 70
              ? "Dobra robota. Karty wróciły do pudełek z dłuższym odstępem — następna powtórka będzie później."
              : "Trudne karty wrócą szybciej. To normalne — powtórka w odstępach działa właśnie tak."}
          </p>
          <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Link href={`/practice/flashcards/${setId}?restart=1`} className="btn btn-primary">
              <RepeatIcon width={15} height={15} /> Powtórz zestaw
            </Link>
            <Link href={`/practice?flashcards=${encodeURIComponent(title)}`} className="btn">
              Nowy zestaw z tematu
            </Link>
            <Link href="/practice" className="btn btn-ghost">
              Wszystkie ćwiczenia
            </Link>
          </div>
        </div>
        <div className="grid-3" style={{ gap: 10 }}>
          <div className="stat">
            <span>Umiem</span>
            <b>{known}</b>
          </div>
          <div className="stat">
            <span>Jeszcze raz</span>
            <b>{again}</b>
          </div>
          <div className="stat">
            <span>Kart w zestawie</span>
            <b>{cards.length}</b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="between">
        <span className="label">
          Karta {index + 1} z {cards.length}
        </span>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip chip-green">
            <CheckIcon width={12} height={12} /> {known}
          </span>
          <span className="chip">
            <RepeatIcon width={12} height={12} /> {again}
          </span>
          <span className="chip chip-gold">pudełko {card.box}</span>
        </div>
      </div>
      <div className="progress">
        <span style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>

      <button
        type="button"
        className="flashcard"
        data-flipped={flipped ? "true" : "false"}
        onClick={() => setFlipped((value) => !value)}
        style={{ cursor: "pointer", border: 0, background: "transparent", padding: 0, width: "100%" }}
        aria-label={flipped ? "Pokaż pytanie" : "Pokaż odpowiedź"}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face">
            <span className="label">Pytanie</span>
            <p style={{ fontSize: 21, fontWeight: 600, margin: "12px 0 0", lineHeight: 1.35 }}>{card.front}</p>
            <span className="small" style={{ marginTop: "auto" }}>
              Kliknij, żeby odwrócić
            </span>
          </div>
          <div className="flashcard-face back">
            <span className="label">Odpowiedź</span>
            <p style={{ fontSize: 17, margin: "12px 0 0", lineHeight: 1.55 }}>{card.back}</p>
            <span className="small" style={{ marginTop: "auto" }}>
              Oceń, czy umiesz
            </span>
          </div>
        </div>
      </button>

      <div className="row" style={{ gap: 10 }}>
        <button
          type="button"
          className="btn"
          style={{ flex: 1 }}
          onClick={() => review(false)}
          disabled={pending}
        >
          <RepeatIcon width={15} height={15} /> Jeszcze raz
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => review(true)}
          disabled={pending}
        >
          <SparkIcon width={15} height={15} /> Umiem
        </button>
      </div>

      <div className="between">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setFlipped(false);
            setIndex((value) => Math.max(0, value - 1));
          }}
          disabled={index === 0}
        >
          <ChevronLeft width={14} height={14} /> Poprzednia
        </button>
        <Link href="/practice" className="small" style={{ fontWeight: 700 }}>
          Wróć później
        </Link>
      </div>
    </div>
  );
}
