import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import {
  createFlashcardSetAction,
  createMockExamAction,
  createQuizAction,
  deleteQuizAction,
} from "@/lib/actions";
import {
  ArrowIcon,
  CheckIcon,
  ChevronRight,
  ClockIcon,
  PracticeIcon,
  SparkIcon,
  TrashIcon,
  TrophyIcon,
} from "@/components/icons";
import { relative } from "@/lib/utils";

export const metadata = { title: "Ćwiczenia" };

type QuizRow = {
  id: string;
  title: string;
  topic: string;
  created_at: string;
  attempts: number;
  best: number | null;
  total: number | null;
};

type SetRow = {
  id: string;
  title: string;
  created_at: string;
  cards: number;
  due: number;
};

const TOPIC_TILES = [
  { label: "Funkcja kwadratowa", emoji: "📐", query: "funkcja kwadratowa" },
  { label: "Fotosynteza", emoji: "🌿", query: "fotosynteza" },
  { label: "Dynamika", emoji: "🚀", query: "dynamika" },
  { label: "Budowa atomu", emoji: "⚛️", query: "budowa atomu" },
  { label: "Prawdopodobieństwo", emoji: "🎲", query: "prawdopodobieństwo" },
  { label: "Prąd elektryczny", emoji: "🔌", query: "prąd elektryczny" },
];

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; flashcards?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;
  const preset = search.topic ?? search.flashcards ?? "";

  const [quizzes, sets, attemptsCount] = await Promise.all([
    q<QuizRow>(
      `select z.id, z.title, z.topic, z.created_at,
              (select count(*)::int from quiz_attempts a where a.quiz_id = z.id) as attempts,
              (select max(a.score) from quiz_attempts a where a.quiz_id = z.id) as best,
              (select max(a.total) from quiz_attempts a where a.quiz_id = z.id) as total
       from quizzes z where z.user_id = $1 order by z.created_at desc limit 20`,
      [user.id],
    ),
    q<SetRow>(
      `select s.id, s.title, s.created_at,
              (select count(*)::int from flashcards c where c.set_id = s.id) as cards,
              (select count(*)::int from flashcards c where c.set_id = s.id and c.due_at <= now()) as due
       from flashcard_sets s where s.user_id = $1 order by s.created_at desc limit 20`,
      [user.id],
    ),
    q<{ n: number }>("select count(*)::int as n from quiz_attempts where user_id = $1", [user.id]),
  ]);

  const totalAttempts = attemptsCount[0]?.n ?? 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <PracticeIcon width={13} height={13} /> Ćwiczenia
          </div>
          <h1 className="page-title">Sprawdź, co naprawdę umiesz</h1>
          <p className="page-sub">
            Quizy, fiszki i egzamin próbny z tematów, które omawiasz na tablicy. Każda odpowiedź to punkty XP.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="chip">
            <TrophyIcon width={13} height={13} /> {totalAttempts} {totalAttempts === 1 ? "podejście" : "podejść"}
          </span>
          <form action={createMockExamAction}>
            <button type="submit" className="btn btn-gold">
              <SparkIcon width={15} height={15} /> Egzamin próbny
            </button>
          </form>
        </div>
      </div>

      <section className="grid-2" style={{ gap: 14 }}>
        <div className="card">
          <h2 className="section-title">Quiz z tematu</h2>
          <p className="small" style={{ marginTop: 0 }}>
            Pięć pytań z wyjaśnieniami. Wynik zapisuje się w historii podejść.
          </p>
          <form action={createQuizAction} className="stack" style={{ gap: 10 }}>
            <input
              className="input"
              name="topic"
              defaultValue={preset}
              placeholder="Np. funkcja kwadratowa, fotosynteza…"
              required
            />
            <button type="submit" className="btn btn-primary">
              <PracticeIcon width={15} height={15} /> Zrób quiz
            </button>
          </form>
          <div className="pill-row" style={{ marginTop: 10 }}>
            {TOPIC_TILES.slice(0, 3).map((tile) => (
              <Link key={tile.query} href={`/practice?topic=${encodeURIComponent(tile.query)}`} className="chip">
                {tile.emoji} {tile.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Fiszki</h2>
          <p className="small" style={{ marginTop: 0 }}>
            Powtórki w systemie pudełek: trudne karty wracają szybciej.
          </p>
          <form action={createFlashcardSetAction} className="stack" style={{ gap: 10 }}>
            <input
              className="input"
              name="topic"
              defaultValue={search.flashcards ?? ""}
              placeholder="Np. fotosynteza, budowa atomu…"
              required
            />
            <button type="submit" className="btn btn-primary">
              <SparkIcon width={15} height={15} /> Zrób fiszki
            </button>
          </form>
          <div className="pill-row" style={{ marginTop: 10 }}>
            {TOPIC_TILES.slice(3).map((tile) => (
              <Link key={tile.query} href={`/practice?flashcards=${encodeURIComponent(tile.query)}`} className="chip">
                {tile.emoji} {tile.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <div className="between">
          <h2 className="section-title">Twoje quizy</h2>
          <span className="small">{quizzes.length} zapisanych</span>
        </div>
        {quizzes.length ? (
          <div className="grid-2" style={{ gap: 10 }}>
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card-soft card-hover" style={{ padding: 14 }}>
                <div className="between" style={{ alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontSize: 15 }}>{quiz.title}</b>
                    <p className="small" style={{ margin: "4px 0 0" }}>
                      {quiz.attempts
                        ? `${quiz.attempts} ${quiz.attempts === 1 ? "podejście" : "podejścia"} · najlepiej ${quiz.best}/${quiz.total}`
                        : "jeszcze nie rozwiązywany"}
                    </p>
                  </div>
                  <span className="chip">{relative(quiz.created_at)}</span>
                </div>
                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                  <Link href={`/practice/quiz/${quiz.id}`} className="btn btn-sm btn-primary">
                    {quiz.attempts ? "Spróbuj ponownie" : "Rozwiąż"} <ArrowIcon width={13} height={13} />
                  </Link>
                  <form action={deleteQuizAction}>
                    <input type="hidden" name="quiz_id" value={quiz.id} />
                    <button type="submit" className="btn btn-sm btn-ghost" title="Usuń quiz">
                      <TrashIcon width={14} height={14} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Nie masz jeszcze quizów</h3>
            <p>Wybierz temat powyżej albo wejdź na tablicę i kliknij „Zrób quiz z tego tematu”.</p>
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 10 }}>
        <div className="between">
          <h2 className="section-title">Twoje zestawy fiszek</h2>
          <span className="small">{sets.length} zestawów</span>
        </div>
        {sets.length ? (
          <div className="grid-3" style={{ gap: 10 }}>
            {sets.map((set) => (
              <Link key={set.id} href={`/practice/flashcards/${set.id}`} className="card-soft card-hover">
                <div className="between">
                  <span className="chip chip-gold">{set.cards} kart</span>
                  {set.due > 0 ? <span className="chip chip-coral">{set.due} do powtórki</span> : <span className="chip chip-green">na dziś zaliczone</span>}
                </div>
                <b style={{ fontSize: 15, display: "block", marginTop: 10 }}>{set.title}</b>
                <div className="between" style={{ marginTop: 10 }}>
                  <span className="small">
                    <ClockIcon width={12} height={12} /> {relative(set.created_at)}
                  </span>
                  <ChevronRight width={15} height={15} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Brak zestawów fiszek</h3>
            <p>Fiszki świetnie działają na pojęcia i definicje. Zacznij od jednego tematu.</p>
          </div>
        )}
      </section>

      <p className="footer-note">
        <CheckIcon width={12} height={12} /> Wyniki i fiszki zapisują się lokalnie w bazie Notary.
      </p>
    </div>
  );
}
