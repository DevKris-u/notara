import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { one, parseJson, q } from "@/lib/db";
import { markNotificationsReadAction } from "@/lib/actions";
import type { Lesson } from "@/lib/lesson/types";
import {
  ArrowIcon,
  BoardIcon,
  ChatIcon,
  CheckIcon,
  FlameIcon,
  PlanIcon,
  PracticeIcon,
  SparkIcon,
  TrophyIcon,
} from "@/components/icons";
import { daysUntil, formatShort, level, plural, relative, weekday } from "@/lib/utils";

export const metadata = { title: "Start" };

type PlanRow = {
  id: string;
  title: string;
  subject_slug: string | null;
  kind: string;
  due_date: string;
  estimate_min: number;
};

type BoardRow = { id: string; title: string; lesson: unknown; created_at: string };

type NoteRow = {
  id: string;
  title: string;
  slug: string;
  read_minutes: number;
  likes: number;
  author_name: string;
  subject_name: string | null;
  emoji: string | null;
};

type NotificationRow = { id: string; kind: string; body: string; href: string; read: boolean; created_at: string };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Jeszcze nie śpisz?";
  if (hour < 11) return "Dzień dobry";
  if (hour < 17) return "Cześć";
  if (hour < 22) return "Dobry wieczór";
  return "Dobry wieczór";
}

function dueLabel(date: unknown): { label: string; tone: string } {
  const days = daysUntil(date);
  if (days < 0) return { label: `${Math.abs(days)} dni po terminie`, tone: "chip-coral" };
  if (days === 0) return { label: "Dzisiaj", tone: "chip-coral" };
  if (days === 1) return { label: "Jutro", tone: "chip-gold" };
  if (days <= 6) return { label: `Za ${days} dni`, tone: "chip-gold" };
  return { label: formatShort(date), tone: "" };
}

