import { expandLesson, planLesson } from "../lesson";
import { isFigureName } from "../lesson/figures";
import { makeLesson, narrationCues, scene, title } from "../lesson/geometry";
import { SUBJECTS } from "../lesson/topics";
import { INK, type ChartKind, type FigureName, type Lesson, type Op, type Step } from "../lesson/types";
import { aiEnabled, aiJson } from "./llm";

type AiVisual = {
  type: "figure" | "chart" | "flow" | "table" | "venn" | "timeline" | "speech" | "formula";
  figure?: FigureName;
  chart?: ChartKind;
  labels?: string[];
  values?: number[];
  rows?: string[][];
  caption?: string;
  unit?: string;
};

type AiStep = {
  title: string;
  narration: string;
  bullets: string[];
  formula?: string;
  note?: string;
  visual?: AiVisual;
};

type AiLesson = {
  title: string;
  subtitle: string;
  subject: string;
  emoji: string;
  steps: AiStep[];
  takeaways: string[];
  followUps: string[];
};

const PALETTE = [INK.gold, INK.mint, INK.lilac, INK.sky, INK.coral, INK.green];

const STEP_SCHEMA = `{
  "title": "krótki tytuł kroku (max 46 znaków)",
  "narration": "2–4 zdania wypowiadane na głos, po polsku, bez formatowania i bez emoji, 45–90 słów",
  "bullets": ["2–4 bardzo krótkie punkty do narysowania (max 85 znaków każdy)"],
  "formula": "opcjonalny wzór lub kluczowa zależność, np. y = a·x + b (bez LaTeX-a)",
  "note": "opcjonalna rada albo typowy błąd (max 120 znaków)",
  "visual": {
    "type": "figure | chart | flow | table | venn | timeline | speech | formula",
    "figure": "tylko dla type=figure: person | teacher | student | pair | book | lightbulb | leaf | plant | cell | dna | atom | flask | molecule | magnet | clock | globe | mountain | sun | drop | heart | brain | balance | triangle | parabola | vector | pen | question | bolt | gear | star",
    "chart": "tylko dla type=chart: bar | line | pie | area",
    "labels": ["dla flow: 2–4 etapy; dla chart: etykiety słupków; dla table: nagłówki kolumn; dla timeline: daty lub epoki; dla venn: nazwy zbiorów"],
    "values": [1, 4, 9],
    "rows": [["komórka", "komórka"]],
    "caption": "krótki podpis pod grafiką (max 60 znaków)",
    "unit": "opcjonalna jednostka wykresu, np. %"
  }
}`;

