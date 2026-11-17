import { INK, type Step } from "./types";
import { bullet, plotMap, scene, title } from "./geometry";

type Built = { steps: Step[]; takeaways: string[]; followUps: string[] };

/* ------------------------------ PERCENT ---------------------------- */

export function percentLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Co znaczy procent",
        "Procent to po prostu setna część całości. Jeden procent równa się jednej setnej, czyli zero przecinek zero jeden. Sto procent to całość. Dlatego zamiana procentu na liczbę jest zawsze taka sama: dzielimy przez sto. Piętnaście procent to zero przecinek piętnaście, a sto dwadzieścia procent to jeden przecinek dwa. Ta jedna umiejętność rozwiązuje większość zadań z procentów.",
        [
          title(40, 44, "Procent = na sto", INK.gold),
          { k: "rect", x: 60, y: 140, w: 400, h: 60, radius: 10, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 80, y: 180, text: "całość = 100% = 1", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 60, y: 250, text: "1% = 1/100 = 0,01", size: 34, hand: true, color: INK.coral },
          { k: "text", x: 60, y: 330, text: "15% = 0,15", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 60, y: 372, text: "120% = 1,20", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 60, y: 440, text: "Procent → liczba: podziel przez 100.", size: 20, weight: 700, color: INK.green },
          { k: "text", x: 60, y: 478, text: "Liczba → procent: pomnóż przez 100.", size: 20, weight: 700, color: INK.green },
        ],
      ),
      s[1].step(
        "Trzy typy zadań",
        "Wszystkie zadania z procentów dzielą się na trzy typy. Pierwszy: ile wynosi p procent z liczby. Drugi: jakim procentem jednej liczby jest druga. Trzeci: o ile procent coś wzrosło lub zmalało. W pierwszym mnożymy, w drugim dzielimy i zamieniamy na procent, a w trzecim liczymy różnicę i odnosimy ją do wartości początkowej. Ważne: zawsze do początkowej, nie do końcowej.",
        [
          title(40, 44, "Trzy typy zadań", INK.mint),
          ...bullet(60, 126, "Ile to p% z liczby? → p/100 · liczba", 0),
          ...bullet(60, 190, "Jakim % jest a z b? → a/b · 100%", 1),
          ...bullet(60, 254, "Zmiana o p%? → różnica / wartość początkowa · 100%", 2),
          { k: "rect", x: 40, y: 330, w: 740, h: 110, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 364, text: "Najczęstszy błąd", size: 19, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 396, text: "Zmianę procentową liczymy względem wartości POCZĄTKOWEJ.", size: 20, maxW: 680, color: INK.soft },
          { k: "text", x: 62, y: 424, text: "Cena 100 → 120 to wzrost o 20%, ale 120 → 100 to spadek o 16,7%.", size: 18, maxW: 680, color: INK.soft },
        ],
      ),
      s[2].step(
        "Przykład: 15% z 240",
        "Policzmy piętnaście procent z dwustu czterdziestu. Zamieniamy procent na liczbę: zero przecinek piętnaście. Mnożymy przez dwieście czterdzieści i dostajemy trzydzieści sześć. Można też policzyć sprytnie: dziesięć procent to dwadzieścia cztery, pięć procent to dwanaście, razem trzydzieści sześć. Metoda sprytna jest szybsza w pamięci i mniej podatna na błąd przecinka.",
        [
          title(40, 44, "Przykład", INK.gold),
          { k: "text", x: 40, y: 126, text: "15% z 240", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 200, text: "0,15 · 240 = 36", size: 34, hand: true, color: INK.green },
          { k: "line", x1: 40, y1: 250, x2: 760, y2: 250, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 296, text: "Metoda sprytna:", size: 20, weight: 700, color: INK.soft },
          { k: "text", x: 40, y: 340, text: "10% = 24", size: 24, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 388, text: "5% = 12", size: 24, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 436, text: "24 + 12 = 36", size: 24, hand: true, color: INK.green },
          { k: "pill", x: 480, y: 300, w: 280, h: 120, text: "10% → podziel przez 10", size: 19, bg: "#efe4c9", color: INK.ink },
        ],
      ),
      s[3].step(
        "Podwyżki i obniżki",
        "Gdy cena rośnie o dwadzieścia procent, mnożymy ją przez jeden przecinek dwa. Gdy spada o dwadzieścia procent, mnożymy przez zero przecinek osiem. Uwaga na pułapkę: wzrost o dwadzieścia procent, a potem spadek o dwadzieścia procent nie wraca do ceny wyjściowej. Sto złotych po podwyżce to sto dwadzieścia, a po obniżce o dwadzieścia procent — dziewięćdziesiąt sześć. Dlatego procenty nie są symetryczne.",
        [
          title(40, 44, "Podwyżki i obniżki", INK.lilac),
          { k: "text", x: 40, y: 124, text: "+20% → · 1,20", size: 26, hand: true, color: INK.green },
          { k: "text", x: 40, y: 176, text: "−20% → · 0,80", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 240, text: "100 zł → +20% → 120 zł", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 290, text: "120 zł → −20% → 96 zł", size: 24, hand: true, color: INK.soft },
          { k: "highlight", x: 34, y: 320, w: 640, h: 66, color: "#eef0fb" },
          { k: "text", x: 48, y: 362, text: "Nie wróciło do 100 zł!", size: 24, weight: 700, color: INK.ink, at: 0.4 },
          { k: "text", x: 40, y: 430, text: "Dwa razy +10% to nie +20%, tylko +21% (1,1 · 1,1 = 1,21).", size: 19, maxW: 740, color: INK.soft },
          { k: "text", x: 40, y: 470, text: "Procenty składane mnożą się, nie dodają.", size: 20, weight: 700, color: INK.ink },
        ],
      ),
    ],
    takeaways: [
      "1% = 0,01; procent zamieniamy na liczbę, dzieląc przez 100.",
      "p% z liczby to p/100 · liczba.",
      "Zmianę procentową liczymy względem wartości początkowej.",
      "Podwyżka i obniżka o ten sam procent nie dają tej samej ceny.",
    ],
    followUps: ["Jak policzyć cenę po dwóch obniżkach?", "Jak obliczyć procent składany?", "Jak zamienić ułamek na procent?"],
  };
}

