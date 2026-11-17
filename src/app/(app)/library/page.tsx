import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import {
  createFolderAction,
  deleteFolderAction,
  deleteUploadAction,
  updateUploadSummaryAction,
  uploadAction,
} from "@/lib/actions";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronRight,
  LibraryIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/icons";
import { relative, truncate } from "@/lib/utils";

export const metadata = { title: "Biblioteka" };

type UploadRow = {
  id: string;
  filename: string;
  mime: string;
  bytes: number;
  summary: string;
  subject_slug: string | null;
  folder_id: string | null;
  folder_name: string | null;
  created_at: string;
};

type FolderRow = { id: string; name: string; files: number; created_at: string };

type SavedRow = {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  saved_at: string;
};

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileEmoji(mime: string, filename: string): string {
  if (/pdf/i.test(mime) || /\.pdf$/i.test(filename)) return "📕";
  if (/^image\//.test(mime)) return "🖼️";
  if (/word|\.docx?$/i.test(mime + filename)) return "📄";
  if (/sheet|csv|\.xlsx?$/i.test(mime + filename)) return "📊";
  return "📝";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; folder?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;

  const [uploads, folders, saved] = await Promise.all([
    q<UploadRow>(
      `select u.id, u.filename, u.mime, u.bytes, u.summary, u.subject_slug, u.folder_id,
              f.name as folder_name, u.created_at
       from uploads u left join folders f on f.id = u.folder_id
       where u.user_id = $1 ${search.folder ? "and u.folder_id = $2" : ""}
       order by u.created_at desc limit 50`,
      search.folder ? [user.id, search.folder] : [user.id],
    ),
    q<FolderRow>(
      `select f.id, f.name, f.created_at,
              (select count(*)::int from uploads u where u.folder_id = f.id) as files
       from folders f where f.user_id = $1 order by f.created_at asc`,
      [user.id],
    ),
    q<SavedRow>(
      `select n.id, n.title, n.slug, p.display_name as author_name, s.created_at as saved_at
       from note_saves s
       join notes n on n.id = s.note_id
       join profiles p on p.id = n.author_id
       where s.user_id = $1 order by s.created_at desc limit 10`,
      [user.id],
    ),
  ]);

  const totalBytes = uploads.reduce((sum, file) => sum + file.bytes, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <LibraryIcon width={13} height={13} /> Biblioteka
          </div>
          <h1 className="page-title">Twoje materiały w jednym miejscu</h1>
          <p className="page-sub">
            Wrzuć notatki ze zdjęcia albo pliku — dostaniesz streszczenie i tag przedmiotu. Duże pliki trzymaj w folderach.
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip">{uploads.length} plików</span>
          <span className="chip">{fileSize(totalBytes)}</span>
        </div>
      </div>

      {search.error === "size" ? (
        <div className="card-soft" style={{ borderColor: "var(--coral)" }}>
          <b style={{ fontSize: 14 }}>Plik jest za duży.</b>
          <p className="small" style={{ margin: "4px 0 0" }}>
            Limit to 8 MB. Podziel materiał na mniejsze części albo wklej najważniejszy fragment jako tekst.
          </p>
        </div>
      ) : null}

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 4 }}>
              <UploadIcon width={17} height={17} />
              <h2 className="section-title">Dodaj materiał</h2>
            </div>
            <p className="small" style={{ marginTop: 0 }}>
              Obsługujemy tekst, Markdown, CSV, JSON i zdjęcia. Dla plików binarnych dodaj własny opis.
            </p>
            <form action={uploadAction} className="stack" style={{ gap: 10 }} encType="multipart/form-data">
              <input className="input" type="file" name="file" accept=".txt,.md,.csv,.json,.pdf,image/*" required />
              <div className="row" style={{ gap: 8 }}>
                <select className="select" name="folder_id" defaultValue={search.folder ?? ""} style={{ flex: 1 }}>
                  <option value="">Bez folderu</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  <UploadIcon width={15} height={15} /> Wgraj i streść
                </button>
              </div>
            </form>
          </section>

          <section className="stack" style={{ gap: 10 }}>
            <div className="between">
              <h2 className="section-title">
                Pliki {search.folder ? `w folderze „${folders.find((f) => f.id === search.folder)?.name ?? "?"}”` : ""}
              </h2>
              {search.folder ? (
                <Link href="/library" className="small" style={{ fontWeight: 700 }}>
                  Pokaż wszystkie
                </Link>
              ) : null}
            </div>

            {uploads.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {uploads.map((file) => (
                  <article key={file.id} className="card" style={{ padding: 16 }}>
                    <div className="between" style={{ alignItems: "flex-start" }}>
                      <div className="row" style={{ gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                        <span style={{ fontSize: 24 }}>{fileEmoji(file.mime, file.filename)}</span>
                        <div style={{ minWidth: 0 }}>
                          <b style={{ fontSize: 14.5, display: "block", wordBreak: "break-word" }}>
                            {file.filename}
                          </b>
                          <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            <span className="chip">{fileSize(file.bytes)}</span>
                            {file.folder_name ? <span className="chip chip-gold">{file.folder_name}</span> : null}
                            {file.subject_slug ? <span className="chip">{file.subject_slug}</span> : null}
                            <span className="small">{relative(file.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <form action={deleteUploadAction}>
                        <input type="hidden" name="upload_id" value={file.id} />
                        <button type="submit" className="btn btn-sm btn-ghost" title="Usuń plik">
                          <TrashIcon width={14} height={14} />
                        </button>
                      </form>
                    </div>

                    <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: "10px 0 0" }}>
                      {file.summary || "Brak streszczenia. Dodaj własny opis poniżej."}
                    </p>

                    <details style={{ marginTop: 10 }}>
                      <summary className="small" style={{ cursor: "pointer", fontWeight: 700 }}>
                        Popraw streszczenie
                      </summary>
                      <form action={updateUploadSummaryAction} className="stack" style={{ gap: 8, marginTop: 8 }}>
                        <input type="hidden" name="upload_id" value={file.id} />
                        <textarea className="textarea" name="summary" rows={3} defaultValue={file.summary} />
                        <button type="submit" className="btn btn-sm">
                          <CheckIcon width={14} height={14} /> Zapisz opis
                        </button>
                      </form>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <h3>Tu jeszcze nic nie ma</h3>
                <p>Wgraj pierwszy plik albo zdjęcie notatki. Streszczenie pojawi się automatycznie.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card-soft">
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <LibraryIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 18 }}>
                Foldery
              </h2>
            </div>
            <form action={createFolderAction} className="row" style={{ gap: 6, marginBottom: 10 }}>
              <input className="input" name="name" placeholder="Nazwa folderu" required />
              <button type="submit" className="btn btn-sm btn-primary" title="Utwórz folder">
                <PlusIcon width={14} height={14} />
              </button>
            </form>
            <div className="stack" style={{ gap: 2 }}>
              {folders.length ? (
                folders.map((folder) => (
                  <div key={folder.id} className="list-row">
                    <Link
                      href={`/library?folder=${folder.id}`}
                      style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14 }}
                    >
                      📁 {folder.name}
                    </Link>
                    <span className="small">{folder.files} plik.</span>
                    <form action={deleteFolderAction}>
                      <input type="hidden" name="folder_id" value={folder.id} />
                      <button type="submit" className="btn btn-sm btn-ghost" title="Usuń folder">
                        <TrashIcon width={13} height={13} />
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  Foldery pomagają rozdzielić przedmioty albo semestry.
                </p>
              )}
            </div>
          </section>

          <section className="card-soft">
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <BookmarkIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 18 }}>
                Zapisane notatki
              </h2>
            </div>
            {saved.length ? (
              <div className="stack" style={{ gap: 2 }}>
                {saved.map((note) => (
                  <Link key={note.id} href={`/notes/${note.slug}`} className="list-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13.5, display: "block" }}>{truncate(note.title, 46)}</b>
                      <span className="small">
                        {note.author_name} · {relative(note.saved_at)}
                      </span>
                    </div>
                    <ChevronRight width={14} height={14} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                Zapisuj notatki z Community, żeby wracały tutaj przed sprawdzianem.
              </p>
            )}
            <Link href="/community" className="btn btn-sm" style={{ marginTop: 10, width: "100%" }}>
              <SparkIcon width={14} height={14} /> Przeglądaj Community
            </Link>
          </section>

          <p className="footer-note">
            Pliki zostają na tym komputerze. Notara nie wysyła ich do zewnętrznych usług.
          </p>
        </aside>
      </div>
    </div>
  );
}
