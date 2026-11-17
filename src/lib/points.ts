import { exec, one, q } from "./db";

export type PlanKey = "free" | "pro" | "max";

export const PLANS: Record<
  PlanKey,
  {
    label: string;
    price: string;
    tagline: string;
    whiteboardPerWindow: number;
    windowDays: number;
    chatsPerDay: number;
    benefits: string[];
  }
> = {
  free: {
    label: "Free",
    price: "0 zł",
    tagline: "Zacznij się uczyć bez karty",
    whiteboardPerWindow: 2,
    windowDays: 5,
    chatsPerDay: 20,
    benefits: [
      "Tablica AI: 2 lekcje w 5 dni",
      "Czat z AI: 20 pytań dziennie",
      "Fiszki i quizy z tematów",
      "Notatki społeczności",
    ],
  },
  pro: {
    label: "Pro",
    price: "29 zł / mies.",
    tagline: "Dla nauki na poważnie",
    whiteboardPerWindow: 999,
    windowDays: 1,
    chatsPerDay: 999,
    benefits: [
      "Nielimitowane lekcje na tablicy",
      "Nielimitowany czat z AI",
      "Plany nauki i Voice Recall",
      "Eksport tablic do PDF",
      "Egzaminy próbne bez limitów",
    ],
  },
  max: {
    label: "Max",
    price: "49 zł / mies.",
    tagline: "Wszystko, plus analiza postępów",
    whiteboardPerWindow: 999,
    windowDays: 1,
    chatsPerDay: 999,
    benefits: [
      "Wszystko z Pro",
      "Analiza mocnych i słabych stron",
      "Priorytetowe generowanie lekcji",
      "Wspólne tablice z klasą",
      "Raport postępów dla rodzica",
    ],
  },
};

export function isPro(user: { plan: string } | null | undefined): boolean {
  return user?.plan === "pro" || user?.plan === "max";
}

/** Counts usages of a feature within the plan window. */
export async function usageCount(userId: string, kind: string, days: number): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from usage_events
     where user_id = $1 and kind = $2 and created_at > now() - ($3 || ' days')::interval`,
    [userId, kind, String(days)],
  );
  return row?.n ?? 0;
}

export async function logUsage(userId: string, kind: string): Promise<void> {
  await exec("insert into usage_events (id, user_id, kind) values ($1, $2, $3)", [
    crypto.randomUUID(),
    userId,
    kind,
  ]);
}

export function whiteboardQuota(user: { id: string; plan: string }) {
  const plan = PLANS[(user.plan as PlanKey) ?? "free"] ?? PLANS.free;
  return {
    limit: plan.whiteboardPerWindow,
    days: plan.windowDays,
    unlimited: plan.whiteboardPerWindow > 100,
  };
}

export async function whiteboardRemaining(user: { id: string; plan: string }) {
  const quota = whiteboardQuota(user);
  if (quota.unlimited) return { unlimited: true, left: Infinity, limit: Infinity, days: quota.days };
  const used = await usageCount(user.id, "whiteboard", quota.days);
  return { unlimited: false, left: Math.max(0, quota.limit - used), limit: quota.limit, days: quota.days };
}

export async function awardXp(
  userId: string,
  kind: string,
  amount: number,
  note = "",
): Promise<void> {
  await exec("insert into point_events (id, user_id, kind, amount, note) values ($1, $2, $3, $4, $5)", [
    crypto.randomUUID(),
    userId,
    kind,
    amount,
    note,
  ]);
  await exec("update profiles set xp = xp + $2 where id = $1", [userId, amount]);
}

/** Marks today as active and advances the streak when the previous day was active. */
export async function touchStreak(userId: string): Promise<void> {
  await exec(
    `update profiles set
       streak = case
         when last_active = current_date then streak
         when last_active = current_date - 1 then streak + 1
         else 1
       end,
       last_active = current_date
     where id = $1`,
    [userId],
  );
}

export async function notify(
  userId: string,
  kind: string,
  body: string,
  href = "/",
): Promise<void> {
  await exec(
    "insert into notifications (id, user_id, kind, body, href) values ($1, $2, $3, $4, $5)",
    [crypto.randomUUID(), userId, kind, body, href],
  );
}

export async function unreadNotifications(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    "select count(*)::int as n from notifications where user_id = $1 and read = false",
    [userId],
  );
  return row?.n ?? 0;
}

export async function leaderboard(limit = 10) {
  return q<{ id: string; username: string; display_name: string; avatar_hue: number; xp: number; streak: number; plan: string }>(
    `select id, username, display_name, avatar_hue, xp, streak, plan
     from profiles order by xp desc, streak desc limit $1`,
    [limit],
  );
}

export async function userRank(userId: string): Promise<number> {
  const row = await one<{ rank: number }>(
    "select count(*)::int + 1 as rank from profiles where xp > (select xp from profiles where id = $1)",
    [userId],
  );
  return row?.rank ?? 1;
}