/* ----------------------------- DERIVATIVE -------------------------- */

export function derivativeLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  const f = { x: 240, y: 100, w: 480, h: 400 };
  const m = plotMap(f, [-1, 5], [-4, 6]);
  return {
    steps: [
      s[0].step(
        "Co to jest pochodna",
        "Pochodna odpowiada na pytanie, jak szybko zmienia się funkcja w danym punkcie. Geometrycznie to nachylenie stycznej do wykresu. Jeśli funkcja rośnie stromo, pochodna jest duża i dodatnia. Jeśli maleje, pochodna jest ujemna. W miejscu, gdzie funkcja ma czubek, pochodna wynosi zero. To dlatego pochodna jest głównym narzędziem do szukania ekstremów.",
        [
          title(40, 44, "Pochodna", INK.gold),
          { k: "text", x: 40, y: 130, text: "f'(x) = nachylenie stycznej", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "f'(x₀) > 0 → funkcja rośnie", size: 21, color: INK.green },
          { k: "text", x: 40, y: 250, text: "f'(x₀) < 0 → funkcja maleje", size: 21, color: INK.coral },
          { k: "text", x: 40, y: 290, text: "f'(x₀) = 0 → możliwe ekstremum", size: 21, color: INK.lilac },
          { k: "axes", x: 430, y: 330, w: 340, h: 210, ticks: false },
          { k: "func", frame: { x: 430, y: 330, w: 340, h: 210 }, expr: "x^2/3", domain: [-3, 3], range: [-1, 4], color: INK.green, width: 4, at: 0.2 },
          { k: "line", x1: 500, y1: 520, x2: 700, y2: 380, color: INK.coral, width: 3, at: 0.6 },
        ],
      ),
      s[1].step(
        "Podstawowe wzory",
        "Pochodne liczymy według kilku prostych reguł. Pochodna stałej to zero. Pochodna x do potęgi n to n razy x do potęgi n minus jeden. Pochodna samego x to jeden. Pochodna sumy to suma pochodnych, a stałą można wyłączyć przed pochodną. Te zasady wystarczą do niemal wszystkich zadań szkolnych.",
        [
          title(40, 44, "Wzory", INK.mint),
          { k: "text", x: 40, y: 128, text: "(c)' = 0", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 188, text: "(xⁿ)' = n·xⁿ⁻¹", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 248, text: "(x)' = 1", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 308, text: "(c·f)' = c·f'", size: 30, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 368, text: "(f + g)' = f' + g'", size: 30, hand: true, color: INK.lilac },
          { k: "text", x: 40, y: 450, text: "Pochodna mówi o zmienności, nie o wartości funkcji.", size: 19, color: INK.soft },
        ],
      ),
      s[2].step(
        "Przykład: f(x) = x² − 4x",
        "Weźmy funkcję x kwadrat minus cztery x. Korzystamy z reguły potęgi: pochodna x kwadrat to dwa x. Pochodna minus cztery x to minus cztery. Czyli f prim od x równa się dwa x minus cztery. Przyrównujemy do zera i dostajemy x równe dwa. W tym punkcie funkcja ma wierzchołek, czyli minimum, bo ramiona idą w górę. Wartość funkcji w dwójce to minus cztery.",
        [
          title(40, 44, "Przykład", INK.lilac),
          { k: "text", x: 40, y: 124, text: "f(x) = x² − 4x", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 186, text: "f'(x) = 2x − 4", size: 30, hand: true, color: INK.green },
          { k: "highlight", x: 34, y: 214, w: 520, h: 64, color: "#eef0fb" },
          { k: "text", x: 48, y: 254, text: "2x − 4 = 0  →  x = 2", size: 26, hand: true, color: INK.ink, at: 0.4 },
          { k: "text", x: 40, y: 316, text: "f(2) = 4 − 8 = −4", size: 26, hand: true, color: INK.lilac },
          { k: "text", x: 40, y: 380, text: "f' < 0 dla x < 2 → funkcja maleje", size: 20, color: INK.coral },
          { k: "text", x: 40, y: 418, text: "f' > 0 dla x > 2 → funkcja rośnie", size: 20, color: INK.green },
          { k: "text", x: 40, y: 466, text: "Wniosek: minimum w (2, −4).", size: 22, weight: 700, color: INK.ink },
        ],
      ),
      s[3].step(
        "Styczna i zastosowania",
        "Styczna w punkcie ma równanie y równa się f prim od x zero razy x minus x zero plus f od x zero. Dla naszej funkcji w punkcie x równa się trzy: f od trzy to minus trzy, a f prim od trzy to dwa. Styczna ma więc równanie y równa się dwa x minus dziewięć. Pochodne wykorzystujemy do liczenia prędkości, kosztu krańcowego i tempa wzrostu. Wszędzie tam, gdzie ważne jest „jak szybko”, pojawia się pochodna.",
        [
          title(40, 44, "Styczna i zastosowania", INK.sky),
          { k: "axes", x: f.x, y: f.y, w: f.w, h: f.h, xLabel: "x", yLabel: "y", ticks: true },
          { k: "func", frame: f, expr: "x^2-4*x", domain: [-1, 5], range: [-4, 6], color: INK.green, width: 4, at: 0.05 },
          { k: "line", x1: m.sx(2), y1: m.sy(2), x2: m.sx(4), y2: m.sy(4), color: INK.coral, width: 3, at: 0.45 },
          { k: "dot", cx: m.sx(3), cy: m.sy(-3), r: 6, color: INK.coral, at: 0.4 },
          { k: "text", x: 40, y: 520, text: "Styczna: y = f'(x₀)(x − x₀) + f(x₀)", size: 20, hand: true, color: INK.ink },
          { k: "text", x: 560, y: 150, text: "y = 2x − 9", size: 24, hand: true, color: INK.coral },
        ],
      ),
    ],
    takeaways: [
      "Pochodna to nachylenie stycznej, czyli tempo zmian.",
      "(xⁿ)' = n·xⁿ⁻¹, (c)' = 0.",
      "Ekstrema szukamy, rozwiązując f'(x) = 0.",
      "Styczna: y = f'(x₀)(x − x₀) + f(x₀).",
    ],
    followUps: ["Jak zbadać monotoniczność funkcji?", "Jak policzyć pochodną iloczynu?", "Po co nam druga pochodna?"],
  };
}

