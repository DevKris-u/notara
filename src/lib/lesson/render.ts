import { compileExpr, plotMap } from "./geometry";
import { INK, type Op } from "./types";

export type Fonts = { hand: string; sans: string };

function fontStr(size: number, weight: number, hand: boolean, fonts: Fonts): string {
  const family = hand ? fonts.hand : fonts.sans;
  return `${weight} ${size}px ${family}`;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function easeOut(v: number): number {
  return 1 - Math.pow(1 - clamp01(v), 3);
}

function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Wraps text to a maximum width, honoring explicit newlines. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW?: number): string[] {
  const parts = text.split("\n");
  if (!maxW) return parts;
  const out: string[] = [];
  for (const part of parts) {
    const words = part.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

function wobbleLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  p: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const segments = Math.max(2, Math.min(16, Math.round(len / 26)));
  ctx.beginPath();
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * p;
    const off = (rnd(seed + i) - 0.5) * 1.1;
    const x = x1 + dx * t + nx * off;
    const y = y1 + dy * t + ny * off;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function samplePath(pts: Array<[number, number]>, smooth: boolean, closed: boolean): Array<[number, number]> {
  if (!smooth || pts.length < 3) return closed ? [...pts, pts[0]] : pts;
  const out: Array<[number, number]> = [];
  const list = closed ? [...pts, pts[0]] : pts;
  for (let i = 0; i < list.length - 1; i += 1) {
    const p0 = list[Math.max(0, i - 1)];
    const p1 = list[i];
    const p2 = list[i + 1];
    const p3 = list[Math.min(list.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.08) {
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y]);
    }
  }
  out.push(list[list.length - 1]);
  return out;
}

function strokePrefix(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>, p: number) {
  if (pts.length < 2) return;
  let total = 0;
  const lengths: number[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lengths.push(l);
    total += l;
  }
  const target = total * clamp01(p);
  let walked = 0;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) {
    const l = lengths[i - 1];
    if (walked + l <= target) {
      ctx.lineTo(pts[i][0], pts[i][1]);
      walked += l;
    } else {
      const remain = target - walked;
      const t = l === 0 ? 0 : remain / l;
      ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t);
      break;
    }
  }
  ctx.stroke();
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a = Math.PI / 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - a), y2 - size * Math.sin(angle - a));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle + a), y2 - size * Math.sin(angle + a));
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draws one operation at drawing progress `p` (0..1). */
export function drawOp(
  ctx: CanvasRenderingContext2D,
  op: Op,
  p: number,
  fonts: Fonts,
  seed: number,
) {
  const prog = clamp01(p);
  if (prog <= 0) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (op.k) {
    case "text": {
      const size = op.size ?? 21;
      const weight = op.weight ?? 500;
      const hand = op.hand ?? false;
      ctx.font = fontStr(size, weight, hand, fonts);
      ctx.fillStyle = op.color ?? INK.ink;
      ctx.textAlign = op.align ?? "left";
      ctx.textBaseline = "alphabetic";
      const alpha = easeOut(prog * 1.6);
      ctx.globalAlpha = alpha;
      const lines = wrapText(ctx, op.text, op.maxW);
      lines.forEach((line, i) => {
        ctx.fillText(line, op.x, op.y + i * size * 1.34 + (1 - alpha) * 4);
      });
      break;
    }
    case "line": {
      ctx.strokeStyle = op.color ?? INK.ink;
      ctx.lineWidth = op.width ?? 2;
      if (op.dash) ctx.setLineDash([9, 7]);
      wobbleLine(ctx, op.x1, op.y1, op.x2, op.y2, seed, prog);
      break;
    }
    case "arrow": {
      ctx.strokeStyle = op.color ?? INK.ink;
      ctx.lineWidth = op.width ?? 2.5;
      const ex = op.x1 + (op.x2 - op.x1) * prog;
      const ey = op.y1 + (op.y2 - op.y1) * prog;
      wobbleLine(ctx, op.x1, op.y1, ex, ey, seed, 1);
      if (prog > 0.72) arrowHead(ctx, op.x1, op.y1, op.x2, op.y2, 12);
      break;
    }
    case "poly": {
      if (!op.pts.length) break;
      const pts = samplePath(op.pts, Boolean(op.smooth), Boolean(op.closed));
      if (op.fill) {
        ctx.globalAlpha = easeOut(prog * 2);
        ctx.fillStyle = op.fill;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const point of pts.slice(1)) ctx.lineTo(point[0], point[1]);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = op.color ?? INK.ink;
      ctx.lineWidth = op.width ?? 2.5;
      strokePrefix(ctx, pts, prog);
      break;
    }
    case "rect": {
      const w = op.w;
      const h = op.h;
      if (op.fill) {
        ctx.globalAlpha = easeOut(prog * 2);
        ctx.fillStyle = op.fill;
        roundRect(ctx, op.x, op.y, w * Math.max(0.01, prog), h, op.radius ?? 4);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if ((op.width ?? 2) > 0) {
        ctx.strokeStyle = op.color ?? INK.ink;
        ctx.lineWidth = op.width ?? 2;
        const per = 2 * (w + h) + 4 * (op.radius ?? 4);
        ctx.setLineDash([per * prog, per]);
        roundRect(ctx, op.x, op.y, w, h, op.radius ?? 4);
        ctx.stroke();
      }
      break;
    }
    case "circle": {
      if (op.fill) {
        ctx.globalAlpha = easeOut(prog * 2);
        ctx.fillStyle = op.fill;
        ctx.beginPath();
        ctx.arc(op.cx, op.cy, op.r * Math.max(0.02, easeOut(prog)), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if ((op.width ?? 2) > 0) {
        ctx.strokeStyle = op.color ?? INK.ink;
        ctx.lineWidth = op.width ?? 2;
        ctx.beginPath();
        ctx.arc(op.cx, op.cy, op.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
        ctx.stroke();
      }
      break;
    }
    case "dot": {
      ctx.fillStyle = op.color ?? INK.ink;
      ctx.beginPath();
      ctx.arc(op.cx, op.cy, (op.r ?? 5) * easeOut(prog), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "axes": {
      const { x, y, w, h } = op;
      ctx.strokeStyle = op.color ?? "#3c4a42";
      ctx.lineWidth = 1.8;
      const p1 = clamp01(prog * 1.6);
      const p2 = clamp01((prog - 0.15) * 1.6);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w * p1, y + h);
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + h - h * p2);
      ctx.stroke();
      if (prog > 0.45) arrowHead(ctx, x, y + h, x + w, y + h, 9);
      if (prog > 0.55) arrowHead(ctx, x, y + h, x, y, 9);
      if (op.ticks !== false && prog > 0.6) {
        ctx.globalAlpha = clamp01((prog - 0.6) * 3);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 1; i <= 4; i += 1) {
          ctx.moveTo(x + (w / 5) * i, y + h - 5);
          ctx.lineTo(x + (w / 5) * i, y + h + 5);
          ctx.moveTo(x - 5, y + h - (h / 5) * i);
          ctx.lineTo(x + 5, y + h - (h / 5) * i);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = fontStr(15, 600, false, fonts);
      ctx.fillStyle = op.color ?? "#3c4a42";
      if (op.xLabel) ctx.fillText(op.xLabel, x + w + 8, y + h + 5);
      if (op.yLabel) ctx.fillText(op.yLabel, x + 6, y - 8);
      break;
    }
    case "func": {
      const fn = compileExpr(op.expr);
      if (!fn) break;
      const domain = op.domain ?? [-5, 5];
      const frame = op.frame;
      const samples = 260;
      const values: number[] = [];
      for (let i = 0; i <= samples; i += 1) {
        const x = domain[0] + ((domain[1] - domain[0]) * i) / samples;
        values.push(fn(x));
      }
      const finite = values.filter((v) => Number.isFinite(v));
      const min = op.range ? op.range[0] : Math.min(...finite);
      const max = op.range ? op.range[1] : Math.max(...finite);
      const map = plotMap(frame, domain, [min, max]);
      ctx.strokeStyle = op.color ?? INK.green;
      ctx.lineWidth = op.width ?? 3.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(frame.x - 2, frame.y - 2, frame.w + 4, frame.h + 4);
      ctx.clip();
      ctx.beginPath();
      let started = false;
      const count = Math.floor(samples * prog);
      for (let i = 0; i <= count; i += 1) {
        const v = values[i];
        if (!Number.isFinite(v)) {
          started = false;
          continue;
        }
        const px = map.sx(domain[0] + ((domain[1] - domain[0]) * i) / samples);
        const py = map.sy(v);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
      if (op.label && prog > 0.7) {
        ctx.font = fontStr(17, 700, true, fonts);
        ctx.fillStyle = op.color ?? INK.green;
        ctx.globalAlpha = clamp01((prog - 0.7) * 4);
        ctx.fillText(op.label, frame.x + 10, frame.y + 26);
      }
      break;
    }
    case "highlight": {
      ctx.globalAlpha = 0.5 * easeOut(prog * 1.5);
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = op.color ?? "#f7df8a";
      roundRect(ctx, op.x, op.y, op.w * easeOut(prog), op.h, 6);
      ctx.fill();
      break;
    }
    case "pill": {
      const alpha = easeOut(prog * 1.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = op.bg ?? "#efe4c9";
      roundRect(ctx, op.x, op.y + (1 - alpha) * 6, op.w * (0.96 + 0.04 * alpha), op.h, Math.min(14, op.h / 2));
      ctx.fill();
      if (prog > 0.3) {
        const size = op.size ?? 22;
        ctx.font = fontStr(size, 700, false, fonts);
        ctx.fillStyle = op.color ?? INK.ink;
        ctx.textBaseline = "middle";
        ctx.globalAlpha = clamp01((prog - 0.3) * 2);
        ctx.fillText(op.text, op.x + 16, op.y + op.h / 2 + 1);
      }
      break;
    }
  }
  ctx.restore();
}

/** Draws the whole board up to the current step and elapsed time. */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  opsByStep: Op[][],
  stepIndex: number,
  elapsedMs: number,
  stepDuration: number,
  fonts: Fonts,
) {
  for (let s = 0; s <= stepIndex; s += 1) {
    const ops = opsByStep[s] ?? [];
    const isCurrent = s === stepIndex;
    const stepProgress = isCurrent ? clamp01(elapsedMs / Math.max(1, stepDuration)) : 1;
    ops.forEach((op, i) => {
      const startAt = op.at ?? Math.min(0.72, 0.04 + i * 0.055);
      const dur = "dur" in op ? (op.dur ?? 0.18) : 0.18;
      const p = isCurrent ? clamp01((stepProgress - startAt) / dur) : 1;
      if (p > 0) drawOp(ctx, op, p, fonts, i + s * 37);
    });
  }
}

/** Returns the union bounding box of all steps' focus areas. */
export function boardExtents(focuses: Array<{ x: number; y: number; w: number; h: number }>) {
  if (!focuses.length) return { x: 0, y: 0, w: 1200, h: 800 };
  const minX = Math.min(...focuses.map((f) => f.x));
  const minY = Math.min(...focuses.map((f) => f.y));
  const maxX = Math.max(...focuses.map((f) => f.x + f.w));
  const maxY = Math.max(...focuses.map((f) => f.y + f.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
