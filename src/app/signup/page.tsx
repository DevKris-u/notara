import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Załóż konto" };

export default async function SignupPage() {
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
          <div className="eyebrow">Zacznijmy</div>
          <h1 style={{ fontSize: 32, margin: "6px 0 4px" }}>Załóż konto</h1>
          <p className="muted" style={{ marginBottom: 18 }}>
            Pięć minut nauki dziennie więcej niż wczoraj. Tyle wystarczy, żeby zobaczyć różnicę.
          </p>
          <SignupForm />
          <p className="muted" style={{ marginTop: 16, fontSize: 13.5 }}>
            Masz już konto?{" "}
            <Link href="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>
              Zaloguj się
            </Link>
            .
          </p>
        </div>

        <aside className="card-soft" style={{ background: "linear-gradient(160deg, #fffdf8, #e9f2e7)" }}>
          <div className="chip chip-green">Co dostajesz</div>
          <h2 style={{ fontSize: 24, margin: "12px 0 10px" }}>Pierwsza lekcja w 30 sekund</h2>
          <div className="stack" style={{ gap: 12 }}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="chip chip-green">1</span>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Wpisz pytanie na tablicy — np. „wytłumacz funkcję kwadratową”.
              </p>
            </div>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="chip chip-green">2</span>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Asystent narysuje i opowie cały temat krok po kroku.
              </p>
            </div>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="chip chip-green">3</span>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Dodaj powtórkę do planu i sprawdź się quizem.
              </p>
            </div>
          </div>
          <div className="card-flat" style={{ marginTop: 16, background: "#fffdf7" }}>
            <p style={{ fontFamily: "var(--font-hand), cursive", fontSize: 22, margin: 0 }}>
              „Uczenie się jest najfajniejsze, kiedy rozumiesz, a nie tylko pamiętasz.”
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
