import { INK, type Step } from "./types";
import { bullet, chip, plotMap, scene, title } from "./geometry";

type Built = { steps: Step[]; takeaways: string[]; followUps: string[] };

/* --------------------------- KINEMATICS ---------------------------- */

export function kinematicsLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3), scene(4)];
  const f = { x: 180, y: 110, w: 480, h: 380 };
  const m = plotMap(f, [0, 6], [0, 14]);

  return {
    steps: [
      s[0].step(
        "Ruch jednostajnie przyspieszony",
        "W ruchu jednostajnie przyspieszonym prędkość zmienia się o tę samą wartość w każdym sekundzie. Trzy wzory wystarczą do większości zadań. Przyspieszenie to zmiana prędkości podzielona przez czas. Prędkość po czasie t to prędkość początkowa plus a t. A droga to prędkość początkowa razy czas plus połowa a t kwadrat.",
        [
          title(40, 44, "Ruch jednostajnie przyspieszony", INK.gold),
          { k: "text", x: 40, y: 120, text: "a = Δv / t", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 182, text: "v = v₀ + a·t", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 244, text: "s = v₀·t + ½·a·t²", size: 30, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 330, text: "a — przyspieszenie [m/s²]", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 362, text: "v — prędkość [m/s]", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 394, text: "s — droga [m]", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 462, text: "Jednostki to połowa punktów na sprawdzianie.", size: 19, weight: 700, color: INK.coral },
          { k: "arrow", x1: 260, y1: 150, x2: 380, y2: 300, color: INK.gold, width: 3 },
        ],
      ),
      s[1].step(
        "Wykres prędkości",
        "Wykres prędkości od czasu to najlepszy przyjaciel tego działu. Nachylenie linii to przyspieszenie, a pole pod wykresem to przebyta droga. Gdy linia jest pozioma, prędkość się nie zmienia, czyli przyspieszenie wynosi zero. Gdy linia opada, mamy hamowanie i przyspieszenie jest ujemne. Wystarczy spojrzeć na kształt, żeby wiedzieć, co się dzieje.",
        [
          title(40, 44, "Wykres v(t)", INK.mint),
          { k: "axes", x: f.x, y: f.y, w: f.w, h: f.h, xLabel: "t [s]", yLabel: "v [m/s]", ticks: true },
          { k: "func", frame: f, expr: "2*x", domain: [0, 6], range: [0, 14], color: INK.green, width: 4, at: 0.05 },
          { k: "poly", pts: [[m.sx(0), m.sy(0)], [m.sx(4), m.sy(0)], [m.sx(4), m.sy(8)]], color: INK.gold, width: 2, fill: "#f6e7b8", closed: true, at: 0.5 },
          { k: "text", x: m.sx(2) + 6, y: m.sy(4) + 20, text: "pole = droga", size: 19, weight: 700, color: INK.ink, at: 0.7 },
          { k: "text", x: 40, y: 470, text: "nachylenie = przyspieszenie", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 508, text: "pole pod wykresem = droga", size: 20, color: INK.soft },
        ],
      ),
      s[2].step(
        "Przykład: v₀ = 0, a = 2 m/s², t = 5 s",
        "Policzmy konkretny przypadek. Ciało rusza z miejsca, więc prędkość początkowa to zero. Przyspieszenie wynosi dwa metry na sekundę kwadrat, a czas to pięć sekund. Prędkość końcowa to zero plus dwa razy pięć, czyli dziesięć metrów na sekundę. Droga to połowa razy dwa razy pięć do kwadratu, czyli dwadzieścia pięć metrów. Zauważ, że w pierwszej sekundzie ciało pokonuje tylko metr.",
        [
          title(40, 44, "Przykład", INK.gold),
          { k: "text", x: 40, y: 120, text: "v₀ = 0    a = 2 m/s²    t = 5 s", size: 23, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 196, text: "v = 0 + 2·5 = 10 m/s", size: 28, hand: true, color: INK.green },
          { k: "text", x: 40, y: 262, text: "s = 0·5 + ½·2·5²", size: 28, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 316, text: "s = 25 m", size: 34, hand: true, color: INK.sky },
          { k: "highlight", x: 34, y: 348, w: 520, h: 76, color: "#f7e7a8" },
          { k: "text", x: 50, y: 400, text: "Odpowiedź: 10 m/s i 25 m", size: 24, weight: 700, color: INK.ink, at: 0.55 },
          { k: "text", x: 40, y: 470, text: "Uwaga: t² liczymy PRZED mnożeniem przez ½.", size: 19, color: INK.coral },
        ],
      ),
      s[3].step(
        "Wykres drogi",
        "Droga w czasie rośnie jak parabola, nie jak prosta. To ważne, bo w pierwszej sekundzie pokonujemy mało, a potem coraz więcej. Wykres drogi od czasu jest więc zakrzywiony ku górze. Gdyby prędkość była stała, droga rosłaby liniowo. Krzywizna to znak, że prędkość się zmienia.",
        [
          title(40, 44, "Wykres s(t)", INK.lilac),
          { k: "axes", x: 170, y: 110, w: 470, h: 370, xLabel: "t [s]", yLabel: "s [m]", ticks: true },
          { k: "func", frame: { x: 170, y: 110, w: 470, h: 370 }, expr: "x^2", domain: [0, 5.5], range: [0, 30], color: INK.lilac, width: 4, at: 0.05 },
          { k: "text", x: 40, y: 500, text: "Przyspieszanie = coraz większe kroki.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 536, text: "Stała prędkość = prosta.", size: 20, color: INK.soft },
        ],
      ),
      s[4].step(
        "Checklista zadań",
        "Zanim zaczniesz liczyć, wypisz dane i szukane razem z jednostkami. Zamień kilometry na metry, a minuty na sekundy. Wybierz wzór, w którym jest tylko jedna niewiadoma. Na końcu sprawdź, czy wynik ma sens: czy prędkość jest dodatnia i czy droga rośnie. Jeśli wychodzi dziwna liczba, najczęściej chodzi o jednostki.",
        [
          title(40, 44, "Checklista", INK.green),
          ...bullet(60, 132, "Wypisz dane i szukane z jednostkami", 0),
          ...bullet(60, 188, "Zamień km/h na m/s (dziel przez 3,6)", 1),
          ...bullet(60, 244, "Wybierz wzór z jedną niewiadomą", 2),
          ...bullet(60, 300, "Sprawdź sens wyniku i jednostkę", 3),
          chip(60, 396, "1 m/s = 3,6 km/h", "#efe4c9"),
          { k: "text", x: 300, y: 392, text: "to najczęstsza pułapka w zadaniach", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "a = Δv/t, v = v₀ + at, s = v₀t + ½at².",
      "Pole pod wykresem v(t) to droga.",
      "Nachylenie wykresu v(t) to przyspieszenie.",
      "Zamieniaj jednostki przed liczeniem.",
    ],
    followUps: ["Jak rozwiązać zadanie z hamowaniem?", "Skąd bierze się wzór na drogę?", "Co to jest droga w pierwszej sekundzie?"],
  };
}

/* ----------------------------- NEWTON ------------------------------ */

export function newtonLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Trzy zasady dynamiki",
        "Newton zostawił nam trzy zasady, które opisują każdy ruch. Pierwsza mówi, że ciało pozostaje w spoczynku albo porusza się ruchem jednostajnym, jeśli nie działa na nie siła wypadkowa. Druga łączy siłę, masę i przyspieszenie: F równa się m razy a. Trzecia mówi, że każdej akcji towarzyszy równa i przeciwnie skierowana reakcja.",
        [
          title(40, 44, "Zasady dynamiki Newtona", INK.gold),
          { k: "text", x: 40, y: 120, text: "I. Bezwładność", size: 24, weight: 700, color: INK.green },
          { k: "text", x: 40, y: 152, text: "Bez siły wypadkowej ruch się nie zmienia.", size: 19, maxW: 720, color: INK.soft },
          { k: "text", x: 40, y: 216, text: "II. F = m·a", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 250, text: "Siła daje przyspieszenie. Większa masa — trudniej ruszyć.", size: 19, maxW: 720, color: INK.soft },
          { k: "text", x: 40, y: 314, text: "III. Akcja = reakcja", size: 24, weight: 700, color: INK.sky },
          { k: "text", x: 40, y: 346, text: "Odpychasz ścianę — ściana odpycha ciebie.", size: 19, maxW: 720, color: INK.soft },
          { k: "rect", x: 40, y: 404, w: 720, h: 92, radius: 14, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 440, text: "F to siła WYPADKOWA — suma wszystkich sił.", size: 21, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 472, text: "Jednostka: 1 N = 1 kg·m/s²", size: 19, color: INK.soft },
        ],
      ),
      s[1].step(
        "F = m·a w praktyce",
        "Policzmy przykład. Na wózek o masie dwóch kilogramów działa siła sześciu niutonów. Przekształcamy wzór: a równa się F przez m, czyli sześć przez dwa, więc przyspieszenie wynosi trzy metry na sekundę kwadrat. Gdyby masa była dwa razy większa, przyspieszenie spadłoby o połowę. To cała intuicja drugiej zasady.",
        [
          title(40, 44, "Obliczenia", INK.mint),
          { k: "text", x: 40, y: 130, text: "m = 2 kg    F = 6 N", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 210, text: "a = F / m = 6 / 2 = 3 m/s²", size: 34, hand: true, color: INK.green },
          { k: "text", x: 40, y: 300, text: "Dwa razy większa masa → dwa razy mniejsze a.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 340, text: "Dwa razy większa siła → dwa razy większe a.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 420, text: "a = F/m", size: 40, hand: true, color: INK.coral },
          { k: "text", x: 300, y: 420, text: "m = F/a", size: 40, hand: true, color: INK.gold },
          { k: "text", x: 560, y: 420, text: "F = m·a", size: 40, hand: true, color: INK.green },
          { k: "text", x: 40, y: 490, text: "Jeden trójkąt — trzy przekształcenia.", size: 19, color: INK.soft },
        ],
      ),
      s[2].step(
        "Siły na rysunku",
        "W zadaniach zawsze rysuj siły. Zaznacz środek ciała i strzałki: ciężar w dół, siła normalna w górę, tarcie przeciwnie do ruchu, siła ciągu w kierunku ruchu. Długość strzałki oznacza wartość siły. Dopiero potem licz siłę wypadkową. Bez rysunku łatwo pominąć tarcie albo pomylić kierunki.",
        [
          title(40, 44, "Diagram sił", INK.sky),
          { k: "rect", x: 300, y: 200, w: 180, h: 130, radius: 10, color: INK.ink, width: 3, fill: "#f4ecd9" },
          { k: "arrow", x1: 390, y1: 265, x2: 390, y2: 120, color: INK.sky, width: 4 },
          { k: "text", x: 405, y: 140, text: "N (normalna)", size: 18, color: INK.sky },
          { k: "arrow", x1: 390, y1: 265, x2: 390, y2: 400, color: INK.coral, width: 4 },
          { k: "text", x: 405, y: 390, text: "Fg = m·g", size: 18, color: INK.coral },
          { k: "arrow", x1: 390, y1: 265, x2: 590, y2: 265, color: INK.green, width: 4 },
          { k: "text", x: 520, y: 240, text: "F (ciąg)", size: 18, color: INK.green },
          { k: "arrow", x1: 390, y1: 265, x2: 240, y2: 265, color: INK.gold, width: 4 },
          { k: "text", x: 170, y: 292, text: "T (tarcie)", size: 18, color: INK.gold },
          { k: "text", x: 40, y: 460, text: "g ≈ 9,81 m/s², w zadaniach często 10 m/s².", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 500, text: "Siła wypadkowa = wektorowa suma wszystkich sił.", size: 19, weight: 700, color: INK.ink },
        ],
      ),
      s[3].step(
        "Bezwładność i tarcie",
        "Pierwsza zasada wyjaśnia, dlaczego w autobusie rzuca nas do przodu, gdy kierowca hamuje. Nasze ciało chce zachować dotychczasową prędkość. Tarcie z kolei zawsze działa przeciwnie do ruchu i zamienia energię w ciepło. Współczynnik tarcia mówi, jaka część nacisku zamienia się w opór. Dlatego zimą hamowanie trwa dłużej — lód ma mały współczynnik tarcia.",
        [
          title(40, 44, "Bezwładność i tarcie", INK.lilac),
          ...bullet(60, 130, "Hamowanie autobusu — ciało leci do przodu", 0),
          ...bullet(60, 186, "Tarcie działa przeciwnie do ruchu", 1),
          ...bullet(60, 242, "T = μ·N (μ — współczynnik tarcia)", 2),
          ...bullet(60, 298, "Lód: małe μ, długa droga hamowania", 3),
          { k: "text", x: 60, y: 392, text: "Masa to miara bezwładności — nie to samo co ciężar.", size: 20, weight: 700, color: INK.ink },
          { k: "text", x: 60, y: 432, text: "Ciężar to siła: Fg = m·g, liczona w niutonach.", size: 20, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "I zasada: bez siły wypadkowej ruch się nie zmienia.",
      "II zasada: F = m·a.",
      "III zasada: akcja i reakcja są równe i przeciwne.",
      "Masa to bezwładność, ciężar to siła grawitacji.",
    ],
    followUps: ["Jak obliczyć siłę tarcia?", "Dlaczego w autobusie rzuca nas do przodu?", "Czym różni się masa od ciężaru?"],
  };
}

/* ------------------------------ OHM -------------------------------- */

export function ohmLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Prawo Ohma",
        "Prawo Ohma wiąże trzy wielkości: napięcie, natężenie prądu i opór. Napięcie mierzymy w woltach, natężenie w amperach, a opór w omach. Wzór to U równa się I razy R. Można go zapamiętać jako trójkąt: napięcie na górze, prąd i opór na dole. Zakryj szukaną wielkość i od razu widzisz działanie.",
        [
          title(40, 44, "Prawo Ohma", INK.gold),
          { k: "poly", pts: [[130, 130], [330, 130], [230, 290]], closed: true, color: INK.green, width: 4, fill: "#edf3e9" },
          { k: "text", x: 218, y: 190, text: "U", size: 44, hand: true, color: INK.ink, align: "center" },
          { k: "text", x: 168, y: 260, text: "I", size: 34, hand: true, color: INK.sky },
          { k: "text", x: 288, y: 260, text: "R", size: 34, hand: true, color: INK.coral },
          { k: "text", x: 400, y: 140, text: "U = I·R", size: 38, hand: true, color: INK.ink },
          { k: "text", x: 400, y: 210, text: "I = U/R", size: 26, hand: true, color: INK.soft },
          { k: "text", x: 400, y: 262, text: "R = U/I", size: 26, hand: true, color: INK.soft },
          { k: "text", x: 400, y: 340, text: "U [V]   I [A]   R [Ω]", size: 22, color: INK.soft },
          { k: "text", x: 400, y: 400, text: "Większy opór → mniejszy prąd.", size: 19, weight: 700, color: INK.green },
        ],
      ),
      s[1].step(
        "Przykład: 12 V i 4 Ω",
        "Mamy źródło dwunastu woltów i opornik czterech omów. Szukamy natężenia prądu, więc dzielimy napięcie przez opór: dwanaście przez cztery daje trzy ampery. Sprawdzenie: trzy ampery razy cztery omy to dwanaście woltów. Zgadza się. Zawsze sprawdzaj wynik, mnożąc z powrotem — to zajmuje sekundę.",
        [
          title(40, 44, "Przykład", INK.mint),
          { k: "text", x: 40, y: 130, text: "U = 12 V    R = 4 Ω", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 210, text: "I = U / R = 12 / 4 = 3 A", size: 32, hand: true, color: INK.green },
          { k: "highlight", x: 34, y: 240, w: 620, h: 70, color: "#f7e7a8" },
          { k: "text", x: 40, y: 340, text: "Sprawdzenie: 3 A · 4 Ω = 12 V ✓", size: 22, color: INK.soft },
          { k: "text", x: 40, y: 410, text: "Gdy napięcie wzrośnie dwa razy, prąd też wzrośnie dwa razy.", size: 19, maxW: 740, color: INK.soft },
        ],
      ),
      s[2].step(
        "Szeregowo i równolegle",
        "W połączeniu szeregowym opory się dodają: R równa się R jeden plus R dwa. Prąd jest wszędzie taki sam, a napięcia się rozkładają. W połączeniu równoległym napięcie jest takie samo, a prądy się rozdzielają. Opór zastępczy jest wtedy mniejszy niż każdy z oporów osobno. To dlatego domowa instalacja działa równolegle — każdy odbiornik ma pełne napięcie.",
        [
          title(40, 44, "Szeregowo i równolegle", INK.sky),
          { k: "text", x: 40, y: 116, text: "Szeregowo", size: 22, weight: 700, color: INK.green },
          { k: "rect", x: 60, y: 160, w: 90, h: 46, radius: 6, color: INK.ink, width: 3 },
          { k: "rect", x: 190, y: 160, w: 90, h: 46, radius: 6, color: INK.ink, width: 3 },
          { k: "line", x1: 60, y1: 183, x2: 20, y2: 183, color: INK.ink, width: 3 },
          { k: "line", x1: 150, y1: 183, x2: 190, y2: 183, color: INK.ink, width: 3 },
          { k: "line", x1: 280, y1: 183, x2: 330, y2: 183, color: INK.ink, width: 3 },
          { k: "text", x: 40, y: 240, text: "R = R₁ + R₂", size: 24, hand: true, color: INK.green },
          { k: "text", x: 40, y: 276, text: "I jednakowe, U się dzieli", size: 18, color: INK.soft },
          { k: "text", x: 420, y: 116, text: "Równolegle", size: 22, weight: 700, color: INK.coral },
          { k: "line", x1: 440, y1: 183, x2: 720, y2: 183, color: INK.ink, width: 3 },
          { k: "line", x1: 480, y1: 160, x2: 480, y2: 206, color: INK.ink, width: 3 },
          { k: "line", x1: 620, y1: 160, x2: 620, y2: 206, color: INK.ink, width: 3 },
          { k: "rect", x: 440, y: 150, w: 280, h: 66, radius: 4, color: INK.coral, width: 2, at: 0.3 },
          { k: "text", x: 420, y: 240, text: "1/R = 1/R₁ + 1/R₂", size: 24, hand: true, color: INK.coral },
          { k: "text", x: 420, y: 276, text: "U jednakowe, I się dzieli", size: 18, color: INK.soft },
          { k: "text", x: 40, y: 350, text: "Opór zastępczy równolegle jest MNIEJSZY niż każdy z oporów.", size: 19, maxW: 740, color: INK.ink },
        ],
      ),
      s[3].step(
        "Moc i energia",
        "Moc prądu mówi, ile energii pobiera urządzenie w ciągu sekundy. Liczymy ją jako P równa się U razy I, a po przekształceniu także jako I kwadrat R lub U kwadrat przez R. Jednostką jest wat. Pralka o mocy dwóch tysięcy watów pracująca pół godziny zużywa jeden kilowatogodzinę energii. To właśnie ta liczba jest na rachunku za prąd.",
        [
          title(40, 44, "Moc i energia", INK.lilac),
          { k: "text", x: 40, y: 130, text: "P = U·I = I²·R = U²/R", size: 28, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 200, text: "P [W] — wat", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 260, text: "E = P·t", size: 30, hand: true, color: INK.lilac },
          { k: "text", x: 40, y: 320, text: "2 kW przez 0,5 h = 1 kWh", size: 22, color: INK.soft },
          { k: "rect", x: 40, y: 380, w: 700, h: 100, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 414, text: "Uwaga", size: 19, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 446, text: "P = U·I działa dla każdego odbiornika. Wzory z R tylko dla oporników.", size: 19, maxW: 650, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "U = I·R, jednostki: V, A, Ω.",
      "Szeregowo: R = R₁ + R₂. Równolegle: 1/R = 1/R₁ + 1/R₂.",
      "P = U·I, energia E = P·t.",
      "Większy opór przy tym samym napięciu daje mniejszy prąd.",
    ],
    followUps: ["Jak policzyć opór zastępczy trzech oporników?", "Dlaczego instalacja domowa jest równoległa?", "Jak dobrać bezpiecznik?"],
  };
}

/* ------------------------------- ATOM ------------------------------ */

export function atomLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Budowa atomu",
        "Atom zbudowany jest z jądra i krążących wokół niego elektronów. W jądrze siedzą protony, które mają ładunek dodatni, oraz neutrony, które są obojętne. Elektrony mają ładunek ujemny i zajmują powłoki. Atom jako całość jest obojętny, bo liczby protonów i elektronów są równe. Prawie cała masa skupiona jest w jądrze, choć jest ono tysiące razy mniejsze od całego atomu.",
        [
          title(40, 44, "Budowa atomu", INK.gold),
          { k: "circle", cx: 240, cy: 250, r: 150, color: "#b9c9b6", width: 2 },
          { k: "circle", cx: 240, cy: 250, r: 105, color: "#b9c9b6", width: 2 },
          { k: "circle", cx: 240, cy: 250, r: 48, color: INK.coral, width: 3, fill: "#f7ddd4" },
          { k: "dot", cx: 228, cy: 240, r: 7, color: INK.coral },
          { k: "dot", cx: 252, cy: 258, r: 7, color: INK.coral },
          { k: "dot", cx: 244, cy: 232, r: 7, color: INK.soft },
          { k: "dot", cx: 135, cy: 200, r: 6, color: INK.sky },
          { k: "dot", cx: 330, cy: 310, r: 6, color: INK.sky },
          { k: "dot", cx: 150, cy: 330, r: 6, color: INK.sky },
          { k: "text", x: 420, y: 140, text: "proton p⁺", size: 20, weight: 700, color: INK.coral },
          { k: "text", x: 420, y: 176, text: "neutron n⁰", size: 20, weight: 700, color: INK.soft },
          { k: "text", x: 420, y: 212, text: "elektron e⁻", size: 20, weight: 700, color: INK.sky },
          { k: "text", x: 420, y: 280, text: "jądro = protony + neutrony", size: 19, color: INK.soft },
          { k: "text", x: 420, y: 316, text: "powłoki = elektrony", size: 19, color: INK.soft },
          { k: "text", x: 420, y: 376, text: "#protonów = #elektronów → atom obojętny", size: 19, maxW: 400, color: INK.green },
        ],
      ),
      s[1].step(
        "Liczba atomowa i masowa",
        "Liczba atomowa Z to liczba protonów i jednocześnie numer pierwiastka w układzie okresowym. Liczba masowa A to suma protonów i neutronów. Neutrony liczymy, odejmując Z od A. Izotopy to atomy tego samego pierwiastka, które mają różną liczbę neutronów. Dlatego mają ten sam Z, ale różne A. Właściwości chemiczne pozostają niemal takie same.",
        [
          title(40, 44, "Z i A", INK.mint),
          { k: "text", x: 40, y: 120, text: "Z = liczba protonów", size: 24, weight: 700, color: INK.coral },
          { k: "text", x: 40, y: 162, text: "A = protony + neutrony", size: 24, weight: 700, color: INK.green },
          { k: "text", x: 40, y: 218, text: "n = A − Z", size: 34, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 300, text: "Przykład: chlor", size: 21, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 340, text: "Z = 17 → 17 protonów, 17 elektronów", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 374, text: "A = 35 → 35 − 17 = 18 neutronów", size: 20, color: INK.soft },
          { k: "rect", x: 40, y: 428, w: 720, h: 96, radius: 14, color: INK.lilac, width: 2, fill: "#efedfb" },
          { k: "text", x: 62, y: 462, text: "Izotopy", size: 19, weight: 700, color: INK.lilac },
          { k: "text", x: 62, y: 494, text: "Ten sam pierwiastek, inna liczba neutronów. Np. chlor-35 i chlor-37.", size: 19, maxW: 660, color: INK.soft },
        ],
      ),
      s[2].step(
        "Konfiguracja elektronowa",
        "Elektrony układamy na powłokach: K, L, M, N. Pierwsza powłoka mieści maksymalnie dwa elektrony, druga osiem, trzecia osiemnaście, ale w najprostszych zadaniach zatrzymujemy się na ośmiu. Dla chloru, który ma siedemnaście elektronów, zapisujemy dwa, osiem, siedem. Ostatnia powłoka to elektrony walencyjne — one decydują o reakcjach chemicznych. Pierwiastek z siedmioma elektronami walencyjnymi chętnie przyjmie jeden.",
        [
          title(40, 44, "Powłoki elektronowe", INK.sky),
          { k: "text", x: 40, y: 116, text: "K: 2   L: 8   M: 18   N: 32", size: 22, color: INK.soft },
          { k: "circle", cx: 250, cy: 260, r: 44, color: INK.coral, width: 3 },
          { k: "circle", cx: 250, cy: 260, r: 86, color: "#a9bdb0", width: 3 },
          { k: "circle", cx: 250, cy: 260, r: 128, color: "#a9bdb0", width: 3 },
          { k: "dot", cx: 250, cy: 224, r: 5, color: INK.sky },
          { k: "dot", cx: 250, cy: 296, r: 5, color: INK.sky },
          { k: "dot", cx: 172, cy: 260, r: 5, color: INK.sky },
          { k: "dot", cx: 328, cy: 260, r: 5, color: INK.sky },
          { k: "dot", cx: 250, cy: 132, r: 5, color: INK.sky },
          { k: "text", x: 420, y: 180, text: "Cl: 17 e⁻ → 2, 8, 7", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 420, y: 236, text: "7 elektronów walencyjnych", size: 19, color: INK.soft },
          { k: "text", x: 420, y: 286, text: "Chlor przyjmie 1 elektron → Cl⁻", size: 19, color: INK.green },
          { k: "text", x: 420, y: 340, text: "Dąży do oktetu, czyli 8 na ostatniej powłoce.", size: 19, maxW: 380, color: INK.soft },
        ],
      ),
      s[3].step(
        "Jony i położenie w układzie",
        "Atom, który oddaje elektron, staje się kationem i ma ładunek dodatni. Atom, który przyjmuje elektron, staje się anionem i ma ładunek ujemny. Sód oddaje jeden elektron i powstaje kation sodu. Chlor przyjmuje jeden elektron i powstaje anion chlorkowy. Razem tworzą chlorek sodu, czyli sól kuchenną. Położenie w układzie okresowym od razu podpowiada, ile elektronów pierwiastek odda lub przyjmie.",
        [
          title(40, 44, "Jony", INK.lilac),
          { k: "text", x: 40, y: 130, text: "Na → Na⁺ + e⁻", size: 28, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 190, text: "Cl + e⁻ → Cl⁻", size: 28, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 260, text: "Na⁺ + Cl⁻ → NaCl", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 340, text: "1. grupa → 1 elektron walencyjny → kation 1+", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 374, text: "17. grupa → 7 elektronów → anion 1−", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 408, text: "18. grupa → oktet pełny → brak reakcji", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 480, text: "Liczba grupy podpowiada ładunek jonu.", size: 21, weight: 700, color: INK.ink },
        ],
      ),
    ],
    takeaways: [
      "Atom = jądro (p⁺, n⁰) + elektrony (e⁻).",
      "Z to liczba protonów, A to protony + neutrony.",
      "Izotopy mają ten sam Z, różne A.",
      "Jony powstają przez oddanie lub przyjęcie elektronów.",
    ],
    followUps: ["Jak ustalić liczbę neutronów w izotopie?", "Dlaczego atomy dążą do oktetu?", "Czym są elektrony walencyjne?"],
  };
}

