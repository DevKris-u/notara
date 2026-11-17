import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, parseJson, q } from "@/lib/db";
import { submitQuizAction } from "@/lib/actions";
import { QuizResult, QuizRunner, type RunnerQuestion } from "@/components/quiz-runner";
import { ChevronLeft, ClockIcon, PracticeIcon, TrophyIcon } from "@/components/icons";
import { relative } from "@/lib/utils";

type QuizRow = {
  id: string;
  title: string;
  subject_slug: string | null;
  topic: string;
  questions: unknown;
  created_at: string;
};

type AttemptRow = {
  id: string;
  score: number;
  total: number;
  answers: unknown;
  created_at: string;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await one<{ title: string }>("select title from quizzes where id = $1", [id]);
  return { title: quiz?.title ?? "Quiz" };
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string; retry?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const search = await searchParams;

  const quiz = await one<QuizRow>(
    "select id, title, subject_slug, topic, questions, created_at from quizzes where id = $1 and user_id = $2",
    [id, user.id],
  );
  if (!quiz) notFound();

  const questions = parseJson<RunnerQuestion[]>(quiz.questions) ?? [];
  if (!questions.length) notFound();

  const attempts = await q<AttemptRow>(
    "select id, score, total, answers, created_at from quiz_attempts where quiz_id = $1 order by created_at desc limit 8",
    [quiz.id],
  );

  const attempt = search.attempt ? attempts.find((row) => row.id === search.attempt) : null;
  const answers = attempt ? (parseJson<number[]>(attempt.answers) ?? []) : [];
  const best = attempts.reduce<AttemptRow | null>(
    (top, row) => (!top || row.score > top.score ? row : top),
    null,
  );

  return (
    <div className="page">
      <div className="between">
        <Link href="/practice" className="btn btn-sm btn-ghost">
          <ChevronLeft width={15} height={15} /> Ćwiczenia
        </Link>
        <div className="row" style={{ gap: 6 }}>
          {best ? (
            <span className="chip chip-gold">
              <TrophyIcon width={12} height={12} /> Najlepiej {best.score}/{best.total}
            </span>
          ) : null}
          <span className="chip">
            <PracticeIcon width={12} height={12} /> {questions.length} pytań
          </span>
        </div>
      </div>

      {attempt ? (
        <QuizResult questions={questions} answers={answers} title={quiz.title} quizId={quiz.id} />
      ) : (
        <>
          <header className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">
              <PracticeIcon width={13} height={13} /> Quiz
            </span>
            <h1 className="page-title">{quiz.title}</h1>
            <p className="page-sub">
              Wybierz odpowiedź i przechodź dalej. Na końcu zobaczysz wyjaśnienia do każdego pytania.
            </p>
          </header>

          <QuizRunner quizId={quiz.id} title={quiz.title} questions={questions} action={submitQuizAction} />

          {attempts.length ? (
            <section className="card-soft">
              <div className="between" style={{ marginBottom: 8 }}>
                <span className="label">Historia podejść</span>
                <span className="small">{attempts.length} zapisanych</span>
              </div>
              <div className="stack" style={{ gap: 2 }}>
                {attempts.map((row) => (
                  <div key={row.id} className="list-row">
                    <span className={row.score / row.total >= 0.8 ? "chip chip-green" : "chip"}>
                      {row.score}/{row.total}
                    </span>
                    <span className="small" style={{ flex: 1 }}>
                      <ClockIcon width={12} height={12} /> {relative(row.created_at)}
                    </span>
                    <Link href={`/practice/quiz/${quiz.id}?attempt=${row.id}`} className="small" style={{ fontWeight: 700 }}>
                      Zobacz
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
