import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction, updatePersonaAction, updateProfileAction } from "@/lib/actions";
import { PLANS, usageCount, whiteboardRemaining, type PlanKey } from "@/lib/points";
import { aiModel } from "@/lib/ai";
import { TTS_MODEL_NAME, TTS_MODEL_REPO, ttsAssetsPresent } from "@/lib/tts/status";
import { q } from "@/lib/db";
import { Avatar } from "@/components/avatar";
import { VoicePicker } from "@/components/voice-picker";
import { CheckIcon, SettingsIcon, SparkIcon, TrophyIcon } from "@/components/icons";
import { level } from "@/lib/utils";

export const metadata = { title: "Ustawienia" };

const VIBES: Array<[string, string, string]> = [
  ["friend", "Kumpel", "Swobodnie, po ludzku, bez szkolnego tonu."],
  ["teacher", "Nauczyciel", "Precyzyjnie: definicja, przykład, wyjaśnienie."],
  ["coach", "Coach", "Krótko, konkretnie, z planem działania."],
];

export default async function SettingsPage() {
  const user = await requireUser();
  const [chats, boards, boardStats] = await Promise.all([
    usageCount(user.id, "chat", 1),
    whiteboardRemaining(user),
    q<{ n: number }>("select count(*)::int as n from boards where user_id = $1", [user.id]),
  ]);

  const xp = level(user.xp);
  const plan = PLANS[(user.plan as PlanKey) ?? "free"] ?? PLANS.free;
  const model = aiModel();
  const narratorReady = ttsAssetsPresent();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <SettingsIcon width={13} height={13} /> Ustawienia
          </div>
          <h1 className="page-title">Profil i asystent</h1>
          <p className="page-sub">
            Dopasuj sposób tłumaczenia do siebie. Te ustawienia zmieniają ton odpowiedzi AI i wygląd profilu.
          </p>
        </div>
        <span className="chip chip-gold">
          <TrophyIcon width={13} height={13} /> {user.xp} XP · poziom {xp.level}
        </span>
      </div>

      <div className="two-col">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card">
            <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 14 }}>
              <Avatar name={user.display_name} hue={user.avatar_hue} size="lg" />
              <div>
                <b style={{ fontSize: 16, display: "block" }}>{user.display_name}</b>
                <span className="small">
                  @{user.username} · {user.email}
                </span>
              </div>
            </div>

            <form action={updateProfileAction} className="stack" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 8 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span>Imię i nazwa wyświetlana</span>
                  <input className="input" name="display_name" defaultValue={user.display_name} required />
                </label>
                <label className="field" style={{ width: 130 }}>
                  <span>Kolor awatara</span>
                  <input
                    className="input"
                    type="number"
                    name="avatar_hue"
                    min={0}
                    max={359}
                    defaultValue={user.avatar_hue}
                  />
                </label>
              </div>
              <label className="field">
                <span>O mnie</span>
                <textarea
                  className="textarea"
                  name="bio"
                  rows={3}
                  defaultValue={user.bio}
                  placeholder="Np. klasa 2 LO, cel: matura rozszerzona z biologii."
                />
              </label>
              <div className="row" style={{ gap: 8 }}>
                <label className="field" style={{ flex: 1 }}>
                  <span>Szkoła</span>
                  <input className="input" name="school" defaultValue={user.school} placeholder="Nazwa szkoły" />
                </label>
                <label className="field" style={{ width: 140 }}>
                  <span>Klasa</span>
                  <input className="input" name="grade" defaultValue={user.grade} placeholder="np. 2 LO" />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                <CheckIcon width={15} height={15} /> Zapisz profil
              </button>
            </form>
          </section>

          <section className="card">
            <div className="row" style={{ gap: 8, marginBottom: 4 }}>
              <SparkIcon width={17} height={17} />
              <h2 className="section-title">Osobowość asystenta</h2>
            </div>
            <p className="small" style={{ marginTop: 0 }}>
              Wpływa na ton czatu i podpowiedzi. Nie zmienia treści lekcji — tylko sposób mówienia.
            </p>
            <form action={updatePersonaAction} className="stack" style={{ gap: 14 }}>
              <div className="stack" style={{ gap: 8 }}>
                <span className="label">Styl</span>
                <div className="grid-3" style={{ gap: 8 }}>
                  {VIBES.map(([value, label, description]) => (
                    <label
                      key={value}
                      className="card-soft"
                      style={{
                        padding: 12,
                        cursor: "pointer",
                        borderColor: user.persona_vibe === value ? "var(--green-2)" : undefined,
                      }}
                    >
                      <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                        <input
                          type="radio"
                          name="vibe"
                          value={value}
                          defaultChecked={user.persona_vibe === value}
                        />
                        <b style={{ fontSize: 13.5 }}>{label}</b>
                      </div>
                      <span className="small">{description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                <label className="field" style={{ flex: 1, minWidth: 160 }}>
                  <span>Ciepło: {user.persona_warmth}/5</span>
                  <input
                    className="input"
                    type="range"
                    name="warmth"
                    min={1}
                    max={5}
                    step={1}
                    defaultValue={user.persona_warmth}
                  />
                  <span className="small">1 = rzeczowo, 5 = dużo wsparcia i zachęty</span>
                </label>
                <label className="field" style={{ flex: 1, minWidth: 160 }}>
                  <span>Emoji: {user.persona_emojis}/3</span>
                  <input
                    className="input"
                    type="range"
                    name="emojis"
                    min={0}
                    max={3}
                    step={1}
                    defaultValue={user.persona_emojis}
                  />
                  <span className="small">0 = bez emoji, 3 = dużo</span>
                </label>
                <label className="field" style={{ width: 150 }}>
                  <span>Język</span>
                  <select className="select" name="language" defaultValue={user.persona_language}>
                    <option value="pl">polski</option>
                    <option value="en">angielski</option>
                  </select>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                <CheckIcon width={15} height={15} /> Zapisz osobowość
              </button>
            </form>
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card-soft">
            <div className="between" style={{ marginBottom: 8 }}>
              <span className="label">Plan</span>
              <Link href="/pricing" className="small" style={{ fontWeight: 700 }}>
                Zmień
              </Link>
            </div>
            <b style={{ fontSize: 20 }}>{plan.label}</b>
            <p className="small" style={{ margin: "2px 0 10px" }}>
              {plan.tagline}
            </p>
            <div className="stack" style={{ gap: 4 }}>
              <div className="between">
                <span className="small">Tablice w tym okresie</span>
                <b style={{ fontSize: 13 }}>
                  {boardStats[0]?.n ?? 0} {boardRestLabel(boards)}
                </b>
              </div>
              <div className="between">
                <span className="small">Pytania do AI dziś</span>
                <b style={{ fontSize: 13 }}>
                  {chats} {plan.chatsPerDay > 100 ? "/ ∞" : `/ ${plan.chatsPerDay}`}
                </b>
              </div>
            </div>
          </section>

          <section className="card-soft">
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="label">Silnik AI</span>
              <span className={`chip ${model ? "chip-green" : "chip-solid"}`} style={{ fontSize: 11 }}>
                {model ? "NVIDIA NIM" : "lokalny"}
              </span>
            </div>
            {model ? (
              <>
                <code
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    wordBreak: "break-all",
                    color: "var(--ink)",
                  }}
                >
                  {model}
                </code>
                <p className="small" style={{ margin: "8px 0 0" }}>
                  Czat, lekcje, quizy i streszczenia pisze model NVIDIA. Rysowanie na tablicy nadal robi lokalny
                  renderer, więc odpowiedzi zawsze mają ten sam układ i animację.
                </p>
              </>
            ) : (
              <p className="small" style={{ margin: "6px 0 0" }}>
                Brak klucza <code>NVIDIA_API_KEY</code> — Notara korzysta z wbudowanego silnika lekcji. Wszystko
                działa offline, tylko treści są szablonowe.
              </p>
            )}
          </section>

          <section className="card-soft">
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="label">Lektor tablicy</span>
              <span className={`chip ${narratorReady ? "chip-green" : "chip-solid"}`} style={{ fontSize: 11 }}>
                {narratorReady ? "offline · 44,1 kHz" : "brak modelu"}
              </span>
            </div>
            <code style={{ display: "block", fontSize: 11.5, lineHeight: 1.5, color: "var(--ink)" }}>
              {TTS_MODEL_NAME}
            </code>
            <p className="small" style={{ margin: "6px 0 0" }}>
              Czyta każdy krok lekcji po polsku. Model działa lokalnie na procesorze — nagranie powstaje na Twoim
              komputerze, bez chmury i bez GPU.
            </p>
            <VoicePicker ready={narratorReady} />
            <p className="small" style={{ margin: "8px 0 0" }}>
              Wagi: <code>{TTS_MODEL_REPO}</code> · licencja MIT
            </p>
          </section>

          <section className="card-soft">
            <span className="label">Konto</span>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              <div className="between">
                <span className="small">E-mail</span>
                <b style={{ fontSize: 13 }}>{user.email}</b>
              </div>
              <div className="between">
                <span className="small">Nazwa użytkownika</span>
                <b style={{ fontSize: 13 }}>@{user.username}</b>
              </div>
              <div className="between">
                <span className="small">Seria</span>
                <b style={{ fontSize: 13 }}>{user.streak} dni</b>
              </div>
              <div className="between">
                <span className="small">Poziom</span>
                <b style={{ fontSize: 13 }}>
                  {xp.level} ({xp.into}/{xp.need} XP)
                </b>
              </div>
            </div>
            <div className="progress" style={{ marginTop: 10 }}>
              <span style={{ width: `${xp.pct}%` }} />
            </div>
          </section>

          <section className="card-soft">
            <span className="label">Dane i prywatność</span>
            <p className="small" style={{ marginTop: 6 }}>
              Notara trzyma dane w lokalnej bazie Postgres (PGlite) na tym komputerze. Jeśli podłączysz klucz NVIDIA,
              treść pytań, tematów lekcji i wgranych notatek trafia do modelu tylko po to, żeby napisać odpowiedź —
              klucz zostaje na serwerze i nigdy nie trafia do przeglądarki.
            </p>
            <p className="small">
              Możesz podłączyć Supabase, żeby korzystać z tych samych danych na innych urządzeniach.
            </p>
            <p className="small">
              Lektor (Supertonic 3) renderuje mowę lokalnie — gotowe nagrania leżą w <code>.data/tts</code> i nigdy nie
              opuszczają tego komputera.
            </p>
          </section>

          <form action={logoutAction}>
            <button type="submit" className="btn btn-sm" style={{ width: "100%" }}>
              Wyloguj się
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function boardRestLabel(stats: { unlimited: boolean; left: number; limit: number }): string {
  if (stats.unlimited) return "/ ∞";
  return `/ ${stats.limit} (zostało ${stats.left})`;
}