const LESSON_SYSTEM = [
  "Jesteś autorem lekcji dla polskiej aplikacji edukacyjnej Notara. Tworzysz materiał, który asystent rysuje na tablicy i czyta na głos.",
  "",
  "Zasady:",
  "- Wszystko po polsku, poprawną polszczyzną, bez anglicyzmów, jeśli istnieje polski termin.",
  "- Poziom: uczeń liceum lub student pierwszego roku.",
  "- Każdy krok to jedna myśl. Kolejność: intuicja → definicja → przykład → zastosowanie → sprawdzenie.",
  "- narration jest czytane na głos: pisz pełnymi zdaniami, bez Markdownu, bez wzorów zapisanych znakami specjalnymi (zamiast √ napisz pierwiastek).",
  "- Tablica rysuje się w rytm narration: pierwsze zdanie zapowiada rysunek, kolejne zdania objaśniają poszczególne punkty. Dlatego kolejność punktów musi odpowiadać kolejności zdań.",
  "- Mów i pisz tym samym językiem: każdy punkt to skrót zdania z narration, a nie nowa, osobna treść. Nie wprowadzaj na tablicy pojęć, których nie ma w narration.",
  "- bullets są rysowane: maksymalnie 85 znaków, bez kropki na końcu, mogą zawierać prosty wzór.",
  "- W narration odwołuj się do tego, co uczeń widzi: „spójrz na wykres”, „ten schemat pokazuje”, ale nigdy nie opisuj elementu, którego nie ma w visual ani w bullets.",
  "- Nie wymyślaj danych, których nie znasz. Jeśli temat jest niejasny, przyjmij najbardziej prawdopodobną interpretację i zaznacz to w pierwszym kroku.",
  "- Zero treści obraźliwych, zero porad medycznych lub prawnych.",
  "",
  "Grafika (pole visual) — dobierz ją do treści kroku, żeby tablica nie wyglądała za każdym razem tak samo:",
  "- chart: gdy w kroku są liczby, proporcje albo porównanie wielkości.",
  "- flow: gdy opisujesz proces, cykl albo kolejne etapy.",
  "- table: gdy porównujesz dwie rzeczy (czasy, pojęcia, epoki).",
  "- venn: gdy pokazujesz część wspólną i różnice.",
  "- timeline: gdy są daty, epoki albo porządek historyczny.",
  "- speech: gdy przytaczasz wypowiedź, cytat albo przykładowe zdanie — świetne do języka polskiego i angielskiego.",
  "- figure: gdy temat jest pojęciem, przedmiotem albo bohaterem (np. liść, atom, postać).",
  "- formula: gdy krok jest przede wszystkim wzorem.",
  "- W jednej lekcji używaj różnych typów visual — nie powtarzaj tego samego w kolejnych krokach.",
  "- chart wymaga labels i values tej samej długości. table wymaga cols w labels oraz rows.",
  "",
  `Struktura kroku:\n${STEP_SCHEMA}`,
  "",
  "Zwróć WYŁĄCZNIE JSON:",
  `{
  "title": "tytuł lekcji (max 60 znaków)",
  "subtitle": "jedno zdanie podtytułu (max 110 znaków)",
  "subject": "matematyka | fizyka | chemia | biologia | polski | historia | angielski | inne",
  "emoji": "jedno emoji pasujące do tematu",
  "steps": [ 4–6 kroków według schematu ],
  "takeaways": ["3–5 zdań: co trzeba zapamiętać"],
  "followUps": ["3 naturalne pytania, które uczeń mógłby zadać dalej"]
}`,
].join("\n");

const VISUAL_TYPES = new Set(["figure", "chart", "flow", "table", "venn", "timeline", "speech", "formula"]);
const CHART_KINDS = new Set<ChartKind>(["bar", "line", "pie", "area"]);

function textList(value: unknown, max: number, maxLen = 34): string[] {
  return (Array.isArray(value) ? value : [])
    .map((item) => str(item, maxLen))
    .filter(Boolean)
    .slice(0, max);
}

function validateVisual(value: unknown): AiVisual | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const type = str(record.type, 12) as AiVisual["type"];
  if (!VISUAL_TYPES.has(type)) return undefined;

  const chartRaw = str(record.chart, 8) as ChartKind;
  const values = (Array.isArray(record.values) ? record.values : [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && Math.abs(item) <= 100000)
    .slice(0, 6);
  const rows = (Array.isArray(record.rows) ? record.rows : [])
    .slice(0, 5)
    .map((row) => textList(row, 4, 30))
    .filter((row) => row.length);

  return {
    type,
    figure: isFigureName(record.figure) ? record.figure : undefined,
    chart: CHART_KINDS.has(chartRaw) ? chartRaw : undefined,
    labels: textList(record.labels, 6, 34),
    values,
    rows: rows.length ? rows : undefined,
    caption: str(record.caption, 70) || undefined,
    unit: str(record.unit, 8) || undefined,
  };
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function validateStep(value: unknown): AiStep | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = str(record.title, 60);
  const narration = str(record.narration, 1200);
  const bullets = (Array.isArray(record.bullets) ? record.bullets : [])
    .map((item) => str(item, 120))
    .filter(Boolean)
    .slice(0, 4);
  if (!title || narration.length < 60 || !bullets.length) return null;
  return {
    title,
    narration,
    bullets,
    formula: str(record.formula, 90) || undefined,
    note: str(record.note, 140) || undefined,
    visual: validateVisual(record.visual),
  };
}