/* ---------------------------- PROBABILITY -------------------------- */

export function probabilityLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Prawdopodobieństwo",
        "Prawdopodobieństwo opisuje szansę zajścia zdarzenia. Liczymy je jako liczbę wyników sprzyjających podzieloną przez liczbę wszystkich możliwych wyników, o ile są one równie prawdopodobne. Wynik zawsze mieści się między zerem a jeden. Zero oznacza zdarzenie niemożliwe, a jeden — pewne. Często zapisujemy wynik jako ułamek, ale można go podać w procentach.",
        [
          title(40, 44, "Prawdopodobieństwo", INK.gold),
          { k: "text", x: 40, y: 130, text: "P(A) = |A| / |Ω|", size: 38, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 196, text: "|A| — wyniki sprzyjające", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 230, text: "|Ω| — wszystkie możliwe wyniki", size: 20, color: INK.soft },
          { k: "line", x1: 40, y1: 280, x2: 740, y2: 280, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 330, text: "0 ≤ P(A) ≤ 1", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 400, text: "0 — niemożliwe    1 — pewne", size: 20, color: INK.soft },
          { k: "rect", x: 60, y: 450, w: 660, h: 34, radius: 17, color: INK.ink, width: 2, fill: "#f2ead8" },
          { k: "rect", x: 60, y: 450, w: 330, h: 34, radius: 17, color: INK.green, width: 0, fill: "#9fcbb1", at: 0.4 },
        ],
      ),
      s[1].step(
        "Przykład: kostka",
        "Rzucamy sześcienną kostką. Wszystkich wyników jest sześć. Zdarzenie „wypadła liczba parzysta” sprzyjają trzy wyniki: dwa, cztery i sześć. Prawdopodobieństwo wynosi więc trzy szóste, czyli jedna druga, czyli pięćdziesiąt procent. Zdarzenie „wypadła siódemka” jest niemożliwe, więc ma prawdopodobieństwo zero. A zdarzenie „wypadła liczba od jeden do sześć” jest pewne i ma prawdopodobieństwo jeden.",
        [
          title(40, 44, "Rzut kostką", INK.mint),
          { k: "rect", x: 60, y: 140, w: 80, h: 80, radius: 14, color: INK.ink, width: 3, fill: "#f7f1e4" },
          { k: "dot", cx: 100, cy: 180, r: 6, color: INK.ink },
          { k: "rect", x: 160, y: 140, w: 80, h: 80, radius: 14, color: INK.ink, width: 3, fill: "#f7f1e4" },
          { k: "dot", cx: 190, cy: 160, r: 5, color: INK.ink },
          { k: "dot", cx: 210, cy: 200, r: 5, color: INK.ink },
          { k: "rect", x: 260, y: 140, w: 80, h: 80, radius: 14, color: INK.ink, width: 3, fill: "#f7f1e4" },
          { k: "dot", cx: 285, cy: 162, r: 5, color: INK.ink },
          { k: "dot", cx: 300, cy: 180, r: 5, color: INK.ink },
          { k: "dot", cx: 315, cy: 198, r: 5, color: INK.ink },
          { k: "text", x: 400, y: 170, text: "Ω = {1,2,3,4,5,6}", size: 22, hand: true, color: INK.soft },
          { k: "text", x: 400, y: 230, text: "A = {2,4,6}", size: 22, hand: true, color: INK.green },
          { k: "text", x: 400, y: 300, text: "P(A) = 3/6 = 1/2 = 50%", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 60, y: 400, text: "P(7) = 0", size: 22, hand: true, color: INK.coral },
          { k: "text", x: 300, y: 400, text: "P(1–6) = 1", size: 22, hand: true, color: INK.green },
        ],
      ),
      s[2].step(
        "Zdarzenie przeciwne",
        "Zdarzenie przeciwne to wszystkie wyniki, które nie są w zdarzeniu A. Razem z A tworzą całą przestrzeń, więc ich prawdopodobieństwa sumują się do jednego. Dlatego wygodnie jest czasem policzyć szansę, że coś się nie stanie, i odjąć od jedynki. Na przykład szansa, że nie wypadnie szóstka, to jeden minus jedna szósta, czyli pięć szóstych. Ta sztuczka ratuje wiele zadań.",
        [
          title(40, 44, "Zdarzenie przeciwne", INK.lilac),
          { k: "text", x: 40, y: 130, text: "P(A') = 1 − P(A)", size: 38, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "P(nie 6) = 1 − 1/6 = 5/6", size: 26, hand: true, color: INK.green },
          { k: "text", x: 40, y: 270, text: "P(co najmniej raz) = 1 − P(ani raz)", size: 24, hand: true, color: INK.lilac },
          { k: "rect", x: 40, y: 340, w: 720, h: 110, radius: 14, color: INK.gold, width: 2, fill: "#fdf5dd" },
          { k: "text", x: 62, y: 374, text: "Kiedy używać?", size: 19, weight: 700, color: INK.gold },
          { k: "text", x: 62, y: 406, text: "Gdy w treści jest „co najmniej” albo „przynajmniej jeden”.", size: 20, maxW: 660, color: INK.soft },
        ],
      ),
      s[3].step(
        "Zdarzenia niezależne",
        "Jeśli dwa zdarzenia są niezależne, prawdopodobieństwo ich iloczynu to iloczyn prawdopodobieństw. Rzut dwiema kostkami: szansa na dwie szóstki to jedna szósta razy jedna szósta, czyli jedna trzydziesta szósta. Na drzewie mnożymy wzdłuż gałęzi, a dodajemy między gałęziami. To najprostsza i najbardziej niezawodna metoda rozwiązywania zadań z dwoma etapami.",
        [
          title(40, 44, "Dwa etapy", INK.sky),
          { k: "text", x: 40, y: 124, text: "P(A i B) = P(A) · P(B)", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 190, text: "dwie szóstki: 1/6 · 1/6 = 1/36", size: 24, hand: true, color: INK.green },
          { k: "circle", cx: 200, cy: 300, r: 22, color: INK.ink, width: 3 },
          { k: "text", x: 186, y: 308, text: "1/6", size: 16, color: INK.ink },
          { k: "line", x1: 220, y1: 290, x2: 420, y2: 240, color: INK.green, width: 3 },
          { k: "line", x1: 220, y1: 310, x2: 420, y2: 380, color: INK.coral, width: 3 },
          { k: "text", x: 250, y: 240, text: "6 → 1/6", size: 19, color: INK.green },
          { k: "text", x: 250, y: 390, text: "nie 6 → 5/6", size: 19, color: INK.coral },
          { k: "text", x: 470, y: 300, text: "mnożymy wzdłuż gałęzi", size: 20, color: INK.soft },
          { k: "text", x: 470, y: 340, text: "dodajemy między gałęziami", size: 20, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "P(A) = wyniki sprzyjające / wszystkie wyniki.",
      "0 ≤ P(A) ≤ 1.",
      "P(A') = 1 − P(A).",
      "Dla niezależnych: P(A i B) = P(A)·P(B).",
    ],
    followUps: ["Jak zrobić drzewko prawdopodobieństwa?", "Czym są zdarzenia wykluczające się?", "Jak policzyć prawdopodobieństwo warunkowe?"],
  };
}