/* ------------------------------- MOLES ----------------------------- */

export function molesLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Mol — porcja chemika",
        "Mol to po prostu bardzo duża porcja. Jeden mol zawiera sześć przecinek zero dwa razy dziesięć do dwudziestej trzeciej cząsteczek. Ta liczba nazywa się stałą Avogadra. Dzięki niej możemy liczyć cząsteczki tak, jak w sklepie liczymy jajka na tuziny. Masa jednego mola substancji w gramach jest liczbowo równa jej masie cząsteczkowej. Woda ma masę molową osiemnaście gramów na mol.",
        [
          title(40, 44, "Mol", INK.gold),
          { k: "text", x: 40, y: 120, text: "1 mol = 6,02 · 10²³ cząsteczek", size: 28, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 182, text: "Nₐ = 6,02 · 10²³ mol⁻¹", size: 22, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 250, text: "M(H₂O) = 18 g/mol", size: 24, hand: true, color: INK.green },
          { k: "text", x: 40, y: 300, text: "2 g wodoru + 16 g tlenu = 18 g wody", size: 19, color: INK.soft },
          { k: "rect", x: 40, y: 360, w: 720, h: 110, radius: 14, color: INK.gold, width: 2, fill: "#fdf5dd" },
          { k: "text", x: 62, y: 394, text: "Analogia", size: 19, weight: 700, color: INK.gold },
          { k: "text", x: 62, y: 426, text: "Tuzin to 12 sztuk. Mol to 6,02·10²³ cząsteczek. Inna nazwa, ta sama idea.", size: 19, maxW: 660, color: INK.soft },
        ],
      ),
      s[1].step(
        "n = m / M",
        "Najważniejszy wzór to liczba moli równa się masa podzielona przez masę molową. Policzmy wodę: mamy trzydzieści sześć gramów, a masa molowa to osiemnaście gramów na mol. Dzielimy i dostajemy dwa mole. Gdy znamy liczbę moli, możemy policzyć cząsteczki, mnożąc przez stałą Avogadra. Dwa mole to około jeden przecinek dwa razy dziesięć do dwudziestej czwartej cząsteczek.",
        [
          title(40, 44, "Liczba moli", INK.mint),
          { k: "text", x: 40, y: 124, text: "n = m / M", size: 40, hand: true, color: INK.ink },
          { k: "text", x: 300, y: 132, text: "n [mol]   m [g]   M [g/mol]", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 220, text: "m = 36 g,  M(H₂O) = 18 g/mol", size: 22, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 280, text: "n = 36 / 18 = 2 mol", size: 34, hand: true, color: INK.green },
          { k: "text", x: 40, y: 356, text: "Liczba cząsteczek: N = n · Nₐ", size: 22, hand: true, color: INK.sky },
          { k: "text", x: 40, y: 404, text: "N = 2 · 6,02·10²³ = 1,2·10²⁴", size: 22, hand: true, color: INK.sky },
        ],
      ),
      s[2].step(
        "Stężenie molowe",
        "Stężenie molowe mówi, ile moli substancji znajduje się w jednym decymetrze sześciennym roztworu. Wzór to C równa się n przez V. Na przykład pół mola w dwóch decymetrach sześciennych daje stężenie zero przecinek dwadzieścia pięć mola na decymetr sześcienny. Pamiętaj, że objętość musi być w decymetrach sześciennych, czyli w litrach. Mililitry dzielimy przez tysiąc.",
        [
          title(40, 44, "Stężenie molowe", INK.lilac),
          { k: "text", x: 40, y: 124, text: "C = n / V", size: 40, hand: true, color: INK.ink },
          { k: "text", x: 300, y: 132, text: "C [mol/dm³]   V [dm³]", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 220, text: "n = 0,5 mol,  V = 2 dm³", size: 22, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 280, text: "C = 0,5 / 2 = 0,25 mol/dm³", size: 30, hand: true, color: INK.green },
          { k: "highlight", x: 34, y: 310, w: 640, h: 70, color: "#eef0fb" },
          { k: "text", x: 48, y: 358, text: "1 dm³ = 1 l = 1000 cm³ = 1000 ml", size: 20, color: INK.ink, at: 0.4 },
          { k: "text", x: 40, y: 440, text: "Najczęstszy błąd: wstawienie mililitrów zamiast litrów.", size: 19, color: INK.coral },
        ],
      ),
      s[3].step(
        "Rozcieńczanie i zadania",
        "Podczas rozcieńczania liczba moli się nie zmienia, zmienia się tylko objętość. Dlatego C jeden razy V jeden równa się C dwa razy V dwa. Jeśli rozcieńczysz roztwór dwa razy, stężenie spadnie o połowę. W zadaniach zawsze wypisz dane, zamień jednostki i dopiero potem podstaw do wzoru. Sprawdź, czy wynik ma sens: stężenie nie może być ujemne, a liczba moli powinna być dodatnia.",
        [
          title(40, 44, "Rozcieńczanie", INK.sky),
          { k: "text", x: 40, y: 124, text: "C₁·V₁ = C₂·V₂", size: 36, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "2 mol/dm³ · 0,5 dm³ = C₂ · 2 dm³", size: 22, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 264, text: "C₂ = 0,5 mol/dm³", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 340, text: "Liczba moli przed = liczba moli po", size: 20, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 382, text: "Zmienia się tylko objętość i stężenie.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 450, text: "Schemat: dane → jednostki → wzór → wynik → sprawdzenie", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "1 mol = 6,02·10²³ cząsteczek (stała Avogadra).",
      "n = m/M, gdzie M to masa molowa w g/mol.",
      "Stężenie molowe: C = n/V, V w dm³.",
      "Rozcieńczanie: C₁V₁ = C₂V₂.",
    ],
    followUps: ["Jak policzyć masę molową związku?", "Czym różni się stężenie procentowe od molowego?", "Jak przeliczyć ml na dm³?"],
  };
}

