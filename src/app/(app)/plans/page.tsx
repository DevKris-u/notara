import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import {
  addPlanItemAction,
  deletePlanItemAction,
  generatePlanAction,
  saveRecallAction,
  togglePlanItemAction,
} from "@/lib/actions";
import { VoiceRecall } from "@/components/voice-recall";
import {
  CheckIcon,
  ClockIcon,
  FlameIcon,
  MicIcon,
  PlanIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from "@/components/icons";
import { daysUntil, formatShort, plural, relative, weekday } from "@/lib/utils";

export const metadata = { title: "Plan nauki" };

type PlanRow = {
  id: string;
  title: string;
  subject_slug: string | null;
  kind: string;
  due_date: string;
  estimate_min: number;
  done: boolean;
  notes: string;
};

type RecallRow = { id: string; topic: string; score: number; feedback: string; created_at: string };
type SubjectRow = { slug: string; name: string; emoji: string };

function dueTone(days: number): string {
  if (days < 0) return "chip-coral";
  if (days === 0) return "chip-coral";
  if (days <= 2) return "chip-gold";
  return "";
}

function dueText(days: number, date: string): string {
  if (days < 0) return `${Math.abs(days)} ${plural(Math.abs(days), "dzień", "dni", "dni")} po terminie`;
  if (days === 0) return "Dzisiaj";
  if (days === 1) return "Jutro";
  if (days <= 6) return `Za ${days} ${plural(days, "dzień", "dni", "dni")}`;
  return formatShort(date);
}

export default async function PlansPage() {
  const user = await requireUser();

  const [items, recalls, subjects] = await Promise.all([
    q<PlanRow>(
      `select id, title, subject_slug, kind, due_date, estimate_min, done, notes
       from plan_items where user_id = $1 order by done asc, due_date asc, created_at asc`,
      [user.id],
    ),
    q<RecallRow>(
      "select id, topic, score, feedback, created_at from recall_sessions where user_id = $1 order by created_at desc limit 6",
      [user.id],
    ),
    q<SubjectRow>("select slug, name, emoji from subjects order by sort asc"),
  ]);

  const open = items.filter((item) => !item.done);
  const done = items.filter((item) => item.done);
  const overdue = open.filter((item) => daysUntil(item.due_date) < 0);
  const today = open.filter((item) => daysUntil(item.due_date) === 0);
  const upcoming = open.filter((item) => daysUntil(item.due_date) > 0);
  const minutes = open.reduce((sum, item) => sum + item.estimate_min, 0);
  const subjectName = (slug: string | null) => subjects.find((subject) => subject.slug === slug);
  const todayIso = new Date().toISOString().slice(0, 10);
  const recallTopics = [
    "Funkcja kwadratowa",
    "Fotosynteza",
    "Dynamika — zasady Newtona",
    "Budowa atomu",
    "Rachunek prawdopodobieństwa",
    "Liczby i działania",
    "Ekologia",
    "Prąd elektryczny",
  ];

  const groups: Array<{ key: string; heading: string; rows: PlanRow[] }> = [
    { key: "overdue", heading: "Zaległe", rows: overdue },
    { key: "today", heading: "Na dziś", rows: today },
    { key: "upcoming", heading: "Nadchodzące", rows: upcoming },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <PlanIcon width={13} height={13} /> Plan nauki
          </div>
          <h1 className="page-title">Co masz do zrobienia</h1>
          <p className="page-sub">
            Rozłóż naukę na małe kroki. {open.length ? `${open.length} ${plural(open.length, "zadanie", "zadania", "zadań")} · ok. ${minutes} min pracy.` : "Pusto — dodaj pierwszy cel."}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="chip chip-gold">
            <FlameIcon width={13} height={13} /> {user.streak} {plural(user.streak, "dzień", "dni", "dni")} serii
          </span>
        </div>
      </div>

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="between" style={{ alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h2 className="section-title">Zadania</h2>
                <p className="small" style={{ margin: 0 }}>
                  Odhaczenie zadania daje 15 XP i podtrzymuje serię.
                </p>
              </div>
              <span className="chip">{open.length} otwartych</span>
            </div>

            {groups.map((group) =>
              group.rows.length ? (
                <div key={group.key} className="stack" style={{ gap: 4, marginBottom: 10 }}>
                  <span className="label">{group.heading}</span>
                  {group.rows.map((item) => {
                    const days = daysUntil(item.due_date);
                    const subject = subjectName(item.subject_slug);
                    return (
                      <div key={item.id} className="list-row" style={{ alignItems: "flex-start" }}>
                        <form action={togglePlanItemAction}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <button
                            type="submit"
                            className="btn btn-sm btn-ghost"
                            title="Oznacz jako zrobione"
                            style={{ padding: 4, marginTop: 2 }}
                          >
                            <CheckIcon width={16} height={16} />
                          </button>
                        </form>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 14.5 }}>{item.title}</b>
                          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            <span className={`chip ${dueTone(days)}`}>{dueText(days, item.due_date)}</span>
                            <span className="chip">
                              <ClockIcon width={12} height={12} /> {item.estimate_min} min
                            </span>
                            {subject ? (
                              <span className="chip">
                                {subject.emoji} {subject.name}
                              </span>
                            ) : null}
                            {item.kind === "exam" ? <span className="chip chip-coral">sprawdzian</span> : null}
                          </div>
                          {item.notes ? (
                            <p className="small" style={{ margin: "6px 0 0" }}>
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="row" style={{ gap: 4 }}>
                          <span className="small" style={{ whiteSpace: "nowrap" }}>
                            {weekday(item.due_date)}
                          </span>
                          <form action={deletePlanItemAction}>
                            <input type="hidden" name="item_id" value={item.id} />
                            <button type="submit" className="btn btn-sm btn-ghost" title="Usuń zadanie">
                              <TrashIcon width={14} height={14} />
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null,
            )}

            {!open.length ? (
              <div className="empty">
                <h3>Brak zadań</h3>
                <p>Dodaj sprawdzian albo wygeneruj plan — rozłożymy materiał na dni.</p>
              </div>
            ) : null}

            {done.length ? (
              <>
                <div className="divider" style={{ margin: "10px 0" }} />
                <details>
                  <summary className="small" style={{ cursor: "pointer", fontWeight: 700 }}>
                    Zrobione ({done.length})
                  </summary>
                  <div className="stack" style={{ gap: 2, marginTop: 8 }}>
                    {done.map((item) => (
                      <div key={item.id} className="list-row">
                        <form action={togglePlanItemAction}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <button
                            type="submit"
                            className="btn btn-sm btn-ghost"
                            title="Cofnij oznaczenie"
                            style={{ padding: 4 }}
                          >
                            <CheckIcon width={16} height={16} color="var(--green-2)" />
                          </button>
                        </form>
                        <span style={{ flex: 1, textDecoration: "line-through", opacity: 0.65, fontSize: 14 }}>
                          {item.title}
                        </span>
                        <form action={deletePlanItemAction}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <button type="submit" className="btn btn-sm btn-ghost">
                            <TrashIcon width={14} height={14} />
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            ) : null}
          </section>

          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 4 }}>
              <MicIcon width={17} height={17} />
              <h2 className="section-title">Voice Recall</h2>
            </div>
            <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
              Wytłumacz temat na głos. Aktywna powtórka pokazuje luki, których nie widać przy czytaniu.
            </p>
            <VoiceRecall action={saveRecallAction} topics={recallTopics} />

            {recalls.length ? (
              <>
                <div className="divider" style={{ margin: "14px 0 10px" }} />
                <span className="label">Ostatnie próby</span>
                <div className="stack" style={{ gap: 6, marginTop: 6 }}>
                  {recalls.map((recall) => (
                    <div key={recall.id} className="list-row" style={{ alignItems: "flex-start" }}>
                      <span
                        className={recall.score >= 70 ? "chip chip-green" : recall.score >= 45 ? "chip chip-gold" : "chip chip-coral"}
                      >
                        {recall.score}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14 }}>{recall.topic}</b>
                        <p className="small" style={{ margin: "2px 0 0" }}>
                          {recall.feedback}
                        </p>
                      </div>
                      <span className="small" style={{ whiteSpace: "nowrap" }}>
                        {relative(recall.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <PlusIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 18 }}>
                Dodaj zadanie
              </h2>
            </div>
            <form action={addPlanItemAction} className="stack" style={{ gap: 10 }}>
              <label className="field">
                <span>Co masz zrobić?</span>
                <input className="input" name="title" placeholder="Np. powtórka wzorów skróconego mnożenia" required />
              </label>
              <div className="row" style={{ gap: 8 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span>Termin</span>
                  <input className="input" type="date" name="due_date" defaultValue={todayIso} required />
                </label>
                <label className="field" style={{ width: 96 }}>
                  <span>Minuty</span>
                  <input className="input" type="number" name="estimate" min={5} max={240} step={5} defaultValue={30} />
                </label>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span>Przedmiot</span>
                  <select className="select" name="subject" defaultValue="">
                    <option value="">—</option>
                    {subjects.map((subject) => (
                      <option key={subject.slug} value={subject.slug}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field" style={{ width: 130 }}>
                  <span>Rodzaj</span>
                  <select className="select" name="kind" defaultValue="task">
                    <option value="task">Zadanie</option>
                    <option value="exam">Sprawdzian</option>
                    <option value="review">Powtórka</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                <PlusIcon width={15} height={15} /> Dodaj do planu
              </button>
            </form>
          </section>

          <section className="card" style={{ background: "linear-gradient(160deg, #fffdf8, #f4ecd9)" }}>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <SparkIcon width={16} height={16} />
              <h2 className="section-title" style={{ fontSize: 18 }}>
                Plan od AI
              </h2>
            </div>
            <p className="small" style={{ marginTop: 0 }}>
              Podaj datę sprawdzianu — ułożymy etapy powtórek i dodamy je do planu.
            </p>
            <form action={generatePlanAction} className="stack" style={{ gap: 10 }}>
              <label className="field">
                <span>Temat</span>
                <input className="input" name="title" placeholder="Np. Sprawdzian z biologii" required />
              </label>
              <label className="field">
                <span>Przedmiot</span>
                <select className="select" name="subject" defaultValue="biologia">
                  {subjects.map((subject) => (
                    <option key={subject.slug} value={subject.slug}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Data sprawdzianu</span>
                <input className="input" type="date" name="exam_date" required />
              </label>
              <button type="submit" className="btn btn-gold">
                <SparkIcon width={15} height={15} /> Rozłóż materiał
              </button>
            </form>
          </section>

          <p className="footer-note">
            Plan zapisuje się lokalnie. Po podłączeniu Supabase te same dane będą dostępne na innych urządzeniach.
          </p>
        </aside>
      </div>
    </div>
  );
}
