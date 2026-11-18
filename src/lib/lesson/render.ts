import { compileExpr, plotMap } from "./geometry";
import { figurePaths } from "./figures";
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

function samplePath(pts: Array<[number, number]>, smooth: boolean, closed: boolean): Array<[number, number]> {  if (!smooth || pts.length < 3) return closed ? [...pts, pts[0]] : pts;
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

/** Slight hand tremor so library illustrations match the sketched type. */
function jitter(pts: Array<[number, number]>, seed: number, amp = 0.7): Array<[number, number]> {
  return pts.map(([x, y], i) => [
    x + (rnd(seed + i * 3.1) - 0.5) * amp,
    y + (rnd(seed + i * 3.1 + 11.7) - 0.5) * amp,
  ]);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
  return `${out}…`;
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

/** Repeats the ink palette so multi-series charts never come out monochrome. */
const CHART_COLORS = [INK.green, INK.gold, INK.coral, INK.sky, INK.lilac, INK.mint];

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
    case "figure": {
      const paths = figurePaths(op.name, op.x, op.y, op.size);
      const count = Math.max(1, paths.length);
      const stagger = 0.55;
      ctx.strokeStyle = op.color ?? INK.ink;
      ctx.lineWidth = Math.max(1.8, op.size / 44);
      paths.forEach((path, i) => {
        const start = (i / count) * stagger;
        const local = clamp01((prog - start) / (1 - stagger));
        if (local <= 0) return;
        ctx.lineWidth = path.width ?? Math.max(1.8, op.size / 44);
        strokePrefix(ctx, jitter(samplePath(path.pts, true, Boolean(path.closed)), seed + i * 7), local);
      });
      if (op.label) {
        const alpha = clamp01((prog - 0.72) * 4);
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          ctx.font = fontStr(Math.max(13, Math.round(op.size / 9)), 600, false, fonts);
          ctx.fillStyle = INK.soft;
          ctx.textAlign = "center";
          ctx.fillText(op.label, op.x + op.size / 2, op.y + op.size + 22);
          ctx.textAlign = "left";
        }
      }
      break;
    }
    case "chart": {
      const data = op.data.slice(0, 8);
      if (!data.length) break;
      const color = op.color ?? INK.green;
      const padL = op.kind === "pie" ? 10 : 44;
      const padB = op.kind === "pie" ? 10 : 46;
      const padT = op.caption ? 34 : 12;
      const px = op.x + padL;
      const py = op.y + padT;
      const pw = Math.max(60, op.w - padL - 10);
      const ph = Math.max(60, op.h - padB - padT);
      const base = py + ph;

      if (op.caption) {
        ctx.font = fontStr(17, 700, true, fonts);
        ctx.fillStyle = INK.ink;
        ctx.globalAlpha = clamp01(prog * 2);
        ctx.fillText(op.caption, op.x + 4, op.y + 18);
        ctx.globalAlpha = 1;
      }

      if (op.kind === "pie") {
        const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0) || 1;
        const cx = op.x + op.w * 0.32;
        const cy = op.y + op.h / 2 + 6;
        const r = Math.min(op.w * 0.28, op.h * 0.4);
        let angle = -Math.PI / 2;
        data.forEach((d, i) => {
          const sweep = (Math.max(0, d.value) / total) * Math.PI * 2;
          const local = clamp01((prog - i * 0.08) * 2.4);
          if (local > 0) {
            const fill = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, angle, angle + sweep * local);
            ctx.closePath();
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = fill;
            ctx.lineWidth = 2.2;
            ctx.stroke();
          }
          angle += sweep;
        });
        ctx.font = fontStr(14, 600, false, fonts);
        ctx.textBaseline = "middle";
        data.forEach((d, i) => {
          const alpha = clamp01((prog - 0.35 - i * 0.06) * 3);
          if (alpha <= 0) return;
          const lx = op.x + op.w * 0.62;
          const ly = op.y + 34 + i * 30;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
          roundRect(ctx, lx, ly - 7, 16, 14, 4);
          ctx.fill();
          ctx.fillStyle = INK.ink;
          ctx.fillText(truncate(ctx, `${d.label} — ${d.value}${op.unit ?? ""}`, op.w * 0.36), lx + 24, ly + 1);
        });
        ctx.globalAlpha = 1;
        ctx.textBaseline = "alphabetic";
        break;
      }

      const max = Math.max(...data.map((d) => Math.max(0, d.value)), 0.0001);

      ctx.strokeStyle = "#3c4a42";
      ctx.lineWidth = 1.7;
      wobbleLine(ctx, px, base, px + pw * clamp01(prog * 1.8), base, seed, 1);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#8a968f";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      for (let i = 1; i <= 3; i += 1) {
        const gy = base - (ph * i) / 4;
        ctx.moveTo(px, gy);
        ctx.lineTo(px + pw, gy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.font = fontStr(12, 600, false, fonts);
      ctx.fillStyle = INK.soft;
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(max)}${op.unit ?? ""}`, px - 6, py + 4);
      ctx.textAlign = "left";

      const step = pw / data.length;

      if (op.kind === "bar") {
        data.forEach((d, i) => {
          const cx = px + step * (i + 0.5);
          const full = (Math.max(0, d.value) / max) * ph;
          const local = clamp01((prog - 0.12 - i * 0.05) * 3);
          const barW = Math.min(step * 0.56, 78);
          if (local <= 0) return;
          const h = full * local;
          ctx.fillStyle = d.color ?? color;
          ctx.globalAlpha = 0.22;
          roundRect(ctx, cx - barW / 2, base - h, barW, h, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = d.color ?? color;
          ctx.lineWidth = 2.6;
          wobbleLine(ctx, cx - barW / 2, base - h, cx + barW / 2, base - h, seed + i * 5, 1);
          ctx.font = fontStr(14, 700, true, fonts);
          ctx.fillStyle = INK.ink;
          ctx.textAlign = "center";
          if (full > 22) ctx.fillText(String(d.value), cx, base - h - 9);
          ctx.font = fontStr(12, 600, false, fonts);
          ctx.fillStyle = INK.soft;
          ctx.fillText(truncate(ctx, d.label, step - 8), cx, base + 18);
          ctx.textAlign = "left";
        });
        break;
      }

      const points = data.map((d, i) => {
        const x = px + step * (i + 0.5);
        const y = base - (Math.max(0, d.value) / max) * ph * 0.92;
        return [x, y] as [number, number];
      });
      const smooth = samplePath(points, true, false);
      if (op.kind === "area") {
        const local = clamp01((prog - 0.2) / 0.6);
        if (local > 0) {
          const endX = points[0][0] + (points[points.length - 1][0] - points[0][0]) * local;
          ctx.beginPath();
          ctx.moveTo(points[0][0], base);
          for (const [x, y] of smooth) {
            if (x > endX) break;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(endX, base);
          ctx.closePath();
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.4;
      strokePrefix(ctx, smooth, clamp01((prog - 0.1) * 1.5));
      points.forEach(([x, y], i) => {
        const alpha = clamp01((prog - 0.45 - i * 0.04) * 4);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = INK.ink;
        ctx.beginPath();
        ctx.arc(x, y, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = fontStr(12, 600, false, fonts);
        ctx.fillStyle = INK.soft;
        ctx.textAlign = "center";
        ctx.fillText(truncate(ctx, data[i].label, step - 6), x, base + 18);
        ctx.textAlign = "left";
      });
      break;
    }
    case "flow": {
      const nodes = op.nodes.slice(0, 5).filter(Boolean);
      if (!nodes.length) break;
      const vertical = op.dir === "v";
      const gap = 28;
      const n = nodes.length;
      const color = op.color ?? INK.sky;
      const bw = vertical ? op.w * 0.8 : (op.w - gap * (n - 1)) / n;
      const bh = vertical ? 66 : 82;

      ctx.font = fontStr(15, 600, true, fonts);
      nodes.forEach((text, i) => {
        const x = vertical ? op.x + (op.w - bw) / 2 : op.x + i * (bw + gap);
        const y = vertical ? op.y + i * (bh + gap) : op.y;
        const local = clamp01((prog - i * 0.1) * 3.2);
        if (local <= 0) return;
        ctx.globalAlpha = local;
        ctx.fillStyle = "#fffaf0";
        roundRect(ctx, x, y, bw, bh, 12);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        const per = 2 * (bw + bh);
        ctx.setLineDash([per * local, per]);
        roundRect(ctx, x, y, bw, bh, 12);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = clamp01((local - 0.5) * 2);
        ctx.fillStyle = INK.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lines = wrapText(ctx, text, bw - 20).slice(0, 2);
        lines.forEach((ln, li) => {
          ctx.fillText(ln, x + bw / 2, y + bh / 2 + (li - (lines.length - 1) / 2) * 19);
        });
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;

        if (i < n - 1) {
          const arrowP = clamp01((prog - i * 0.1 - 0.45) * 3);
          if (arrowP > 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.2;
            const ax1 = vertical ? x + bw / 2 : x + bw + 4;
            const ay1 = vertical ? y + bh + 3 : y + bh / 2;
            const ax2 = vertical ? x + bw / 2 : x + bw + gap - 6;
            const ay2 = vertical ? y + bh + gap - 6 : y + bh / 2;
            wobbleLine(ctx, ax1, ay1, ax1 + (ax2 - ax1) * arrowP, ay1 + (ay2 - ay1) * arrowP, seed + i, 1);
            if (arrowP > 0.6) arrowHead(ctx, ax1, ay1, ax2, ay2, 10);
          }
        }
      });
      break;
    }
    case "venn": {
      const sets = op.sets.slice(0, 3);
      if (!sets.length) break;
      const r = Math.min(op.w, op.h) / (sets.length === 3 ? 2.5 : 2.3);
      const cx = op.x + op.w / 2;
      const cy = op.y + op.h / 2;
      const centers: Array<[number, number]> =
        sets.length === 3
          ? [
              [cx, cy - r * 0.42],
              [cx - r * 0.62, cy + r * 0.42],
              [cx + r * 0.62, cy + r * 0.42],
            ]
          : [
              [cx - r * 0.5, cy],
              [cx + r * 0.5, cy],
            ];
      ctx.lineWidth = 2.4;
      centers.forEach(([x, y], i) => {
        const local = clamp01((prog - i * 0.12) * 2.6);
        if (local <= 0) return;
        const color = sets[i]?.color ?? CHART_COLORS[i % CHART_COLORS.length];
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * local);
        ctx.stroke();
        ctx.font = fontStr(15, 700, true, fonts);
        ctx.fillStyle = INK.ink;
        ctx.textAlign = "center";
        ctx.globalAlpha = clamp01((local - 0.55) * 3);
        ctx.fillText(sets[i].label, x, y - r * 0.55);
        ctx.globalAlpha = 1;
      });
      if (op.overlap) {
        ctx.globalAlpha = clamp01((prog - 0.6) * 3);
        ctx.font = fontStr(14, 600, false, fonts);
        ctx.fillStyle = INK.soft;
        ctx.textAlign = "center";
        ctx.fillText(op.overlap, cx, cy + 4);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = "left";
      break;
    }
    case "table": {
      const cols = op.cols.slice(0, 4);
      const rows = op.rows.slice(0, 5).map((row) => row.slice(0, cols.length));
      if (!cols.length) break;
      const colW = op.w / cols.length;
      const headH = 42;
      const rowH = 46;
      const color = op.color ?? INK.green;

      if (op.caption) {
        ctx.font = fontStr(17, 700, true, fonts);
        ctx.fillStyle = INK.ink;
        ctx.fillText(op.caption, op.x, op.y - 12);
      }

      ctx.globalAlpha = clamp01(prog * 2.4);
      ctx.fillStyle = "#f3e8d2";
      roundRect(ctx, op.x, op.y, op.w, headH, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;

      const height = headH + rows.length * rowH;
      const per = 2 * (op.w + height);
      ctx.setLineDash([per * clamp01(prog * 1.4), per]);
      roundRect(ctx, op.x, op.y, op.w, height, 10);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      for (let c = 1; c < cols.length; c += 1) {
        ctx.moveTo(op.x + colW * c, op.y + 4);
        ctx.lineTo(op.x + colW * c, op.y + height - 4);
      }
      ctx.moveTo(op.x + 6, op.y + headH);
      ctx.lineTo(op.x + op.w - 6, op.y + headH);
      rows.forEach((_, ri) => {
        const y = op.y + headH + rowH * (ri + 1);
        ctx.moveTo(op.x + 6, y);
        ctx.lineTo(op.x + op.w - 6, y);
      });
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const cell = (text: string, centerX: number, centerY: number, size: number, weight: number, tint: string) => {
        ctx.font = fontStr(size, weight, false, fonts);
        ctx.fillStyle = tint;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lines = wrapText(ctx, text, colW - 16).slice(0, 2);
        lines.forEach((ln, li) => {
          ctx.fillText(ln, centerX, centerY + (li - (lines.length - 1) / 2) * (size * 1.24));
        });
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
      };

      cols.forEach((colText, ci) => {
        const alpha = clamp01((prog - 0.25) * 3);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        cell(colText, op.x + colW * (ci + 0.5), op.y + headH / 2 + 1, 15, 700, INK.ink);
        ctx.globalAlpha = 1;
      });
      rows.forEach((row, ri) => {
        row.forEach((text, ci) => {
          const alpha = clamp01((prog - 0.4 - ri * 0.06) * 3);
          if (alpha <= 0) return;
          ctx.globalAlpha = alpha;
          cell(text, op.x + colW * (ci + 0.5), op.y + headH + rowH * ri + rowH / 2 + 1, 14, 500, INK.ink);
          ctx.globalAlpha = 1;
        });
      });
      break;
    }
    case "timeline": {
      const items = op.items.slice(0, 5);
      if (!items.length) break;
      const color = op.color ?? INK.gold;
      const step = op.w / items.length;
      const yLine = op.y + 34;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      wobbleLine(ctx, op.x, yLine, op.x + op.w * clamp01(prog * 1.5), yLine, seed, 1);

      items.forEach((item, i) => {
        const cx = op.x + step * (i + 0.5);
        const local = clamp01((prog - 0.15 - i * 0.07) * 3);
        if (local <= 0) return;
        ctx.globalAlpha = local;
        ctx.fillStyle = "#fffdf7";
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, yLine, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = fontStr(15, 700, true, fonts);
        ctx.fillStyle = INK.ink;
        ctx.textAlign = "center";
        ctx.fillText(truncate(ctx, item.label, step - 12), cx, yLine - 18);

        if (item.text) {
          ctx.font = fontStr(13, 500, false, fonts);
          ctx.fillStyle = INK.soft;
          const lines = wrapText(ctx, item.text, step - 16).slice(0, 3);
          lines.forEach((ln, li) => ctx.fillText(ln, cx, yLine + 24 + li * 17));
        }
        ctx.globalAlpha = 1;
      });
      ctx.textAlign = "left";
      break;
    }
    case "speech": {
      const bg = op.bg ?? "#fdf3dd";
      const edge = op.color ?? INK.ink;
      const alpha = easeOut(prog * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = bg;
      roundRect(ctx, op.x, op.y, op.w, op.h, 20);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(op.x + 36, op.y + op.h - 3);
      ctx.lineTo(op.x + 24, op.y + op.h + 26);
      ctx.lineTo(op.x + 66, op.y + op.h - 3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      const per = 2 * (op.w + op.h) + 60;
      ctx.setLineDash([per * clamp01(prog * 1.5), per]);
      roundRect(ctx, op.x, op.y, op.w, op.h, 20);
      ctx.stroke();
      ctx.setLineDash([]);
      if (prog > 0.3) {
        ctx.beginPath();
        ctx.moveTo(op.x + 36, op.y + op.h - 3);
        ctx.lineTo(op.x + 24, op.y + op.h + 26);
        ctx.moveTo(op.x + 24, op.y + op.h + 26);
        ctx.lineTo(op.x + 66, op.y + op.h - 3);
        ctx.stroke();
      }

      const textAlpha = clamp01((prog - 0.35) * 2.4);
      if (textAlpha > 0) {
        ctx.globalAlpha = textAlpha;
        ctx.font = fontStr(20, 600, true, fonts);
        ctx.fillStyle = INK.ink;
        const lines = wrapText(ctx, op.text, op.w - 44);
        lines.slice(0, 4).forEach((ln, i) => {
          ctx.fillText(ln, op.x + 22, op.y + 42 + i * 27);
        });
        if (op.who) {
          ctx.font = fontStr(14, 700, false, fonts);
          ctx.fillStyle = INK.soft;
          ctx.fillText(op.who, op.x + 22, op.y + op.h - 16);
        }
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "callout": {
      const dotP = clamp01(prog * 4);
      const lineP = clamp01((prog - 0.05) / 0.45);
      const textP = clamp01((prog - 0.5) / 0.3);
      const color = op.color ?? INK.coral;
      if (dotP > 0) {
        ctx.globalAlpha = dotP;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(op.x, op.y, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (lineP > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        const mx = (op.tx + op.x) / 2 + 12;
        const my = (op.ty + op.y) / 2;
        const pts: Array<[number, number]> = [];
        for (let i = 0; i <= 14; i += 1) {
          const t = i / 14;
          const it = 1 - t;
          pts.push([
            it * it * op.tx + 2 * it * t * mx + t * t * op.x,
            it * it * op.ty + 2 * it * t * my + t * t * op.y,
          ]);
        }
        strokePrefix(ctx, pts, lineP);
      }
      if (textP > 0) {
        ctx.globalAlpha = textP;
        ctx.font = fontStr(op.size ?? 17, 700, true, fonts);
        ctx.fillStyle = color;
        ctx.textAlign = op.tx <= op.x ? "left" : "right";
        const lines = wrapText(ctx, op.text, 200);
        lines.slice(0, 3).forEach((ln, i) => {
          ctx.fillText(ln, op.tx, op.ty - (lines.length - 1 - i) * 21);
        });
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
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
