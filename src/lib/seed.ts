import type { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "./password";
import { buildFlashcards, buildQuiz, planLesson } from "./lesson";
import { topicByKey } from "./lesson/topics";

const P = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const N = (n: number) => `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const KASIA = P(1);
const MAREK = P(2);
const OLA = P(3);

const SUBJECTS: Array<[string, string, string, string, number]> = [
  ["matematyka", "Matematyka", "📐", "#2f6f96", 1],
  ["fizyka", "Fizyka", "🔭", "#6b5bbd", 2],
  ["chemia", "Chemia", "⚗️", "#0d7a55", 3],
  ["biologia", "Biologia", "🧬", "#b0562f", 4],
  ["polski", "Język polski", "📚", "#c68a12", 5],
  ["historia", "Historia", "🏛️", "#8b5e3c", 6],
  ["angielski", "Angielski", "🗣️", "#2f6f96", 7],
  ["inne", "Nauka własna", "💡", "#0e4d3a", 8],
];

type SeedNote = {
  id: string;
  author: string;
  title: string;
  slug: string;
  subject: string;
  tags: string[];
  minutes: number;
  days: number;
  featured?: boolean;
  body: string;
};

const NOTES: SeedNote[] = [
  {
    id: N(1),
    author: KASIA,
    title: "Funkcja kwadratowa — ściąga, która naprawdę działa",
    slug: "funkcja-kwadratowa-sciaga",
    subject: "matematyka",
    tags: ["matura", "funkcja kwadratowa", "delta"],
    minutes: 6,
    days: 1,
    featured: true,
    body: `# Funkcja kwadratowa w jednym miejscu

Wszystko, czego potrzebujesz do sprawdzianu, zapisane tak, żeby dało się powtórzyć w 10 minut.

## Postać ogólna

**y = ax² + bx + c**, gdzie **a ≠ 0**.

- **a** decyduje o ramionach: a > 0 w górę, a < 0 w dół
- **b** przesuwa wierzchołek w poziomie
- **c** to miejsce przecięcia z osią OY

## Delta

Δ = b² − 4ac

- Δ > 0 → dwa miejsca zerowe
- Δ = 0 → jedno miejsce zerowe
- Δ < 0 → brak miejsc zerowych

Pierwiastki: x₁,₂ = (−b ± √Δ) / 2a

## Wierzchołek

p = −b / 2a, q = f(p)

Wierzchołek leży dokładnie w połowie drogi między miejscami zerowymi. To najszybszy sposób sprawdzenia wyniku.

## Przykład

y = x² − 4x + 3

1. a = 1, b = −4, c = 3
2. Δ = 16 − 12 = 4
3. √Δ = 2
4. x₁ = 1, x₂ = 3
5. p = 2, q = −1

> Najczęstszy błąd: zgubienie minusa przy b. Dla b = −4 wzór ma −(−4), czyli +4.

## Co powtórzyć przed sprawdzianem

- postać iloczynowa i kanoniczna
- zaznaczanie wierzchołka na wykresie
- zadania z parametrem`,
  },
  {
    id: N(2),
    author: OLA,
    title: "Fotosynteza w 7 punktach",
    slug: "fotosynteza-w-7-punktach",
    subject: "biologia",
    tags: ["fotosynteza", "biologia", "matura"],
    minutes: 4,
    days: 2,
    featured: true,
    body: `# Fotosynteza bez wkuwania

Równanie, które trzeba znać:

**6CO₂ + 6H₂O + światło → C₆H₁₂O₆ + 6O₂**

## Siedem rzeczy, które musisz wiedzieć

1. Zachodzi w **chloroplastach**.
2. **Faza jasna** — w tylakoidach, wymaga światła, uwalnia tlen.
3. **Cykl Calvina** — w stromie, buduje glukozę z CO₂.
4. Chlorofil pochłania głównie światło **czerwone i niebieskie**.
5. Czynniki ograniczające: **światło, CO₂, temperatura**.
6. Produkt uboczny — **tlen**, bez którego nie byłoby życia.
7. Fotosynteza i oddychanie komórkowe to procesy **odwrotne**.

> Na maturze często pojawia się wykres tempa fotosyntezy. Szukaj plateau — to znak czynnika ograniczającego.

## Jak to zapamiętać

Wyobraź sobie kuchnię: światło to prąd, CO₂ i woda to składniki, a glukoza to gotowe danie. Bez prądu kuchnia nie działa, choćby składników było najwięcej.`,
  },
  {
    id: N(3),
    author: MAREK,
    title: "Prawo Ohma — wszystkie przekształcenia",
    slug: "prawo-ohma-przeksztalcenia",
    subject: "fizyka",
    tags: ["prąd", "ohm", "fizyka"],
    minutes: 3,
    days: 3,
    body: `# Prawo Ohma

Trójkąt, który rozwiązuje 90% zadań:

**U = I · R**

- U — napięcie [V]
- I — natężenie [A]
- R — opór [Ω]

## Przekształcenia

- I = U / R
- R = U / I

## Połączenia

**Szeregowo:** R = R₁ + R₂ + …
Prąd jest wszędzie taki sam, napięcia się dodają.

**Równolegle:** 1/R = 1/R₁ + 1/R₂ + …
Napięcie jest takie samo, prądy się dodają.

## Moc

P = U · I = I² · R = U² / R

Energia: E = P · t

> Pamiętaj o jednostkach. 1 kW = 1000 W, a 1 kWh to energia, nie moc.`,
  },
  {
    id: N(4),
    author: OLA,
    title: "Present Perfect vs Past Simple — koniec z mieszaniem",
    slug: "present-perfect-vs-past-simple",
    subject: "angielski",
    tags: ["angielski", "gramatyka", "czasy"],
    minutes: 4,
    days: 4,
    body: `# Dwa czasy, jedna decyzja

Zadaj sobie jedno pytanie: **czy podaję konkretny czas w przeszłości?**

- TAK → past simple
- NIE → present perfect

## Present Perfect

**have / has + III forma**

- I have lost my keys. (nadal ich nie mam)
- She has just left.
- Have you ever been to London?

Sygnały: ever, never, just, already, yet, since, for.

## Past Simple

**II forma**

- I lost my keys yesterday.
- She left two hours ago.
- Did you go to London in 2020?

Sygnały: yesterday, last week, in 2020, ago.

> „I have seen him yesterday” to błąd. Z yesterday zawsze past simple.

## Szybki test

1. I ___ (finish) my homework — I can go out now. → **have finished**
2. We ___ (watch) that film last night. → **watched**
3. She ___ (never / try) sushi. → **has never tried**`,
  },
  {
    id: N(5),
    author: MAREK,
    title: "Jak napisać rozprawkę, która dostaje maks punktów",
    slug: "rozprawka-maks-punktow",
    subject: "polski",
    tags: ["polski", "wypracowanie", "matura"],
    minutes: 5,
    days: 5,
    body: `# Rozprawka krok po kroku

## Szkielet

1. **Wstęp** — kontekst + teza
2. **Rozwinięcie** — trzy argumenty
3. **Zakończenie** — powrót do tezy

## Teza, nie temat

Źle: „W pracy omówię temat samotności.”
Dobrze: „Samotność bohatera wynika z lęku przed odrzuceniem, a nie z pychy.”

Teza musi być **sporna** — ktoś powinien móc się z nią nie zgodzić.

## Akapit = T + P + K

- **T** — twierdzenie
- **P** — przykład z lektury
- **K** — komentarz wracający do tezy

## Plan czasu

- 5 min — plan i teza
- 25 min — pisanie
- 5 min — sprawdzenie

> Bez komentarza przykład nic nie wnosi. To komentarz łączy dowód z twoją tezą.`,
  },
  {
    id: N(6),
    author: KASIA,
    title: "Mol, stężenie i rozcieńczanie — notatka z zadaniami",
    slug: "mol-stezenie-rozcienczanie",
    subject: "chemia",
    tags: ["chemia", "mol", "stężenie"],
    minutes: 5,
    days: 6,
    body: `# Mol bez stresu

## Trzy wzory

- **n = m / M** — liczba moli
- **C = n / V** — stężenie molowe (V w dm³)
- **C₁V₁ = C₂V₂** — rozcieńczanie

## Stała Avogadra

1 mol = 6,02 · 10²³ cząsteczek.

## Przykład 1

Ile moli jest w 36 g wody? M(H₂O) = 18 g/mol.
n = 36 / 18 = **2 mol**.

## Przykład 2

0,5 mola w 2 dm³ roztworu.
C = 0,5 / 2 = **0,25 mol/dm³**.

## Przykład 3

Rozcieńczamy 0,5 dm³ roztworu 2 mol/dm³ do 2 dm³.
C₂ = (2 · 0,5) / 2 = **0,5 mol/dm³**.

> Najczęstszy błąd: mililitry zamiast decymetrów sześciennych. 250 ml = 0,25 dm³.`,
  },
];

const QUESTIONS: Array<{
  id: string;
  author: string;
  title: string;
  body: string;
  subject: string;
  days: number;
  resolved?: boolean;
  answers: Array<{ author: string; body: string; votes: number; accepted?: boolean; days: number }>;
}> = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    author: MAREK,
    title: "Dlaczego delta ujemna oznacza brak miejsc zerowych?",
    body: "Rozumiem wzór, ale nie rozumiem, co fizycznie oznacza ujemna delta. Może mi to ktoś wytłumaczyć na wykresie?",
    subject: "matematyka",
    days: 1,
    resolved: true,
    answers: [
      {
        author: KASIA,
        body: "Delta ujemna oznacza, że parabola w ogóle nie przecina osi x — cała leży nad osią (gdy a > 0) albo pod nią (gdy a < 0). We wzorze pojawia się √Δ, a pierwiastek z liczby ujemnej nie istnieje w liczbach rzeczywistych. Dlatego nie ma rzeczywistych miejsc zerowych.",
        votes: 14,
        accepted: true,
        days: 1,
      },
      {
        author: OLA,
        body: "Dodam intuicję: delta to taki „zapas” między wierzchołkiem a osią x. Gdy jest ujemna, wierzchołek jest po złej stronie osi i parabola nigdy jej nie dotknie.",
        votes: 6,
        days: 2,
      },
    ],
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    author: OLA,
    title: "Present perfect — kiedy „for”, a kiedy „since”?",
    body: "Ciągle mylę te dwa słowa. Macie jakiś prosty sposób, żeby to zapamiętać?",
    subject: "angielski",
    days: 2,
    answers: [
      {
        author: MAREK,
        body: "For + długość okresu (for two years, for ten minutes). Since + punkt w czasie (since 2020, since Monday). Test: jeśli odpowiedź brzmi „jak długo”, to for. Jeśli „od kiedy”, to since.",
        votes: 9,
        accepted: true,
        days: 2,
      },
    ],
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    author: KASIA,
    title: "Jak szybko nauczyć się nazw organelli komórki?",
    body: "Mam sprawdzian w piątek i ciągle mylę mitochondrium z rybosomem. Jakieś sprawdzone metody?",
    subject: "biologia",
    days: 3,
    answers: [
      {
        author: OLA,
        body: "Skorzystaj z fiszek i skojarzeń: mitochondrium = elektrownia (ATP), rybosom = fabryka białek. Do tego rysunek komórki z podpisami — rysowanie działa lepiej niż czytanie. Na koniec Voice Recall: wyjaśnij wszystko na głos bez notatek.",
        votes: 11,
        days: 3,
      },
    ],
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    author: MAREK,
    title: "Szeregowe czy równoległe — jak rozpoznać na schemacie?",
    body: "Mam problem z zadaniami, gdzie jest kilka oporników. Jak od razu wiedzieć, które połączenie jest które?",
    subject: "fizyka",
    days: 4,
    answers: [],
  },
];

function bodyOf(note: SeedNote): string {
  return note.body.trim();
}

function pgArray(values: string[]): string {
  return `{${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

export async function seedDatabase(db: PGlite): Promise<void> {
  const count = await db.query<{ n: number }>("select count(*)::int as n from profiles");
  if ((count.rows[0]?.n ?? 0) > 0) return;

  const password = hashPassword("notara123");

  const users: Array<[string, string, string, string, string, string, number, string, number, string]> = [
    [KASIA, "kasia", "kasia@notara.app", "Kasia Nowak", "LO im. Marii Skłodowskiej-Curie", "klasa 2", 12, "pro", 2450, "Uczę się do matury i zbieram notatki z biologii. Kocham rysować na tablicy."],
    [MAREK, "marek", "marek@notara.app", "Marek Wiśniewski", "Technikum Łączności", "klasa 3", 5, "free", 1780, "Fizyka i angielski. Zawsze mam jakieś pytanie."],
    [OLA, "ola", "ola@notara.app", "Ola Zielińska", "LO nr 4", "klasa 1", 21, "free", 3120, "Biologia to moje życie. Fiszki ratują mi życie przed sprawdzianami."],
  ];

  for (const [id, username, email, display, school, grade, streak, plan, xp, bio] of users) {
    await db.query(
      `insert into profiles (id, username, email, password_hash, display_name, bio, school, grade, avatar_hue, plan, xp, streak, last_active, persona_vibe, persona_warmth, persona_emojis)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,current_date,$13,$14,$15)`,
      [
        id,
        username,
        email,
        password,
        display,
        bio,
        school,
        grade,
        username === "kasia" ? 152 : username === "marek" ? 212 : 28,
        plan,
        xp,
        streak,
        username === "kasia" ? "friend" : "teacher",
        3,
        username === "kasia" ? 2 : 1,
      ],
    );
  }

  for (const [slug, name, emoji, color, sort] of SUBJECTS) {
    await db.query("insert into subjects (slug, name, emoji, color, sort) values ($1,$2,$3,$4,$5)", [
      slug,
      name,
      emoji,
      color,
      sort,
    ]);
  }

  for (const note of NOTES) {
    await db.query(
      `insert into notes (id, author_id, title, slug, subject_slug, body, tags, read_minutes, featured, created_at)
       values ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9, now() - ($10 || ' days')::interval)`,
      [
        note.id,
        note.author,
        note.title,
        note.slug,
        note.subject,
        bodyOf(note),
        pgArray(note.tags),
        note.minutes,
        note.featured ?? false,
        String(note.days),
      ],
    );
  }

  const likes: Array<[string, string, number]> = [
    [KASIA, N(2), 1],
    [KASIA, N(4), 2],
    [MAREK, N(1), 1],
    [MAREK, N(5), 3],
    [OLA, N(1), 1],
    [OLA, N(3), 2],
    [OLA, N(6), 4],
    [KASIA, N(3), 2],
    [MAREK, N(2), 2],
    [MAREK, N(6), 5],
    [OLA, N(5), 4],
  ];
  for (const [user, note, days] of likes) {
    await db.query(
      "insert into note_likes (user_id, note_id, created_at) values ($1,$2, now() - ($3 || ' days')::interval) on conflict do nothing",
      [user, note, String(days)],
    );
  }

  const comments: Array<[string, string, string, number]> = [
    [N(1), OLA, "Ta ściąga uratowała mnie przed sprawdzianem, dzięki!", 0],
    [N(1), MAREK, "Warto dodać jeszcze przykład z deltą = 0.", 1],
    [N(2), KASIA, "Kuchnia jako analogia jest genialna.", 1],
    [N(4), KASIA, "Wreszcie rozumiem różnicę. Test na końcu super.", 2],
  ];
  for (const [note, author, body, days] of comments) {
    await db.query(
      "insert into note_comments (id, note_id, author_id, body, created_at) values ($1,$2,$3,$4, now() - ($5 || ' days')::interval)",
      [crypto.randomUUID(), note, author, body, String(days)],
    );
  }

  for (const question of QUESTIONS) {
    await db.query(
      `insert into questions (id, author_id, title, body, subject_slug, resolved, created_at)
       values ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval)`,
      [
        question.id,
        question.author,
        question.title,
        question.body,
        question.subject,
        question.resolved ?? false,
        String(question.days),
      ],
    );
    for (const answer of question.answers) {
      await db.query(
        `insert into answers (id, question_id, author_id, body, votes, accepted, created_at)
         values ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval)`,
        [
          crypto.randomUUID(),
          question.id,
          answer.author,
          answer.body,
          answer.votes,
          answer.accepted ?? false,
          String(answer.days),
        ],
      );
    }
  }

  const quadratic = topicByKey("quadratic");
  const photosynthesis = topicByKey("photosynthesis");

  const boardOne = planLesson("funkcja kwadratowa delta i wierzchołek");
  const boardTwo = planLesson("fotosynteza faza jasna i cykl Calvina");

  await db.query(
    `insert into boards (id, user_id, title, prompt, subject_slug, lesson, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6::jsonb, now() - interval '2 days', now() - interval '2 days')`,
    [
      "d0000000-0000-4000-8000-000000000001",
      KASIA,
      boardOne.title,
      boardOne.prompt,
      "matematyka",
      JSON.stringify(boardOne),
    ],
  );
  await db.query(
    `insert into boards (id, user_id, title, prompt, subject_slug, lesson, created_at, updated_at)
     values ($1,$2,$3,$4,$5,$6::jsonb, now() - interval '6 days', now() - interval '6 days')`,
    [
      "d0000000-0000-4000-8000-000000000002",
      KASIA,
      boardTwo.title,
      boardTwo.prompt,
      "biologia",
      JSON.stringify(boardTwo),
    ],
  );

  const quiz = buildQuiz(quadratic, 5);
  await db.query(
    `insert into quizzes (id, user_id, title, subject_slug, topic, questions, created_at)
     values ($1,$2,$3,$4,$5,$6::jsonb, now() - interval '3 days')`,
    [
      "e0000000-0000-4000-8000-000000000001",
      KASIA,
      "Funkcja kwadratowa — szybka powtórka",
      "matematyka",
      quadratic.title,
      JSON.stringify(quiz),
    ],
  );

  const cards = buildFlashcards(photosynthesis);
  await db.query(
    "insert into flashcard_sets (id, user_id, title, subject_slug, created_at) values ($1,$2,$3,$4, now() - interval '4 days')",
    ["f0000000-0000-4000-8000-000000000001", KASIA, "Fotosynteza — 4 karty", "biologia"],
  );
  for (const card of cards) {
    await db.query("insert into flashcards (id, set_id, front, back) values ($1,$2,$3,$4)", [
      crypto.randomUUID(),
      "f0000000-0000-4000-8000-000000000001",
      card.front,
      card.back,
    ]);
  }

  await db.query("insert into folders (id, user_id, name) values ($1,$2,$3), ($4,$5,$6)", [
    "a1000000-0000-4000-8000-000000000001",
    KASIA,
    "Biologia",
    "a1000000-0000-4000-8000-000000000002",
    KASIA,
    "Matematyka",
  ]);

  await db.query(
    `insert into uploads (id, user_id, folder_id, filename, mime, bytes, content, summary, subject_slug, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() - interval '2 days')`,
    [
      "a2000000-0000-4000-8000-000000000001",
      KASIA,
      "a1000000-0000-4000-8000-000000000001",
      "fotosynteza-notatki.txt",
      "text/plain",
      4820,
      "Fotosynteza zachodzi w chloroplastach. Faza jasna w tylakoidach, cykl Calvina w stromie. Czynniki ograniczające: światło, CO2, temperatura.",
      "Trzy najważniejsze informacje: chloroplasty, dwie fazy, czynniki ograniczające. Dodaj wykres tempa fotosyntezy.",
      "biologia",
    ],
  );

  const plan: Array<[string, string, string, string, string, number, boolean]> = [
    ["Sprawdzian: funkcja kwadratowa", "matematyka", "exam", "2026-11-24", "Delta, wierzchołek, postać kanoniczna. Powtórzyć zadania z parametrem.", 60, false],
    ["Powtórka: fotosynteza", "biologia", "task", "2026-11-19", "Fiszki + Voice Recall", 25, false],
    ["Angielski: present perfect", "angielski", "task", "2026-11-21", "10 zdań z for/since", 20, false],
    ["Wypracowanie: Makbet", "polski", "task", "2026-11-27", "Teza + 3 argumenty", 45, false],
    ["Matura próbna: matematyka", "matematyka", "exam", "2026-12-10", "Poziom podstawowy, 180 min", 180, false],
    ["Powtórka: prawo Ohma", "fizyka", "task", "2026-11-18", "Zadania z oporem zastępczym", 30, true],
  ];
  for (const [title, subject, kind, due, notes, estimate, done] of plan) {
    await db.query(
      `insert into plan_items (id, user_id, title, subject_slug, kind, due_date, estimate_min, done, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [crypto.randomUUID(), KASIA, title, subject, kind, due, estimate, done, notes],
    );
  }

  await db.query(
    `insert into plan_items (id, user_id, title, subject_slug, kind, due_date, estimate_min, done)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [crypto.randomUUID(), MAREK, "Sprawdzian: prąd elektryczny", "fizyka", "exam", "2026-11-20", 60, false],
  );

  const notifications: Array<[string, string, string, boolean, number]> = [
    ["like", "Ola polubiła twoją notatkę o funkcji kwadratowej.", "/notes/funkcja-kwadratowa-sciaga", false, 0],
    ["answer", "Marek odpowiedział na twoje pytanie o organelle.", "/questions", false, 1],
    ["streak", "12 dni z rzędu — tak trzymaj! 🔥", "/leaderboard", false, 2],
    ["system", "Nowy quiz tygodnia: funkcja kwadratowa.", "/practice", true, 4],
  ];
  for (const [kind, body, href, read, days] of notifications) {
    await db.query(
      `insert into notifications (id, user_id, kind, body, href, read, created_at)
       values ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval)`,
      [crypto.randomUUID(), KASIA, kind, body, href, read, String(days)],
    );
  }

  await db.query(
    `insert into point_events (id, user_id, kind, amount, note, created_at)
     values
       ($1,$2,'lesson',40,'Lekcja: funkcja kwadratowa', now() - interval '2 days'),
       ($3,$2,'quiz',60,'Quiz: funkcja kwadratowa', now() - interval '3 days'),
       ($4,$2,'note',50,'Notatka: funkcja kwadratowa', now() - interval '1 days'),
       ($5,$2,'streak',30,'Seria 10 dni', now() - interval '2 days')`,
    [crypto.randomUUID(), KASIA, crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()],
  );

  await db.query(
    `insert into chats (id, user_id, title, mode, created_at, updated_at)
     values ($1,$2,$3,'chat', now() - interval '2 days', now() - interval '2 days')`,
    ["a3000000-0000-4000-8000-000000000001", KASIA, "Fotosynteza — pytanie"],
  );
  const chatMessages: Array<[string, string, string]> = [
    ["user", "Czy możesz mi wyjaśnić, czym różni się faza jasna od cyklu Calvina?", "Fotosynteza"],
    [
      "assistant",
      "Jasne! **Faza jasna** zachodzi w błonach tylakoidów i wymaga światła. W jej trakcie woda jest rozkładana, uwalniany jest tlen i powstają ATP oraz NADPH.\n\n**Cykl Calvina** zachodzi w stromie i nie potrzebuje światła bezpośrednio. Wykorzystuje ATP i NADPH z fazy jasnej, żeby z CO₂ zbudować glukozę.\n\nNajprostsza analogia: faza jasna to ładowanie baterii, a cykl Calvina to praca, którą dzięki nim wykonujesz.",
      "",
    ],
    ["user", "A dlaczego tlen jest produktem ubocznym?", "Fotosynteza"],
    [
      "assistant",
      "Bo w fazie jasnej trzeba zdobyć elektrony do zasilenia procesu. Roślina rozbija wodę, a tlen zostaje „odrzucony” jako produkt uboczny. Dla rośliny to odpad, dla nas — warunek życia.\n\nChcesz, żebym rozrysował to na tablicy?",
      "",
    ],
  ];
  for (const [role, content, attachment] of chatMessages) {
    await db.query(
      "insert into chat_messages (id, chat_id, role, content, attachment, created_at) values ($1,$2,$3,$4,$5, now() - interval '2 days')",
      [crypto.randomUUID(), "a3000000-0000-4000-8000-000000000001", role, content, attachment || null],
    );
  }

  await db.query("insert into app_meta (key, value) values ('seed', '1') on conflict do nothing");
}
