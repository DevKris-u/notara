import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { toggleNoteLikeAction, toggleNoteSaveAction } from "@/lib/actions";
import { NoteEditor } from "@/components/note-editor";
import { Avatar } from "@/components/avatar";
import {
  BookmarkIcon,
  ChevronRight,
  CommunityIcon,
  HeartIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
} from "@/components/icons";
import { plural, relative } from "@/lib/utils";

export const metadata = { title: "Community" };

type NoteRow = {
  id: string;
  title: string;
  slug: string;
  read_minutes: number;
  featured: boolean;
  created_at: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  author_name: string;
  username: string;
  avatar_hue: number;
  subject_name: string | null;
  emoji: string | null;
  tags: string[];
};

type SubjectRow = { slug: string; name: string; emoji: string };

const TABS = [
  { key: "all", label: "Wszystkie" },
  { key: "popular", label: "Najpopularniejsze" },
  { key: "saved", label: "Zapisane" },
  { key: "mine", label: "Moje" },
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;
  const tab = TABS.some((item) => item.key === search.tab) ? search.tab! : "all";
  const term = (search.q ?? "").trim();
  const subject = search.subject ?? "";

  const order = tab === "popular" ? "likes desc, n.created_at desc" : "n.featured desc, n.created_at desc";
  const extra =
    tab === "saved"
      ? "and exists (select 1 from note_saves sv where sv.note_id = n.id and sv.user_id = $1)"
      : tab === "mine"
        ? "and n.author_id = $1"
        : "";

  const [notes, subjects] = await Promise.all([
    q<NoteRow>(
      `select n.id, n.title, n.slug, n.read_minutes, n.featured, n.created_at, n.tags,
              (select count(*)::int from note_likes l where l.note_id = n.id) as likes,
              (select count(*)::int from note_comments c where c.note_id = n.id) as comments,
              exists (select 1 from note_likes l where l.note_id = n.id and l.user_id = $1) as liked,
              exists (select 1 from note_saves s where s.note_id = n.id and s.user_id = $1) as saved,
              p.display_name as author_name, p.username, p.avatar_hue,
              s.name as subject_name, s.emoji
       from notes n
       join profiles p on p.id = n.author_id
       left join subjects s on s.slug = n.subject_slug
       where ($2 = '' or n.title ilike '%' || $2 || '%' or n.body ilike '%' || $2 || '%')
         and ($3 = '' or n.subject_slug = $3)
         ${extra}
       order by ${order} limit 40`,
      [user.id, term, subject],
    ),
    q<SubjectRow>("select slug, name, emoji from subjects order by sort asc"),
  ]);

  const activeSubject = subjects.find((item) => item.slug === subject);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <CommunityIcon width={13} height={13} /> Community
          </div>
          <h1 className="page-title">Notatki od uczniów</h1>
          <p className="page-sub">
            Sprawdzone materiały, które ktoś już poukładał za ciebie. Zapisuj, komentuj i dodawaj własne.
          </p>
        </div>
        <a href="#nowa-notatka" className="btn btn-primary">
          <PlusIcon width={15} height={15} /> Dodaj notatkę
        </a>
      </div>

      <form className="row" style={{ gap: 8, flexWrap: "wrap" }} action="/community">
        <label className="field" style={{ flex: 1, minWidth: 220 }}>
          <span>Szukaj</span>
          <div style={{ position: "relative" }}>
            <SearchIcon
              width={15}
              height={15}
              style={{ position: "absolute", left: 12, top: 13, opacity: 0.5 }}
            />
            <input
              className="input"
              name="q"
              defaultValue={term}
              placeholder="Temat, pojęcie, autor…"
              style={{ paddingLeft: 34 }}
            />
          </div>
        </label>
        <label className="field" style={{ width: 190 }}>
          <span>Przedmiot</span>
          <select className="select" name="subject" defaultValue={subject}>
            <option value="">Wszystkie</option>
            {subjects.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.emoji} {item.name}
              </option>
            ))}
          </select>
        </label>
        {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
        <button type="submit" className="btn" style={{ alignSelf: "flex-end" }}>
          Filtruj
        </button>
      </form>

      <div className="tabs">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/community?tab=${item.key}${subject ? `&subject=${subject}` : ""}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            data-active={tab === item.key ? "true" : "false"}
          >
            {item.label}
          </Link>
        ))}
        {activeSubject ? (
          <Link href="/community" data-active="true">
            {activeSubject.emoji} {activeSubject.name} ✕
          </Link>
        ) : null}
      </div>

      {notes.length ? (
        <div className="grid-2" style={{ gap: 12 }}>
          {notes.map((note) => (
            <article key={note.id} className="card card-hover" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
              <div className="between" style={{ alignItems: "flex-start", gap: 8 }}>
                <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                  {note.featured ? <span className="chip chip-gold">★ wyróżnione</span> : null}
                  {note.subject_name ? (
                    <span className="chip">
                      {note.emoji} {note.subject_name}
                    </span>
                  ) : null}
                </div>
                <span className="small">{note.read_minutes} min</span>
              </div>

              <Link href={`/notes/${note.slug}`} style={{ marginTop: 10 }}>
                <h2 style={{ fontSize: 19, lineHeight: 1.3, margin: 0 }}>{note.title}</h2>
              </Link>

              {note.tags?.length ? (
                <div className="pill-row" style={{ marginTop: 10 }}>
                  {note.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="between" style={{ marginTop: "auto", paddingTop: 14 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Avatar name={note.author_name} hue={note.avatar_hue} size="sm" />
                  <span className="small">
                    {note.author_name}
                    <br />
                    {relative(note.created_at)}
                  </span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <form action={toggleNoteLikeAction}>
                    <input type="hidden" name="note_id" value={note.id} />
                    <input type="hidden" name="slug" value={note.slug} />
                    <button
                      type="submit"
                      className={note.liked ? "btn btn-sm btn-coral" : "btn btn-sm btn-ghost"}
                      title="Polub"
                    >
                      <HeartIcon width={14} height={14} /> {note.likes}
                    </button>
                  </form>
                  <form action={toggleNoteSaveAction}>
                    <input type="hidden" name="note_id" value={note.id} />
                    <input type="hidden" name="slug" value={note.slug} />
                    <button
                      type="submit"
                      className={note.saved ? "btn btn-sm btn-gold" : "btn btn-sm btn-ghost"}
                      title="Zapisz w bibliotece"
                    >
                      <BookmarkIcon width={14} height={14} />
                    </button>
                  </form>
                  <Link href={`/notes/${note.slug}`} className="btn btn-sm btn-ghost" title="Otwórz">
                    <ChevronRight width={14} height={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Nic nie znaleźliśmy</h3>
          <p>
            {term || subject
              ? "Zmień frazę albo wyczyść filtry — może notatka ma inne słowa kluczowe."
              : "Nie ma tu jeszcze notatek. Bądź pierwszą osobą, która podzieli się materiałem."}
          </p>
        </div>
      )}

      <section id="nowa-notatka" className="card" style={{ padding: 20 }}>
        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
          <SparkIcon width={17} height={17} />
          <h2 className="section-title">Dodaj swoją notatkę</h2>
        </div>
        <p className="small" style={{ marginTop: 0 }}>
          Piszesz Markdownem. Najlepsze notatki mają jedną myśl na akapit i konkretny przykład.
        </p>
        <NoteEditor subjects={subjects} />
      </section>

      <p className="footer-note">
        Wspólna nauka: {notes.length} {plural(notes.length, "notatka", "notatki", "notatek")} w tym widoku. Szanuj pracę innych — zawsze można zgłosić problem.
      </p>
    </div>
  );
}