function validateLesson(value: unknown): AiLesson | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = str(record.title, 70);
  if (!title) return null;

  const steps = (Array.isArray(record.steps) ? record.steps : [])
    .map(validateStep)
    .filter((step): step is AiStep => Boolean(step))
    .slice(0, 6);
  if (steps.length < 3) return null;

  const rawSubject = str(record.subject, 20).toLowerCase();
  const subject = rawSubject in SUBJECTS ? rawSubject : "inne";

  return {
    title,
    subtitle: str(record.subtitle, 160) || "Lekcja krok po kroku",
    subject,
    emoji: str(record.emoji, 8) || SUBJECTS[subject as keyof typeof SUBJECTS].emoji,
    steps,
    takeaways: (Array.isArray(record.takeaways) ? record.takeaways : [])
      .map((item) => str(item, 160))
      .filter(Boolean)
      .slice(0, 5),
    followUps: (Array.isArray(record.followUps) ? record.followUps : [])
      .map((item) => str(item, 120))
      .filter(Boolean)
      .slice(0, 4),
  };
}

/* ------------------------------------------------------------------ */
/*  Layout engine: one drawing per idea, never the same stack twice    */
/* ------------------------------------------------------------------ */

const SUBJECT_FIGURES: Record<string, FigureName[]> = {
  biologia: ["cell", "leaf", "dna", "plant", "heart"],
  chemia: ["flask", "atom", "molecule", "drop"],
  fizyka: ["bolt", "vector", "magnet", "clock"],
  matematyka: ["parabola", "triangle", "balance", "star"],
  polski: ["person", "book", "pen", "teacher"],
  historia: ["globe", "mountain", "balance", "clock"],
  angielski: ["book", "pair", "question", "pen"],
  inne: ["lightbulb", "brain", "star", "question"],
};

const PROCESS_HINTS = /\b(etap|krok|proces|cykl|faza|najpierw|następnie|potem|wreszcie|kolejno|na końcu)\b/i;

function subjectFigure(subject: string, index: number): FigureName {
  const pool = SUBJECT_FIGURES[subject] ?? SUBJECT_FIGURES.inne;
  return pool[index % pool.length];
}

/** Reads numbers out of the bullets so a chart never invents its own data. */
function bulletNumbers(items: string[]): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  for (const item of items) {
    const match = item.match(/(-?\d+(?:[.,]\d+)?)/);
    if (!match) continue;
    const value = Number(match[1].replace(",", "."));
    if (!Number.isFinite(value)) continue;
    const label = item
      .replace(match[0], " ")
      .replace(/[–—:=-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!label) continue;
    labels.push(label.length > 20 ? `${label.slice(0, 19)}…` : label);
    values.push(Math.abs(value));
  }
  const distinct = new Set(values).size;
  return values.length >= 3 && distinct >= 2 ? { labels, values } : { labels: [], values: [] };
}

/** Picks a drawing when the model did not send one (or when it fell back to the local plan). */
function autoVisual(step: AiStep, subject: string, index: number): AiVisual {
  const bullets = step.bullets.slice(0, 4);
  const text = `${step.title} ${bullets.join(" ")}`;

  const measured = bulletNumbers(bullets);
  if (measured.values.length >= 3 && !step.formula) {
    return { type: "chart", chart: "bar", labels: measured.labels, values: measured.values };
  }

  if (subject === "historia" && bullets.length >= 3) {
    return {
      type: "timeline",
      labels: bullets.map((item) => item.split(/[–—:]/)[0].trim().slice(0, 18)),
    };
  }

  if (PROCESS_HINTS.test(text) && bullets.length >= 3) {
    return {
      type: "flow",
      labels: bullets.map((item) => {
        const head = item.split(/[,.;:]/)[0].trim();
        return head.length > 28 ? `${head.slice(0, 27)}…` : head;
      }),
    };
  }

  if ((subject === "polski" || subject === "angielski") && index % 2 === 0) {
    return { type: "speech" };
  }

  if (step.formula) return { type: "formula" };

  return { type: "figure", figure: subjectFigure(subject, index) };
}

type Block = { ops: Op[]; bottom: number };