/* -------------------------------- pH ------------------------------- */

export function phLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Skala pH",
        "Skala pH opisuje kwasowość roztworu i ma zakres od zera do czternastu. Środek skali, czyli siedem, to odczyn obojętny, tak jak w czystej wodzie. Wartości poniżej siedmiu oznaczają kwas, a powyżej siedmiu zasadę. Im mniejsze pH, tym więcej jonów wodorowych i tym mocniejszy kwas. Każda jednostka w dół oznacza dziesięciokrotny wzrost stężenia jonów wodorowych.",
        [
          title(40, 44, "Skala pH", INK.gold),
          { k: "rect", x: 50, y: 150, w: 760, h: 58, radius: 12, color: INK.ink, width: 2, fill: "#f7f1e4" },
          { k: "rect", x: 50, y: 150, w: 190, h: 58, radius: 12, color: INK.coral, width: 0, fill: "#f2b5a4" },
          { k: "rect", x: 620, y: 150, w: 190, h: 58, radius: 12, color: INK.sky, width: 0, fill: "#b9d4e4" },
          { k: "text", x: 50, y: 240, text: "0", size: 18, color: INK.soft },
          { k: "text", x: 425, y: 240, text: "7", size: 18, color: INK.soft },
          { k: "text", x: 790, y: 240, text: "14", size: 18, color: INK.soft },
          { k: "text", x: 90, y: 130, text: "kwas", size: 20, weight: 700, color: INK.coral },
          { k: "text", x: 400, y: 130, text: "obojętne", size: 20, weight: 700, color: INK.green },
          { k: "text", x: 690, y: 130, text: "zasada", size: 20, weight: 700, color: INK.sky },
          { k: "text", x: 50, y: 320, text: "pH < 7  → kwas", size: 22, color: INK.coral },
          { k: "text", x: 50, y: 360, text: "pH = 7  → obojętne", size: 22, color: INK.green },
          { k: "text", x: 50, y: 400, text: "pH > 7  → zasada", size: 22, color: INK.sky },
          { k: "text", x: 50, y: 470, text: "Jedna jednostka w dół = 10× więcej jonów H⁺.", size: 19, weight: 700, color: INK.ink },
        ],
      ),
      s[1].step(
        "pH = −log[H⁺]",
        "pH liczymy jako ujemny logarytm dziesiętny ze stężenia jonów wodorowych. Jeśli stężenie wynosi dziesięć do minus trzeciej mola na decymetr sześcienny, to pH równa się trzy. Dla dziesięć do minus piątej otrzymujemy pięć. Dzięki logarytmowi ogromne różnice stężeń zamieniają się w wygodną skalę od zera do czternastu. W drugą stronę: znając pH, podnosimy dziesięć do potęgi minus pH.",
        [
          title(40, 44, "Obliczanie pH", INK.mint),
          { k: "text", x: 40, y: 130, text: "pH = −log[H⁺]", size: 40, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 220, text: "[H⁺] = 10⁻³ mol/dm³", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 280, text: "pH = −log(10⁻³) = 3", size: 34, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 356, text: "[H⁺] = 10⁻⁵ → pH = 5", size: 24, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 420, text: "W drugą stronę: [H⁺] = 10^(−pH)", size: 22, color: INK.soft },
          { k: "text", x: 40, y: 480, text: "Logarytm zamienia mnożenie na dodawanie — dlatego skala jest wygodna.", size: 19, maxW: 720, color: INK.ink },
        ],
      ),
      s[2].step(
        "Kwasy, zasady, zobojętnianie",
        "Kwasy oddają jony wodorowe, a zasady przyjmują je albo oddają jony wodorotlenkowe. Gdy zmieszamy kwas z zasadą, zachodzi reakcja zobojętniania. Powstaje sól i woda. Na przykład kwas chlorowodorowy plus wodorotlenek sodu daje chlorek sodu i wodę. Jeśli użyjemy dokładnie takich ilości, żeby się zobojętniły, pH końcowe będzie bliskie siedmiu.",
        [
          title(40, 44, "Zobojętnianie", INK.lilac),
          { k: "text", x: 40, y: 124, text: "kwas + zasada → sól + woda", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 200, text: "HCl + NaOH → NaCl + H₂O", size: 30, hand: true, color: INK.green },
          { k: "text", x: 40, y: 280, text: "Kwas: HCl, H₂SO₄, HNO₃", size: 20, color: INK.coral },
          { k: "text", x: 40, y: 316, text: "Zasada: NaOH, KOH, Ca(OH)₂", size: 20, color: INK.sky },
          { k: "rect", x: 40, y: 376, w: 720, h: 104, radius: 14, color: INK.gold, width: 2, fill: "#fdf5dd" },
          { k: "text", x: 62, y: 410, text: "Uwaga", size: 19, weight: 700, color: INK.gold },
          { k: "text", x: 62, y: 442, text: "Zobojętnianie nie zawsze daje pH 7 — wszystko zależy od mocnych i słabych kwasów.", size: 19, maxW: 660, color: INK.soft },
        ],
      ),
      s[3].step(
        "Wskaźniki i życie codzienne",
        "Wskaźniki zmieniają kolor w zależności od pH. Papierek uniwersalny pokazuje całą paletę, a fenoloftaleina jest bezbarwna w kwasie i różowa w zasadzie. W codziennym życiu sok z cytryny ma pH około dwa, kawa pięć, woda siedem, mydło dziewięć, a wybielacz trzynaście. Nasza skóra i krew mają ściśle określone pH, a jego zmiana może być groźna. Dlatego warto rozumieć tę skalę, nie tylko ją wkuwać.",
        [
          title(40, 44, "W codziennym życiu", INK.sky),
          { k: "text", x: 40, y: 120, text: "cytryna ~2   kawa ~5   woda 7", size: 21, color: INK.soft },
          { k: "text", x: 40, y: 158, text: "mydło ~9   wybielacz ~13", size: 21, color: INK.soft },
          ...bullet(60, 232, "Papierek uniwersalny — cała skala", 0),
          ...bullet(60, 288, "Fenoloftaleina — różowa w zasadzie", 1),
          ...bullet(60, 344, "Krew ma pH ok. 7,4 — bardzo wąski zakres", 2),
          { k: "text", x: 60, y: 430, text: "Kwas w żołądku ma pH 1–2 i rozkłada pokarm.", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "pH 0–14; 7 to odczyn obojętny.",
      "pH = −log[H⁺].",
      "Każda jednostka to dziesięciokrotna zmiana stężenia H⁺.",
      "kwas + zasada → sól + woda.",
    ],
    followUps: ["Jak obliczyć pH po rozcieńczeniu kwasu?", "Co to jest mocny i słaby kwas?", "Jak działa bufor pH we krwi?"],
  };
}

