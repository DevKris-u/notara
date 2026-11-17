import { INK, type Step } from "./types";
import { bullet, chip, plotMap, scene, title } from "./geometry";

function assertSteps(steps: Step[]): Step[] {
  return steps;
}

/* ----------------------------- LINEAR ------------------------------ */

export function linearLesson(prompt: string): { steps: Step[]; takeaways: string[]; followUps: string[] } {
  const s = [scene(0), scene(1), scene(2), scene(3), scene(4)];
  const f = { x: 300, y: 110, w: 470, h: 400 };
  const map = plotMap(f, [-3, 4], [-3, 8]);

  const steps = assertSteps([
    s[0].step(
      "Czym jest funkcja liniowa",
      "Funkcja liniowa ma najprostszy wzór ze wszystkich funkcji: y równa się a x plus b. Litera a mówi nam, jak stromo biegnie prosta, a litera b, w którym miejscu przecina pionową oś. Wykresem jest zawsze linia prosta. Dlatego wystarczą dwa punkty, żeby ją narysować.",
      [
        title(40, 44, "Funkcja liniowa", INK.gold),
        { k: "text", x: 40, y: 140, text: "y = a·x + b", size: 52, hand: true, color: INK.ink, at: 0.05 },
        { k: "line", x1: 42, y1: 160, x2: 330, y2: 160, color: INK.coral, width: 3, at: 0.2 },
        { k: "text", x: 42, y: 210, text: "a — nachylenie: jak szybko rośnie lub maleje", size: 21, maxW: 430, color: INK.soft },
        { k: "text", x: 42, y: 268, text: "b — miejsce przecięcia z osią OY", size: 21, maxW: 430, color: INK.soft },
        { k: "text", x: 42, y: 330, text: "a ≠ 0", size: 24, hand: true, color: INK.green },
        { k: "text", x: 42, y: 382, text: "Dziedzina: wszystkie liczby rzeczywiste.", size: 19, maxW: 440, color: INK.soft },
        chip(42, 470, "wykres = linia prosta", "#efe4c9"),
        { k: "arrow", x1: 250, y1: 452, x2: 292, y2: 300, color: INK.gold, width: 3 },
      ],
    ),
    s[1].step(
      "Co robi współczynnik a",
      "Znak współczynnika a decyduje o tym, czy prosta rośnie, czy maleje. Gdy a jest dodatnie, wykres idzie w górę, gdy ujemne — w dół. Gdy a jest równe zero, zostaje pozioma linia, ale wtedy nie jest to już funkcja liniowa.",
      [
        title(40, 44, "Kierunek prostej", INK.mint),
        { k: "text", x: 40, y: 120, text: "a > 0", size: 26, weight: 700, color: INK.green },
        { k: "line", x1: 70, y1: 300, x2: 230, y2: 300, color: "#c9c2b0", width: 2 },
        { k: "line", x1: 150, y1: 350, x2: 150, y2: 190, color: "#c9c2b0", width: 2 },
        { k: "poly", pts: [[85, 330], [220, 205]], color: INK.green, width: 5 },
        { k: "text", x: 40, y: 400, text: "rośnie", size: 19, color: INK.soft },
        { k: "text", x: 330, y: 120, text: "a < 0", size: 26, weight: 700, color: INK.coral },
        { k: "line", x1: 360, y1: 300, x2: 520, y2: 300, color: "#c9c2b0", width: 2 },
        { k: "line", x1: 440, y1: 350, x2: 440, y2: 190, color: "#c9c2b0", width: 2 },
        { k: "poly", pts: [[375, 205], [510, 330]], color: INK.coral, width: 5 },
        { k: "text", x: 330, y: 400, text: "maleje", size: 19, color: INK.soft },
        { k: "text", x: 610, y: 120, text: "a = 0", size: 26, weight: 700, color: INK.sky },
        { k: "line", x1: 630, y1: 300, x2: 800, y2: 300, color: "#c9c2b0", width: 2 },
        { k: "line", x1: 715, y1: 350, x2: 715, y2: 190, color: "#c9c2b0", width: 2 },
        { k: "poly", pts: [[645, 265], [790, 265]], color: INK.sky, width: 5 },
        { k: "text", x: 610, y: 400, text: "stała", size: 19, color: INK.soft },
        { k: "text", x: 40, y: 470, text: "Zapamiętaj: a to “stromość”, b to “start”.", size: 21, color: INK.ink, maxW: 720 },
      ],
    ),
    s[2].step(
      "Rysujemy y = 2x + 1",
      "Zobaczmy to na konkretnym przykładzie. Tutaj a równa się dwa, a b równa się jeden. Zaczynamy od punktu zero jeden na osi pionowej, bo b to początek. Potem przesuwamy się o jeden w prawo i o dwa w górę, bo takie jest nachylenie. Przez oba punkty prowadzimy prostą.",
      [
        title(40, 44, "Przykład: y = 2x + 1", INK.gold),
        { k: "axes", x: f.x, y: f.y, w: f.w, h: f.h, xLabel: "x", yLabel: "y", ticks: true },
        { k: "func", frame: f, expr: "2*x+1", domain: [-3, 4], range: [-3, 8], color: INK.green, width: 4, at: 0.05 },
        { k: "dot", cx: map.sx(0), cy: map.sy(1), r: 6, color: INK.coral, at: 0.55 },
        { k: "text", x: map.sx(0) + 14, y: map.sy(1) + 26, text: "(0, 1)", size: 19, weight: 700, color: INK.coral, at: 0.62 },
        { k: "dot", cx: map.sx(1), cy: map.sy(3), r: 6, color: INK.coral, at: 0.7 },
        { k: "text", x: map.sx(1) + 14, y: map.sy(3) + 26, text: "(1, 3)", size: 19, weight: 700, color: INK.coral, at: 0.76 },
        { k: "text", x: 40, y: 470, text: "b = 1 → start na OY", size: 21, color: INK.soft },
        { k: "text", x: 40, y: 508, text: "a = 2 → 1 w prawo, 2 w górę", size: 21, color: INK.soft },
      ],
    ),
    s[3].step(
      "Miejsce zerowe",
      "Miejsce zerowe to argument, dla którego funkcja przyjmuje wartość zero, czyli punkt przecięcia z osią iks. Liczymy je z równania a x plus b równa się zero. Dla naszego przykładu dostajemy x równa się minus jedna druga. Na wykresie to miejsce, w którym prosta przecina poziomą oś.",
      [
        title(40, 44, "Miejsce zerowe", INK.lilac),
        { k: "text", x: 40, y: 140, text: "0 = a·x + b", size: 34, hand: true, color: INK.ink },
        { k: "arrow", x1: 250, y1: 158, x2: 340, y2: 158, color: INK.lilac, width: 3 },
        { k: "text", x: 360, y: 148, text: "x = −b / a", size: 34, hand: true, color: INK.lilac },
        { k: "highlight", x: 40, y: 212, w: 660, h: 96, color: "#f7e7a8" },
        { k: "text", x: 62, y: 248, text: "y = 2x + 1   →   x = −1/2 = −0,5", size: 26, hand: true, color: INK.ink },
        { k: "line", x1: 80, y1: 350, x2: 760, y2: 350, color: INK.ink, width: 2 },
        { k: "line", x1: 420, y1: 336, x2: 420, y2: 364, color: INK.ink, width: 2 },
        { k: "dot", cx: 320, cy: 350, r: 8, color: INK.coral },
        { k: "text", x: 306, y: 398, text: "−0,5", size: 20, weight: 700, color: INK.coral },
        { k: "text", x: 600, y: 398, text: "tu prosta przecina oś x", size: 19, color: INK.soft },
        { k: "text", x: 40, y: 470, text: "Sprawdzenie: 2·(−0,5) + 1 = 0 ✓", size: 22, color: INK.green },
      ],
    ),
    s[4].step(
      "Schemat na sprawdzian",
      "Najlepszy sposób to trzymać się schematu. Po pierwsze odczytaj a i b ze wzoru. Po drugie policz miejsce zerowe. Po trzecie zaznacz dwa punkty i poprowadź prostą. Na koniec sprawdź, czy otrzymany punkt naprawdę leży na wykresie. Ten schemat działa w każdym zadaniu z funkcją liniową.",
      [
        title(40, 44, "Schemat działania", INK.green),
        ...bullet(60, 140, "1. Odczytaj a i b ze wzoru", 0),
        ...bullet(60, 196, "2. Policz miejsce zerowe: x = −b/a", 1),
        ...bullet(60, 252, "3. Zaznacz dwa punkty i poprowadź prostą", 2),
        ...bullet(60, 308, "4. Sprawdź wynik, podstawiając punkt do wzoru", 3),
        { k: "rect", x: 40, y: 390, w: 700, h: 120, radius: 16, color: INK.green, width: 2, fill: "#eef5ee" },
        { k: "text", x: 62, y: 424, text: "Najczęstszy błąd", size: 20, weight: 700, color: INK.coral },
        { k: "text", x: 62, y: 456, text: "Mylenie a z b przy odczycie z wykresu. b czytaj zawsze na osi OY, dla x = 0.", size: 19, maxW: 650, color: INK.soft },
      ],
    ),
  ]);

  return {
    steps,
    takeaways: [
      "Wzór funkcji liniowej to y = ax + b.",
      "a decyduje o nachyleniu, b o przecięciu z osią OY.",
      "Miejsce zerowe liczymy z x = −b/a.",
      "Do narysowania prostej wystarczą dwa punkty.",
    ],
    followUps: [
      "Jak narysować wykres, gdy mam tylko dwa punkty?",
      "Co się dzieje, gdy a = 0?",
      "Jak odczytać wzór funkcji z wykresu?",
    ],
  };
}