/** Concrete nouns in Polish map to a small pictogram, so a mention of water draws a drop. */
const FIGURE_HINTS: Array<[RegExp, FigureName]> = [
  [/dwutlenek węgla|co2/i, "molecule"],
  [/wodór|wodor/i, "atom"],
  [/wod[ayęzio]|wodn/i, "drop"],
  [/fotosyntez|chlorofil|chloroplast/i, "leaf"],
  [/światł|słońc|słoneczn/i, "sun"],
  [/energi|energet/i, "bolt"],
  [/liść|liści|liście|liścia/i, "leaf"],
  [/roślin|roślink/i, "plant"],
  [/komórk/i, "cell"],
  [/\bdna\b|geny|genu|genów|dziedzicz/i, "dna"],
  [/cząsteczk|molekuł/i, "molecule"],
  [/atom|elektron|proton|neutron/i, "atom"],
  [/reakcj|związek|kwas|zasada|roztwór/i, "flask"],
  [/magnes|magnetyczn/i, "magnet"],
  [/prędkoś|przyspieszeni|wektor|siła|siły/i, "vector"],
  [/czas|zegar|godzin|\brok\b|wiek/i, "clock"],
  [/ziemi|glob|\bświat\b/i, "globe"],
  [/\bgór|szczyt|pasmo/i, "mountain"],
  [/serce|serc|krwi|krążeni/i, "heart"],
  [/mózg|pamię|myśleni/i, "brain"],
  [/równowag|sprawiedliwo|bilans/i, "balance"],
  [/trójkąt|pitagoras/i, "triangle"],
  [/parabol|kwadratow|wierzchołk/i, "parabola"],
  [/gwiazd|bohater|postaci|postać/i, "star"],
  [/uczeń|uczniowie|uczennic/i, "student"],
  [/nauczyciel|lektora|powiedział/i, "teacher"],
  [/człowiek|ludzi|osob/i, "person"],
  [/książk|lektur|tekst|czyt/i, "book"],
  [/piór|pisarz|pisać|notatk/i, "pen"],
  [/maszyn|mechanizm|system|proces/i, "gear"],
];

function keywordFigure(text: string): FigureName | undefined {
  for (const [pattern, name] of FIGURE_HINTS) if (pattern.test(text)) return name;
  return undefined;
}

function point(
  x: number,
  y: number,
  text: string,
  color: string,
  size: number,
  maxW: number,
  at: number,
  figure?: FigureName,
  iconX?: number,
): Op[] {
  const head: Op[] = figure
    ? [{ k: "figure", name: figure, x: (iconX ?? x - 50) - 6, y: y - 40, size: 44, color, at }]
    : [{ k: "dot", cx: x - 17, cy: y - size * 0.32, r: size > 19 ? 5.5 : 4.6, color, at }];
  return [...head, { k: "text", x, y, text, size, maxW, color: "#233229", at: at + 0.02 }];
}

/** Rough line count without canvas access — matches the renderer's wrap closely enough. */
function lineCount(text: string, size: number, maxW: number): number {
  const perLine = Math.max(8, Math.floor(maxW / (size * 0.52)));
  return Math.max(1, Math.ceil(text.length / perLine));
}

function bulletColumn(
  x: number,
  y: number,
  items: string[],
  color: string,
  maxW: number,
  size = 20,
  atStart = 0.14,
): Block {
  const ops: Op[] = [];
  const icons = items.map((text) => keywordFigure(text));
  const withIcons = icons.some(Boolean);
  const textX = withIcons ? x + 54 : x;
  const width = withIcons ? Math.max(160, maxW - 54) : maxW;
  let cursor = y;
  items.forEach((text, i) => {
    ops.push(
      ...point(
        textX,
        cursor,
        text,
        color,
        size,
        width,
        Math.min(0.86, atStart + i * 0.06),
        icons[i],
        x,
      ),
    );
    cursor += lineCount(text, size, width) * size * 1.36 + 14;
  });
  return { ops, bottom: cursor };
}

function columnHeight(items: string[], size: number, maxW: number): number {
  const withIcons = items.some((text) => Boolean(keywordFigure(text)));
  const width = withIcons ? Math.max(160, maxW - 54) : maxW;
  return items.reduce((sum, text) => sum + lineCount(text, size, width) * size * 1.36 + 14, 0);
}

function formulaBar(x: number, y: number, w: number, text: string, at = 0.04): Op[] {
  return [
    { k: "highlight", x, y, w, h: 78, color: "#f7e7a8", at },
    { k: "text", x: x + 22, y: y + 50, text, size: 28, hand: true, color: INK.ink, maxW: w - 40, at: at + 0.02 },
  ];
}

