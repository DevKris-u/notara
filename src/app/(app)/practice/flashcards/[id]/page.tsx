import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { reviewCardAction } from "@/lib/actions";
import { FlashcardDeck, type DeckCard } from "@/components/flashcard-deck";
import { ChevronLeft, ClockIcon, SparkIcon } from "@/components/icons";
import { relative } from "@/lib/utils";

type SetRow = { id: string; title: string; subject_slug: string | null; created_at: string };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = await one<{ title: string }>("select title from flashcard_sets where id = $1", [id]);
  return { title: set?.title ?? "Fiszki" };
}

export default async function FlashcardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ restart?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const search = await searchParams;

  const set = await one<SetRow>(
    "select id, title, subject_slug, created_at from flashcard_sets where id = $1 and user_id = $2",
    [id, user.id],
  );
  if (!set) notFound();

  const cards = await q<DeckCard>(
    `select id, front, back, box, due_at from flashcards
     where set_id = $1 order by box asc, due_at asc, front asc`,
    [set.id],
  );
  if (!cards.length) notFound();

  const [dueRow] = await q<{ n: number }>(
    "select count(*)::int as n from flashcards where set_id = $1 and due_at <= now()",
    [set.id],
  );

  return (
    <div className="page">
      <div className="between">
        <Link href="/practice" className="btn btn-sm btn-ghost">
          <ChevronLeft width={15} height={15} /> Ćwiczenia
        </Link>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip">
            <SparkIcon width={12} height={12} /> {cards.length} kart
          </span>
          <span className={dueRow?.n ? "chip chip-coral" : "chip chip-green"}>
            <ClockIcon width={12} height={12} /> {dueRow?.n ? `${dueRow.n} do powtórki` : "wszystko powtórzone"}
          </span>
        </div>
      </div>

      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">
          <SparkIcon width={13} height={13} /> Fiszki
        </span>
        <h1 className="page-title">{set.title}</h1>
        <p className="page-sub">
          Odwróć kartę, oceń szczerze i idź dalej. Zestaw utworzono {relative(set.created_at)}.
        </p>
      </header>

      <FlashcardDeck
        key={search.restart ?? "deck"}
        setId={set.id}
        title={set.title}
        cards={cards}
        action={reviewCardAction}
      />
    </div>
  );
}