export default async function HomePage() {
  const user = await requireUser();

  const [planItems, boards, notes, notifications, boardCount, quizCount, savedCount, recallCount] = await Promise.all([
    q<PlanRow>(
      `select id, title, subject_slug, kind, due_date, estimate_min from plan_items
       where user_id = $1 and done = false order by due_date asc limit 4`,
      [user.id],
    ),
    q<BoardRow>("select id, title, lesson, created_at from boards where user_id = $1 order by created_at desc limit 3", [
      user.id,
    ]),
    q<NoteRow>(
      `select n.id, n.title, n.slug, n.read_minutes,
              (select count(*)::int from note_likes l where l.note_id = n.id) as likes,
              p.display_name as author_name, s.name as subject_name, s.emoji as emoji
       from notes n
       join profiles p on p.id = n.author_id
       left join subjects s on s.slug = n.subject_slug
       order by likes desc, n.created_at desc limit 3`,
    ),
    q<NotificationRow>(
      "select id, kind, body, href, read, created_at from notifications where user_id = $1 order by created_at desc limit 5",
      [user.id],
    ),
    one<{ n: number }>("select count(*)::int as n from boards where user_id = $1", [user.id]),
    one<{ n: number }>("select count(*)::int as n from quizzes where user_id = $1", [user.id]),
    one<{ n: number }>("select count(*)::int as n from note_saves where user_id = $1", [user.id]),
    one<{ n: number }>("select count(*)::int as n from recall_sessions where user_id = $1", [user.id]),
  ]);

  const xp = level(user.xp);
  const next = planItems[0];
  const unread = notifications.filter((item) => !item.read).length;

  const stats = [
    { label: "XP", value: String(user.xp), icon: SparkIcon },
    { label: "Seria", value: `${user.streak} ${plural(user.streak, "dzień", "dni", "dni")}`, icon: FlameIcon },
    { label: "Tablice", value: String(boardCount?.n ?? 0), icon: BoardIcon },
    { label: "Quizy", value: String(quizCount?.n ?? 0), icon: PracticeIcon },
    { label: "Zapisane", value: String(savedCount?.n ?? 0), icon: CheckIcon },
    { label: "Recall", value: String(recallCount?.n ?? 0), icon: TrophyIcon },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Twój dzień nauki</div>
          <h1 className="page-title">
            {greeting()}, {user.display_name.split(" ")[0]}.
          </h1>
          <p className="page-sub">
            {next
              ? `Najbliżej masz: ${next.title.toLowerCase()}. Zacznij od jednej małej rzeczy.`
              : "Nie masz zaplanowanych zadań. To dobry moment, żeby poukładać naukę na najbliższe dni."}
          </p>
        </div>
        <div className="row">
          <Link href="/whiteboard" className="btn btn-primary">
            <BoardIcon width={16} height={16} /> Nowa tablica
          </Link>
          <Link href="/chat" className="btn">
            <ChatIcon width={16} height={16} /> Zapytaj AI
          </Link>
        </div>
      </div>

      <section className="grid-3" style={{ gap: 14 }}>
        <div className="card" style={{ gridColumn: "span 2", padding: 18 }}>
          <div className="between" style={{ alignItems: "flex-start" }}>
            <div>
              <span className="label">Poziom {xp.level}</span>
              <h2 style={{ fontSize: 23, margin: "4px 0 2px" }}>
                {xp.into} / {xp.need} XP do poziomu {xp.level + 1}
              </h2>
              <p className="small">Nauka liczy się nawet wtedy, gdy trwa 10 minut.</p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <FlameIcon width={18} height={18} color="var(--coral)" />
              <b style={{ fontSize: 17 }}>{user.streak}</b>
            </div>
          </div>
          <div className="progress" style={{ marginTop: 14 }}>
            <span style={{ width: `${xp.pct}%` }} />
          </div>
          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            <Link href="/leaderboard" className="btn btn-sm">
              <TrophyIcon width={14} height={14} /> Ranking
            </Link>
            <Link href="/plans" className="btn btn-sm">
              <PlanIcon width={14} height={14} /> Plan nauki
            </Link>
          </div>
        </div>

        <div className="card-soft" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="label">Na dziś</span>
          {next ? (
            <>
              <b style={{ fontSize: 16, lineHeight: 1.3 }}>{next.title}</b>
              <div className="row" style={{ gap: 6 }}>
                <span className={`chip ${dueLabel(next.due_date).tone}`}>{dueLabel(next.due_date).label}</span>
                <span className="chip">{next.estimate_min} min</span>
              </div>
              <p className="small" style={{ marginTop: "auto" }}>
                {weekday(next.due_date)}, {formatShort(next.due_date)}
              </p>
            </>
          ) : (
            <>
              <b style={{ fontSize: 16 }}>Wszystko odhaczone</b>
              <p className="small">Dodaj nowy cel, żeby mieć co powtarzać.</p>
            </>
          )}
          <Link href="/plans" className="btn btn-sm" style={{ marginTop: 4 }}>
            Otwórz plan <ArrowIcon width={13} height={13} />
          </Link>
        </div>
      </section>

      <section className="grid-4" style={{ gap: 10 }}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat">
              <div className="row" style={{ gap: 6, justifyContent: "space-between" }}>
                <span>{item.label}</span>
                <Icon width={15} height={15} color="var(--ink-faint)" />
              </div>
              <b>{item.value}</b>
            </div>
          );
        })}
      </section>

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <section className="stack" style={{ gap: 10 }}>
            <div className="between">
              <h2 className="section-title">Ostatnie tablice</h2>
              <Link href="/whiteboard" className="small" style={{ fontWeight: 700 }}>
                Wszystkie
              </Link>
            </div>
            {boards.length ? (
              <div className="board-grid">
                {boards.map((board) => {
                  const lesson = parseJson<Lesson>(board.lesson);
                  return (
                    <Link key={board.id} href={`/whiteboard/${board.id}`} className="board-card">
                      <div className="board-thumb">{lesson?.emoji ?? "🎨"}</div>
                      <b style={{ fontSize: 14.5, lineHeight: 1.3 }}>{board.title}</b>
                      <div className="between" style={{ marginTop: "auto" }}>
                        <span className="small">{lesson?.steps.length ?? 0} kroków</span>
                        <span className="small">{relative(board.created_at)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <h3>Jeszcze nie masz tablic</h3>
                <p>Wpisz pytanie, a asystent narysuje i opowie temat krok po kroku.</p>
                <Link href="/whiteboard" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                  Stwórz pierwszą lekcję
                </Link>
              </div>
            )}
          </section>

          <section className="stack" style={{ gap: 10 }}>
            <div className="between">
              <h2 className="section-title">Najbliższe zadania</h2>
              <Link href="/plans" className="small" style={{ fontWeight: 700 }}>
                Plan nauki
              </Link>
            </div>
            <div className="card" style={{ padding: "6px 16px" }}>
              {planItems.length ? (
                planItems.map((item) => (
                  <div key={item.id} className="list-row">
                    <span className="dot" style={{ background: "var(--green-2)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 14 }}>{item.title}</b>
                      <div className="small">
                        {weekday(item.due_date)}, {formatShort(item.due_date)} · {item.estimate_min} min
                      </div>
                    </div>
                    <span className={`chip ${dueLabel(item.due_date).tone}`}>{dueLabel(item.due_date).label}</span>
                  </div>
                ))
              ) : (
                <p className="muted" style={{ padding: "12px 0" }}>
                  Brak zadań. Dodaj sprawdzian albo powtórkę w planie nauki.
                </p>
              )}
            </div>
          </section>

          <section className="stack" style={{ gap: 10 }}>
            <div className="between">
              <h2 className="section-title">Z Community</h2>
              <Link href="/community" className="small" style={{ fontWeight: 700 }}>
                Przeglądaj notatki
              </Link>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {notes.map((note) => (
                <Link key={note.id} href={`/notes/${note.slug}`} className="card-soft card-hover" style={{ padding: 14 }}>
                  <div className="between" style={{ alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                        {note.emoji ? <span>{note.emoji}</span> : null}
                        <span className="small">{note.subject_name ?? "Nauka"}</span>
                      </div>
                      <b style={{ fontSize: 14.5 }}>{note.title}</b>
                      <p className="small" style={{ marginTop: 4 }}>
                        {note.author_name} · {note.read_minutes} min czytania
                      </p>
                    </div>
                    <span className="chip chip-coral">♥ {note.likes}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card-soft">
            <div className="between">
              <h2 className="section-title" style={{ fontSize: 17 }}>
                Powiadomienia {unread ? <span className="chip chip-coral">{unread}</span> : null}
              </h2>
              {unread ? (
                <form action={markNotificationsReadAction}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Oznacz jako przeczytane
                  </button>
                </form>
              ) : null}
            </div>
            <div className="stack" style={{ gap: 2, marginTop: 8 }}>
              {notifications.length ? (
                notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="list-row"
                    style={{ padding: "10px 0", alignItems: "flex-start" }}
                  >
                    <span
                      className="dot"
                      style={{ marginTop: 6, background: item.read ? "var(--line-strong)" : "var(--coral)" }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.45 }}>{item.body}</span>
                      <span className="small">{relative(item.created_at)}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="muted">Cisza. Wróć po lekcji — coś się tu pojawi.</p>
              )}
            </div>
          </section>

          <section className="card" style={{ background: "linear-gradient(160deg, #fffdf8, #f4ecd9)" }}>
            <span className="chip chip-gold">Szybki start</span>
            <h3 style={{ fontSize: 19, margin: "10px 0 6px" }}>Trzy sposoby na 10 minut nauki</h3>
            <div className="stack" style={{ gap: 8, marginTop: 8 }}>
              <Link href="/whiteboard" className="btn btn-sm" style={{ justifyContent: "flex-start" }}>
                <BoardIcon width={15} height={15} /> Rozrysuj trudny temat
              </Link>
              <Link href="/practice" className="btn btn-sm" style={{ justifyContent: "flex-start" }}>
                <PracticeIcon width={15} height={15} /> Zrób quiz albo fiszki
              </Link>
              <Link href="/questions" className="btn btn-sm" style={{ justifyContent: "flex-start" }}>
                <ChatIcon width={15} height={15} /> Odpowiedz komuś na pytanie
              </Link>
            </div>
          </section>

          <p className="footer-note">
            Notara działa lokalnie. Twoje dane zostają na tym komputerze, a Supabase możesz podłączyć później.
          </p>
        </aside>
      </div>
    </div>
  );
}