function noteBox(x: number, y: number, w: number, text: string, at = 0.7): Op[] {
  return [
    { k: "rect", x, y, w, h: 92, radius: 18, color: INK.coral, width: 1.8, fill: "#fff6ec", at },
    { k: "text", x: x + 22, y: y + 31, text: "Zapamiętaj", size: 17, weight: 700, color: INK.coral, at: at + 0.03 },
    { k: "text", x: x + 22, y: y + 59, text, size: 17, maxW: w - 44, color: INK.soft, at: at + 0.05 },
  ];
}

/** Turns AI-written content into canvas operations. The model never controls geometry. */
function renderStep(step: AiStep, index: number, subject: string): Step {
  const box = scene(index);
  const color = PALETTE[index % PALETTE.length];
  const ops: Op[] = [title(40, 44, step.title, color)];

  let visual: AiVisual = step.visual ?? autoVisual(step, subject, index);
  const labels = visual.labels ?? [];
  const values = visual.values ?? [];

  // Never draw a broken diagram — degrade to a figure from the subject set.
  if (visual.type === "chart" && Math.min(labels.length, values.length) < 2) {
    visual = { type: "figure", figure: subjectFigure(subject, index) };
  }
  if ((visual.type === "flow" || visual.type === "timeline" || visual.type === "venn") && labels.length < 2) {
    visual = { type: "figure", figure: subjectFigure(subject, index) };
  }
  if (visual.type === "table" && (labels.length < 2 || !visual.rows?.length)) {
    visual = { type: "figure", figure: subjectFigure(subject, index) };
  }

  const bullets = step.bullets.slice(0, 4);
  // Draw on the narrator's clock: the diagram lands with the first explanation,
  // each point arrives with the sentence that explains it, the note closes the step.
  const cues = narrationCues(step.narration);
  const at = (k: number) => {
    if (!cues.length) return Math.min(0.86, 0.12 + k * 0.08);
    const i = Math.min(k, cues.length - 1);
    return Math.min(0.86, cues[i].at + Math.max(0, k - (cues.length - 1)) * 0.06);
  };
  const diagramAt = at(1);
  const pointAt = at(2);
  const noteAt = Math.min(0.9, at(Math.max(0, cues.length - 1)) + 0.04);
  let bottom = 160;

  switch (visual.type) {
    case "formula": {
      const formula = step.formula ?? bullets[0] ?? step.title;
      ops.push(...formulaBar(34, 96, 762, formula, diagramAt));
      const rest = step.formula ? bullets : bullets.slice(1);
      if (rest.length > 2) {
        const left = rest.slice(0, 2);
        const right = rest.slice(2, 4);
        ops.push(...bulletColumn(66, 232, left, color, 380, 20, pointAt).ops);
        ops.push(...bulletColumn(516, 232, right, color, 380, 20, pointAt + 0.03).ops);
        bottom = 232 + Math.max(columnHeight(left, 20, 380), columnHeight(right, 20, 380));
      } else {
        const block = bulletColumn(66, 232, rest, color, 720, 21, pointAt);
        ops.push(...block.ops);
        bottom = block.bottom;
      }
      break;
    }

    case "figure": {
      const figure = visual.figure ?? subjectFigure(subject, index);
      const size = bullets.length > 2 ? 236 : 210;
      ops.push({
        k: "figure",
        name: figure,
        x: 74,
        y: 158,
        size,
        color,
        label: visual.caption,
        at: diagramAt,
      });

      let top = 148;
      if (step.formula) {
        ops.push(...formulaBar(404, 108, 476, step.formula, diagramAt + 0.02));
        top = 206;
      }
      const block = bulletColumn(432, top + 30, bullets, color, 430, 20, pointAt);
      ops.push(...block.ops);
      bottom = Math.max(block.bottom, 170 + size);
      break;
    }

    case "chart": {
      const data = labels
        .slice(0, 6)
        .map((label, i) => ({
          label,
          value: values[i] ?? 0,
          color: i === 0 ? color : undefined,
        }))
        .filter((item) => Number.isFinite(item.value));
      ops.push({
        k: "chart",
        kind: visual.chart ?? "bar",
        x: 46,
        y: 118,
        w: 528,
        h: 352,
        data,
        unit: visual.unit,
        caption: visual.caption,
        color,
        at: diagramAt,
      });
      const block = bulletColumn(614, 178, bullets, color, 296, 18, pointAt);
      ops.push(...block.ops);
      bottom = Math.max(490, block.bottom);
      break;
    }

    case "flow": {
      const nodes = labels.slice(0, 4);
      ops.push({ k: "flow", x: 56, y: 132, w: 848, nodes, color, at: diagramAt });
      bottom = 240;
      const left = bullets.slice(0, 2);
      const right = bullets.slice(2, 4);
      if (right.length) {
        ops.push(...bulletColumn(66, bottom + 46, left, color, 380, 20, pointAt).ops);
        ops.push(...bulletColumn(516, bottom + 46, right, color, 380, 20, pointAt + 0.03).ops);
        bottom = bottom + 46 + Math.max(columnHeight(left, 20, 380), columnHeight(right, 20, 380));
      } else {
        const block = bulletColumn(66, bottom + 46, left, color, 760, 21, pointAt);
        ops.push(...block.ops);
        bottom = Math.max(block.bottom, bottom + 46);
      }
      break;
    }

    case "table": {
      const cols = labels.slice(0, 4);
      const rows = (visual.rows ?? []).slice(0, 4);
      ops.push({
        k: "table",
        x: 56,
        y: 140,
        w: 848,
        cols,
        rows,
        color,
        caption: visual.caption,
        at: diagramAt,
      });
      bottom = 140 + 42 + rows.length * 46 + 34;
      const left = bullets.slice(0, 2);
      const right = bullets.slice(2, 4);
      if (right.length) {
        ops.push(...bulletColumn(66, bottom, left, color, 380, 19, pointAt).ops);
        ops.push(...bulletColumn(516, bottom, right, color, 380, 19, pointAt + 0.03).ops);
        bottom += Math.max(columnHeight(left, 19, 380), columnHeight(right, 19, 380));
      } else if (left.length) {
        const block = bulletColumn(66, bottom, left, color, 760, 20, pointAt);
        ops.push(...block.ops);
        bottom = block.bottom;
      }
      break;
    }

    case "venn": {
      ops.push({
        k: "venn",
        x: 56,
        y: 140,
        w: 420,
        h: 356,
        sets: labels.slice(0, 3).map((label) => ({ label })),
        overlap: visual.caption,
        at: diagramAt,
      });
      const block = bulletColumn(534, 172, bullets, color, 376, 20, pointAt);
      ops.push(...block.ops);
      bottom = Math.max(496, block.bottom);
      break;
    }

    case "timeline": {
      ops.push({
        k: "timeline",
        x: 56,
        y: 178,
        w: 848,
        items: labels.slice(0, 5).map((label) => ({ label })),
        color,
        at: diagramAt,
      });
      bottom = 320;
      const left = bullets.slice(0, 2);
      const right = bullets.slice(2, 4);
      if (right.length) {
        ops.push(...bulletColumn(66, bottom, left, color, 380, 20, pointAt).ops);
        ops.push(...bulletColumn(516, bottom, right, color, 380, 20, pointAt + 0.03).ops);
        bottom += Math.max(columnHeight(left, 20, 380), columnHeight(right, 20, 380));
      } else {
        const block = bulletColumn(66, bottom, left, color, 760, 21, pointAt);
        ops.push(...block.ops);
        bottom = block.bottom;
      }
      break;
    }

    case "speech": {
      const quote = bullets[0] ?? step.formula ?? step.note ?? step.title;
      const rest = bullets.slice(1);
      ops.push({
        k: "speech",
        x: 330,
        y: 150,
        w: 552,
        h: 202,
        text: quote,
        who: visual.caption ?? "Przykład",
        color,
        at: diagramAt,
      });
      ops.push({
        k: "figure",
        name: index % 2 === 0 ? "teacher" : "student",
        x: 78,
        y: 186,
        size: 190,
        color,
        at: diagramAt,
      });
      const left = rest.slice(0, 2);
      const right = rest.slice(2, 4);
      if (right.length) {
        ops.push(...bulletColumn(66, 430, left, color, 380, 19, pointAt).ops);
        ops.push(...bulletColumn(516, 430, right, color, 380, 19, pointAt + 0.03).ops);
        bottom = 430 + Math.max(columnHeight(left, 19, 380), columnHeight(right, 19, 380));
      } else {
        const block = bulletColumn(66, 430, left, color, 760, 20, pointAt);
        ops.push(...block.ops);
        bottom = Math.max(block.bottom, 430);
      }
      if (step.formula && step.formula !== quote) {
        ops.push(...formulaBar(330, 372, 552, step.formula, pointAt));
        bottom = Math.max(bottom, 466);
      }
      break;
    }
  }

  if (step.note) {
    const y = Math.min(Math.max(bottom + 18, 300), 592);
    ops.push(...noteBox(40, y, 840, step.note, noteAt));
  }

  return box.step(step.title, step.narration, ops);
}