/* ------------------------------- CELL ------------------------------ */

export function cellLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Komórka — podstawowa jednostka życia",
        "Komórka jest najmniejszą jednostką zdolną do samodzielnego życia. Wszystkie organizmy zbudowane są z komórek, a nowe komórki powstają tylko z istniejących. Każda komórka ma błonę komórkową, która oddziela wnętrze od środowiska i decyduje, co może przejść. W środku znajduje się cytoplazma, w której zachodzą reakcje, oraz materiał genetyczny. To trzy elementy wspólne dla każdej komórki.",
        [
          title(40, 44, "Komórka", INK.gold),
          { k: "poly", pts: [[180, 130], [340, 120], [430, 220], [410, 360], [280, 430], [150, 360], [120, 240]], closed: true, smooth: true, color: INK.green, width: 4, fill: "#eef4e7" },
          { k: "circle", cx: 270, cy: 260, r: 62, color: INK.coral, width: 3, fill: "#f7ddd4" },
          { k: "text", x: 240, y: 268, text: "jądro", size: 18, weight: 700, color: INK.ink },
          { k: "circle", cx: 200, cy: 340, r: 16, color: INK.lilac, width: 2, fill: "#e6e1fa" },
          { k: "circle", cx: 340, cy: 330, r: 14, color: INK.lilac, width: 2, fill: "#e6e1fa" },
          { k: "text", x: 480, y: 140, text: "błona komórkowa", size: 19, weight: 700, color: INK.green },
          { k: "text", x: 480, y: 172, text: "cytoplazma", size: 19, weight: 700, color: INK.soft },
          { k: "text", x: 480, y: 204, text: "jądro z DNA", size: 19, weight: 700, color: INK.coral },
          { k: "text", x: 480, y: 236, text: "mitochondria", size: 19, weight: 700, color: INK.lilac },
          { k: "text", x: 480, y: 300, text: "Wszystkie komórki mają:", size: 20, weight: 700, color: INK.ink },
          { k: "text", x: 480, y: 334, text: "błonę, cytoplazmę i materiał genetyczny.", size: 19, maxW: 340, color: INK.soft },
        ],
      ),
      s[1].step(
        "Najważniejsze organelle",
        "Mitochondrium to elektrownia komórki — zachodzi w nim oddychanie komórkowe, które produkuje ATP. Rybosomy budują białka z instrukcji zapisanej w RNA. Siatka śródplazmatyczna transportuje substancje, a aparat Golgiego pakuje je i wysyła. Lizosomy trawią zbędne cząsteczki. Każde organellum ma jedną, konkretną robotę, a razem tworzą sprawną fabrykę.",
        [
          title(40, 44, "Organelle", INK.mint),
          ...bullet(60, 126, "Mitochondrium — ATP, oddychanie komórkowe", 0),
          ...bullet(60, 182, "Rybosom — synteza białek", 1),
          ...bullet(60, 238, "Siatka śródplazmatyczna — transport", 2),
          ...bullet(60, 294, "Aparat Golgiego — pakowanie i wysyłka", 3),
          ...bullet(60, 350, "Lizosom — trawienie wewnątrzkomórkowe", 4),
          { k: "text", x: 60, y: 436, text: "Mitochondrium ma własne DNA — pochodzi od bakterii.", size: 19, weight: 700, color: INK.lilac },
          { k: "text", x: 60, y: 472, text: "Dlatego dziedziczymy je tylko po matce.", size: 19, color: INK.soft },
        ],
      ),
      s[2].step(
        "Komórka roślinna vs zwierzęca",
        "Komórka roślinna różni się od zwierzęcej trzema rzeczami. Ma ścianę komórkową z celulozy, która daje sztywność. Ma chloroplasty, w których zachodzi fotosynteza. I ma dużą wakuolę, która magazynuje wodę i utrzymuje ciśnienie. Komórka zwierzęca nie ma ściany ani chloroplastów, za to ma więcej mitochondriów i centriole. Oba typy mają jądro, błonę i cytoplazmę.",
        [
          title(40, 44, "Roślinna vs zwierzęca", INK.sky),
          { k: "rect", x: 50, y: 120, w: 350, h: 350, radius: 18, color: INK.green, width: 4, fill: "#eef4e7" },
          { k: "text", x: 90, y: 152, text: "roślinna", size: 22, weight: 700, color: INK.green },
          { k: "circle", cx: 140, cy: 260, r: 26, color: INK.green, width: 2, fill: "#d8ead2" },
          { k: "text", x: 180, y: 254, text: "chloroplasty", size: 17, color: INK.soft },
          { k: "rect", x: 110, y: 320, w: 170, h: 80, radius: 12, color: INK.sky, width: 2, fill: "#dcebf3" },
          { k: "text", x: 180, y: 360, text: "wakuola", size: 17, color: INK.soft },
          { k: "text", x: 90, y: 430, text: "ściana komórkowa", size: 17, color: INK.soft },
          { k: "circle", cx: 600, cy: 270, r: 130, color: INK.coral, width: 4, fill: "#fbeee8" },
          { k: "text", x: 540, y: 160, text: "zwierzęca", size: 22, weight: 700, color: INK.coral },
          { k: "circle", cx: 580, cy: 260, r: 34, color: INK.coral, width: 2, fill: "#f7ddd4" },
          { k: "text", x: 500, y: 320, text: "więcej mitochondriów", size: 17, color: INK.soft },
          { k: "text", x: 40, y: 500, text: "Roślina: ściana + chloroplasty + duża wakuola.", size: 19, weight: 700, color: INK.ink },
        ],
      ),
      s[3].step(
        "Oddychanie komórkowe",
        "Oddychanie komórkowe to proces, w którym komórka zdobywa energię. W uproszczeniu glukoza i tlen są zamieniane na dwutlenek węgla, wodę i ATP. Najwięcej ATP powstaje w mitochondriach. ATP jest uniwersalną walutą energii — każda praca komórki, od skurczu mięśnia po transport jonów, zużywa właśnie ATP. Dlatego komórki z dużym zapotrzebowaniem na energię mają wyjątkowo dużo mitochondriów.",
        [
          title(40, 44, "Oddychanie komórkowe", INK.lilac),
          { k: "text", x: 40, y: 130, text: "glukoza + O₂ → CO₂ + H₂O + ATP", size: 24, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energia", size: 20, hand: true, color: INK.soft },
          { k: "pill", x: 40, y: 270, w: 380, h: 60, text: "ATP = waluta energii", size: 21, bg: "#e9e6fb", color: INK.lilac },
          { k: "text", x: 40, y: 380, text: "Mięśnie i neurony mają najwięcej mitochondriów.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 420, text: "Bez tlenu: fermentacja, mniej ATP, kwas mlekowy.", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 490, text: "Fotosynteza i oddychanie to procesy odwrotne.", size: 20, weight: 700, color: INK.green },
        ],
      ),
    ],
    takeaways: [
      "Komórka = błona + cytoplazma + materiał genetyczny.",
      "Mitochondrium produkuje ATP w oddychaniu komórkowym.",
      "Komórka roślinna ma ścianę, chloroplasty i dużą wakuolę.",
      "ATP to uniwersalna waluta energii komórki.",
    ],
    followUps: ["Jak działa transport przez błonę?", "Dlaczego mitochondria mają własne DNA?", "Czym jest mitoza?"],
  };
}

