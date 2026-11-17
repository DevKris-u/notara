import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { acceptAnswerAction, answerQuestionAction, reportAction, voteAnswerAction } from "@/lib/actions";
import { Avatar } from "@/components/avatar";
import { CheckIcon, ChevronLeft, ChatIcon, SparkIcon, TrophyIcon } from "@/components/icons";
import { formatDate, relative } from "@/lib/utils";

type QuestionRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  resolved: boolean;
  created_at: string;
  author_name: string;
  avatar_hue: number;
  subject_name: string | null;
  emoji: string | null;
};

type AnswerRow = {
  id: string;
  body: string;
  votes: number;
  accepted: boolean;
  created_at: string;
  author_id: string;
  author_name: string;
  avatar_hue: number;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await one<{ title: string }>("select title from questions where id = $1", [id]);
  return { title: question?.title ?? "Pytanie" };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const question = await one<QuestionRow>(
    `select q.id, q.author_id, q.title, q.body, q.resolved, q.created_at,
            p.display_name as author_name, p.avatar_hue,
            s.name as subject_name, s.emoji
     from questions q
     join profiles p on p.id = q.author_id
     left join subjects s on s.slug = q.subject_slug
     where q.id = $1`,
    [id],
  );
  if (!question) notFound();

  const answers = await q<AnswerRow>(
    `select a.id, a.body, a.votes, a.accepted, a.created_at, a.author_id,
            p.display_name as author_name, p.avatar_hue
     from answers a join profiles p on p.id = a.author_id
     where a.question_id = $1
     order by a.accepted desc, a.votes desc, a.created_at asc`,
    [question.id],
  );

  const isAuthor = question.author_id === user.id;

  return (
    <div className="page">
      <div className="between">
        <Link href="/questions" className="btn btn-sm btn-ghost">
          <ChevronLeft width={15} height={15} /> Pytania
        </Link>
        <div className="row" style={{ gap: 6 }}>
          {question.resolved ? (
            <span className="chip chip-green">
              <CheckIcon width={12} height={12} /> rozwiązane
            </span>
          ) : (
            <span className="chip chip-coral">otwarte</span>
          )}
          {question.subject_name ? (
            <span className="chip">
              {question.emoji} {question.subject_name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="two-col">
        <div className="stack" style={{ gap: 14 }}>
          <header className="card" style={{ padding: 20 }}>
            <h1 className="page-title" style={{ fontSize: 28 }}>
              {question.title}
            </h1>
            {question.body ? (
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.65, margin: "10px 0 0" }}>
                {question.body}
              </p>
            ) : null}
            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <Avatar name={question.author_name} hue={question.avatar_hue} size="sm" />
              <span className="small">
                {question.author_name} · {formatDate(question.created_at)}
              </span>
            </div>
          </header>

          <div className="between">
            <h2 className="section-title">
              {answers.length} {answers.length === 1 ? "odpowiedź" : "odpowiedzi"}
            </h2>
            <span className="small">Głosuj na najbardziej pomocną</span>
          </div>

          {answers.length ? (
            answers.map((answer) => (
              <article key={answer.id} className="answer-card" data-accepted={answer.accepted ? "true" : "false"}>
                <div className="between" style={{ alignItems: "flex-start", gap: 10 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Avatar name={answer.author_name} hue={answer.avatar_hue} size="sm" />
                    <span className="small">
                      <b style={{ color: "var(--ink)" }}>{answer.author_name}</b>
                      <br />
                      {relative(answer.created_at)}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    {answer.accepted ? (
                      <span className="chip chip-green">
                        <CheckIcon width={12} height={12} /> zaakceptowana
                      </span>
                    ) : null}
                    <span className={answer.votes > 0 ? "chip chip-gold" : "chip"}>
                      <TrophyIcon width={12} height={12} /> {answer.votes}
                    </span>
                  </div>
                </div>

                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, margin: "12px 0 0", whiteSpace: "pre-wrap" }}>
                  {answer.body}
                </p>

                <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  <form action={voteAnswerAction}>
                    <input type="hidden" name="answer_id" value={answer.id} />
                    <input type="hidden" name="value" value="1" />
                    <button type="submit" className="btn btn-sm">
                      + Pomocne
                    </button>
                  </form>
                  <form action={voteAnswerAction}>
                    <input type="hidden" name="answer_id" value={answer.id} />
                    <input type="hidden" name="value" value="-1" />
                    <button type="submit" className="btn btn-sm btn-ghost">
                      −
                    </button>
                  </form>
                  {isAuthor && !answer.accepted ? (
                    <form action={acceptAnswerAction}>
                      <input type="hidden" name="answer_id" value={answer.id} />
                      <button type="submit" className="btn btn-sm btn-gold">
                        <CheckIcon width={13} height={13} /> Akceptuj odpowiedź
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty">
              <h3>Jeszcze nikt nie odpowiedział</h3>
              <p>Może to twoja szansa? Odpowiedź daje 20 XP, a zaakceptowana — 40 XP.</p>
            </div>
          )}

          <section className="card">
            <h2 className="section-title">Twoja odpowiedź</h2>
            <form action={answerQuestionAction} className="stack" style={{ gap: 10 }}>
              <input type="hidden" name="question_id" value={question.id} />
              <textarea
                className="textarea"
                name="body"
                rows={5}
                placeholder="Wyjaśnij krok po kroku. Jeśli to możliwe, podaj przykład."
                required
                minLength={10}
              />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                <ChatIcon width={15} height={15} /> Opublikuj odpowiedź
              </button>
            </form>
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card-soft">
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <SparkIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 17 }}>
                Nie czekaj bezczynnie
              </h2>
            </div>
            <p className="small" style={{ marginTop: 0 }}>
              Asystent AI odpowie od razu, a tablica rozrysuje temat krok po kroku.
            </p>
            <div className="stack" style={{ gap: 8, marginTop: 8 }}>
              <Link href="/chat" className="btn btn-sm btn-primary">
                Zapytaj AI
              </Link>
              <Link href={`/whiteboard?q=${encodeURIComponent(question.title)}`} className="btn btn-sm">
                Rozrysuj na tablicy
              </Link>
            </div>
          </section>

          <details className="card-soft">
            <summary className="small" style={{ cursor: "pointer", fontWeight: 700 }}>
              Zgłoś pytanie
            </summary>
            <form action={reportAction} className="stack" style={{ gap: 8, marginTop: 10 }}>
              <input type="hidden" name="target_kind" value="question" />
              <input type="hidden" name="target_id" value={question.id} />
              <textarea className="textarea" name="reason" rows={2} placeholder="Co jest nie tak?" required />
              <button type="submit" className="btn btn-sm">
                Wyślij zgłoszenie
              </button>
            </form>
          </details>
        </aside>
      </div>
    </div>
  );
}