function speechNarration(narration: string): string {
  return narration
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** AI lesson; falls back to the authored topic library when the model is unavailable. */
export async function generateLesson(prompt: string): Promise<Lesson> {
  const fallback = planLesson(prompt);
  if (!aiEnabled()) return fallback;

  const ai = await aiJson(
    {
      system: LESSON_SYSTEM,
      user: `Temat lekcji: ${prompt}`,
      maxTokens: 4000,
      temperature: 0.55,
      json: true,
    },
    validateLesson,
  );
  if (!ai) return fallback;

  const steps = ai.steps.map((step, index) =>
    renderStep({ ...step, narration: speechNarration(step.narration) }, index, ai.subject),
  );

  return makeLesson({
    title: ai.title,
    subtitle: ai.subtitle,
    subject: ai.subject,
    subjectName: SUBJECTS[ai.subject as keyof typeof SUBJECTS]?.name ?? "Nauka własna",
    emoji: ai.emoji,
    prompt,
    steps,
    followUps: ai.followUps.length
      ? ai.followUps
      : ["Wyjaśnij to prostszymi słowami", "Pokaż przykład z życia", "Jakie zadanie to sprawdza?"],
    takeaways: ai.takeaways.length ? ai.takeaways : ai.steps.map((step) => step.title),
  });
}

const FOLLOW_UP_SYSTEM = [
  "Jesteś autorem lekcji w aplikacji Notara. Uczeń ogląda już tablicę i zadaje dodatkowe pytanie.",
  "Dopisz 2 nowe kroki, które precyzyjnie odpowiadają na pytanie i pasują do reszty lekcji.",
  "Nie powtarzaj tego, co już jest na tablicy. Każdy krok: jedno konkretne uzupełnienie lub kontrprzykład.",
  "Po polsku, narration bez formatowania (czytane na głos), bullets krótkie.",
  "",
  `Schemat kroku:\n${STEP_SCHEMA}`,
  "",
  'Zwróć WYŁĄCZNIE JSON: {"steps": [krok, krok]}',
].join("\n");

function validateSteps(value: unknown): { steps: AiStep[] } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const steps = (Array.isArray(record.steps) ? record.steps : [])
    .map(validateStep)
    .filter((step): step is AiStep => Boolean(step))
    .slice(0, 3);
  return steps.length ? { steps } : null;
}

