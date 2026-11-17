import type { Lesson, Op, Step } from "./types";

/* ------------------------------------------------------------------ */
/*  Tiny safe expression parser for plotted functions                 */
/* ------------------------------------------------------------------ */

type Token = { t: "num"; v: number } | { t: "op"; v: string } | { t: "fn"; v: string };

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
      out.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j += 1;
      const word = src.slice(i, j).toLowerCase();
      if (word === "pi") out.push({ t: "num", v: Math.PI });
      else if (word === "e") out.push({ t: "num", v: Math.E });
      else if (word === "x") out.push({ t: "op", v: "x" });
      else if (FUNCS[word]) out.push({ t: "fn", v: word });
      i = j;
      continue;
    }
    out.push({ t: "op", v: c });
    i += 1;
  }
  return out;
}

/** Compiles a math expression into a fast evaluator. Returns null on error. */
export function compileExpr(src: string): ((x: number) => number) | null {
  const tokens = tokenize(src);
  let pos = 0;

  const peek = () => tokens[pos];
  const eat = (v: string) => {
    const token = tokens[pos];
    if (token && token.t === "op" && token.v === v) {
      pos += 1;
      return true;
    }
    return false;
  };

  const expr = (): ((x: number) => number) => {
    let left = term();
    while (peek() && peek().t === "op" && (peek() as { v: string }).v === "+") {
      pos += 1;
      const l = left;
      const r = term();
      left = (x) => l(x) + r(x);
    }
    while (peek() && peek().t === "op" && (peek() as { v: string }).v === "-") {
      pos += 1;
      const l = left;
      const r = term();
      left = (x) => l(x) - r(x);
    }
    return left;
  };

  const term = (): ((x: number) => number) => {
    let left = power();
    for (;;) {
      const token = peek();
      if (token && token.t === "op" && token.v === "*") {
        pos += 1;
        const l = left;
        const r = power();
        left = (x) => l(x) * r(x);
      } else if (token && token.t === "op" && token.v === "/") {
        pos += 1;
        const l = left;
        const r = power();
        left = (x) => l(x) / r(x);
      } else break;
    }
    return left;
  };

  const power = (): ((x: number) => number) => {
    const base = unary();
    if (eat("^")) {
      const exp = power();
      return (x) => Math.pow(base(x), exp(x));
    }
    return base;
  };

  const unary = (): ((x: number) => number) => {
    if (eat("-")) {
      const inner = unary();
      return (x) => -inner(x);
    }
    if (eat("+")) return unary();
    return atom();
  };

  const atom = (): ((x: number) => number) => {
    const token = peek();
    if (!token) return () => 0;
    if (token.t === "num") {
      pos += 1;
      const v = token.v;
      return () => v;
    }
    if (token.t === "op" && token.v === "x") {
      pos += 1;
      return (x) => x;
    }
    if (token.t === "fn") {
      pos += 1;
      const fn = FUNCS[token.v];
      eat("(");
      const inner = expr();
      eat(")");
      return (x) => fn(inner(x));
    }
    if (eat("(")) {
      const inner = expr();
      eat(")");
      return inner;
    }
    pos += 1;
    return () => 0;
  };

  try {
    const fn = expr();
    return (x: number) => {
      const v = fn(x);
      return Number.isFinite(v) ? v : NaN;
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Scene layout: each step gets its own area of the infinite board    */
/* ------------------------------------------------------------------ */

const SCENE_W = 960;
const SCENE_H = 730;

export function translateOp(op: Op, dx: number, dy: number): Op {
  switch (op.k) {
    case "text":
    case "rect":
    case "highlight":
    case "pill":
    case "axes":
      return { ...op, x: op.x + dx, y: op.y + dy };
    case "line":
    case "arrow":
      return { ...op, x1: op.x1 + dx, y1: op.y1 + dy, x2: op.x2 + dx, y2: op.y2 + dy };
    case "poly":
      return { ...op, pts: op.pts.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
    case "circle":
    case "dot":
      return { ...op, cx: op.cx + dx, cy: op.cy + dy };
    case "func":
      return { ...op, frame: { ...op.frame, x: op.frame.x + dx, y: op.frame.y + dy } };
    default:
      return op;
  }
}

/** Maps data coordinates into a plotted frame on the board. */
export function plotMap(
  frame: { x: number; y: number; w: number; h: number },
  domain: [number, number],
  range: [number, number],
) {
  return {
    sx: (x: number) => frame.x + ((x - domain[0]) / (domain[1] - domain[0])) * frame.w,
    sy: (y: number) => frame.y + frame.h - ((y - range[0]) / (range[1] - range[0])) * frame.h,
  };
}

/** Rough Polish speech length estimate, in milliseconds. */
export function speechMs(text: string): number {
  const chars = text.replace(/\s+/g, " ").trim().length;
  return Math.max(3200, Math.round((chars / 14.2) * 1000) + 900);
}

export function scene(index: number) {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const ox = 100 + col * SCENE_W;
  const oy = 100 + row * SCENE_H;
  return {
    ox,
    oy,
    step(title: string, narration: string, ops: Op[]): Step {
      const durMs = speechMs(narration);
      return {
        title,
        narration,
        durMs,
        focus: { x: ox - 40, y: oy - 74, w: SCENE_W - 20, h: SCENE_H - 30 },
        ops: ops.map((op) => translateOp(op, ox, oy)),
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Convenience drawing helpers (local coordinates)                    */
/* ------------------------------------------------------------------ */

export function title(x: number, y: number, text: string, color = "#e2b23f") {
  return {
    k: "pill" as const,
    x: x - 6,
    y: y - 34,
    w: Math.min(760, 26 + text.length * 17),
    h: 48,
    text,
    size: 25,
    bg: color,
    color: "#14211c",
    at: 0,
  };
}

export function bullet(x: number, y: number, text: string, i = 0, color = "#0e4d3a") {
  return [
    { k: "dot" as const, cx: x - 18, cy: y - 7, r: 5.5, color, at: 0.08 + i * 0.02 },
    {
      k: "text" as const,
      x,
      y,
      text,
      size: 21,
      maxW: 700,
      color: "#233229",
      at: 0.1 + i * 0.02,
    },
  ] satisfies Op[];
}

export function chip(x: number, y: number, text: string, bg = "#f0e6cf") {
  return {
    k: "pill" as const,
    x,
    y: y - 24,
    w: Math.max(96, text.length * 12 + 34),
    h: 42,
    text,
    size: 19,
    bg,
    color: "#14211c",
  };
}

export function makeLesson(
  base: Omit<Lesson, "steps" | "durationMs" | "id"> & { steps: Step[] },
): Lesson {
  const steps = base.steps;
  return {
    ...base,
    id: crypto.randomUUID(),
    steps,
    durationMs: steps.reduce((sum, s) => sum + s.durMs, 0),
  };
}
