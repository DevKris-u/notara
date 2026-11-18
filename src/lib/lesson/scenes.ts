import { translateOp } from "./geometry";
import { INK, type FigureName, type Op } from "./types";

/**
 * Composite, hand-drawn explanations.
 *
 * A scene is a small picture that actually teaches the idea: the Pythagorean
 * squares on the triangle's sides, Newton under the tree, the water cycle.
 * Every scene is authored in a 720 × 420 box and translated into the step, so a
 * layout can place it without knowing its internals.
 */

export type SceneName =
  | "pythagoras"
  | "newton"
  | "photosynthesis"
  | "atom"
  | "cell"
  | "water-cycle"
  | "circuit"
  | "parabola"
  | "incline"
  | "triangle-area";

type PolyOpts = { closed?: boolean; fill?: string; color?: string; width?: number };

function ellipsePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
  steps = 40,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = (Math.PI * 2 * i) / steps;
    const px = Math.cos(a) * rx;
    const py = Math.sin(a) * ry;
    pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
  }
  return pts;
}

/** Tiny drawing pen with a reveal phase per element (0 = first, 1 = last). */
class Pen {
  readonly ops: Op[] = [];

  constructor(private color: string) {}

  private add(op: Op, phase: number) {
    this.ops.push({ ...op, at: phase } as Op);
  }

  text(
    x: number,
    y: number,
    text: string,
    size = 17,
    phase = 0.3,
    color = INK.ink,
    weight = 600,
    hand = false,
  ) {
    this.add({ k: "text", x, y, text, size, color, weight, hand, maxW: 300 }, phase);
  }

  label(x: number, y: number, text: string, phase = 0.35) {
    this.text(x, y, text, 15, phase, INK.soft);
  }

  line(x1: number, y1: number, x2: number, y2: number, phase = 0.1, color = this.color, width = 2.4, dash = false) {
    this.add({ k: "line", x1, y1, x2, y2, color, width, dash }, phase);
  }

  arrow(x1: number, y1: number, x2: number, y2: number, phase = 0.1, color = this.color, width = 2.4) {
    this.add({ k: "arrow", x1, y1, x2, y2, color, width }, phase);
  }

  poly(pts: Array<[number, number]>, phase = 0.1, opts: PolyOpts = {}) {
    this.add(
      {
        k: "poly",
        pts,
        closed: opts.closed,
        fill: opts.fill,
        color: opts.color ?? this.color,
        width: opts.width ?? 2.4,
      },
      phase,
    );
  }

  circle(cx: number, cy: number, r: number, phase = 0.1, fill?: string, color = this.color) {
    this.add({ k: "circle", cx, cy, r, fill, color, width: 2.2 }, phase);
  }

  dot(cx: number, cy: number, r = 5, phase = 0.1, color = this.color) {
    this.add({ k: "dot", cx, cy, r, color }, phase);
  }

  figure(name: FigureName, x: number, y: number, size: number, phase = 0.2, color = this.color) {
    this.add({ k: "figure", name, x, y, size, color }, phase);
  }
}