/** Adds 2 AI-written steps to an existing board, keeping all previous drawing. */
export async function extendLesson(lesson: Lesson, question: string): Promise<Lesson> {
  if (!aiEnabled()) return expandLesson(lesson, question);

  const outline = lesson.steps.map((step, index) => `${index + 1}. ${step.title}`).join("\n");
  const result = await aiJson(
    {
      system: FOLLOW_UP_SYSTEM,
      user: [
        `Tytuł lekcji: ${lesson.title}`,
        `Podtytuł: ${lesson.subtitle}`,
        `Pytanie ucznia: ${question}`,
        "Kroki już na tablicy:",
        outline,
        "Najważniejsze wnioski lekcji:",
        lesson.takeaways.map((item) => `- ${item}`).join("\n"),
      ].join("\n"),
      maxTokens: 2500,
      temperature: 0.55,
      json: true,
    },
    validateSteps,
  );
  if (!result) return expandLesson(lesson, question);

  const offset = lesson.steps.length;
  const added = result.steps.map((step, index) =>
    renderStep({ ...step, narration: speechNarration(step.narration) }, offset + index, lesson.subject),
  );
  const steps = [...lesson.steps, ...added];
  return {
    ...lesson,
    steps,
    durationMs: steps.reduce((sum, step) => sum + step.durMs, 0),
  };
}