/* --------------------------- PHOTOSYNTHESIS ------------------------ */

export function photosynthesisLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Równanie fotosyntezy",
        "Fotosynteza to proces, w którym rośliny wytwarzają glukozę ze światła, dwutlenku węgla i wody. Produktem ubocznym jest tlen. Równanie wygląda tak: sześć cząsteczek dwutlenku węgla plus sześć cząsteczek wody, w obecności światła, daje jedną cząsteczkę glukozy i sześć cząsteczek tlenu. Energia światła jest magazynowana w wiązaniach chemicznych glukozy. To dzięki temu procesowi mamy tlen w atmosferze i pokarm w łańcuchu pokarmowym.",
        [
          title(40, 44, "Fotosynteza", INK.gold),
          { k: "text", x: 40, y: 130, text: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", size: 27, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 188, text: "↑ światło i chlorofil", size: 20, color: INK.gold },
          { k: "arrow", x1: 100, y1: 210, x2: 100, y2: 240, color: INK.gold, width: 3 },
          { k: "rect", x: 40, y: 280, w: 700, h: 104, radius: 14, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 62, y: 314, text: "Substraty", size: 18, weight: 700, color: INK.green },
          { k: "text", x: 62, y: 342, text: "dwutlenek węgla + woda + energia światła", size: 20, color: INK.soft },
          { k: "text", x: 62, y: 314, text: "", size: 1, at: 0 },
          { k: "text", x: 400, y: 314, text: "Produkty", size: 18, weight: 700, color: INK.coral },
          { k: "text", x: 400, y: 342, text: "glukoza + tlen", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 440, text: "Tlen, którym oddychamy, pochodzi właśnie z fotosyntezy.", size: 19, color: INK.ink },
        ],
      ),
      s[1].step(
        "Dwie fazy w chloroplastie",
        "Fotosynteza przebiega w chloroplastach i ma dwie fazy. Faza jasna zachodzi w błonach tylakoidów i wymaga światła. Powstaje w niej ATP oraz NADPH, a woda jest rozkładana, co uwalnia tlen. Faza ciemna, czyli cykl Calvina, zachodzi w stromie i nie potrzebuje bezpośrednio światła. W niej z CO₂ budowana jest glukoza, przy użyciu ATP i NADPH z fazy jasnej.",
        [
          title(40, 44, "Chloroplast", INK.mint),
          { k: "poly", pts: [[120, 140], [360, 140], [430, 260], [360, 400], [120, 400], [70, 260]], closed: true, smooth: true, color: INK.green, width: 4, fill: "#eaf3e1" },
          { k: "line", x1: 150, y1: 200, x2: 330, y2: 200, color: INK.green, width: 3 },
          { k: "line", x1: 150, y1: 260, x2: 330, y2: 260, color: INK.green, width: 3 },
          { k: "line", x1: 150, y1: 320, x2: 330, y2: 320, color: INK.green, width: 3 },
          { k: "text", x: 470, y: 150, text: "tylakoidy → faza jasna", size: 20, weight: 700, color: INK.green },
          { k: "text", x: 470, y: 186, text: "stroma → cykl Calvina", size: 20, weight: 700, color: INK.sky },
          { k: "text", x: 470, y: 250, text: "Faza jasna: H₂O → O₂ + ATP + NADPH", size: 19, color: INK.soft },
          { k: "text", x: 470, y: 286, text: "Cykl Calvina: CO₂ → glukoza", size: 19, color: INK.soft },
          { k: "text", x: 470, y: 350, text: "Chlorofil pochłania głównie światło", size: 19, color: INK.soft },
          { k: "text", x: 470, y: 380, text: "czerwone i niebieskie — dlatego liście są zielone.", size: 19, maxW: 380, color: INK.soft },
        ],
      ),
      s[2].step(
        "Czynniki ograniczające",
        "Tempo fotosyntezy zależy od trzech czynników: natężenia światła, stężenia dwutlenku węgla i temperatury. Gdy jednego z nich brakuje, pozostałe nie pomogą — dlatego mówimy o czynniku ograniczającym. Na wykresie widać to jako plateau: po przekroczeniu pewnego poziomu światła tempo przestaje rosnąć, bo ogranicza je już CO₂. Zbyt wysoka temperatura niszczy enzymy, więc tempo spada. To klasyczne zadanie maturalne z odczytywaniem wykresu.",
        [
          title(40, 44, "Czynniki ograniczające", INK.lilac),
          { k: "axes", x: 130, y: 110, w: 480, h: 340, xLabel: "natężenie światła", yLabel: "tempo fotosyntezy", ticks: true },
          { k: "func", frame: { x: 130, y: 110, w: 480, h: 340 }, expr: "4*ln(x+1)", domain: [0, 8], range: [0, 12], color: INK.green, width: 4, at: 0.05 },
          { k: "line", x1: 130, y1: 120, x2: 610, y2: 120, color: INK.coral, width: 2, dash: true, at: 0.5 },
          { k: "text", x: 620, y: 116, text: "limit CO₂", size: 18, color: INK.coral },
          { k: "text", x: 40, y: 500, text: "Brak jednego czynnika blokuje cały proces.", size: 20, weight: 700, color: INK.ink },
          ...bullet(620, 200, "światło", 0, INK.gold),
          ...bullet(620, 250, "CO₂", 1, INK.sky),
          ...bullet(620, 300, "temperatura", 2, INK.coral),
        ],
      ),
      s[3].step(
        "Znaczenie dla życia",
        "Fotosynteza jest podstawą niemal wszystkich łańcuchów pokarmowych. Rośliny, glony i sinice produkują materię organiczną z nieorganicznej. Bez fotosyntezy nie byłoby tlenu w atmosferze ani warstwy ozonowej. Proces pochłania też ogromne ilości dwutlenku węgla, więc ma znaczenie dla klimatu. Jej odwrotnością jest oddychanie komórkowe, które zużywa glukozę i tlen. Warto zapamiętać oba równania razem — różnią się kierunkiem.",
        [
          title(40, 44, "Dlaczego to ważne", INK.green),
          ...bullet(60, 130, "Podstawa łańcuchów pokarmowych", 0),
          ...bullet(60, 186, "Źródło tlenu w atmosferze", 1),
          ...bullet(60, 242, "Pochłanianie CO₂ — regulacja klimatu", 2),
          ...bullet(60, 298, "Odwrotność oddychania komórkowego", 3),
          { k: "rect", x: 40, y: 366, w: 720, h: 120, radius: 14, color: INK.sky, width: 2, fill: "#e9f2f8" },
          { k: "text", x: 62, y: 400, text: "Porównanie", size: 19, weight: 700, color: INK.sky },
          { k: "text", x: 62, y: 432, text: "Fotosynteza: CO₂ + H₂O → glukoza + O₂ (energia wchodzi)", size: 18, maxW: 670, color: INK.soft },
          { k: "text", x: 62, y: 462, text: "Oddychanie: glukoza + O₂ → CO₂ + H₂O (energia wychodzi)", size: 18, maxW: 670, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "6CO₂ + 6H₂O + światło → glukoza + 6O₂.",
      "Faza jasna w tylakoidach, cykl Calvina w stromie.",
      "Czynniki ograniczające: światło, CO₂, temperatura.",
      "Fotosynteza i oddychanie to procesy odwrotne.",
    ],
    followUps: ["Jak odczytać wykres tempa fotosyntezy?", "Dlaczego liście są zielone?", "Czym różni się fotosynteza od chemosyntezy?"],
  };
}

