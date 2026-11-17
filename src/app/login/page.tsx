import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { demoLoginAction } from "@/lib/actions";
import { LoginForm } from "./login-form";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Zaloguj się" };

const DEMO = [
  { who: "kasia", name: "Kasia", note: "plan Pro, 12-dniowa seria" },
  { who: "marek", name: "Marek", note: "plan Free, fizyka" },
  { who: "ola", name: "Ola", note: "plan Free, biologia" },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "30px 20px 60px" }}>
      <Link href="/" className="brand" style={{ padding: 0 }}>
        <span className="brand-mark">n</span>
        <span className="brand-name">
          notara<span>.</span>
        </span>
      </Link>

      <div className="two-col" style={{ marginTop: 26 }}>
        <div className="card" style={{ padding: 26 }}>
          <div className="eyebrow">Witaj ponownie</div>
          <h1 style={{ fontSize: 32, margin: "6px 0 4px" }}>Zaloguj się</h1>
          <p className="muted" style={{ marginBottom: 18 }}>
            Twoje tablice, plany i notatki czekają dokładnie tam, gdzie je zostawiłeś.
          </p>
          <LoginForm />

          <div className="divider" style={{ margin: "22px 0 16px" }} />
          <p className="small" style={{ marginBottom: 10 }}>
            Konto demo — hasło <b>notara123</b> dla każdego:
          </p>
          <div className="stack" style={{ gap: 8 }}>
            {DEMO.map((account) => (
              <form key={account.who} action={demoLoginAction}>
                <input type="hidden" name="who" value={account.who} />
                <button
                  type="submit"
                  className="btn"
                  style={{ width: "100%", justifyContent: "flex-start", padding: "8px 12px" }}
                >
                  <Avatar name={account.name} hue={account.who === "kasia" ? 152 : account.who === "marek" ? 212 : 28} size="sm" />
                  <span style={{ textAlign: "left", lineHeight: 1.2 }}>
                    <span style={{ display: "block", fontSize: 13.5 }}>Wejdź jako {account.name}</span>
                    <span className="small" style={{ fontWeight: 400 }}>{account.note}</span>
                  </span>
                </button>
              </form>
            ))}
          </div>

          <p className="muted" style={{ marginTop: 18, fontSize: 13.5 }}>
            Nie masz konta?{" "}
            <Link href="/signup" style={{ fontWeight: 700, textDecoration: "underline" }}>
              Załóż je w 20 sekund
            </Link>
            .
          </p>
        </div>

        <aside className="card-soft" style={{ background: "linear-gradient(160deg, #fffdf8, #f2e8d2)" }}>
          <div className="chip chip-gold">Tablica AI</div>
          <h2 style={{ fontSize: 24, margin: "12px 0 8px" }}>Ucz się tak, jak lubisz</h2>
          <p className="muted" style={{ fontSize: 13.5 }}>
            Wybierz tryb asystenta: kolega, nauczyciel albo coach. Ustaw ciepło i emotikony. Notara
            dopasuje sposób tłumaczenia do ciebie.
          </p>
          <div className="stack" style={{ marginTop: 16, gap: 10 }}>
            <div className="card-flat">
              <b style={{ fontSize: 13 }}>🎨 Tablica z narracją</b>
              <p className="small" style={{ marginTop: 4 }}>Rysuje i mówi w tym samym czasie.</p>
            </div>
            <div className="card-flat">
              <b style={{ fontSize: 13 }}>🧠 Voice Recall</b>
              <p className="small" style={{ marginTop: 4 }}>Sprawdza zrozumienie, nie pamięć.</p>
            </div>
            <div className="card-flat">
              <b style={{ fontSize: 13 }}>🔥 Serie i XP</b>
              <p className="small" style={{ marginTop: 4 }}>Małe kroki, które robią różnicę.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
