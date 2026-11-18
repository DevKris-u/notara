import type { FigureName } from "./types";

/**
 * Hand-drawn illustration library.
 *
 * Every figure is authored in a normalised 100 × 100 box and scaled to the
 * requested size, so the board can place the same character at any scale without
 * redrawing it. Paths are plain polylines — the renderer jitters them and draws
 * them progressively, which is what makes them look sketched instead of printed.
 */

export type FigPath = {
  pts: Array<[number, number]>;
  closed?: boolean;
  width?: number;
};

const TAU = Math.PI * 2;

function line(x1: number, y1: number, x2: number, y2: number): FigPath {
  return { pts: [[x1, y1], [x2, y2]] };
}

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from = 0,
  to = TAU,
  steps = 32,
): FigPath {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return { pts, closed: Math.abs(to - from - TAU) < 0.001 };
}

/** Ellipse rotated by `rot` radians — used for the atom's orbits. */
function orbit(cx: number, cy: number, rx: number, ry: number, rot: number, steps = 40): FigPath {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = (TAU * i) / steps;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return { pts, closed: true };
}

function poly(pts: Array<[number, number]>, closed = false): FigPath {
  return { pts, closed };
}

function personBase(): FigPath[] {
  return [
    ellipse(50, 25, 13, 14),
    poly([[38, 51], [50, 44], [62, 51], [66, 82], [34, 82]], true),
    line(38, 55, 25, 73),
    line(62, 55, 75, 73),
    line(43, 82, 40, 97),
    line(57, 82, 60, 97),
  ];
}

function leafShape(): FigPath {
  return poly([[50, 8], [72, 30], [74, 58], [52, 88], [28, 60], [26, 30]], true);
}

function starPath(): FigPath {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? 38 : 16;
    const a = -Math.PI / 2 + (TAU * i) / 10;
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  return poly(pts, true);
}

