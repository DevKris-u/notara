import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { leaderboard, userRank } from "@/lib/points";
import { Avatar } from "@/components/avatar";
import { FlameIcon, SparkIcon, TrophyIcon } from "@/components/icons";
import { level, plural } from "@/lib/utils";

export const metadata = { title: "Ranking" };

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const user = await requireUser();
  const [rows, rank, weekly] = await Promise.all([
    leaderboard(20),
    userRank(user.id),
    q<{ user_id: string; xp: number }>(
      `select user_id, sum(amount)::int as xp from point_events
       where created_at > now() - interval '7 days'
       group by user_id order by xp desc`,
    ),
  ]);

  const weeklyMap = new Map(weekly.map((row) => [row.user_id, row.xp]));
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myWeekly = weeklyMap.get(user.id) ?? 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <TrophyIcon width={13} height={13} /> Ranking
          </div>
          <h1 className="page-title">Kto tu najwięcej pracuje</h1>
          <p className="page-sub">
            Punkty XP zdobywasz za lekcje, quizy, notatki i pomoc innym. Liczy się regularność, nie jeden wielki dzień.
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip chip-gold">
            <TrophyIcon width={13} height={13} /> Twoje miejsce: {rank}
          </span>
          <span className="chip">
            <SparkIcon width={13} height={13} /> {myWeekly} XP w 7 dni
          </span>
        </div>
      </div>

      <section className="grid-3" style={{ gap: 12, alignItems: "end" }}>
        {top.map((person, index) => {
          const info = level(person.xp);
          const isMe = person.id === user.id;
          return (
            <div
              key={person.id}
              className="card"
              style={{
                textAlign: "center",
                padding: 18,
                order: index === 0 ? 2 : index === 1 ? 1 : 3,
                borderColor: isMe ? "var(--green-2)" : undefined,
                background: index === 0 ? "linear-gradient(160deg, #fffdf8, #f3e6c8)" : undefined,
              }}
            >
              <div style={{ fontSize: 26 }}>{MEDALS[index]}</div>
              <Avatar name={person.display_name} hue={person.avatar_hue} size={index === 0 ? "lg" : "md"} />
              <b style={{ display: "block", marginTop: 8, fontSize: 15 }}>{person.display_name}</b>
              <span className="small">@{person.username}</span>
              <div className="row" style={{ justifyContent: "center", gap: 6, marginTop: 8 }}>
                <span className="chip chip-gold">{person.xp} XP</span>
                <span className="chip">poz. {info.level}</span>
              </div>
              <div className="progress" style={{ marginTop: 10 }}>
                <span style={{ width: `${info.pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="card" style={{ padding: "6px 16px" }}>
        {rest.length ? (
          rest.map((person, index) => {
            const info = level(person.xp);
            const isMe = person.id === user.id;
            return (
              <div
                key={person.id}
                className="list-row"
                style={{ background: isMe ? "var(--paper-2)" : undefined, borderRadius: 10, paddingLeft: 8, paddingRight: 8 }}
              >
                <span className="rank" style={{ width: 32, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                  {index + 4}
                </span>
                <Avatar name={person.display_name} hue={person.avatar_hue} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 14 }}>
                    {person.display_name} {isMe ? <span className="chip chip-green">ty</span> : null}
                  </b>
                  <div className="small">
                    @{person.username} · poziom {info.level} · {plural(person.streak, "dzień", "dni", "dni")} serii
                  </div>
                </div>
                <span className={weeklyMap.get(person.id) ? "chip chip-green" : "chip"}>
                  +{weeklyMap.get(person.id) ?? 0} / 7 dni
                </span>
                <b style={{ fontSize: 14, width: 74, textAlign: "right" }}>{person.xp} XP</b>
              </div>
            );
          })
        ) : (
          <p className="muted" style={{ padding: "14px 0" }}>
            Ranking dopiero się rozkręca.
          </p>
        )}
      </section>

      <section className="grid-3" style={{ gap: 10 }}>
        <div className="card-soft">
          <span className="label">Jak zdobyć XP</span>
          <div className="stack" style={{ gap: 4, marginTop: 8 }}>
            {[
              ["Lekcja na tablicy", "+40"],
              ["Quiz (za poprawną)", "+12"],
              ["Notatka w Community", "+50"],
              ["Odpowiedź na pytanie", "+20"],
              ["Zaakceptowana odpowiedź", "+40"],
              ["Voice Recall", "+25"],
            ].map(([label, value]) => (
              <div key={label} className="between">
                <span className="small">{label}</span>
                <b style={{ fontSize: 13 }}>{value}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <span className="label">Twoja seria</span>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <FlameIcon width={22} height={22} color="var(--coral)" />
            <b style={{ fontSize: 30 }}>{user.streak}</b>
          </div>
          <p className="small" style={{ marginTop: 6 }}>
            {plural(user.streak, "dzień", "dni", "dni")} z rzędu. Wystarczy jedna aktywność dziennie, żeby nie przerwać serii.
          </p>
        </div>
        <div className="card-soft">
          <span className="label">Twój poziom</span>
          <div className="between" style={{ marginTop: 8 }}>
            <b style={{ fontSize: 24 }}>Poziom {level(user.xp).level}</b>
            <span className="chip">{user.xp} XP</span>
          </div>
          <div className="progress" style={{ marginTop: 10 }}>
            <span style={{ width: `${level(user.xp).pct}%` }} />
          </div>
          <p className="small" style={{ marginTop: 6 }}>
            {level(user.xp).need - level(user.xp).into} XP do kolejnego poziomu.
          </p>
        </div>
      </section>

      <p className="footer-note">
        Ranking jest lokalny — pokazuje konta z tej instalacji Notary.{" "}
        <Link href="/pricing" style={{ fontWeight: 700 }}>
          Zobacz, co dają plany Pro i Max
        </Link>
        .
      </p>
    </div>
  );
}
