import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ArrowIcon, BoardIcon, ChatIcon, PlanIcon, PracticeIcon, SparkIcon, CheckIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: BoardIcon,
    title: "Tablica AI",
    body: "Zadajesz pytanie, a asystent tłumaczy na głos i rysuje krok po kroku. Jak korepetytor przy białej tablicy.",
    href: "/whiteboard",
  },
  {
    icon: ChatIcon,
    title: "Czat, który tłumaczy",
    body: "Zdjęcie zadania, plik z notatkami albo zwykłe pytanie. Odpowiedź dopasowana do twojego stylu nauki.",
    href: "/chat",
  },
  {
    icon: PlanIcon,
    title: "Plan nauki",
    body: "Podaj datę sprawdzianu — plan rozłoży materiał na dni i przypomni, co powtórzyć.",
    href: "/plans",
  },
  {
    icon: PracticeIcon,
    title: "Quizy i fiszki",
    body: "Aktywne powtórki zamiast czytania w kółko. Fiszki same wracają w odpowiednim momencie.",
    href: "/practice",
  },
  {
    icon: SparkIcon,
    title: "Voice Recall",
    body: "Wyjaśnij temat na głos. Aplikacja sprawdzi, czy naprawdę go rozumiesz — i wskaże luki.",
    href: "/plans",
  },
  {
    icon: CheckIcon,
    title: "Notatki społeczności",
    body: "Ściągi, opracowania i pytania od uczniów z całej Polski. Z zawsze aktualnym materiałem.",
    href: "/community",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">n</span>
          <span className="brand-name">
            notara<span>.</span>
          </span>
        </Link>
        <nav className="row" style={{ gap: 14 }}>
          <Link href="/#funkcje" className="muted" style={{ fontWeight: 600 }}>
            Funkcje
          </Link>
          <Link href="/#tablica" className="muted" style={{ fontWeight: 600 }}>
            Tablica
          </Link>
          <Link href="/#plany" className="muted" style={{ fontWeight: 600 }}>
            Cennik
          </Link>
          {user ? (
            <Link href="/home" className="btn btn-primary btn-sm">
              Otwórz Notarę <ArrowIcon width={15} height={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Zaloguj
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Zacznij za darmo
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero" style={{ marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: 28, alignItems: "center" }}>
          <div>
            <div className="eyebrow">AI do nauki · tablica, czat, plan</div>
            <h1 className="hero-title" style={{ marginTop: 12 }}>
              Nie ucz się <em>więcej</em>.
              <br />
              Ucz się <em>mądrzej</em>.
            </h1>
            <p className="muted" style={{ fontSize: 17, maxWidth: 520, marginTop: 16 }}>
              Notara to asystent AI, który tłumaczy na głos, rysuje na tablicy i układa plan powtórek.
              Zamiast kolejnej notatki dostajesz coś, co naprawdę zostaje w głowie.
            </p>
            <div className="row" style={{ marginTop: 22 }}>
              <Link href={user ? "/whiteboard" : "/signup"} className="btn btn-primary btn-lg">
                {user ? "Otwórz tablicę" : "Spróbuj tablicy AI"} <ArrowIcon width={17} height={17} />
              </Link>
              <Link href="/login" className="btn btn-lg">
                Mam już konto
              </Link>
            </div>
            <div className="row" style={{ marginTop: 18, gap: 16 }}>
              <span className="chip chip-green">2 lekcje tablicy za darmo</span>
              <span className="chip">Bez karty</span>
              <span className="chip">Po polsku</span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div
              style={{
                border: "2px solid var(--ink)",
                borderRadius: 18,
                background: "#fffdf7",
                boxShadow: "7px 8px 0 rgba(20,33,28,.16)",
                padding: 16,
                transform: "rotate(-1.2deg)",
              }}
            >
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="chip chip-gold" style={{ fontSize: 11 }}>
                  Tablica AI
                </span>
                <span className="small">lekcja · 2:04</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-hand), cursive",
                  fontSize: 26,
                  lineHeight: 1.25,
                  color: "#14211c",
                  minHeight: 150,
                }}
              >
                <div style={{ fontSize: 17, opacity: 0.6, fontFamily: "var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
                  Funkcja kwadratowa
                </div>
                y = ax² + bx + c
                <div style={{ color: "#d9502c", fontSize: 23 }}>Δ = b² − 4ac</div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8 }}>
                  <svg width="150" height="76" viewBox="0 0 150 76" aria-hidden>
                    <path d="M8 70H146" stroke="#14211c" strokeWidth="1.5" />
                    <path d="M74 74V4" stroke="#14211c" strokeWidth="1.5" />
                    <path d="M26 8 Q74 106 122 8" stroke="#0e4d3a" strokeWidth="3" fill="none" />
                    <circle cx="44" cy="52" r="4" fill="#d9502c" />
                    <circle cx="104" cy="52" r="4" fill="#d9502c" />
                  </svg>
                  <span style={{ fontSize: 19, color: "#0e4d3a" }}>x₁ = 1, x₂ = 3</span>
                </div>
              </div>
            </div>
            <div
              className="chip chip-green"
              style={{ position: "absolute", bottom: -14, left: 10, boxShadow: "2px 3px 0 rgba(20,33,28,.14)" }}
            >
              🔊 Tłumaczy i rysuje jednocześnie
            </div>
          </div>
        </div>
      </section>

      <section id="funkcje" style={{ marginTop: 54 }}>
        <div className="between">
          <div>
            <div className="eyebrow">Wszystko w jednym miejscu</div>
            <h2 style={{ fontSize: 34, marginTop: 6 }}>Sześć narzędzi, jedna codzienna rutyna</h2>
          </div>
          <Link href="/signup" className="btn btn-sm">
            Załóż konto <ArrowIcon width={14} height={14} />
          </Link>
        </div>
        <div className="grid-3" style={{ marginTop: 18 }}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-card">
                <span className="feature-ico">
                  <Icon width={19} height={19} />
                </span>
                <h3>{feature.title}</h3>
                <p className="muted" style={{ fontSize: 13.5 }}>
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="tablica" style={{ marginTop: 54 }}>
        <div className="card" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 26, padding: 28 }}>
          <div>
            <div className="eyebrow">Najważniejsza funkcja</div>
            <h2 style={{ fontSize: 32, marginTop: 6, lineHeight: 1.05 }}>
              Tablica, która tłumaczy tak, jak dobry korepetytor
            </h2>
            <p className="muted" style={{ marginTop: 10 }}>
              Każda lekcja to kilka kroków. Asystent mówi, rysuje i podkreśla najważniejsze fragmenty
              w tej samej chwili. Możesz wstrzymać, wyciszyć głos albo przesunąć tablicę — a potem wrócić
              przyciskiem „Śledź”.
            </p>
            <ul className="stack" style={{ listStyle: "none", padding: 0, marginTop: 14, fontSize: 14 }}>
              <li className="row" style={{ gap: 8 }}>
                <span className="chip chip-green">1</span> Piszesz pytanie albo dodajesz zdjęcie zadania.
              </li>
              <li className="row" style={{ gap: 8 }}>
                <span className="chip chip-green">2</span> Asystent rysuje i tłumaczy krok po kroku.
              </li>
              <li className="row" style={{ gap: 8 }}>
                <span className="chip chip-green">3</span> Dopytujesz na tym samym boardzie, eksportujesz PDF.
              </li>
            </ul>
            <Link href="/whiteboard" className="btn btn-primary" style={{ marginTop: 18 }}>
              Otwórz tablicę <ArrowIcon width={15} height={15} />
            </Link>
          </div>
          <div className="card-flat" style={{ background: "#fffdf7" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="wb-badge">krok 3 z 5</span>
              <span className="small">Miejsce zerowe</span>
            </div>
            <div className="progress" style={{ margin: "10px 0 14px" }}>
              <span style={{ width: "60%" }} />
            </div>
            <div style={{ fontFamily: "var(--font-hand), cursive", fontSize: 27, lineHeight: 1.3 }}>
              0 = 2x + 1
              <br />
              <span style={{ color: "#d9502c" }}>x = −b / a = −0,5</span>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "#55645c", marginTop: 12, lineHeight: 1.6 }}>
                „Miejsce zerowe to argument, dla którego funkcja przyjmuje wartość zero. Na wykresie to
                punkt przecięcia z osią iks.”
              </div>
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <span className="chip">⏸ Pauza</span>
              <span className="chip">🔇 Wycisz</span>
              <span className="chip chip-green">Śledź</span>
              <span className="chip">PDF</span>
            </div>
          </div>
        </div>
      </section>

      <section id="plany" style={{ marginTop: 54 }}>
        <div className="eyebrow">Cennik prosty jak tabliczka mnożenia</div>
        <h2 style={{ fontSize: 32, marginTop: 6 }}>Zacznij za darmo. Pro, kiedy chcesz więcej.</h2>
        <div className="grid-3" style={{ marginTop: 18 }}>
          <div className="card-soft">
            <b style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>Free</b>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "6px 0" }}>0 zł</div>
            <p className="muted" style={{ fontSize: 13.5 }}>Na start i na jeden sprawdzian.</p>
            <ul className="stack" style={{ paddingLeft: 18, fontSize: 13.5, marginTop: 10 }}>
              <li>2 lekcje tablicy w 5 dni</li>
              <li>20 pytań do AI dziennie</li>
              <li>Quizy, fiszki i notatki</li>
            </ul>
          </div>
          <div className="card" style={{ borderColor: "var(--green)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>Pro</b>
              <span className="chip chip-green">Najczęściej wybierany</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "6px 0" }}>29 zł<small style={{ fontSize: 14 }}> / mies.</small></div>
            <p className="muted" style={{ fontSize: 13.5 }}>Codzienna nauka bez limitów.</p>
            <ul className="stack" style={{ paddingLeft: 18, fontSize: 13.5, marginTop: 10 }}>
              <li>Nielimitowane lekcje tablicy</li>
              <li>Nielimitowany czat</li>
              <li>Plany nauki i Voice Recall</li>
              <li>Eksport do PDF</li>
            </ul>
          </div>
          <div className="card-soft">
            <b style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>Max</b>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "6px 0" }}>49 zł<small style={{ fontSize: 14 }}> / mies.</small></div>
            <p className="muted" style={{ fontSize: 13.5 }}>Dla klas i ambitnych maturzystów.</p>
            <ul className="stack" style={{ paddingLeft: 18, fontSize: 13.5, marginTop: 10 }}>
              <li>Wszystko z Pro</li>
              <li>Analiza postępów</li>
              <li>Wspólne tablice z klasą</li>
            </ul>
          </div>
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <Link href="/signup" className="btn btn-primary">
            Załóż darmowe konto
          </Link>
          <span className="small">Bez karty. Bez zobowiązań. Możesz zmienić plan w każdej chwili.</span>
        </div>
      </section>

      <footer style={{ marginTop: 60, paddingTop: 18, borderTop: "1.5px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span className="small">© {new Date().getFullYear()} Notara — projekt edukacyjny. Nie jest powiązany z Knowunity.</span>
        <span className="small">Zbudowane lokalnie: Next.js + Postgres (PGlite) + Supabase-ready.</span>
      </footer>
    </div>
  );
}
