import { explainTopic, planLesson, topicForLesson } from "../lesson";
import { TOPICS, detectTopic } from "../lesson/topics";

export type Persona = {
  vibe: string;
  warmth: number;
  emojis: number;
  language: string;
};

const EMOJIS = ["", "✨", "💡", "🌱", "🎯", "📚"];

function emoji(persona: Persona): string {
  if (persona.emojis <= 0) return "";
  return ` ${EMOJIS[Math.min(EMOJIS.length - 1, Math.max(1, persona.emojis))]}`;
}

function opener(persona: Persona): string {
  const base = ["Spoko, rozłożmy to na części.", "Jasne — tłumaczę po kolei.", "Dobre pytanie. Zaczynamy.", "Lecimy z tematem."];
  const teacher = ["Zacznijmy od definicji, a potem przejdziemy do przykładu.", "Ustalmy najpierw, co dokładnie musisz umieć."];
  const coach = ["Zrobimy to w trzech krokach — bez zbędnych rzeczy.", "Plan jest prosty: zrozumieć, przećwiczyć, powtórzyć."];
  const pool = persona.vibe === "teacher" ? teacher : persona.vibe === "coach" ? coach : base;
  return pool[Math.abs(hash(persona.vibe + persona.warmth)) % pool.length];
}

function closer(persona: Persona): string {
  const lines = [
    "Chcesz, żebym rozrysował to na tablicy? To często pomaga bardziej niż czytanie.",
    "Mogę zrobić z tego krótki quiz — powiedz tylko, kiedy chcesz sprawdzić wiedzę.",
    "Jeśli coś jest niejasne, dopytaj. Rozbijemy to na mniejsze kawałki.",
    "Chcesz, żebym dodał to do twojego planu nauki?",
  ];
  const warm = [
    "Dasz radę — to naprawdę da się ogarnąć krok po kroku.",
    "Spokojnie, większość osób myli się dokładnie w tym miejscu.",
    "To dobry moment, żeby to utrwalić. Jesteś na dobrej drodze.",
    "Nie musisz pamiętać wszystkiego naraz. Zacznij od jednej rzeczy.",
  ];
  const line = lines[Math.abs(hash(persona.vibe + persona.emojis + persona.warmth)) % lines.length];
  const encouragement = persona.warmth >= 4 ? ` ${warm[Math.abs(hash(persona.vibe)) % warm.length]}` : "";
  return `${line}${encouragement}`;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}

function isGreeting(text: string): boolean {
  return /^(hej|cześć|czesc|siema|hello|hi|dzień dobry|dzien dobry|yo)\b/i.test(text.trim());
}

function isThanks(text: string): boolean {
  return /^(dzięk|dziek|thanks|thx)/i.test(text.trim());
}

function wantsPlan(text: string): boolean {
  return /(plan|harmonogram|rozkład|rozkład|nauczyć się|nauczyc sie|powtór|powtor)/i.test(text);
}

function wantsQuiz(text: string): boolean {
  return /(quiz|test|sprawdz|fiszki|pytania)/i.test(text);
}

export type ChatReply = {
  content: string;
  topic: string | null;
  suggestions: string[];
};

