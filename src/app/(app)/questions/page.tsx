import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { askQuestionAction } from "@/lib/actions";
import { Avatar } from "@/components/avatar";
import { CheckIcon, ChatIcon, PlusIcon, SparkIcon, TrophyIcon } from "@/components/icons";
import { plural, relative, truncate } from "@/lib/utils";

export const metadata = { title: "Pytania" };

type QuestionRow = {
  id: string;
  title: string;
  body: string;
  resolved: boolean;
  created_at: string;
  answers: number;
  author_name: string;
  avatar_hue: number;
  subject_name: string | null;
  emoji: string | null;
};

const TABS = [
  { key: "open", label: "Bez odpowiedzi" },
  { key: "all", label: "Wszystkie" },
  { key: "resolved", label: "Rozwiązane" },
  { key: "mine", label: "Moje" },
];

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; subject?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;
  const tab = TABS.some((item) => item.key === search.tab) ? search.tab! : "open";
  const subject = search.subject ?? "";

  const filter =
    tab === "open"
      ? "and q.resolved = false and not exists (select 1 from answers a where a.question_id = q.id)"
      : tab === "resolved"
        ? "and q.resolved = true"
        : tab === "mine"
          ? "and q.author_id = $1"
          : "";

  const [questions, subjects] = await Promise.all([
    q<QuestionRow>(
      `select q.id, q.title, q.body, q.resolved, q.created_at,
              (select count(*)::int from answers a where a.question_id = q.id) as answers,
              p.display_name as author_name, p.avatar_hue,
              s.name as subject_name, s.emoji
       from questions q
       join profiles p on p.id = q.author_id
       left join subjects s on s.slug = q.subject_slug
       where ($2 = '' or q.subject_slug = $2) ${filter}
       order by q.created_at desc limit 40`,
      [user.id, subject],
    ),
    q<{ slug: string; name: string; emoji: string }>("select slug, name, emoji from subjects order by sort asc"),
  ]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <ChatIcon width={13} height={13} /> Pytania
          </div>
          <h1 className="page-title">Nie rozumiesz czegoś? Zapytaj</h1>
          <p className="page-sub">
            Ktoś z community prawdopodobnie już to przerabiał. Najlepsze odpowiedzi zdobywają punkty i status.
          </p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/questions?tab=${item.key}${subject ? `&subject=${subject}` : ""}`}
            data-active={tab === item.key ? "true" : "false"}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/questions" data-active={!subject ? "true" : "false"}>
          Wszystkie przedmioty
        </Link>
        {subjects.slice(0, 4).map((item) => (
          <Link
            key={item.slug}
            href={`/questions?tab=${tab}&subject=${item.slug}`}
            data-active={subject === item.slug ? "true" : "false"}
          >
            {item.emoji} {item.name}
          </Link>
        ))}
      </div>

      <div className="two-col">
        <div className="stack" style={{ gap: 12 }}>
          {questions.length ? (
            questions.map((question) => (
              <Link key={question.id} href={`/questions/${question.id}`} className="card card-hover" style={{ display: "block", padding: 16 }}>
                <div className="between" style={{ alignItems: "flex-start", gap: 8 }}>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    {question.resolved ? (
                      <span className="chip chip-green">
                        <CheckIcon width={12} height={12} /> rozwiązane
                      </span>
                    ) : question.answers === 0 ? (
                      <span className="chip chip-coral">czeka na odpowiedź</span>
                    ) : (
                      <span className="chip chip-gold">w toku</span>
                    )}
                    {question.subject_name ? (
                      <span className="chip">
                        {question.emoji} {question.subject_name}
                      </span>
                    ) : null}
                  </div>
                  <span className="small">{relative(question.created_at)}</span>
                </div>

                <h2 style={{ fontSize: 18, margin: "10px 0 6px", lineHeight: 1.35 }}>{question.title}</h2>
                {question.body ? (
                  <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                    {truncate(question.body, 150)}
                  </p>
                ) : null}

                <div className="between" style={{ marginTop: 12 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Avatar name={question.author_name} hue={question.avatar_hue} size="sm" />
                    <span className="small">{question.author_name}</span>
                  </div>
                  <span className="chip">
                    <ChatIcon width={12} height={12} /> {question.answers}{" "}
                    {plural(question.answers, "odpowiedź", "odpowiedzi", "odpowiedzi")}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty">
              <h3>Brak pytań w tym widoku</h3>
              <p>Zmień filtr albo zadaj własne pytanie — pierwsza odpowiedź zwykle przychodzi szybko.</p>
            </div>
          )}
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <PlusIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 18 }}>
                Zadaj pytanie
              </h2>
            </div>
            <form action={askQuestionAction} className="stack" style={{ gap: 10 }}>
              <label className="field">
                <span>Tytuł pytania</span>
                <input className="input" name="title" placeholder="Np. Dlaczego delta może być ujemna?" required minLength={10} />
              </label>
              <label className="field">
                <span>Szczegóły (opcjonalnie)</span>
                <textarea className="textarea" name="body" rows={4} placeholder="Napisz, co już próbowałeś i gdzie się gubisz." />
              </label>
              <label className="field">
                <span>Przedmiot</span>
                <select className="select" name="subject" defaultValue="">
                  <option value="">—</option>
                  {subjects.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.emoji} {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-primary">
                <ChatIcon width={15} height={15} /> Opublikuj pytanie
              </button>
            </form>
          </section>

          <section className="card-soft">
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <TrophyIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 17 }}>
                Jak zdobywać punkty
              </h2>
            </div>
            <p className="small" style={{ marginTop: 0 }}>
              Odpowiedź: +20 XP. Zaakceptowana odpowiedź: +40 XP. Głos od innych: +10 XP.
            </p>
            <Link href="/leaderboard" className="btn btn-sm" style={{ marginTop: 8 }}>
              <SparkIcon width={14} height={14} /> Zobacz ranking
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
