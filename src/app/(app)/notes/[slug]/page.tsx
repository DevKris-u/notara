import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, parseJson, q } from "@/lib/db";
import {
  addNoteCommentAction,
  deleteNoteAction,
  reportAction,
  toggleNoteLikeAction,
  toggleNoteSaveAction,
} from "@/lib/actions";
import { Markdown } from "@/components/markdown";
import { Avatar } from "@/components/avatar";
import {
  BookmarkIcon,
  ChevronLeft,
  CommunityIcon,
  HeartIcon,
  SparkIcon,
  TrashIcon,
} from "@/components/icons";
import { formatDate, relative } from "@/lib/utils";

type NoteRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  subject_slug: string | null;
  body: string;
  tags: unknown;
  read_minutes: number;
  created_at: string;
  author_name: string;
  username: string;
  avatar_hue: number;
  author_bio: string;
  subject_name: string | null;
  emoji: string | null;
  likes: number;
  liked: boolean;
  saved: boolean;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  avatar_hue: number;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await one<{ title: string; body: string }>("select title, body from notes where slug = $1", [slug]);
  return {
    title: note?.title ?? "Notatka",
    description: note?.body.slice(0, 150),
  };
}

function tagList(value: unknown): string[] {
  const parsed = parseJson<string[]>(value);
  return Array.isArray(parsed) ? parsed : [];
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;

  const note = await one<NoteRow>(
    `select n.id, n.author_id, n.title, n.slug, n.subject_slug, n.body, n.tags, n.read_minutes, n.created_at,
            p.display_name as author_name, p.username, p.avatar_hue, p.bio as author_bio,
            s.name as subject_name, s.emoji,
            (select count(*)::int from note_likes l where l.note_id = n.id) as likes,
            exists (select 1 from note_likes l where l.note_id = n.id and l.user_id = $2) as liked,
            exists (select 1 from note_saves sv where sv.note_id = n.id and sv.user_id = $2) as saved
     from notes n
     join profiles p on p.id = n.author_id
     left join subjects s on s.slug = n.subject_slug
     where n.slug = $1`,
    [slug, user.id],
  );
  if (!note) notFound();

  const [comments, related] = await Promise.all([
    q<CommentRow>(
      `select c.id, c.body, c.created_at, p.display_name as author_name, p.avatar_hue
       from note_comments c join profiles p on p.id = c.author_id
       where c.note_id = $1 order by c.created_at asc`,
      [note.id],
    ),
    q<{ id: string; title: string; slug: string; read_minutes: number; author_name: string }>(
      `select n.id, n.title, n.slug, n.read_minutes, p.display_name as author_name
       from notes n join profiles p on p.id = n.author_id
       where n.id <> $1 and ($2 = '' or n.subject_slug = $2)
       order by n.featured desc, n.created_at desc limit 4`,
      [note.id, note.subject_slug ?? ""],
    ),
  ]);

  const tags = tagList(note.tags);

  return (
    <div className="page">
      <div className="between">
        <Link href="/community" className="btn btn-sm btn-ghost">
          <ChevronLeft width={15} height={15} /> Community
        </Link>
        <div className="row" style={{ gap: 6 }}>
          {note.subject_name ? (
            <span className="chip">
              {note.emoji} {note.subject_name}
            </span>
          ) : null}
          <span className="chip">{note.read_minutes} min czytania</span>
        </div>
      </div>

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <header className="stack" style={{ gap: 10 }}>
            <h1 className="page-title">{note.title}</h1>
            <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
              <Avatar name={note.author_name} hue={note.avatar_hue} />
              <span className="small">
                <b style={{ color: "var(--ink)" }}>{note.author_name}</b> · @{note.username}
                <br />
                {formatDate(note.created_at)}
              </span>
            </div>
            {tags.length ? (
              <div className="pill-row">
                {tags.map((tag) => (
                  <Link key={tag} href={`/community?q=${encodeURIComponent(tag)}`} className="chip">
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <article className="card prose-note" style={{ padding: 24 }}>
            <Markdown text={note.body} />
          </article>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <form action={toggleNoteLikeAction}>
              <input type="hidden" name="note_id" value={note.id} />
              <input type="hidden" name="slug" value={note.slug} />
              <button type="submit" className={note.liked ? "btn btn-coral" : "btn"}>
                <HeartIcon width={15} height={15} /> {note.liked ? "Lubisz to" : "Polub"} · {note.likes}
              </button>
            </form>
            <form action={toggleNoteSaveAction}>
              <input type="hidden" name="note_id" value={note.id} />
              <input type="hidden" name="slug" value={note.slug} />
              <button type="submit" className={note.saved ? "btn btn-gold" : "btn"}>
                <BookmarkIcon width={15} height={15} /> {note.saved ? "Zapisana" : "Zapisz"}
              </button>
            </form>
            <Link href={`/whiteboard?q=${encodeURIComponent(note.title)}`} className="btn">
              <SparkIcon width={15} height={15} /> Rozrysuj temat
            </Link>
            {note.author_id === user.id ? (
              <form action={deleteNoteAction}>
                <input type="hidden" name="note_id" value={note.id} />
                <button type="submit" className="btn btn-ghost">
                  <TrashIcon width={15} height={15} /> Usuń notatkę
                </button>
              </form>
            ) : null}
          </div>

          <section className="card">
            <h2 className="section-title">Komentarze ({comments.length})</h2>
            <form action={addNoteCommentAction} className="stack" style={{ gap: 8, marginBottom: 14 }}>
              <input type="hidden" name="note_id" value={note.id} />
              <input type="hidden" name="slug" value={note.slug} />
              <textarea
                className="textarea"
                name="body"
                rows={2}
                placeholder="Dopisz coś od siebie — pytanie, poprawkę albo podziękowanie."
                required
              />
              <button type="submit" className="btn btn-sm" style={{ alignSelf: "flex-end" }}>
                Dodaj komentarz
              </button>
            </form>

            {comments.length ? (
              <div className="stack" style={{ gap: 12 }}>
                {comments.map((comment) => (
                  <div key={comment.id} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                    <Avatar name={comment.author_name} hue={comment.avatar_hue} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <b style={{ fontSize: 13.5 }}>{comment.author_name}</b>
                        <span className="small">{relative(comment.created_at)}</span>
                      </div>
                      <p className="muted" style={{ margin: "3px 0 0", fontSize: 14, lineHeight: 1.55 }}>
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                Nikt jeszcze nie skomentował. Bądź pierwszy.
              </p>
            )}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card-soft">
            <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
              <Avatar name={note.author_name} hue={note.avatar_hue} size="lg" />
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 15 }}>{note.author_name}</b>
                <p className="small" style={{ margin: "2px 0 0" }}>
                  @{note.username}
                </p>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13.5, margin: "10px 0 0", lineHeight: 1.55 }}>
              {note.author_bio || "Uczy się i dzieli notatkami. Zajrzyj do innych materiałów tej osoby."}
            </p>
            <Link href={`/community?q=${encodeURIComponent(note.author_name)}`} className="btn btn-sm btn-ghost" style={{ marginTop: 10 }}>
              <CommunityIcon width={14} height={14} /> Więcej od autora
            </Link>
          </section>

          <section className="card-soft">
            <h2 className="section-title" style={{ fontSize: 17 }}>
              Podobne notatki
            </h2>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              {related.length ? (
                related.map((item) => (
                  <Link key={item.id} href={`/notes/${item.slug}`} className="list-row">
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13.5, display: "block" }}>{item.title}</b>
                      <span className="small">
                        {item.author_name} · {item.read_minutes} min
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  To jedyna notatka z tego przedmiotu.
                </p>
              )}
            </div>
          </section>

          <details className="card-soft">
            <summary className="small" style={{ cursor: "pointer", fontWeight: 700 }}>
              Zgłoś problem z notatką
            </summary>
            <form action={reportAction} className="stack" style={{ gap: 8, marginTop: 10 }}>
              <input type="hidden" name="target_kind" value="note" />
              <input type="hidden" name="target_id" value={note.id} />
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
