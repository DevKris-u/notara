const PL_MONTHS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

const PL_WEEKDAYS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
    return new Date(value);
  }
  return new Date();
}

export function formatDate(value: unknown): string {
  const date = toDate(value);
  return `${date.getDate()} ${PL_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(value: unknown): string {
  const date = toDate(value);
  return `${date.getDate()} ${PL_MONTHS[date.getMonth()].slice(0, 3)}`;
}

export function formatTime(value: unknown): string {
  const date = toDate(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function relative(value: unknown): string {
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "teraz";
  if (min < 60) return `${min} min temu`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  return formatDate(date);
}

export function daysUntil(value: unknown): number {
  const date = toDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function weekday(value: unknown): string {
  return PL_WEEKDAYS[toDate(value).getDay()];
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function level(xp: number): { level: number; into: number; need: number; pct: number } {
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const into = xp % 500;
  return { level, into, need: 500, pct: Math.round((into / 500) * 100) };
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function avatarStyle(hue: number): { background: string; color: string } {
  return {
    background: `linear-gradient(140deg, hsl(${hue} 45% 82%), hsl(${(hue + 40) % 360} 40% 68%))`,
    color: `hsl(${hue} 45% 20%)`,
  };
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}
