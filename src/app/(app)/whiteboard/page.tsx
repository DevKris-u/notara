import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { whiteboardRemaining } from "@/lib/points";
import { parseJson } from "@/lib/db";
import { createBoardAction } from "@/lib/actions";
import type { Lesson } from "@/lib/lesson/types";
import { relative } from "@/lib/utils";
import { BoardIcon, PlusIcon, SearchIcon, SparkIcon } from "@/components/icons";
import { QuickPrompts } from "@/components/quick-prompts";

export const metadata = { title: "Tablica AI" };

const QUICK = [
  "Wytłumacz funkcję kwadratową",
  "Twierdzenie Pitagorasa z przykładem",
  "Fotosynteza krok po kroku",
  "Prawo Ohma — jak liczyć prąd i opór",
  "Present Perfect vs Past Simple",
  "Jak napisać rozprawkę?",
];

type BoardRow = {
  id: string;
  title: string;
  prompt: string;
  subject_slug: string | null;
  lesson: unknown;
  pinned: boolean;
  created_at: string;
};

function groupLabel(date: unknown): string {
  const value = date instanceof Date ? date : new Date(String(date));
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (value >= startToday) return "Dzisiaj";
  if (value >= new Date(startToday.getTime() - 6 * 86400000)) return "W tym tygodniu";
  return "Wcześniej";
}

export default async function WhiteboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const search = (params.q ?? "").trim();

  const rows = search
    ? await q<BoardRow>(
        `select id, title, prompt, subject_slug, lesson, pinned, created_at from boards
         where user_id = $1 and (title ilike $2 or prompt ilike $2)
         order by pinned desc, created_at desc limit 50`,
        [user.id, `%${search}%`],
      )
    : await q<BoardRow>(
        `select id, title, prompt, subject_slug, lesson, pinned, created_at from boards
         where user_id = $1 order by pinned desc, created_at desc limit 50`,
        [user.id],
      );

  const remaining = await whiteboardRemaining(user);
  const blocked = !remaining.unlimited && remaining.left <= 0;
  const lessons = rows.map((row) => ({ row, lesson: parseJson<Lesson>(row.lesson) }));

  const groups = ["Dzisiaj", "W tym tygodniu", "Wcześniej"] as const;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Tablica AI</div>
          <h1 className="page-title">Lekcja, którą widać</h1>
          <p className="page-sub">
            Zadaj pytanie — asystent opowie temat na głos i narysuje go krok po kroku. Wszystkie tablice
            zostają w twojej bibliotece, a do każdej możesz dopytać.
          </p>
        </div>
        <div className="stack" style={{ alignItems: "flex-end", gap: 6 }}>
          <span className="chip chip-green">
            {remaining.unlimited ? "Nielimitowane lekcje" : `${remaining.left} z ${remaining.limit} lekcji w ${remaining.days} dni`}
          </span>
          <span className="small">Krok po kroku · narracja · eksport PDF</span>
        </div>
      </div>

      <div className="card" style={{ background: "linear-gradient(150deg, #fffdf8, #f4ecd9)" }}>
        <form action={createBoardAction} className="stack" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="feature-ico" style={{ background: "var(--green)", color: "#fdf8ea", borderColor: "var(--green)" }}>
              <BoardIcon width={19} height={19} />
            </span>
            <div>
              <h2 style={{ fontSize: 20 }}>Co mam ci narysować?</h2>
              <p className="small">Wpisz temat, pytanie albo wklej treść zadania.</p>
            </div>
          </div>
          <textarea
            id="board-prompt"
            name="prompt"
            className="textarea"
            rows={2}
            placeholder="Np. wytłumacz, skąd się bierze delta i narysuj wykres funkcji kwadratowej"
            required
            disabled={blocked}
          />
          <div className="between">
            <QuickPrompts targetId="board-prompt" prompts={QUICK.slice(0, 3)} disabled={blocked} />
            <button type="submit" className="btn btn-primary" disabled={blocked}>
              <PlusIcon width={15} height={15} /> Narysuj lekcję
            </button>
          </div>
        </form>

        <div className="divider" style={{ margin: "16px 0 12px" }} />
        <div className="pill-row">
          {QUICK.map((prompt) => (
            <form key={prompt} action={createBoardAction}>
              <input type="hidden" name="prompt" value={prompt} />
              <button type="submit" className="chip" style={{ cursor: "pointer" }} disabled={blocked}>
                {prompt}
              </button>
            </form>
          ))}
        </div>
      </div>

      {blocked ? (
        <div className="card" style={{ borderColor: "var(--coral)", background: "#fbeee8" }}>
          <div className="between">
            <div>
              <h3 style={{ fontSize: 19 }}>Wykorzystałeś limit tablicy na ten okres</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>
                Plan Free obejmuje {remaining.limit} lekcje w {remaining.days} dni. W Pro lekcje są nielimitowane,
                a tablice zostają zapisane na zawsze.
              </p>
            </div>
            <Link href="/pricing" className="btn btn-coral">
              <SparkIcon width={15} height={15} /> Zobacz Pro
            </Link>
          </div>
        </div>
      ) : null}

      <div className="between">
        <div>
          <div className="eyebrow">Twoje tablice</div>
          <h2 style={{ fontSize: 24, marginTop: 4 }}>
            {lessons.length ? `${lessons.length} zapisanych lekcji` : "Jeszcze pusto"}
          </h2>
        </div>
        <form className="row" style={{ gap: 8 }}>
          <label className="row" style={{ gap: 6, border: "1.5px solid var(--line-strong)", borderRadius: 999, padding: "6px 12px", background: "var(--paper-2)" }}>
            <SearchIcon width={15} height={15} />
            <input
              name="q"
              defaultValue={search}
              placeholder="Szukaj w tablicach…"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: 170 }}
            />
          </label>
          <button type="submit" className="btn btn-sm">
            Szukaj
          </button>
        </form>
      </div>

      {lessons.length === 0 ? (
        <div className="empty">
          <h3>Twoja pierwsza tablica czeka</h3>
          <p>
            {search
              ? "Nic nie znaleźliśmy. Spróbuj innego hasła."
              : "Wybierz gotowy temat powyżej albo wpisz własne pytanie. Lekcja rysuje się i opowiada jednocześnie."}
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const items = lessons.filter((item) => groupLabel(item.row.created_at) === group);
          if (!items.length) return null;
          return (
            <section key={group} className="stack" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <h3 style={{ fontSize: 15, fontFamily: "var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
                  {group}
                </h3>
                <span className="divider" style={{ flex: 1 }} />
              </div>
              <div className="board-grid">
                {items.map(({ row, lesson }) => (
                  <Link key={row.id} href={`/whiteboard/${row.id}`} className="board-card">
                    <div className="board-thumb">{lesson?.emoji ?? "🎨"}</div>
                    <div>
                      <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                        {row.pinned ? <span className="chip chip-gold" style={{ fontSize: 10 }}>Przypięta</span> : null}
                        <span className="small">{lesson?.subjectName ?? "Nauka"}</span>
                      </div>
                      <b style={{ fontSize: 14.5, lineHeight: 1.3, display: "block" }}>{row.title}</b>
                      <p className="small" style={{ marginTop: 4 }}>
                        {row.prompt.length > 64 ? `${row.prompt.slice(0, 62)}…` : row.prompt}
                      </p>
                    </div>
                    <div className="between" style={{ marginTop: "auto" }}>
                      <span className="small">
                        {lesson?.steps.length ?? 0} kroków · {Math.round((lesson?.durationMs ?? 0) / 1000)} s
                      </span>
                      <span className="small">{relative(row.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
