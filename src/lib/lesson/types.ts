export type Align = "left" | "center" | "right";

/** Hand-drawn illustrations the board can sketch, scaled into a square box. */
export type FigureName =
  | "person"
  | "teacher"
  | "student"
  | "pair"
  | "book"
  | "lightbulb"
  | "leaf"
  | "plant"
  | "cell"
  | "dna"
  | "atom"
  | "flask"
  | "molecule"
  | "magnet"
  | "clock"
  | "globe"
  | "mountain"
  | "sun"
  | "drop"
  | "heart"
  | "brain"
  | "balance"
  | "triangle"
  | "parabola"
  | "vector"
  | "pen"
  | "question"
  | "bolt"
  | "gear"
  | "star";

export type ChartKind = "bar" | "line" | "pie" | "area";

export type Series = { label: string; value: number; color?: string };

export type Op =
  | {
      k: "text";
      x: number;
      y: number;
      text: string;
      size?: number;
      color?: string;
      weight?: number;
      align?: Align;
      hand?: boolean;
      maxW?: number;
      at?: number;
      dur?: number;
    }
  | {
      k: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      width?: number;
      dash?: boolean;
      at?: number;
      dur?: number;
    }
  | {
      k: "arrow";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      width?: number;
      at?: number;
      dur?: number;
    }
  | {
      k: "poly";
      pts: Array<[number, number]>;
      color?: string;
      width?: number;
      fill?: string;
      closed?: boolean;
      smooth?: boolean;
      at?: number;
      dur?: number;
    }
  | {
      k: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius?: number;
      color?: string;
      width?: number;
      fill?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "circle";
      cx: number;
      cy: number;
      r: number;
      color?: string;
      width?: number;
      fill?: string;
      at?: number;
      dur?: number;
    }
  | { k: "dot"; cx: number; cy: number; r?: number; color?: string; at?: number }
  | {
      k: "axes";
      x: number;
      y: number;
      w: number;
      h: number;
      xLabel?: string;
      yLabel?: string;
      color?: string;
      ticks?: boolean;
      at?: number;
      dur?: number;
    }
  | {
      k: "func";
      frame: { x: number; y: number; w: number; h: number };
      expr: string;
      domain?: [number, number];
      range?: [number, number];
      color?: string;
      width?: number;
      label?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "highlight";
      x: number;
      y: number;
      w: number;
      h: number;
      color?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "pill";
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      color?: string;
      bg?: string;
      size?: number;
      at?: number;
      dur?: number;
    }
  | {
      k: "figure";
      name: FigureName;
      x: number;
      y: number;
      size: number;
      color?: string;
      label?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "chart";
      kind: ChartKind;
      x: number;
      y: number;
      w: number;
      h: number;
      data: Series[];
      unit?: string;
      caption?: string;
      color?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "flow";
      x: number;
      y: number;
      w: number;
      nodes: string[];
      dir?: "h" | "v";
      color?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "venn";
      x: number;
      y: number;
      w: number;
      h: number;
      sets: Array<{ label: string; color?: string }>;
      overlap?: string;
      caption?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "table";
      x: number;
      y: number;
      w: number;
      cols: string[];
      rows: string[][];
      color?: string;
      caption?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "timeline";
      x: number;
      y: number;
      w: number;
      items: Array<{ label: string; text?: string }>;
      color?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "speech";
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      who?: string;
      color?: string;
      bg?: string;
      at?: number;
      dur?: number;
    }
  | {
      k: "callout";
      x: number;
      y: number;
      tx: number;
      ty: number;
      text: string;
      color?: string;
      size?: number;
      at?: number;
      dur?: number;
    };

export type Box = { x: number; y: number; w: number; h: number };

export type Step = {
  title: string;
  narration: string;
  durMs: number;
  focus: Box;
  ops: Op[];
};

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  subjectName: string;
  emoji: string;
  prompt: string;
  steps: Step[];
  followUps: string[];
  takeaways: string[];
  durationMs: number;
};

export type Ink = {
  ink: string;
  soft: string;
  green: string;
  coral: string;
  gold: string;
  sky: string;
  lilac: string;
  mint: string;
};

export const INK: Ink = {
  ink: "#14211c",
  soft: "#5c6b63",
  green: "#0e4d3a",
  coral: "#d9502c",
  gold: "#c68a12",
  sky: "#2f6f96",
  lilac: "#6b5bbd",
  mint: "#0d7a55",
};