/** Deterministic, persona-aware tutor reply — no external API needed. */
export function chatReply(
  prompt: string,
  persona: Persona,
  history: Array<{ role: string; content: string }> = [],
): ChatReply {
  const topic = detectTopic(prompt);
  const trimmed = prompt.trim();

  if (isGreeting(trimmed) && trimmed.length < 30) {
    return {
      content: `Cześć!${emoji(persona)} Jestem twoim asystentem do nauki. Mogę wytłumaczyć temat, rozrysować go na tablicy, zrobić quiz albo ułożyć plan powtórek.\n\nOd czego zaczynamy?`,
      topic: null,
      suggestions: ["Wytłumacz funkcję kwadratową", "Zrób mi plan na sprawdzian z biologii", "Jak działa prawo Ohma?"],
    };
  }

  if (isThanks(trimmed)) {
    return {
      content: `Nie ma sprawy${emoji(persona)} ${persona.warmth >= 4 ? "Powodzenia — trzymam kciuki!" : "Wróć, kiedy będziesz chciał powtórzyć."}`,
      topic: null,
      suggestions: ["Zrób mi quiz z tego tematu", "Dodaj powtórkę do planu"],
    };
  }

  if (wantsQuiz(trimmed) && topic) {
    return {
      content: `Przygotowałem dla ciebie zestaw pytań z tematu **${topic.title}**.${emoji(persona)}\n\nMożesz zacząć od razu w zakładce Ćwiczenia — quiz zapisze się w twojej bibliotece, a wynik doda punkty XP.\n\n${closer(persona)}`,
      topic: topic.key,
      suggestions: ["Wyjaśnij najtrudniejsze pojęcie", "Rozrysuj to na tablicy", "Zrób fiszki z tego tematu"],
    };
  }

  if (wantsPlan(trimmed)) {
    const subject = topic ? topic.title : "wybrany temat";
    return {
      content: [
        `Zróbmy plan dla: **${subject}**.${emoji(persona)}`,
        "",
        "**Jak to rozłożyć**",
        "- Dziś: 25 min — przypomnienie definicji i jednego przykładu.",
        "- Za 2 dni: 20 min — zadania, w których najczęściej się mylisz.",
        "- Za 5 dni: 15 min — aktywna powtórka bez notatek.",
        "",
        "W zakładce **Plan nauki** możesz dodać termin sprawdzianu, a zadania rozłożą się na dni automatycznie. Warto też użyć Voice Recall — wytłumaczenie tematu na głos pokazuje luki, których nie widać przy czytaniu.",
        "",
        closer(persona),
      ].join("\n"),
      topic: topic?.key ?? null,
      suggestions: ["Dodaj to do mojego planu", "Rozrysuj temat na tablicy", "Zrób mi quiz"],
    };
  }

  if (topic) {
    const body = explainTopic(topic, prompt);
    return {
      content: `${opener(persona)}${emoji(persona)}\n\n${body}\n\n${closer(persona)}`,
      topic: topic.key,
      suggestions: topic.build(prompt).followUps,
    };
  }

  // Unknown topic: still give a useful, structured answer.
  const words = trimmed.replace(/\s+/g, " ").slice(0, 140);
  const related = TOPICS.filter((t) => (history.at(-1)?.content ?? "").includes(t.title)).slice(0, 2);
  const plan = planLesson(trimmed);
  return {
    content: [
      `${opener(persona)} Nie mam jeszcze gotowej lekcji dokładnie na to pytanie, ale dam ci sprawdzony schemat.${emoji(persona)}`,
      "",
      `**Pytanie:** ${words}`,
      "",
      "**Od czego zacząć**",
      "- Nazwij pojęcia, których nie rozumiesz, i zapisz je własnymi słowami.",
      "- Znajdź w podręczniku jeden konkretny przykład i prześledź go krok po kroku.",
      "- Sprawdź się bez notatek — dopiero wtedy widać, co naprawdę umiesz.",
      "",
      `Na tablicy przygotowałem ${plan.steps.length} kroków, które prowadzą od pytania do notatki. ${related.length ? `Łączy się to z tematem **${related[0].title}**.` : ""}`,
      "",
      closer(persona),
    ].join("\n"),
    topic: null,
    suggestions: ["Rozrysuj to na tablicy", "Daj konkretny przykład", "Zrób mi krótki quiz z tego"],
  };
}

/** Extractive summary used for uploaded files. */
export function summarizeText(text: string, maxSentences = 4): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25);
  if (sentences.length <= maxSentences) return sentences.join(" ");
  const scored = sentences.map((sentence, index) => {
    let score = 0;
    if (index < 2) score += 3;
    if (/\b(jest|to|oznacza|defini|wzór|zasada|proces|dlatego)\b/i.test(sentence)) score += 2;
    if (/\d/.test(sentence)) score += 1;
    score += Math.min(3, sentence.length / 90);
    return { sentence, score, index };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence)
    .join(" ");
}

export function quizFromTopicName(name: string) {
  const topic = detectTopic(name);
  return topic ?? null;
}

export function lessonTitleFor(topicKey: string | null): string | null {
  if (!topicKey) return null;
  const topic = TOPICS.find((t) => t.key === topicKey);
  if (!topic) return null;
  return topicForLesson(planLesson(topic.title)).title;
}