/* -------------------------------- DNA ------------------------------ */

export function dnaLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Struktura DNA",
        "DNA to podwójna helisa zbudowana z nukleotydów. Każdy nukleotyd ma cukier deoksyrybozę, resztę fosforanową i jedną z czterech zasad: adeninę, tyminę, cytozynę lub guaninę. Zasady łączą się w pary zawsze tak samo: adenina z tyminą, a cytozyna z guaniną. To komplementarność zasad. Sekwencja tych liter jest instrukcją, według której budowane są białka. Cały zestaw instrukcji organizmu nazywamy genomem.",
        [
          title(40, 44, "Podwójna helisa", INK.gold),
          { k: "poly", pts: [[160, 110], [230, 160], [170, 220], [240, 280], [170, 340], [240, 400]], color: INK.green, width: 5, smooth: true },
          { k: "poly", pts: [[280, 110], [210, 160], [270, 220], [200, 280], [270, 340], [200, 400]], color: INK.sky, width: 5, smooth: true },
          { k: "line", x1: 214, y1: 150, x2: 246, y2: 150, color: INK.coral, width: 3 },
          { k: "line", x1: 214, y1: 250, x2: 246, y2: 250, color: INK.coral, width: 3 },
          { k: "line", x1: 214, y1: 350, x2: 246, y2: 350, color: INK.coral, width: 3 },
          { k: "text", x: 360, y: 130, text: "A — T", size: 28, hand: true, color: INK.coral },
          { k: "text", x: 360, y: 186, text: "C — G", size: 28, hand: true, color: INK.lilac },
          { k: "text", x: 360, y: 250, text: "cukier + fosforan + zasada", size: 19, color: INK.soft },
          { k: "text", x: 360, y: 300, text: "Sekwencja zasad = informacja.", size: 19, color: INK.soft },
          { k: "text", x: 360, y: 370, text: "Genom = cały zestaw genów.", size: 20, weight: 700, color: INK.green },
        ],
      ),
      s[1].step(
        "Replikacja DNA",
        "Przed podziałem komórki DNA musi się skopiować. Podwójna helisa rozplata się, a każda nić służy jako matryca do zbudowania nowej. Zasada komplementarności zapewnia, że naprzeciw adeniny zawsze stanie tymina, a naprzeciw cytozyny guanina. W efekcie powstają dwie identyczne cząsteczki, każda z jedną starą i jedną nową nicią. Ten mechanizm nazywamy replikacją semikonserwatywną. Błąd w kopiowaniu to mutacja.",
        [
          title(40, 44, "Replikacja", INK.mint),
          { k: "text", x: 40, y: 124, text: "A T C G  →  T A G C", size: 26, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 190, text: "Rozplatanie, kopiowanie, sklejenie.", size: 20, color: INK.soft },
          { k: "line", x1: 40, y1: 240, x2: 780, y2: 240, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 280, text: "Stara nić + nowa nić = nowa helisa", size: 21, weight: 700, color: INK.green },
          { k: "text", x: 40, y: 330, text: "Semikonserwatywna, bo zachowuje połowę oryginału.", size: 19, maxW: 700, color: INK.soft },
          { k: "rect", x: 40, y: 400, w: 720, h: 100, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 434, text: "Mutacja", size: 19, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 466, text: "Zmiana kolejności zasad. Może być neutralna, szkodliwa lub korzystna.", size: 19, maxW: 660, color: INK.soft },
        ],
      ),
      s[2].step(
        "Od genu do białka",
        "Informacja z DNA jest przepisywana na mRNA w procesie transkrypcji. Potem rybosom czyta mRNA i składa aminokwasy w białko — to translacja. Trzy kolejne zasady tworzą kodon, który koduje jeden aminokwas. Na przykład kodon AUG to metionina i jednocześnie sygnał startu. Zmiana jednej litery może zmienić aminokwas, a czasem całe białko przestaje działać. Dlatego kolejność zasad jest tak istotna.",
        [
          title(40, 44, "Ekspresja genu", INK.lilac),
          { k: "text", x: 40, y: 130, text: "DNA → mRNA → białko", size: 30, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 200, text: "transkrypcja (jądro)  →  translacja (rybosom)", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 270, text: "3 zasady = 1 kodon = 1 aminokwas", size: 22, weight: 700, color: INK.lilac },
          { k: "text", x: 40, y: 320, text: "AUG → metionina (start)", size: 22, hand: true, color: INK.green },
          { k: "text", x: 40, y: 380, text: "UAA, UAG, UGA → stop", size: 22, hand: true, color: INK.coral },
          { k: "text", x: 40, y: 460, text: "Białka to enzymy, struktury i sygnały — czyli prawie wszystko w komórce.", size: 19, maxW: 720, color: INK.soft },
        ],
      ),
      s[3].step(
        "Dziedziczenie i krzyżówka",
        "Cechy dziedziczymy w genach, po jednym allelu od każdego rodzica. Allel dominujący ujawnia się, gdy jest obecny choć raz. Allel recesywny ujawnia się tylko wtedy, gdy są dwa takie same. Krzyżówka dwóch heterozygot Aa daje w potomstwie dwadzieścia pięć procent AA, pięćdziesiąt procent Aa i dwadzieścia pięć procent aa. Czyli stosunek fenotypów wynosi trzy do jednego. To właśnie odkrył Mendel na grochu.",
        [
          title(40, 44, "Krzyżówka Aa × Aa", INK.sky),
          { k: "rect", x: 120, y: 150, w: 360, h: 300, radius: 10, color: INK.ink, width: 3 },
          { k: "text", x: 150, y: 130, text: "A", size: 22, weight: 700, color: INK.green },
          { k: "text", x: 300, y: 130, text: "a", size: 22, weight: 700, color: INK.coral },
          { k: "text", x: 90, y: 200, text: "A", size: 22, weight: 700, color: INK.green },
          { k: "text", x: 90, y: 350, text: "a", size: 22, weight: 700, color: INK.coral },
          { k: "line", x1: 240, y1: 150, x2: 240, y2: 450, color: INK.ink, width: 2 },
          { k: "line", x1: 120, y1: 300, x2: 480, y2: 300, color: INK.ink, width: 2 },
          { k: "text", x: 160, y: 210, text: "AA", size: 26, hand: true, color: INK.green },
          { k: "text", x: 320, y: 210, text: "Aa", size: 26, hand: true, color: INK.green },
          { k: "text", x: 160, y: 360, text: "Aa", size: 26, hand: true, color: INK.green },
          { k: "text", x: 320, y: 360, text: "aa", size: 26, hand: true, color: INK.coral },
          { k: "text", x: 540, y: 190, text: "25% AA", size: 22, color: INK.soft },
          { k: "text", x: 540, y: 240, text: "50% Aa", size: 22, color: INK.soft },
          { k: "text", x: 540, y: 290, text: "25% aa", size: 22, color: INK.soft },
          { k: "pill", x: 540, y: 340, w: 240, h: 56, text: "3 : 1 fenotypy", size: 20, bg: "#e6f0e4", color: INK.green },
          { k: "text", x: 120, y: 500, text: "Aa × Aa → 3/4 cecha dominująca, 1/4 recesywna.", size: 19, color: INK.ink },
        ],
      ),
    ],
    takeaways: [
      "DNA to podwójna helisa; pary A–T, C–G.",
      "Replikacja jest semikonserwatywna.",
      "DNA → mRNA → białko (transkrypcja i translacja).",
      "Krzyżówka Aa × Aa daje fenotypy 3:1.",
    ],
    followUps: ["Jak zapisać krzyżówkę Aa × aa?", "Co to jest kodon start?", "Czym są mutacje punktowe?"],
  };
}
