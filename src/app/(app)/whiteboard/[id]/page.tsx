import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, parseJson, q } from "@/lib/db";
import { deleteBoardAction, togglePinBoardAction } from "@/lib/actions";
import type { Lesson } from "@/lib/lesson/types";
import { BoardPlayer } from "@/components/board-player";
import { FollowUpBox } from "@/components/follow-up-box";
import { LessonRating } from "@/components/lesson-rating";
import { ChevronLeft, CheckIcon, ClockIcon, SparkIcon, TrashIcon, TargetIcon } from "@/components/icons";
import { formatDate, relative } from "@/lib/utils";

type BoardRow = {
  id: string;
  title: string;
  prompt: string;
  subject_slug: string | null;
  lesson: unknown;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await one<{ title: string }>("select title from boards where id = $1", [id]);
  return { title: board?.title ?? "Tablica" };
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const search = await searchParams;

  const board = await one<BoardRow>(
    `select id, title, prompt, subject_slug, lesson, pinned, created_at, updated_at
     from boards where id = $1 and user_id = $2`,
    [id, user.id],
  );
  if (!board) notFound();

  const lesson = parseJson<Lesson>(board.lesson);
  if (!lesson || !Array.isArray(lesson.steps) || !lesson.steps.length) notFound();

  const messages = await q<{ id: string; role: string; content: string; created_at: string }>(
    "select id, role, content, created_at from board_messages where board_id = $1 order by created_at asc",
    [board.id],
  );

  const initialStep = Math.max(0, Math.min(lesson.steps.length - 1, Number(search.step ?? "0") || 0));
  const template = encodeURIComponent(lesson.title);

  return (
    <div className="page">
      <div className="between">
        <Link href="/whiteboard" className="btn btn-sm btn-ghost">
          <ChevronLeft width={15} height={15} /> Wszystkie tablice
        </Link>
        <div className="row" style={{ gap: 6 }}>
          <form action={togglePinBoardAction}>
            <input type="hidden" name="board_id" value={board.id} />
            <button type="submit" className="btn btn-sm">
              <TargetIcon width={14} height={14} /> {board.pinned ? "Odepnij" : "Przypnij"}
            </button>
          </form>
          <form action={deleteBoardAction}>
            <input type="hidden" name="board_id" value={board.id} />
            <button type="submit" className="btn btn-sm btn-coral">
              <TrashIcon width={14} height={14} /> Usuń
            </button>
          </form>
        </div>
      </div>

      <header className="stack" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="chip chip-gold">
            {lesson.emoji} {lesson.subjectName}
          </span>
          <span className="chip">{lesson.steps.length} kroków</span>
          <span className="chip">
            <ClockIcon width={13} height={13} /> {Math.max(1, Math.round(lesson.durationMs / 60000))} min
          </span>
          <span className="small">{relative(board.created_at)}</span>
        </div>
        <h1 className="page-title">{lesson.title}</h1>
        <p className="page-sub">{lesson.subtitle}</p>
      </header>

      <BoardPlayer lesson={lesson} initialStep={initialStep} />

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <CheckIcon width={17} height={17} />
              <h2 className="section-title">Co zapamiętać</h2>
            </div>
            <ul className="stack" style={{ gap: 8, margin: 0, paddingLeft: 20 }}>
              {lesson.takeaways.map((item) => (
                <li key={item} className="muted" style={{ fontSize: 14.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              <SparkIcon width={17} height={17} />
              <h2 className="section-title">Dopytaj</h2>
            </div>
            <FollowUpBox boardId={board.id} suggestions={lesson.followUps} />

            {messages.length ? (
              <>
                <div className="divider" style={{ margin: "16px 0 12px" }} />
                <div className="stack" style={{ gap: 8 }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={message.role === "user" ? "bubble" : "bubble"}
                      data-role={message.role}
                      style={{ maxWidth: "100%", alignSelf: message.role === "user" ? "flex-end" : "flex-start" }}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <div className="card-soft">
            <span className="label">Twoje pytanie</span>
            <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
              {board.prompt || lesson.prompt}
            </p>
            <div className="divider" style={{ margin: "12px 0" }} />
            <LessonRating boardId={board.id} />
          </div>

          <div className="card-soft">
            <span className="label">Następny krok</span>
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              <Link href={`/practice?topic=${template}`} className="btn btn-primary btn-sm">
                Zrób quiz z tego tematu
              </Link>
              <Link href={`/practice?flashcards=${template}`} className="btn btn-sm">
                Zrób fiszki
              </Link>
              <Link href={`/whiteboard?q=${encodeURIComponent(lesson.title)}`} className="btn btn-sm">
                Inne tablice z tematem
              </Link>
            </div>
            <p className="small" style={{ marginTop: 10 }}>
              Tablica zapisana {formatDate(board.created_at)}. Możesz do niej wrócić w każdej chwili.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
