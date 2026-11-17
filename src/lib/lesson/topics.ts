import type { Step } from "./types";
import { linearLesson, pythagorasLesson, quadraticLesson } from "./math";
import { derivativeLesson, percentLesson, probabilityLesson } from "./more";
import { atomLesson, cellLesson, dnaLesson, kinematicsLesson, molesLesson, newtonLesson, ohmLesson, photosynthesisLesson, phLesson } from "./science";
import { englishLesson, essayLesson, genericLesson, historyLesson } from "./human";

export type Built = { steps: Step[]; takeaways: string[]; followUps: string[] };

export type SubjectSlug = "matematyka" | "fizyka" | "chemia" | "biologia" | "polski" | "historia" | "angielski" | "inne";

export type Topic = {
  key: string;
  subject: SubjectSlug;
  emoji: string;
  title: string;
  subtitle: string;
  keywords: string[];
  build: (prompt: string) => Built;
  glossary: Array<[string, string]>;
};

export const SUBJECTS: Record<SubjectSlug, { name: string; emoji: string; color: string }> = {
  matematyka: { name: "Matematyka", emoji: "📐", color: "#2f6f96" },
  fizyka: { name: "Fizyka", emoji: "🔭", color: "#6b5bbd" },
  chemia: { name: "Chemia", emoji: "⚗️", color: "#0d7a55" },
  biologia: { name: "Biologia", emoji: "🧬", color: "#b0562f" },
  polski: { name: "Język polski", emoji: "📚", color: "#c68a12" },
  historia: { name: "Historia", emoji: "🏛️", color: "#8b5e3c" },
  angielski: { name: "Angielski", emoji: "🗣️", color: "#2f6f96" },
  inne: { name: "Nauka własna", emoji: "💡", color: "#0e4d3a" },
};