const SCENES: Record<SceneName, (p: Pen) => void> = {
  pythagoras: (p) => {
    p.poly([[100, 180], [220, 180], [220, 300], [100, 300]], 0.06, {
      closed: true,
      fill: "#eef3e6",
      color: INK.green,
      width: 2,
    });
    p.poly([[220, 300], [340, 300], [340, 420], [220, 420]], 0.12, {
      closed: true,
      fill: "#f7efdc",
      color: INK.gold,
      width: 2,
    });
    p.poly([[340, 300], [220, 180], [340, 60], [460, 180]], 0.18, {
      closed: true,
      fill: "#e9eef7",
      color: INK.sky,
      width: 2,
    });
    p.poly([[220, 300], [340, 300], [220, 180]], 0.08, { closed: true, color: INK.ink, width: 3 });
    p.poly([[220, 284], [236, 284], [236, 300]], 0.22, { color: INK.ink, width: 1.8 });
    p.text(150, 246, "a²", 24, 0.3, INK.green, 700);
    p.text(262, 372, "b²", 24, 0.32, INK.gold, 700);
    p.text(330, 128, "c²", 24, 0.34, INK.sky, 700);
    p.text(232, 262, "a", 20, 0.26, INK.ink, 700, true);
    p.text(274, 294, "b", 20, 0.28, INK.ink, 700, true);
    p.text(292, 224, "c", 20, 0.3, INK.ink, 700, true);
    p.text(500, 84, "a² + b² = c²", 30, 0.4, INK.ink, 600, true);
    p.label(500, 116, "pole kwadratu na przeciwprostokątnej", 0.44);
  },

  newton: (p) => {
    p.line(40, 380, 680, 380, 0.04, INK.ink, 2.4);
    p.figure("tree", 460, 154, 240, 0.08);
    p.figure("sitter", 320, 270, 120, 0.18);
    p.figure("apple", 354, 232, 34, 0.24);
    p.poly([[448, 196], [430, 224], [400, 242], [376, 248]], 0.3, { color: INK.coral, width: 2 });
    p.arrow(371, 202, 371, 228, 0.34, INK.coral, 2.2);
    p.text(384, 222, "g", 22, 0.36, INK.coral, 700, true);
    p.label(452, 352, "Newton pod drzewem", 0.42);
  },

  photosynthesis: (p) => {
    p.line(40, 368, 680, 368, 0.04, INK.ink, 2.2);
    p.figure("sun", 40, 18, 86, 0.06);
    p.figure("leaf", 280, 130, 190, 0.14);
    p.figure("drop", 150, 268, 56, 0.2);
    p.figure("cloud", 520, 70, 120, 0.24);
    p.arrow(120, 96, 272, 164, 0.3, INK.gold);
    p.arrow(556, 192, 452, 212, 0.34, INK.soft);
    p.arrow(190, 286, 268, 266, 0.38, INK.sky);
    p.arrow(402, 150, 480, 74, 0.42, INK.green);
    p.arrow(392, 318, 468, 338, 0.46, INK.coral);
    p.text(92, 152, "światło", 15, 0.32, INK.gold);
    p.text(596, 196, "CO₂", 18, 0.36, INK.soft, 700);
    p.text(120, 322, "H₂O", 18, 0.4, INK.sky, 700);
    p.text(492, 60, "O₂", 18, 0.44, INK.green, 700);
    p.text(470, 372, "glukoza", 16, 0.48, INK.coral);
  },

  atom: (p) => {
    const cx = 330;
    const cy = 210;
    p.poly(ellipsePoints(cx, cy, 230, 84, 0), 0.08, { closed: true, color: INK.sky, width: 1.8 });
    p.poly(ellipsePoints(cx, cy, 230, 84, Math.PI / 3), 0.12, { closed: true, color: INK.lilac, width: 1.8 });
    p.poly(ellipsePoints(cx, cy, 230, 84, -Math.PI / 3), 0.16, { closed: true, color: INK.green, width: 1.8 });
    p.circle(cx, cy, 30, 0.2, "#f6dccd", INK.coral);
    p.text(cx - 16, cy + 7, "+", 24, 0.24, INK.coral, 700, true);
    p.dot(cx + 230, cy, 7, 0.26, INK.sky);
    p.dot(cx - 72.7, cy + 42, 7, 0.28, INK.lilac);
    p.dot(cx + 72.7, cy + 42, 7, 0.3, INK.green);
    p.label(cx + 150, cy + 34, "elektron", 0.34);
    p.label(cx - 24, cy + 68, "jądro", 0.4);
  },

  cell: (p) => {
    p.poly(ellipsePoints(340, 210, 270, 148), 0.06, { closed: true, color: INK.green, width: 3 });
    p.poly(ellipsePoints(340, 210, 256, 136), 0.1, { closed: true, color: INK.green, width: 1.6 });
    p.circle(280, 190, 54, 0.16, "#ece5f7", INK.lilac);
    p.circle(266, 180, 13, 0.2, INK.lilac, INK.lilac);
    p.poly(ellipsePoints(468, 138, 46, 22, 0.5), 0.22, { closed: true, fill: "#f7e6dd", color: INK.coral });
    p.poly(ellipsePoints(452, 288, 40, 19, -0.4), 0.26, { closed: true, fill: "#f7e6dd", color: INK.coral });
    p.poly(ellipsePoints(396, 250, 26, 13, 0.9), 0.3, { closed: true, fill: "#e4f1e2", color: INK.mint });
    p.label(188, 262, "jądro", 0.34);
    p.label(470, 326, "mitochondrium", 0.38);
    p.label(296, 300, "chloroplast", 0.42);
  },

  "water-cycle": (p) => {
    p.line(40, 352, 680, 352, 0.04, INK.sky, 2.4);
    p.figure("sun", 36, 16, 82, 0.06);
    p.figure("cloud", 400, 56, 150, 0.1);
    p.poly([[470, 352], [560, 196], [650, 352]], 0.14, { closed: true, color: INK.ink, width: 2.4 });
    p.poly([[410, 352], [470, 268], [530, 352]], 0.18, { closed: true, color: INK.ink, width: 2 });
    p.poly([[58, 344], [86, 336], [114, 344], [142, 336], [170, 344], [198, 336], [226, 344]], 0.22, { color: INK.sky });
    p.arrow(150, 320, 150, 232, 0.26, INK.sky);
    p.arrow(190, 320, 190, 240, 0.3, INK.sky);
    p.arrow(430, 196, 410, 268, 0.34, INK.sky);
    p.arrow(466, 196, 450, 268, 0.38, INK.sky);
    p.arrow(502, 196, 490, 268, 0.42, INK.sky);
    p.text(44, 210, "parowanie", 15, 0.46, INK.sky);
    p.text(340, 292, "opad", 15, 0.5, INK.sky);
    p.label(250, 340, "morze", 0.54);
  },

  circuit: (p) => {
    p.line(160, 128, 300, 128, 0.06);
    p.line(380, 128, 520, 128, 0.1);
    p.line(160, 128, 160, 300, 0.14);
    p.line(160, 300, 296, 300, 0.18);
    p.line(384, 300, 520, 300, 0.22);
    p.line(520, 128, 520, 300, 0.26);
    // bulb
    p.circle(340, 128, 38, 0.3, "#fdf6e2", INK.gold);
    p.poly([[326, 112], [340, 132], [354, 112]], 0.34, { color: INK.gold, width: 2 });
    // battery
    p.line(296, 286, 296, 314, 0.38, INK.ink, 3);
    p.line(310, 292, 310, 308, 0.4, INK.ink, 5);
    p.line(324, 286, 324, 314, 0.42, INK.ink, 3);
    p.line(338, 292, 338, 308, 0.44, INK.ink, 5);
    p.line(352, 286, 352, 314, 0.46, INK.ink, 3);
    p.line(366, 292, 366, 308, 0.48, INK.ink, 5);
    p.line(380, 300, 384, 300, 0.5, INK.ink, 2.4);
    p.arrow(240, 108, 292, 108, 0.54, INK.coral, 2);
    p.label(226, 92, "prąd", 0.58);
    p.label(340, 340, "bateria", 0.62);
    p.label(390, 92, "żarówka", 0.66);
  },

  parabola: (p) => {
    p.arrow(120, 340, 640, 340, 0.06, INK.ink, 2.2);
    p.arrow(320, 384, 320, 52, 0.08, INK.ink, 2.2);
    const pts: Array<[number, number]> = [];
    for (let dx = -200; dx <= 200; dx += 10) pts.push([320 + dx, 180 + 0.004 * dx * dx]);
    p.poly(pts, 0.12, { color: INK.sky, width: 3.2 });
    p.line(320, 150, 320, 332, 0.18, INK.lilac, 1.6, true);
    p.dot(320, 180, 6, 0.22, INK.coral);
    p.dot(120, 340, 5, 0.26, INK.ink);
    p.dot(520, 340, 5, 0.28, INK.ink);
    p.text(420, 72, "y = ax² + bx + c", 24, 0.32, INK.ink, 600, true);
    p.label(342, 172, "wierzchołek", 0.38);
    p.label(96, 364, "miejsca zerowe", 0.44);
  },

  incline: (p) => {
    p.line(80, 360, 660, 360, 0.04, INK.ink, 2.4);
    p.poly([[120, 360], [620, 360], [620, 150]], 0.08, {
      closed: true,
      fill: "#efe7d5",
      color: INK.ink,
      width: 2.4,
    });
    const ux = 0.922;
    const uy = -0.387;
    const nx = 0.387;
    const ny = 0.922;
    const cx = 370;
    const cy = 255;
    const h = 30;
    p.poly(
      [
        [cx + ux * h + nx * h, cy + uy * h + ny * h],
        [cx - ux * h + nx * h, cy - uy * h + ny * h],
        [cx - ux * h - nx * h, cy - uy * h - ny * h],
        [cx + ux * h - nx * h, cy + uy * h - ny * h],
      ],
      0.16,
      { closed: true, fill: "#dfe9f3", color: INK.sky, width: 2.4 },
    );
    p.arrow(cx, cy + h, cx, cy + h + 58, 0.24, INK.coral);
    p.arrow(cx - nx * h, cy - ny * h, cx - nx * (h + 70), cy - ny * (h + 70), 0.3, INK.green);
    p.arrow(cx - ux * h, cy - uy * h, cx - ux * (h + 70), cy - uy * (h + 70), 0.36, INK.gold);
    p.text(cx + 12, cy + 92, "Fg", 19, 0.42, INK.coral, 700, true);
    p.text(cx - 76, cy - 66, "N", 19, 0.46, INK.green, 700, true);
    p.text(cx - 118, cy + 8, "T", 19, 0.5, INK.gold, 700, true);
    p.label(470, 392, "równia pochyła", 0.54);
  },

  "triangle-area": (p) => {
    p.poly([[140, 340], [560, 340], [320, 120]], 0.08, { closed: true, color: INK.ink, width: 3 });
    p.line(320, 120, 320, 340, 0.16, INK.coral, 2.2, true);
    p.poly([[320, 326], [334, 326], [334, 340]], 0.2, { color: INK.coral, width: 1.8 });
    p.text(296, 248, "h", 20, 0.24, INK.coral, 700, true);
    p.text(342, 364, "a", 20, 0.26, INK.ink, 700, true);
    p.text(430, 90, "P = ½ · a · h", 26, 0.32, INK.ink, 600, true);
    p.label(392, 214, "wysokość", 0.36);
  },
};

export const SCENE_NAMES = Object.keys(SCENES) as SceneName[];

export function isSceneName(value: unknown): value is SceneName {
  return typeof value === "string" && value in SCENES;
}

/** Draws a scene at (x, y); elements unfold from `at` over the next third of the step. */
export function sceneOps(name: SceneName, x: number, y: number, color: string, at: number): Op[] {
  const pen = new Pen(color);
  SCENES[name](pen);
  return pen.ops.map((op) => {
    const phase = op.at ?? 0.1;
    return translateOp({ ...op, at: Math.min(0.92, at + phase * 0.34) } as Op, x, y);
  });
}