const FIGURES: Record<FigureName, () => FigPath[]> = {
  person: personBase,

  teacher: () => [
    ...personBase(),
    poly([[62, 55], [78, 40], [86, 30]]),
    poly([[34, 20], [30, 12], [26, 6]]),
  ],

  student: () => [
    ...personBase(),
    poly([[62, 58], [74, 58], [74, 72], [62, 72]], true),
    line(68, 58, 68, 72),
  ],

  pair: () => {
    const scaled = personBase().map((path) => ({
      ...path,
      pts: path.pts.map(([x, y]) => [x * 0.66 + 4, y * 0.66 + 32] as [number, number]),
    }));
    const second = personBase().map((path) => ({
      ...path,
      pts: path.pts.map(([x, y]) => [x * 0.66 + 34, y * 0.66 + 32] as [number, number]),
    }));
    return [...scaled, ...second];
  },

  book: () => [
    poly([[50, 30], [18, 22], [18, 72], [50, 82]], true),
    poly([[50, 30], [82, 22], [82, 72], [50, 82]], true),
    line(50, 32, 50, 80),
    line(26, 38, 42, 42),
    line(26, 48, 42, 52),
    line(58, 42, 74, 38),
    line(58, 52, 74, 48),
  ],

  lightbulb: () => [
    ellipse(50, 40, 20, 22),
    line(40, 62, 40, 74),
    line(60, 62, 60, 74),
    line(40, 74, 60, 74),
    poly([[43, 78], [57, 78]]),
    poly([[44, 58], [50, 48], [56, 58]]),
    line(50, 18, 50, 8),
    line(24, 22, 17, 15),
    line(76, 22, 83, 15),
    line(20, 42, 9, 42),
    line(80, 42, 91, 42),
  ],

  leaf: () => [
    leafShape(),
    line(50, 14, 50, 84),
    line(50, 34, 34, 42),
    line(50, 46, 33, 54),
    line(50, 34, 66, 42),
    line(50, 46, 67, 54),
  ],

  plant: () => [
    poly([[36, 72], [64, 72], [60, 93], [40, 93]], true),
    line(36, 78, 64, 78),
    line(50, 72, 50, 36),
    poly([[50, 60], [34, 50], [32, 66], [48, 68]], true),
    poly([[50, 46], [66, 34], [70, 50], [52, 54]], true),
  ],

  cell: () => [
    ellipse(50, 50, 34, 28, 0, TAU, 40),
    ellipse(45, 47, 11, 10),
    ellipse(64, 62, 5, 5),
    ellipse(62, 38, 4, 4),
    ellipse(32, 64, 4, 4),
  ],

  dna: () => {
    const left: Array<[number, number]> = [];
    const right: Array<[number, number]> = [];
    const rungs: FigPath[] = [];
    for (let i = 0; i <= 30; i += 1) {
      const y = 8 + i * 2.8;
      const phase = (i / 30) * Math.PI * 4;
      const dx = Math.sin(phase) * 16;
      left.push([50 + dx, y]);
      right.push([50 - dx, y]);
      if (i % 4 === 0) rungs.push(line(50 + dx, y, 50 - dx, y));
    }
    return [poly(left), poly(right), ...rungs];
  },

  atom: () => [
    ellipse(50, 50, 6, 6),
    orbit(50, 50, 40, 15, 0),
    orbit(50, 50, 40, 15, Math.PI / 3),
    orbit(50, 50, 40, 15, -Math.PI / 3),
  ],

  flask: () => [
    line(42, 12, 42, 40),
    line(58, 12, 58, 40),
    poly([[42, 40], [24, 84], [76, 84], [58, 40]], true),
    poly([[28, 66], [72, 66], [76, 84], [24, 84]], true),
    ellipse(50, 75, 4, 4),
    ellipse(60, 79, 3, 3),
    line(38, 12, 62, 12),
  ],

  molecule: () => [
    ellipse(32, 34, 10, 10),
    ellipse(68, 28, 8, 8),
    ellipse(50, 70, 11, 11),
    line(41, 38, 59, 64),
    line(38, 29, 60, 28),
    line(60, 35, 55, 61),
  ],

  magnet: () => [
    poly([[26, 16], [26, 64], [34, 78], [50, 84], [66, 78], [74, 64], [74, 16]]),
    poly([[38, 16], [38, 58], [44, 68], [50, 71], [56, 68], [62, 58], [62, 16]]),
    line(26, 16, 38, 16),
    line(62, 16, 74, 16),
  ],

  clock: () => {
    const ticks: FigPath[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (TAU * i) / 12;
      const r1 = i % 3 === 0 ? 22 : 25;
      ticks.push(line(50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1, 50 + Math.cos(a) * 30, 50 + Math.sin(a) * 30));
    }
    return [
      ellipse(50, 50, 32, 32),
      ...ticks,
      line(50, 50, 50, 30),
      line(50, 50, 65, 60),
      ellipse(50, 50, 2.5, 2.5),
    ];
  },

  globe: () => [
    ellipse(50, 50, 30, 30),
    ellipse(50, 50, 13, 30),
    line(20, 50, 80, 50),
    ellipse(50, 34, 26, 8, 0, Math.PI),
    ellipse(50, 66, 26, 8, Math.PI, TAU),
  ],

  mountain: () => [
    poly([[8, 82], [34, 34], [50, 58], [66, 22], [92, 82]], true),
    poly([[26, 47], [34, 34], [42, 47], [36, 42], [32, 47], [28, 42]], true),
    poly([[59, 34], [66, 22], [73, 34], [68, 30], [64, 34], [62, 30]], true),
    line(8, 82, 92, 82),
  ],

  sun: () => {
    const rays: FigPath[] = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (TAU * i) / 8;
      rays.push(line(50 + Math.cos(a) * 24, 50 + Math.sin(a) * 24, 50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38));
    }
    return [ellipse(50, 50, 18, 18), ...rays];
  },

  drop: () => [
    poly([[50, 6], [70, 42], [72, 60], [60, 82], [40, 82], [28, 60], [30, 42]], true),
    ellipse(42, 58, 8, 12, Math.PI * 0.9, Math.PI * 1.5),
  ],

  heart: () => [
    ellipse(38, 40, 15, 13),
    ellipse(62, 40, 15, 13),
    poly([[23, 44], [50, 86], [77, 44]]),
  ],

  brain: () => [
    ellipse(50, 46, 30, 26, 0, TAU, 36),
    poly([[38, 28], [34, 40], [42, 44], [36, 56], [46, 62]]),
    poly([[62, 28], [66, 40], [58, 46], [64, 56], [54, 62]]),
    line(50, 22, 50, 70),
    poly([[50, 70], [46, 78], [54, 78], [50, 70]]),
  ],

  balance: () => [
    line(50, 14, 50, 76),
    line(36, 88, 64, 88),
    line(50, 76, 36, 88),
    line(50, 76, 64, 88),
    line(16, 24, 84, 24),
    ellipse(50, 24, 4, 4),
    line(16, 24, 8, 44),
    line(16, 24, 24, 44),
    ellipse(16, 48, 14, 5),
    line(84, 24, 76, 44),
    line(84, 24, 92, 44),
    ellipse(84, 48, 14, 5),
  ],

  triangle: () => [
    poly([[16, 84], [84, 84], [16, 26]], true),
    poly([[16, 72], [28, 72], [28, 84]]),
  ],

  parabola: () => {
    const pts: Array<[number, number]> = [];
    for (let x = 8; x <= 92; x += 2) {
      const t = (x - 50) / 42;
      pts.push([x, 78 - 62 * t * t]);
    }
    return [poly(pts), line(50, 88, 50, 14), { ...ellipse(50, 78, 3.5, 3.5) }];
  },

  vector: () => [
    poly([[16, 82], [78, 30]]),
    poly([[78, 30], [66, 32]]),
    poly([[78, 30], [74, 42]]),
    { ...line(16, 82, 78, 82) },
    line(78, 82, 78, 30),
    poly([[78, 74], [70, 74], [70, 82]]),
  ],

  pen: () => [
    poly([[18, 84], [30, 72], [70, 20], [82, 32], [42, 80]], true),
    line(30, 72, 42, 80),
    line(70, 20, 76, 14),
    line(76, 14, 84, 24),
    line(18, 84, 24, 76),
  ],

  question: () => [
    poly([[30, 34], [36, 20], [52, 14], [66, 22], [68, 36], [58, 48], [50, 54], [50, 64]]),
    ellipse(50, 78, 3.5, 3.5),
  ],

  bolt: () => [poly([[58, 6], [32, 52], [48, 52], [40, 94], [70, 44], [54, 44]], true)],

  gear: () => {
    const teeth: FigPath[] = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (TAU * i) / 8;
      const x1 = 50 + Math.cos(a) * 26;
      const y1 = 50 + Math.sin(a) * 26;
      const x2 = 50 + Math.cos(a) * 36;
      const y2 = 50 + Math.sin(a) * 36;
      teeth.push(line(x1, y1, x2, y2));
      teeth.push(line(x2, y2, 50 + Math.cos(a + 0.18) * 34, 50 + Math.sin(a + 0.18) * 34));
    }
    return [ellipse(50, 50, 26, 26), ellipse(50, 50, 9, 9), ...teeth];
  },

  star: () => [starPath()],
};

export const FIGURE_NAMES = Object.keys(FIGURES) as FigureName[];

export function isFigureName(value: unknown): value is FigureName {
  return typeof value === "string" && value in FIGURES;
}

/** Figure paths scaled into a `size × size` box at (x, y). */
export function figurePaths(name: FigureName, x: number, y: number, size: number): FigPath[] {
  const scale = size / 100;
  return FIGURES[name]().map((path) => ({
    ...path,
    pts: path.pts.map(([px, py]) => [x + px * scale, y + py * scale] as [number, number]),
  }));
}