export const TOPICS: Topic[] = [
  {
    key: "linear",
    subject: "matematyka",
    emoji: "📈",
    title: "Funkcja liniowa",
    subtitle: "wzór, wykres, miejsce zerowe",
    keywords: ["funkcja liniowa", "liniow", "y=ax", "y = ax", "nachylenie", "miejsce zerowe", "prosta y", "współczynnik kierunkowy"],
    build: linearLesson,
    glossary: [
      ["Funkcja liniowa", "funkcja postaci y = ax + b, której wykresem jest linia prosta"],
      ["Współczynnik kierunkowy a", "liczba określająca nachylenie prostej; a > 0 rośnie, a < 0 maleje"],
      ["Wyraz wolny b", "miejsce przecięcia wykresu z osią OY, czyli wartość dla x = 0"],
      ["Miejsce zerowe", "argument, dla którego funkcja przyjmuje wartość 0; x = −b/a"],
      ["Prosta", "zbiór punktów o stałym nachyleniu, wyznaczony przez dwa punkty"],
    ],
  },
  {
    key: "quadratic",
    subject: "matematyka",
    emoji: "🎢",
    title: "Funkcja kwadratowa",
    subtitle: "parabola, delta, wierzchołek",
    keywords: ["kwadratow", "parabol", "delta", "wierzchołek", "x2", "x²", "postać kanoniczna", "postać iloczynowa"],
    build: quadraticLesson,
    glossary: [
      ["Funkcja kwadratowa", "funkcja postaci y = ax² + bx + c, gdzie a ≠ 0"],
      ["Delta", "wyrażenie Δ = b² − 4ac; jego znak mówi, ile jest miejsc zerowych"],
      ["Wierzchołek paraboli", "najwyższy lub najniższy punkt wykresu; p = −b/2a, q = f(p)"],
      ["Parabola", "krzywa będąca wykresem funkcji kwadratowej"],
      ["Postać iloczynowa", "zapis a(x − x₁)(x − x₂) używający miejsc zerowych"],
    ],
  },
  {
    key: "pythagoras",
    subject: "matematyka",
    emoji: "📐",
    title: "Twierdzenie Pitagorasa",
    subtitle: "trójkąt prostokątny bez tajemnic",
    keywords: ["pitagoras", "przeciwprostokątn", "przyprostokątn", "trójkąt prostokątn", "a2+b2", "a² + b²"],
    build: pythagorasLesson,
    glossary: [
      ["Przeciwprostokątna", "najdłuższy bok trójkąta prostokątnego, leżący naprzeciw kąta prostego"],
      ["Przyprostokątne", "dwa boki trójkąta prostokątnego tworzące kąt prosty"],
      ["Twierdzenie Pitagorasa", "w trójkącie prostokątnym a² + b² = c²"],
      ["Trójkąt pitagorejski", "trójkąt prostokątny o bokach będących liczbami całkowitymi, np. 3–4–5"],
    ],
  },
  {
    key: "percent",
    subject: "matematyka",
    emoji: "％",
    title: "Procenty",
    subtitle: "podwyżki, obniżki, zmiany",
    keywords: ["procent", "%", "podwyżk", "obniżk", "rabat", "vAT", "wzrost o", "spadek o", "procent składany"],
    build: percentLesson,
    glossary: [
      ["Procent", "setna część całości; 1% = 0,01"],
      ["Punkt procentowy", "różnica między dwiema wartościami procentowymi, np. 5% i 7% to 2 punkty procentowe"],
      ["Zmiana procentowa", "różnica wartości podzielona przez wartość początkową, wyrażona w procentach"],
      ["Procent składany", "wielokrotne naliczanie procentu od powiększonej już wartości"],
    ],
  },
  {
    key: "derivative",
    subject: "matematyka",
    emoji: "📉",
    title: "Pochodna funkcji",
    subtitle: "styczna, ekstrema, monotoniczność",
    keywords: ["pochodn", "styczn", "ekstremum", "monotoniczno", "f'(x)", "f prim"],
    build: derivativeLesson,
    glossary: [
      ["Pochodna", "granica ilorazu różnicowego; geometrycznie nachylenie stycznej do wykresu"],
      ["Styczna", "prosta dotykająca wykresu w jednym punkcie, o nachyleniu równym pochodnej"],
      ["Ekstremum", "minimum lub maksimum lokalne, gdzie pochodna zmienia znak"],
      ["Monotoniczność", "przedziały, na których funkcja rośnie lub maleje"],
    ],
  },
  {
    key: "probability",
    subject: "matematyka",
    emoji: "🎲",
    title: "Prawdopodobieństwo",
    subtitle: "kostki, drzewka, zdarzenia",
    keywords: ["prawdopodobieństw", "kostk", "losow", "drzewk", "zdarzenie przeciwne", "kombinatoryk"],
    build: probabilityLesson,
    glossary: [
      ["Prawdopodobieństwo", "stosunek liczby wyników sprzyjających do liczby wszystkich wyników"],
      ["Zdarzenie przeciwne", "wszystkie wyniki nie należące do zdarzenia A; P(A') = 1 − P(A)"],
      ["Zdarzenia niezależne", "zdarzenia, których wystąpienie nie wpływa na siebie; P(A i B) = P(A)·P(B)"],
      ["Przestrzeń zdarzeń", "zbiór wszystkich możliwych wyników doświadczenia losowego"],
    ],
  },
  {
    key: "kinematics",
    subject: "fizyka",
    emoji: "🚀",
    title: "Ruch jednostajnie przyspieszony",
    subtitle: "prędkość, droga, wykresy",
    keywords: ["przyspieszen", "prędkoś", "ruch", "droga", "v0", "v₀", "kinematyk", "hamowani"],
    build: kinematicsLesson,
    glossary: [
      ["Przyspieszenie", "zmiana prędkości w jednostce czasu; a = Δv/t, jednostka m/s²"],
      ["Prędkość końcowa", "v = v₀ + a·t"],
      ["Droga", "s = v₀·t + ½·a·t² w ruchu jednostajnie przyspieszonym"],
      ["Wykres v(t)", "nachylenie to przyspieszenie, a pole pod wykresem to droga"],
    ],
  },
  {
    key: "newton",
    subject: "fizyka",
    emoji: "🍎",
    title: "Zasady dynamiki Newtona",
    subtitle: "siły, masa, bezwładność",
    keywords: ["newton", "dynamik", "siła", "sił", "bezwładno", "tarcie", "F=ma", "wypadkow"],
    build: newtonLesson,
    glossary: [
      ["I zasada dynamiki", "ciało pozostaje w spoczynku lub w ruchu jednostajnym, gdy siła wypadkowa wynosi zero"],
      ["II zasada dynamiki", "F = m·a; siła wypadkowa nadaje ciału przyspieszenie"],
      ["III zasada dynamiki", "każdej akcji towarzyszy równa i przeciwnie skierowana reakcja"],
      ["Tarcie", "siła przeciwdziałająca ruchowi, zależna od nacisku i współczynnika tarcia"],
    ],
  },
  {
    key: "ohm",
    subject: "fizyka",
    emoji: "🔌",
    title: "Prawo Ohma",
    subtitle: "napięcie, prąd, opór",
    keywords: ["ohm", "napięc", "prąd", "opór", "opor", "amper", "wolt", "moc prądu", "obwód"],
    build: ohmLesson,
    glossary: [
      ["Prawo Ohma", "U = I·R; napięcie równa się iloczynowi natężenia i oporu"],
      ["Napięcie", "różnica potencjałów, mierzona w woltach [V]"],
      ["Natężenie prądu", "ładunek przepływający w jednostce czasu, w amperach [A]"],
      ["Opór zastępczy", "jeden opór równoważny układowi; szeregowo się dodaje, równolegle odwrotności"],
    ],
  },
  {
    key: "atom",
    subject: "chemia",
    emoji: "⚛️",
    title: "Budowa atomu",
    subtitle: "protony, neutrony, elektrony",
    keywords: ["atom", "proton", "neutron", "elektron", "izotop", "powłok", "konfiguracj", "jon", "układ okresowy"],
    build: atomLesson,
    glossary: [
      ["Liczba atomowa Z", "liczba protonów w jądrze; decyduje o tym, jaki to pierwiastek"],
      ["Liczba masowa A", "suma protonów i neutronów w jądrze"],
      ["Izotopy", "atomy tego samego pierwiastka różniące się liczbą neutronów"],
      ["Elektrony walencyjne", "elektrony z ostatniej powłoki, decydujące o właściwościach chemicznych"],
      ["Kation", "jon dodatni powstający przez oddanie elektronów"],
    ],
  },
  {
    key: "moles",
    subject: "chemia",
    emoji: "🧪",
    title: "Mol i stężenie molowe",
    subtitle: "liczenie cząsteczek bez liczenia",
    keywords: ["mol", "stężenie molowe", "avogadr", "masa molowa", "roztwór", "rozcieńczan", "dm3"],
    build: molesLesson,
    glossary: [
      ["Mol", "porcja substancji zawierająca 6,02·10²³ cząsteczek"],
      ["Stała Avogadra", "Nₐ = 6,02·10²³ mol⁻¹"],
      ["Masa molowa", "masa jednego mola substancji w g/mol, liczbowo równa masie cząsteczkowej"],
      ["Stężenie molowe", "C = n/V, liczba moli na decymetr sześcienny roztworu"],
    ],
  },
  {
    key: "ph",
    subject: "chemia",
    emoji: "🧫",
    title: "Skala pH",
    subtitle: "kwasy, zasady, zobojętnianie",
    keywords: ["ph", "kwas", "zasada", "wodorotlen", "zobojętnian", "wskaźnik", "fenoloftaleina"],
    build: phLesson,
    glossary: [
      ["pH", "ujemny logarytm dziesiętny stężenia jonów wodorowych"],
      ["Odczyn obojętny", "pH równe 7, jak w czystej wodzie"],
      ["Zobojętnianie", "reakcja kwasu z zasadą, w której powstaje sól i woda"],
      ["Wskaźnik", "substancja zmieniająca kolor w zależności od pH roztworu"],
    ],
  },
  {
    key: "cell",
    subject: "biologia",
    emoji: "🔬",
    title: "Budowa komórki",
    subtitle: "organelle i ich funkcje",
    keywords: ["komórk", "organell", "mitochondri", "rybosom", "jądro komórk", "chloroplast", "błona komórkow"],
    build: cellLesson,
    glossary: [
      ["Mitochondrium", "organellum, w którym zachodzi oddychanie komórkowe i powstaje ATP"],
      ["Rybosom", "miejsce syntezy białek z instrukcji mRNA"],
      ["Chloroplast", "organellum komórki roślinnej, w którym zachodzi fotosynteza"],
      ["Wakuola", "pęcherz magazynujący wodę i substancje; w komórce roślinnej jest duża"],
      ["ATP", "uniwersalna waluta energii komórki"],
    ],
  },
  {
    key: "photosynthesis",
    subject: "biologia",
    emoji: "🌿",
    title: "Fotosynteza",
    subtitle: "światło, chlorofil, glukoza",
    keywords: ["fotosyntez", "chlorofil", "chloroplast", "cykl calvina", "tlen", "roślin"],
    build: photosynthesisLesson,
    glossary: [
      ["Fotosynteza", "proces wytwarzania glukozy ze światła, CO₂ i wody, z wydzieleniem tlenu"],
      ["Faza jasna", "etap w tylakoidach, w którym powstają ATP i NADPH oraz uwalniany jest tlen"],
      ["Cykl Calvina", "etap w stromie, w którym z CO₂ powstaje glukoza"],
      ["Czynnik ograniczający", "składnik, którego brakuje najbardziej i który wyznacza tempo procesu"],
    ],
  },
  {
    key: "dna",
    subject: "biologia",
    emoji: "🧬",
    title: "DNA i dziedziczenie",
    subtitle: "geny, replikacja, krzyżówki",
    keywords: ["dna", "gen", "mendel", "dziedzicz", "allel", "kodon", "replikacj", "rna", "mutacj"],
    build: dnaLesson,
    glossary: [
      ["Nukleotyd", "jednostka DNA złożona z cukru, fosforanu i zasady azotowej"],
      ["Komplementarność", "zasada łączenia A–T oraz C–G w podwójnej helisie"],
      ["Replikacja", "kopiowanie DNA przed podziałem komórki; semikonserwatywna"],
      ["Kodon", "trzy kolejne zasady mRNA kodujące jeden aminokwas"],
      ["Allele", "wersje tego samego genu, po jednym od każdego rodzica"],
    ],
  },
  {
    key: "essay",
    subject: "polski",
    emoji: "✍️",
    title: "Wypracowanie",
    subtitle: "teza, argumenty, kompozycja",
    keywords: ["wypracowani", "rozprawk", "charakterystyk", "esej", "teza", "argument", "lektura", "wstęp", "zakończeni"],
    build: essayLesson,
    glossary: [
      ["Teza", "stanowisko autora, które tekst ma udowodnić"],
      ["Argument", "uzasadnienie tezy oparte na przykładzie z tekstu lub lektury"],
      ["Kompozycja", "uporządkowanie pracy: wstęp, rozwinięcie, zakończenie"],
      ["Kompetencje literackie", "umiejętność analizy i interpretacji tekstu, oceniana w kryteriach"],
    ],
  },
  {
    key: "history",
    subject: "historia",
    emoji: "🏛️",
    title: "Analiza wydarzenia historycznego",
    subtitle: "przyczyny, przebieg, skutki",
    keywords: ["histor", "powstani", "wojn", "rewolucj", "przyczyn", "skutk", "źródło historyczn", "dat"],
    build: historyLesson,
    glossary: [
      ["Przyczyna bezpośrednia", "bezpośredni wyzwalacz wydarzenia, działający tuż przed nim"],
      ["Skutek długofalowy", "konsekwencja widoczna dopiero po latach lub dekadach"],
      ["Krytyka źródła", "ocena pochodzenia, celu i wiarygodności materiału historycznego"],
      ["Anachronizm", "błąd polegający na przypisaniu zjawiska do niewłaściwej epoki"],
    ],
  },
  {
    key: "english",
    subject: "angielski",
    emoji: "🗣️",
    title: "Present Perfect",
    subtitle: "have/has + III forma",
    keywords: ["present perfect", "past simple", "angielsk", "czas", "have been", "irregular", "for since"],
    build: englishLesson,
    glossary: [
      ["Present perfect", "czas have/has + III forma, łączący przeszłość z teraźniejszością"],
      ["Past participle", "trzecia forma czasownika, np. seen, gone, written"],
      ["Since", "przyimek oznaczający „od” konkretnego punktu w czasie"],
      ["For", "przyimek oznaczający „przez” dany okres"],
    ],
  },
];

export const GENERIC_TOPIC: Topic = {
  key: "generic",
  subject: "inne",
  emoji: "💡",
  title: "Nauka własna",
  subtitle: "od pytania do notatki",
  keywords: [],
  build: genericLesson,
  glossary: [
    ["Aktywne przypominanie", "odtwarzanie informacji z pamięci zamiast ponownego czytania"],
    ["Powtórka rozłożona", "powracanie do materiału po 1, 3 i 7 dniach"],
    ["Notatka syntetyczna", "krótki zapis definicji, schematu i jednego przykładu"],
  ],
};

/** Polish-aware keyword matching: ignores diacritics and letter case. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectTopic(prompt: string): Topic | null {
  const text = normalize(prompt);
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      const needle = normalize(kw);
      if (needle.length > 2 && text.includes(needle)) {
        score += needle.includes(" ") ? 3 : 2;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }
  return best ? best.topic : null;
}

export function topicByKey(key: string): Topic {
  return TOPICS.find((t) => t.key === key) ?? GENERIC_TOPIC;
}