/* ---------------------------- QUADRATIC ---------------------------- */

export function quadraticLesson(prompt: string): { steps: Step[]; takeaways: string[]; followUps: string[] } {
  const s = [scene(0), scene(1), scene(2), scene(3), scene(4), scene(5)];
  const f = { x: 330, y: 90, w: 430, h: 420 };
  const map = plotMap(f, [-1, 5], [-2, 5]);

  return {
    steps: [
      s[0].step(
        "Funkcja kwadratowa",
        "Funkcja kwadratowa to funkcja, w której najwyższa potęga iksa to dwa. Jej wzór wygląda tak: y równa się a x kwadrat plus b x plus c, przy czym a jest różne od zera. Wykresem jest parabola, czyli charakterystyczna miseczka albo łuk. To dlatego funkcja kwadratowa pojawia się wszędzie tam, gdzie coś najpierw rośnie, a potem maleje.",
        [
          title(40, 44, "Funkcja kwadratowa", INK.gold),
          { k: "text", x: 40, y: 150, text: "y = a·x² + b·x + c", size: 44, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 216, text: "a ≠ 0", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 280, text: "Wykresem jest parabola.", size: 22, color: INK.soft },
          { k: "poly", pts: [[120, 470], [200, 380], [280, 350], [360, 380], [430, 470]], color: INK.green, width: 4, smooth: true },
          { k: "text", x: 470, y: 400, text: "a > 0 → ramiona w górę", size: 19, color: INK.soft },
          { k: "text", x: 470, y: 440, text: "a < 0 → ramiona w dół", size: 19, color: INK.soft },
          { k: "text", x: 470, y: 490, text: "c → przecięcie z OY", size: 19, color: INK.soft },
        ],
      ),
      s[1].step(
        "Ramiona i wierzchołek",
        "Znak a decyduje o tym, w którą stronę otwierają się ramiona paraboli. Gdy a jest dodatnie, ramiona idą w górę i parabola ma najniższy punkt, czyli minimum. Gdy a jest ujemne, ramiona idą w dół i mamy maksimum. Ten skrajny punkt nazywamy wierzchołkiem, a jego współrzędne liczymy ze wzorów: p równa się minus b przez dwa a, q to wartość funkcji w p.",
        [
          title(40, 44, "Ramiona paraboli", INK.mint),
          { k: "poly", pts: [[80, 330], [160, 240], [240, 210], [320, 240], [400, 330]], color: INK.green, width: 5, smooth: true },
          { k: "text", x: 80, y: 380, text: "a > 0 → minimum", size: 21, weight: 700, color: INK.green },
          { k: "poly", pts: [[450, 210], [530, 300], [610, 330], [690, 300], [770, 210]], color: INK.coral, width: 5, smooth: true },
          { k: "text", x: 450, y: 380, text: "a < 0 → maksimum", size: 21, weight: 700, color: INK.coral },
          { k: "line", x1: 40, y1: 430, x2: 810, y2: 430, color: "#cfc7b4", width: 2 },
          { k: "text", x: 40, y: 474, text: "p = −b / 2a", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 400, y: 474, text: "q = f(p)", size: 30, hand: true, color: INK.ink },
        ],
      ),
      s[2].step(
        "Delta i miejsca zerowe",
        "Żeby znaleźć miejsca zerowe, czyli przecięcia paraboli z osią iks, liczymy deltę. Delta równa się b kwadrat minus cztery a c. Jej znak mówi wszystko: dodatnia delta to dwa miejsca zerowe, delta równa zero to jedno, a ujemna delta oznacza brak miejsc zerowych. Same miejsca liczymy ze wzoru minus b plus minus pierwiastek z delty, podzielone przez dwa a.",
        [
          title(40, 44, "Delta", INK.lilac),
          { k: "pill", x: 40, y: 110, w: 300, h: 76, text: "Δ = b² − 4ac", size: 34, bg: "#efe4c9", color: INK.ink },
          { k: "text", x: 380, y: 146, text: "x₁,₂ = (−b ± √Δ) / 2a", size: 26, hand: true, color: INK.ink },
          ...bullet(60, 260, "Δ > 0 → dwa miejsca zerowe", 0, INK.green),
          ...bullet(60, 316, "Δ = 0 → jedno miejsce zerowe", 1, INK.gold),
          ...bullet(60, 372, "Δ < 0 → brak miejsc zerowych", 2, INK.coral),
          { k: "text", x: 60, y: 452, text: "Delta to nie wynik — to informacja, ile wyników będzie.", size: 20, maxW: 740, color: INK.soft },
        ],
      ),
      s[3].step(
        "Przykład krok po kroku",
        "Rozwiążmy x kwadrat minus cztery x plus trzy. Tutaj a równa się jeden, b równa się minus cztery, a c równa się trzy. Delta wychodzi cztery, a pierwiastek z delty to dwa. Podstawiamy do wzoru i dostajemy dwa miejsca zerowe: jeden i trzy. Warto zawsze podstawić wynik z powrotem do równania, żeby się upewnić.",
        [
          title(40, 44, "Przykład: x² − 4x + 3", INK.gold),
          { k: "text", x: 40, y: 120, text: "a = 1   b = −4   c = 3", size: 24, hand: true, color: INK.soft },
          { k: "highlight", x: 34, y: 168, w: 620, h: 74, color: "#eaf2e4" },
          { k: "text", x: 46, y: 200, text: "Δ = (−4)² − 4·1·3 = 16 − 12 = 4", size: 24, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 286, text: "√Δ = 2", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 344, text: "x₁ = (4 − 2) / 2 = 1", size: 28, hand: true, color: INK.green },
          { k: "text", x: 40, y: 400, text: "x₂ = (4 + 2) / 2 = 3", size: 28, hand: true, color: INK.green },
          { k: "text", x: 40, y: 470, text: "Postać iloczynowa: (x − 1)(x − 3)", size: 21, color: INK.soft },
        ],
      ),
      s[4].step(
        "Wykres: miejsca zerowe i wierzchołek",
        "Teraz złóżmy wszystko w jeden obrazek. Parabola przecina oś iks w jedynce i trójce. Wierzchołek leży dokładnie pomiędzy nimi, czyli dla x równego dwa. Wartość w wierzchołku to minus jeden, więc jest to najniższy punkt wykresu. Oś symetrii przechodzi przez wierzchołek i dzieli parabolę na dwie identyczne połówki.",
        [
          title(40, 44, "Wykres: y = x² − 4x + 3", INK.green),
          { k: "axes", x: f.x, y: f.y, w: f.w, h: f.h, xLabel: "x", yLabel: "y", ticks: true },
          { k: "line", x1: map.sx(2), y1: f.y, x2: map.sx(2), y2: f.y + f.h, color: INK.lilac, width: 2, dash: true },
          { k: "func", frame: f, expr: "x^2-4*x+3", domain: [-1, 5], range: [-2, 5], color: INK.green, width: 4, at: 0.05 },
          { k: "dot", cx: map.sx(1), cy: map.sy(0), r: 7, color: INK.coral, at: 0.5 },
          { k: "dot", cx: map.sx(3), cy: map.sy(0), r: 7, color: INK.coral, at: 0.56 },
          { k: "dot", cx: map.sx(2), cy: map.sy(-1), r: 7, color: INK.gold, at: 0.66 },
          { k: "text", x: map.sx(2) + 16, y: map.sy(-1) - 12, text: "W = (2, −1)", size: 20, weight: 700, color: INK.gold, at: 0.7 },
          { k: "text", x: 40, y: 500, text: "x₁ = 1      x₂ = 3      p = 2      q = −1", size: 21, hand: true, color: INK.soft },
        ],
      ),
      s[5].step(
        "Co zapamiętać",
        "Na koniec trzy rzeczy, które załatwiają większość zadań. Zawsze wypisz a, b i c — to chroni przed błędem znaku. Policz deltę i sprawdź jej znak, zanim zaczniesz liczyć pierwiastki. Pamiętaj, że wierzchołek leży dokładnie w połowie drogi między miejscami zerowymi. Jeśli delta jest ujemna, parabola nie przecina osi iks — i to jest pełna odpowiedź.",
        [
          title(40, 44, "Ściąga", INK.lilac),
          ...bullet(60, 130, "Wypisz a, b, c — uważaj na znaki", 0),
          ...bullet(60, 186, "Δ > 0 → dwa rozwiązania, Δ = 0 → jedno", 1),
          ...bullet(60, 242, "Wierzchołek: p = −b/2a, q = f(p)", 2),
          ...bullet(60, 298, "Postać iloczynowa: a(x − x₁)(x − x₂)", 3),
          { k: "rect", x: 40, y: 380, w: 720, h: 128, radius: 16, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 414, text: "Uwaga na znak b", size: 20, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 448, text: "We wzorze minus b oznacza minus całe b. Dla b = −4 mamy −(−4) = +4.", size: 19, maxW: 670, color: INK.soft },
          { k: "text", x: 62, y: 486, text: "To najczęstszy powód utraty punktów.", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "Postać ogólna: y = ax² + bx + c, a ≠ 0.",
      "Δ = b² − 4ac określa liczbę miejsc zerowych.",
      "Wierzchołek: p = −b/2a, q = f(p).",
      "a > 0 daje minimum, a < 0 maksimum.",
    ],
    followUps: [
      "Pokaż to na innym przykładzie",
      "Jak zapisać funkcję w postaci kanonicznej?",
      "Co zrobić, gdy delta jest ujemna?",
    ],
  };
}

/* ---------------------------- PYTHAGORAS --------------------------- */

export function pythagorasLesson(prompt: string): { steps: Step[]; takeaways: string[]; followUps: string[] } {
  const s = [scene(0), scene(1), scene(2), scene(3), scene(4)];
  return {
    steps: [
      s[0].step(
        "Twierdzenie Pitagorasa",
        "Twierdzenie Pitagorasa dotyczy trójkątów prostokątnych, czyli takich, które mają jeden kąt dziewięćdziesiąt stopni. Mówi ono, że suma kwadratów przyprostokątnych jest równa kwadratowi przeciwprostokątnej. Zapiszemy to tak: a kwadrat plus b kwadrat równa się c kwadrat. Najdłuższy bok, leżący naprzeciw kąta prostego, to właśnie przeciwprostokątna c.",
        [
          title(40, 44, "Twierdzenie Pitagorasa", INK.gold),
          { k: "poly", pts: [[120, 400], [330, 400], [120, 190]], closed: true, color: INK.green, width: 4, fill: "#edf3e9" },
          { k: "poly", pts: [[132, 388], [132, 376], [144, 376], [144, 388]], closed: true, color: INK.ink, width: 2 },
          { k: "text", x: 210, y: 440, text: "a", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 78, y: 300, text: "b", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 240, y: 275, text: "c", size: 26, hand: true, color: INK.sky },
          { k: "text", x: 430, y: 160, text: "a² + b² = c²", size: 46, hand: true, color: INK.ink },
          { k: "text", x: 430, y: 240, text: "c — najdłuższy bok,", size: 20, color: INK.soft },
          { k: "text", x: 430, y: 270, text: "naprzeciw kąta prostego.", size: 20, color: INK.soft },
          { k: "text", x: 430, y: 330, text: "Kąt 90° oznaczamy kropką", size: 19, color: INK.soft },
          { k: "text", x: 430, y: 360, text: "albo kwadracikiem.", size: 19, color: INK.soft },
          { k: "text", x: 430, y: 440, text: "Działa TYLKO w trójkącie prostokątnym.", size: 19, weight: 700, color: INK.coral },
        ],
      ),
      s[1].step(
        "Przykład: 3, 4, 5",
        "Weźmy trójkąt o przyprostokątnych trzy i cztery. Podstawiamy do wzoru: trzy do kwadratu to dziewięć, cztery do kwadratu to szesnaście. Razem dwadzieścia pięć. Pierwiastek z dwudziestu pięciu to pięć, więc przeciwprostokątna ma długość pięć. Taki trójkąt nazywamy trójkątem pitagorejskim i warto go zapamiętać, bo często pojawia się w zadaniach.",
        [
          title(40, 44, "Przykład 3–4–5", INK.mint),
          { k: "poly", pts: [[100, 430], [420, 430], [100, 180]], closed: true, color: INK.green, width: 4, fill: "#edf3e9" },
          { k: "text", x: 240, y: 470, text: "4", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 58, y: 310, text: "3", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 285, y: 270, text: "c = ?", size: 26, hand: true, color: INK.sky },
          { k: "text", x: 480, y: 190, text: "3² + 4² = c²", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 480, y: 250, text: "9 + 16 = 25", size: 26, hand: true, color: INK.soft },
          { k: "text", x: 480, y: 310, text: "c = √25 = 5", size: 34, hand: true, color: INK.green },
          { k: "highlight", x: 466, y: 340, w: 320, h: 62, color: "#f7e7a8" },
          { k: "text", x: 484, y: 374, text: "Wynik: 5", size: 24, weight: 700, color: INK.ink, at: 0.5 },
          { k: "text", x: 480, y: 440, text: "Trójkąt 3–4–5 to klasyk.", size: 19, color: INK.soft },
        ],
      ),
      s[2].step(
        "Gdy szukamy przyprostokątnej",
        "Czasem znamy przeciwprostokątną i jedną przyprostokątną. Wtedy przekształcamy wzór: a kwadrat równa się c kwadrat minus b kwadrat. Na przykład dla c równego trzynaście i b równego pięć mamy sto sześćdziesiąt dziewięć minus dwadzieścia pięć, czyli sto czterdzieści cztery. Pierwiastek to dwanaście. Pamiętaj, żeby zawsze odejmować od kwadratu najdłuższego boku.",
        [
          title(40, 44, "Szukamy przyprostokątnej", INK.lilac),
          { k: "text", x: 40, y: 130, text: "a² = c² − b²", size: 38, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "c = 13,  b = 5", size: 24, hand: true, color: INK.soft },
          { k: "highlight", x: 34, y: 248, w: 640, h: 78, color: "#eef0fb" },
          { k: "text", x: 48, y: 300, text: "a² = 169 − 25 = 144", size: 28, hand: true, color: INK.ink, at: 0.25 },
          { k: "text", x: 40, y: 378, text: "a = 12", size: 40, hand: true, color: INK.lilac },
          { k: "text", x: 40, y: 462, text: "Odejmujemy zawsze od kwadratu przeciwprostokątnej,", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 492, text: "bo ona jest najdłuższa.", size: 19, color: INK.soft },
        ],
      ),
      s[3].step(
        "Sprawdzanie, czy trójkąt jest prostokątny",
        "Twierdzenie działa też w drugą stronę. Jeśli suma kwadratów dwóch krótszych boków jest równa kwadratowi najdłuższego, to trójkąt jest prostokątny. Weźmy boki sześć, osiem i dziesięć: trzydzieści sześć plus sześćdziesiąt cztery daje sto, a sto to dziesięć do kwadratu. Zgadza się, więc kąt między bokami sześć i osiem jest prosty. To bardzo szybki sposób sprawdzenia w zadaniach z rysunkiem.",
        [
          title(40, 44, "Test: czy to trójkąt prostokątny?", INK.sky),
          { k: "text", x: 40, y: 124, text: "6, 8, 10", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 196, text: "6² + 8² = 36 + 64 = 100", size: 26, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 250, text: "10² = 100", size: 26, hand: true, color: INK.soft },
          { k: "pill", x: 40, y: 300, w: 320, h: 62, text: "TAK — kąt prosty", size: 22, bg: "#dff0e2", color: INK.green },
          { k: "text", x: 40, y: 410, text: "Gdyby suma była większa → kąt ostry.", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 444, text: "Gdyby mniejsza → kąt rozwarty.", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 506, text: "Zawsze porównuj z kwadratem najdłuższego boku.", size: 19, weight: 700, color: INK.ink },
        ],
      ),
      s[4].step(
        "Zastosowanie w życiu",
        "Pitagoras przydaje się daleko poza zeszytem. Drabina oparta o ścianę, przekątna boiska, ekran telewizora, a nawet odległość między dwoma punktami na mapie — to wszystko trójkąty prostokątne. W zadaniach szukaj słów: przekątna, wysokość, odległość, najkrótsza droga. Jeśli widzisz kąt prosty, od razu myśl o Pitagorasie.",
        [
          title(40, 44, "Gdzie to wykorzystasz", INK.green),
          ...bullet(60, 136, "Drabina oparta o ścianę", 0),
          ...bullet(60, 192, "Przekątna prostokąta lub boiska", 1),
          ...bullet(60, 248, "Odległość między punktami na mapie", 2),
          ...bullet(60, 304, "Wysokość w trójkącie równoramiennym", 3),
          { k: "rect", x: 40, y: 372, w: 720, h: 120, radius: 16, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 62, y: 406, text: "Wskazówka do zadań", size: 19, weight: 700, color: INK.green },
          { k: "text", x: 62, y: 438, text: "Narysuj trójkąt i zaznacz kąt prosty. Potem podpisz boki: c zawsze naprzeciw kąta prostego.", size: 19, maxW: 670, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "a² + b² = c² w trójkącie prostokątnym.",
      "c to zawsze najdłuższy bok, naprzeciw kąta prostego.",
      "Szukając przyprostokątnej: a² = c² − b².",
      "Twierdzenie działa też jako test kąta prostego.",
    ],
    followUps: ["Jak działa twierdzenie odwrotne?", "Pokaż przykład z drabiną", "Skąd się bierze ten wzór?"],
  };
}
