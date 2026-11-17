import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { exec, one, q } from "./db";

export type User = {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  school: string;
  grade: string;
  avatar_hue: number;
  plan: string;
  xp: number;
  streak: number;
  last_active: string | null;
  persona_vibe: string;
  persona_warmth: number;
  persona_emojis: number;
  persona_language: string;
  created_at: string;
};

const COOKIE = "notara_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + MAX_AGE * 1000);
  await exec("insert into sessions (token, user_id, expires_at) values ($1, $2, $3)", [
    token,
    userId,
    expires.toISOString(),
  ]);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await exec("delete from sessions where token = $1", [token]);
  store.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const row = await one<User>(
    `select p.* from sessions s
     join profiles p on p.id = s.user_id
     where s.token = $1 and s.expires_at > now()`,
    [token],
  );
  return row;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function findUserByLogin(login: string): Promise<(User & { password_hash: string }) | null> {
  const value = login.trim().toLowerCase();
  return one<User & { password_hash: string }>(
    "select * from profiles where lower(email) = $1 or lower(username) = $1",
    [value],
  );
}

export async function usernameTaken(username: string, email: string): Promise<boolean> {
  const row = await one<{ id: string }>(
    "select id from profiles where lower(username) = $1 or lower(email) = $2",
    [username.toLowerCase(), email.toLowerCase()],
  );
  return Boolean(row);
}

export async function followCounts(userId: string) {
  const rows = await q<{ n: number }>("select count(*)::int as n from notes where author_id = $1", [userId]);
  return rows[0]?.n ?? 0;
}
