import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { changePlanAction } from "@/lib/actions";
import { PLANS, usageCount, whiteboardRemaining, type PlanKey } from "@/lib/points";
import { CheckIcon, SparkIcon, TrophyIcon } from "@/components/icons";

export const metadata = { title: "Plany" };

const ORDER: PlanKey[] = ["free", "pro", "max"];

const COMPARE: Array<[string, string, string, string]> = [
  ["Lekcje na tablicy", "2 / 5 dni", "bez limitu", "bez limitu"],
  ["Czat z AI", "20 pytań / dzień", "bez limitu", "bez limitu"],
  ["Quizy i fiszki", "tak", "tak", "tak"],
  ["Plan nauki", "tak", "tak", "tak"],
  ["Voice Recall", "tak", "tak", "tak"],
  ["Eksport PDF", "—", "tak", "tak"],
  ["Analiza postępów", "—", "—", "tak"],
  ["Wspólne tablice", "—", "—", "tak"],
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;
  const [remaining, chats] = await Promise.all([
    whiteboardRemaining(user),
    usageCount(user.id, "chat", 1),
  ]);

  const limitMessage =
    search.limit === "whiteboard"
      ? "Limit lekcji na tablicy w tym okresie został wykorzystany. W planie Pro tablice są bez limitu."
      : search.limit === "chat"
        ? "Dzienny limit pytań do AI został wykorzystany. Zwiększ plan, żeby rozmawiać dalej."
        : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <TrophyIcon width={13} height={13} /> Plany
          </div>
          <h1 className="page-title">Ucz się tyle, ile potrzebujesz</h1>
          <p className="page-sub">
            Zacznij bezpłatnie. Pro daje nielimitowane tablice i czat, Max dokłada analizę postępów.
          </p>
        </div>
        <span className="chip chip-gold">
          <SparkIcon width={13} height={13} /> Twój plan: {PLANS[(user.plan as PlanKey) ?? "free"].label}
        </span>
      </div>

      {limitMessage ? (
        <div className="card" style={{ borderColor: "var(--coral)", background: "#fff8f4" }}>
          <b style={{ fontSize: 15 }}>Limit osiągnięty</b>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
            {limitMessage}
          </p>
        </div>
      ) : null}

      <section className="grid-3" style={{ gap: 12 }}>
        {ORDER.map((key) => {
          const plan = PLANS[key];
          const active = (user.plan as PlanKey) === key;
          return (
            <div
              key={key}
              className="card"
              style={{
                padding: 20,
                borderColor: active ? "var(--green-2)" : key === "pro" ? "var(--gold)" : undefined,
                background: key === "pro" ? "linear-gradient(160deg, #fffdf8, #f3e6c8)" : undefined,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div className="between">
                <b style={{ fontSize: 18 }}>{plan.label}</b>
                {active ? <span className="chip chip-green">aktywny</span> : key === "pro" ? <span className="chip chip-gold">polecany</span> : null}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{plan.price}</div>
              <p className="small" style={{ margin: 0 }}>
                {plan.tagline}
              </p>
              <div className="divider" style={{ margin: "6px 0" }} />
              <ul className="stack" style={{ gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="row" style={{ gap: 6, alignItems: "flex-start" }}>
                    <CheckIcon width={14} height={14} color="var(--green-2)" />
                    <span className="small" style={{ color: "var(--ink-soft)" }}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
              <form action={changePlanAction} style={{ marginTop: "auto", paddingTop: 12 }}>
                <input type="hidden" name="plan" value={key} />
                <button
                  type="submit"
                  className={active ? "btn btn-sm" : key === "pro" ? "btn btn-primary" : "btn btn-sm"}
                  disabled={active}
                  style={{ width: "100%" }}
                >
                  {active ? "Twój obecny plan" : `Wybierz ${plan.label}`}
                </button>
              </form>
            </div>
          );
        })}
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 className="section-title">Twoje zużycie dziś</h2>
        <div className="grid-3" style={{ gap: 10, marginTop: 10 }}>
          <div className="stat">
            <span>Tablice</span>
            <b>{remaining.unlimited ? "∞" : `${remaining.left} / ${remaining.limit}`}</b>
          </div>
          <div className="stat">
            <span>Pytania do AI</span>
            <b>{PLANS[(user.plan as PlanKey) ?? "free"].chatsPerDay > 100 ? "∞" : `${chats} / ${PLANS[(user.plan as PlanKey) ?? "free"].chatsPerDay}`}</b>
          </div>
          <div className="stat">
            <span>Okres rozliczeniowy</span>
            <b>{remaining.unlimited ? "bez limitu" : `${remaining.days} dni`}</b>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "6px 16px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 8px" }}>Funkcja</th>
              {ORDER.map((key) => (
                <th key={key} style={{ textAlign: "center", padding: "12px 8px" }}>
                  {PLANS[key].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([label, free, pro, max]) => (
              <tr key={label} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 8px", color: "var(--ink-soft)" }}>{label}</td>
                {[free, pro, max].map((value, index) => (
                  <td key={`${label}-${index}`} style={{ textAlign: "center", padding: "10px 8px" }}>
                    {value === "tak" ? <CheckIcon width={14} height={14} color="var(--green-2)" /> : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="footer-note">
        To lokalna wersja demonstracyjna — zmiana planu działa od razu i nie pobiera płatności.{" "}
        <Link href="/settings" style={{ fontWeight: 700 }}>
          Wróć do ustawień
        </Link>
        .
      </p>
    </div>
  );
}
