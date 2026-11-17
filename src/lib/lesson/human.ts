import { INK, type Step } from "./types";
import { bullet, chip, scene, title } from "./geometry";

type Built = { steps: Step[]; takeaways: string[]; followUps: string[] };

/* ------------------------------ ESSAY ------------------------------ */

export function essayLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Struktura wypracowania",
        "Dobre wypracowanie ma zawsze ten sam szkielet: wstęp, rozwinięcie i zakończenie. We wstępie wprowadzasz temat i stawiasz tezę. W rozwinięciu podajesz trzy argumenty, każdy z przykładem i komentarzem. W zakończeniu wracasz do tezy i podsumowujesz, co z niej wynika. Ta struktura daje komisji dokładnie to, czego szuka w kryteriach. Nie kombinuj z formą, dopóki nie opanujesz szkieletu.",
        [
          title(40, 44, "Szkielet wypracowania", INK.gold),
          { k: "rect", x: 50, y: 120, w: 720, h: 100, radius: 14, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 70, y: 156, text: "1. Wstęp", size: 21, weight: 700, color: INK.green },
          { k: "text", x: 70, y: 190, text: "kontekst + teza (1 akapit)", size: 18, color: INK.soft },
          { k: "rect", x: 50, y: 240, w: 720, h: 160, radius: 14, color: INK.gold, width: 2, fill: "#fdf5dd" },
          { k: "text", x: 70, y: 276, text: "2. Rozwinięcie", size: 21, weight: 700, color: INK.gold },
          { k: "text", x: 70, y: 312, text: "argument 1 + przykład + komentarz", size: 18, color: INK.soft },
          { k: "text", x: 70, y: 342, text: "argument 2 + przykład + komentarz", size: 18, color: INK.soft },
          { k: "text", x: 70, y: 372, text: "argument 3 + przykład + komentarz", size: 18, color: INK.soft },
          { k: "rect", x: 50, y: 420, w: 720, h: 100, radius: 14, color: INK.lilac, width: 2, fill: "#efedfb" },
          { k: "text", x: 70, y: 456, text: "3. Zakończenie", size: 21, weight: 700, color: INK.lilac },
          { k: "text", x: 70, y: 490, text: "powrót do tezy + wniosek", size: 18, color: INK.soft },
        ],
      ),
      s[1].step(
        "Teza, nie temat",
        "Największy błąd to przepisanie tematu zamiast postawienia tezy. Teza to twoje stanowisko, które da się obronić. Zamiast pisać „w pracy omówię temat”, napisz „uważam, że bohaterowie kierują się strachem, a nie miłością”. Teza musi być konkretna i musi być widoczna w pierwszym akapicie. W zakończeniu nie dodawaj nowych argumentów — tylko domykasz to, co zapowiedziałeś.",
        [
          title(40, 44, "Teza vs temat", INK.mint),
          { k: "rect", x: 40, y: 130, w: 720, h: 96, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 164, text: "Źle: „W mojej pracy omówię temat…”", size: 20, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 196, text: "To nie jest stanowisko, tylko zapowiedź.", size: 18, color: INK.soft },
          { k: "rect", x: 40, y: 260, w: 720, h: 110, radius: 14, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 62, y: 294, text: "Dobrze: „Bohater wybiera samotność, bo boi się odrzucenia.”", size: 20, weight: 700, color: INK.green },
          { k: "text", x: 62, y: 330, text: "Konkretna teza, którą można udowodnić przykładami.", size: 18, color: INK.soft },
          { k: "text", x: 40, y: 420, text: "Test tezy: czy ktoś mógłby się z nią nie zgodzić?", size: 20, color: INK.ink },
          { k: "text", x: 40, y: 458, text: "Jeśli nie — to nie jest teza, tylko oczywistość.", size: 20, color: INK.soft },
        ],
      ),
      s[2].step(
        "Akapit argumentacyjny",
        "Każdy akapit rozwinięcia buduj w schemacie: twierdzenie, przykład, komentarz. Najpierw zdanie z argumentem, potem konkret z lektury lub tekstu, a na końcu wyjaśnienie, co z tego wynika dla tezy. Bez komentarza przykład nic nie wnosi. Jeden akapit to jedna myśl — nie upychaj w nim trzech wątków. Przejrzystość liczy się bardziej niż ozdobniki.",
        [
          title(40, 44, "Schemat akapitu", INK.lilac),
          { k: "text", x: 40, y: 124, text: "T — twierdzenie", size: 24, hand: true, color: INK.green },
          { k: "text", x: 40, y: 176, text: "P — przykład z tekstu", size: 24, hand: true, color: INK.gold },
          { k: "text", x: 40, y: 228, text: "K — komentarz do tezy", size: 24, hand: true, color: INK.coral },
          { k: "rect", x: 40, y: 280, w: 720, h: 130, radius: 14, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 314, text: "Przykład zdania łączącego:", size: 18, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 346, text: "„To pokazuje, że bohater nie szuka zemsty, lecz zapomnienia.”", size: 19, maxW: 670, color: INK.soft },
          { k: "text", x: 62, y: 380, text: "Komentarz zawsze wraca do twojej tezy.", size: 18, color: INK.soft },
          { k: "text", x: 40, y: 470, text: "Jeden akapit = jedna myśl = jeden dowód.", size: 20, weight: 700, color: INK.ink },
        ],
      ),
      s[3].step(
        "Czas i kryteria",
        "Na egzaminie licz czas: około pięć minut na plan, dwadzieścia pięć na pisanie i pięć na sprawdzenie. Plan to trzy argumenty zapisane jednym zdaniem — to ratuje przed zbaczaniem z tematu. Sprawdzając, policz akapity i czasowniki: powinny być w jednym czasie i zgodne z podmiotem. Kryteria oceniają treść, kompozycję, język i ortografię, więc równy wysiłek w każdym obszarze daje najwięcej punktów.",
        [
          title(40, 44, "Plan i czas", INK.sky),
          ...bullet(60, 128, "5 min — plan i teza", 0),
          ...bullet(60, 184, "25 min — pisanie akapitów", 1),
          ...bullet(60, 240, "5 min — sprawdzenie języka", 2),
          ...bullet(60, 296, "1 argument = 1 akapit", 3),
          chip(60, 380, "treść · kompozycja · język · ortografia", "#efe4c9"),
          { k: "text", x: 60, y: 450, text: "Minimum 250 słów to około 1,5 strony A4.", size: 19, color: INK.soft },
          { k: "text", x: 60, y: 488, text: "Lepiej mniej, ale konkretnie, niż więcej i chaotycznie.", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "Struktura: wstęp z tezą, 3 argumenty, zakończenie.",
      "Teza to twoje stanowisko, nie powtórzenie tematu.",
      "Akapit: twierdzenie → przykład → komentarz.",
      "Plan oszczędza czas i chroni przed off-topem.",
    ],
    followUps: ["Jak napisać wstęp do rozprawki?", "Jak dobrać przykłady z lektury?", "Ile akapitów powinno mieć wypracowanie?"],
  };
}

/* ------------------------------ HISTORY ---------------------------- */

export function historyLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Jak analizować wydarzenie",
        "Każde wydarzenie historyczne opisz w czterech krokach: przyczyny, przebieg, skutki i znaczenie. Przyczyny dzielimy na bezpośrednie i pośrednie. Przebieg to najważniejsze daty i decyzje w porządku chronologicznym. Skutki mogą być krótko- i długoterminowe, a także polityczne, gospodarcze i społeczne. Na końcu oceniasz znaczenie — co to wydarzenie zmieniło na dłuższą metę.",
        [
          title(40, 44, "Schemat analizy", INK.gold),
          { k: "line", x1: 80, y1: 200, x2: 780, y2: 200, color: INK.ink, width: 3 },
          { k: "circle", cx: 140, cy: 200, r: 16, color: INK.coral, width: 3, fill: "#fffdf8" },
          { k: "circle", cx: 360, cy: 200, r: 16, color: INK.gold, width: 3, fill: "#fffdf8" },
          { k: "circle", cx: 580, cy: 200, r: 16, color: INK.sky, width: 3, fill: "#fffdf8" },
          { k: "circle", cx: 760, cy: 200, r: 16, color: INK.green, width: 3, fill: "#fffdf8" },
          { k: "text", x: 96, y: 160, text: "przyczyny", size: 20, weight: 700, color: INK.coral },
          { k: "text", x: 320, y: 160, text: "przebieg", size: 20, weight: 700, color: INK.gold },
          { k: "text", x: 536, y: 160, text: "skutki", size: 20, weight: 700, color: INK.sky },
          { k: "text", x: 700, y: 160, text: "znaczenie", size: 20, weight: 700, color: INK.green },
          { k: "text", x: 80, y: 260, text: "→ dlaczego", size: 19, color: INK.soft },
          { k: "text", x: 320, y: 260, text: "→ co i kiedy", size: 19, color: INK.soft },
          { k: "text", x: 536, y: 260, text: "→ co z tego", size: 19, color: INK.soft },
          { k: "text", x: 700, y: 260, text: "→ po co pamiętać", size: 19, color: INK.soft },
          { k: "text", x: 80, y: 370, text: "Bez skutków odpowiedź jest tylko opowieścią, nie analizą.", size: 20, maxW: 740, color: INK.ink },
        ],
      ),
      s[1].step(
        "Przyczyny i skutki",
        "Przyczyny bezpośrednie to te, które uruchomiły wydarzenie tuż przed nim. Pośrednie narastały latami. Skutki dzielimy podobnie: natychmiastowe i długofalowe. W dobrych odpowiedziach używamy słów-wskaźówek: „w konsekwencji”, „w wyniku”, „w dłuższej perspektywie”. To sygnały dla egzaminatora, że analizujesz, a nie tylko opowiadasz. Pamiętaj też o skutkach dla różnych grup społecznych.",
        [
          title(40, 44, "Przyczyny i skutki", INK.mint),
          { k: "text", x: 40, y: 124, text: "Przyczyny:", size: 21, weight: 700, color: INK.coral },
          { k: "text", x: 40, y: 160, text: "bezpośrednie (wyzwalacz)", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 192, text: "pośrednie (długi proces)", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 260, text: "Skutki:", size: 21, weight: 700, color: INK.sky },
          { k: "text", x: 40, y: 296, text: "natychmiastowe", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 328, text: "długofalowe", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 360, text: "polityczne / gospodarcze / społeczne", size: 19, color: INK.soft },
          { k: "text", x: 460, y: 150, text: "Słowa-wskaźówki:", size: 20, weight: 700, color: INK.ink },
          { k: "text", x: 460, y: 190, text: "w wyniku…", size: 19, color: INK.soft },
          { k: "text", x: 460, y: 222, text: "w konsekwencji…", size: 19, color: INK.soft },
          { k: "text", x: 460, y: 254, text: "bezpośrednią przyczyną było…", size: 19, color: INK.soft },
          { k: "text", x: 460, y: 286, text: "w dłuższej perspektywie…", size: 19, color: INK.soft },
          { k: "text", x: 460, y: 340, text: "Dzięki nim odpowiedź brzmi jak analiza.", size: 18, color: INK.green },
        ],
      ),
      s[2].step(
        "Źródło historyczne",
        "Analizując źródło, najpierw ustal, kto je stworzył, kiedy i w jakim celu. To pytania o autora, czas i intencję. Potem oddziel fakty od opinii. Na końcu oceń wiarygodność: czy autor był świadkiem, czy stroną sporu, czy miał powód, by coś pominąć. Dobra odpowiedź zawsze zawiera jedno zdanie o ograniczeniach źródła. To pokazuje krytyczne myślenie, które jest w kryteriach.",
        [
          title(40, 44, "Praca ze źródłem", INK.lilac),
          ...bullet(60, 130, "Kto? — autor i jego rola", 0),
          ...bullet(60, 186, "Kiedy? — czas powstania", 1),
          ...bullet(60, 242, "Po co? — cel i odbiorca", 2),
          ...bullet(60, 298, "Co? — fakty vs opinie", 3),
          ...bullet(60, 354, "Czy można ufać? — ograniczenia", 4),
          { k: "rect", x: 40, y: 424, w: 720, h: 100, radius: 14, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 458, text: "Zdanie na plus:", size: 18, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 490, text: "„Autor był uczestnikiem, więc jego relacja może wyolbrzymiać rolę własnej strony.”", size: 18, maxW: 660, color: INK.soft },
        ],
      ),
      s[3].step(
        "Mapa i chronologia",
        "Historia bez chronologii to chaos. Zanim zaczniesz pisać, naszkicuj os czasu z pięcioma najważniejszymi datami. Zaznacz, co było przed, a co po — to pomaga uniknąć anachronizmów, czyli przypisania czegoś do złego okresu. Przy mapie zwróć uwagę na granice, które zmieniały się częściej niż podręczniki sugerują. W zadaniach z mapą zawsze zaczynaj od legendy i skali.",
        [
          title(40, 44, "Chronologia i mapa", INK.sky),
          { k: "line", x1: 60, y1: 200, x2: 780, y2: 200, color: INK.ink, width: 3 },
          { k: "line", x1: 180, y1: 180, x2: 180, y2: 220, color: INK.ink, width: 3 },
          { k: "line", x1: 360, y1: 180, x2: 360, y2: 220, color: INK.ink, width: 3 },
          { k: "line", x1: 540, y1: 180, x2: 540, y2: 220, color: INK.ink, width: 3 },
          { k: "line", x1: 700, y1: 180, x2: 700, y2: 220, color: INK.ink, width: 3 },
          { k: "text", x: 150, y: 250, text: "data 1", size: 18, color: INK.soft },
          { k: "text", x: 330, y: 250, text: "data 2", size: 18, color: INK.soft },
          { k: "text", x: 510, y: 250, text: "data 3", size: 18, color: INK.soft },
          { k: "text", x: 670, y: 250, text: "data 4", size: 18, color: INK.soft },
          { k: "text", x: 60, y: 330, text: "Najpierw os czasu, potem pisanie.", size: 21, weight: 700, color: INK.ink },
          { k: "text", x: 60, y: 372, text: "Anachronizm = błąd rzeczowy, który kosztuje punkty.", size: 19, color: INK.coral },
          { k: "text", x: 60, y: 420, text: "W zadaniach z mapą: legenda → skala → kierunki → granice.", size: 19, color: INK.soft },
        ],
      ),
    ],
    takeaways: [
      "Analiza: przyczyny → przebieg → skutki → znaczenie.",
      "Rozróżniaj przyczyny bezpośrednie i pośrednie.",
      "Przy źródle pytaj: kto, kiedy, po co, czy wiarygodne.",
      "Zawsze ustal chronologię przed pisaniem.",
    ],
    followUps: ["Jak ocenić wiarygodność źródła?", "Jak napisać dłuższą wypowiedź historyczną?", "Jak zapamiętać daty?"],
  };
}

/* ------------------------------ ENGLISH ---------------------------- */

export function englishLesson(prompt: string): Built {
  const s = [scene(0), scene(1), scene(2), scene(3)];
  return {
    steps: [
      s[0].step(
        "Present Perfect — budowa",
        "Present perfect tworzymy przez have albo has plus trzecią formę czasownika, czyli past participle. Dla I, you, we, they używamy have. Dla he, she, it używamy has. Na przykład: I have finished, she has gone. Trzecia forma czasowników nieregularnych jest w tabeli — trzeba ją znać, bo nie da się jej wydedukować. Czasowniki regularne mają końcówkę ed.",
        [
          title(40, 44, "Present Perfect", INK.gold),
          { k: "text", x: 40, y: 130, text: "have / has + III forma", size: 36, hand: true, color: INK.ink },
          { k: "text", x: 40, y: 210, text: "I have finished", size: 24, hand: true, color: INK.green },
          { k: "text", x: 40, y: 254, text: "She has gone", size: 24, hand: true, color: INK.green },
          { k: "text", x: 40, y: 298, text: "They have seen", size: 24, hand: true, color: INK.green },
          { k: "line", x1: 40, y1: 350, x2: 740, y2: 350, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 396, text: "have → I / you / we / they", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 430, text: "has → he / she / it", size: 20, color: INK.soft },
          { k: "text", x: 40, y: 490, text: "Przeczenia: haven't / hasn't + III forma", size: 19, color: INK.coral },
        ],
      ),
      s[1].step(
        "Kiedy go używać",
        "Present perfect łączy przeszłość z teraźniejszością. Używamy go, gdy skutek jest ważny teraz, gdy nie podajemy konkretnej daty albo gdy czynność trwa do dziś. Na przykład „I have lost my keys” oznacza, że nadal ich nie mam. Jeśli podajesz konkretny czas w przeszłości, musisz użyć past simple. To najważniejsza różnica i najczęstsze źródło błędów.",
        [
          title(40, 44, "Kiedy używać", INK.mint),
          ...bullet(60, 126, "Skutek ważny teraz: I have lost my keys.", 0),
          ...bullet(60, 182, "Brak konkretnej daty: She has visited Paris.", 1),
          ...bullet(60, 238, "Doświadczenie życiowe: Have you ever tried sushi?", 2),
          ...bullet(60, 294, "Trwa do teraz: We have lived here for years.", 3),
          { k: "rect", x: 40, y: 364, w: 720, h: 108, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 62, y: 398, text: "Uwaga", size: 18, weight: 700, color: INK.coral },
          { k: "text", x: 62, y: 430, text: "„Yesterday I have seen” — błąd. Z yesterday zawsze past simple.", size: 19, maxW: 660, color: INK.soft },
          { k: "text", x: 62, y: 458, text: "„I saw it yesterday.” ✓", size: 18, color: INK.green },
        ],
      ),
      s[2].step(
        "Present Perfect vs Past Simple",
        "Past simple mówi o zakończonej przeszłości z konkretnym czasem. Present perfect mówi o przeszłości bez daty, ale z wpływem na teraz. Porównaj: „I have eaten” — jestem najedzony. „I ate at noon” — podaję kiedy. Słowa takie jak yesterday, last week, in 2020, ago wymagają past simple. Słowa ever, never, already, yet, just, since, for lubią present perfect.",
        [
          title(40, 44, "Dwa czasy, jedna różnica", INK.lilac),
          { k: "rect", x: 40, y: 120, w: 340, h: 240, radius: 14, color: INK.sky, width: 2, fill: "#e9f2f8" },
          { k: "text", x: 60, y: 152, text: "Present Perfect", size: 19, weight: 700, color: INK.sky },
          { k: "text", x: 60, y: 192, text: "I have eaten.", size: 22, hand: true, color: INK.ink },
          { k: "text", x: 60, y: 232, text: "skutek teraz", size: 18, color: INK.soft },
          { k: "text", x: 60, y: 266, text: "brak daty", size: 18, color: INK.soft },
          { k: "text", x: 60, y: 300, text: "ever, never, just, yet", size: 18, color: INK.soft },
          { k: "rect", x: 410, y: 120, w: 340, h: 240, radius: 14, color: INK.coral, width: 2, fill: "#fbeee8" },
          { k: "text", x: 430, y: 152, text: "Past Simple", size: 19, weight: 700, color: INK.coral },
          { k: "text", x: 430, y: 192, text: "I ate at noon.", size: 22, hand: true, color: INK.ink },
          { k: "text", x: 430, y: 232, text: "zakończone", size: 18, color: INK.soft },
          { k: "text", x: 430, y: 266, text: "konkretny czas", size: 18, color: INK.soft },
          { k: "text", x: 430, y: 300, text: "yesterday, last week, ago", size: 18, color: INK.soft },
          { k: "text", x: 40, y: 420, text: "Nigdy nie łącz present perfect z konkretną datą z przeszłości.", size: 20, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 458, text: "For = przez (okres), since = od (punkt w czasie).", size: 19, color: INK.soft },
        ],
      ),
      s[3].step(
        "For, since, yet, already",
        "Te cztery słowa najczęściej pojawiają się w testach. For łączy się z okresem: for two years. Since łączy się z punktem: since 2020. Yet używamy w przeczeniach i pytaniach, na końcu zdania. Already oznacza „już” w zdaniach twierdzących. Just oznacza „właśnie”. Uwaga: „I have already done it” brzmi naturalnie, ale „I have done it yesterday” już nie.",
        [
          title(40, 44, "Słowa kluczowe", INK.sky),
          { k: "text", x: 40, y: 128, text: "for + okres", size: 24, weight: 700, color: INK.green },
          { k: "text", x: 40, y: 162, text: "for two years", size: 20, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 216, text: "since + punkt", size: 24, weight: 700, color: INK.lilac },
          { k: "text", x: 40, y: 250, text: "since 2020", size: 20, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 304, text: "yet — pytania i przeczenia", size: 24, weight: 700, color: INK.coral },
          { k: "text", x: 40, y: 338, text: "I haven't finished yet.", size: 20, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 392, text: "already — twierdzenia", size: 24, weight: 700, color: INK.gold },
          { k: "text", x: 40, y: 426, text: "She has already left.", size: 20, hand: true, color: INK.soft },
          { k: "text", x: 40, y: 490, text: "just — właśnie: I have just arrived.", size: 20, color: INK.ink },
        ],
      ),
    ],
    takeaways: [
      "Present perfect: have/has + III forma.",
      "Łączy przeszłość z teraźniejszością, bez konkretnej daty.",
      "Z konkretnym czasem w przeszłości używamy past simple.",
      "for = okres, since = punkt, yet = przeczenia/pytania.",
    ],
    followUps: ["Jak odróżnić present perfect od past simple w tekście?", "Jakie są nieregularne formy czasowników?", "Kiedy użyć present perfect continuous?"],
  };
}

/* ------------------------------ GENERIC ---------------------------- */

const STOP = new Set([
  "jak", "co", "to", "jest", "się", "na", "w", "z", "do", "i", "nie", "czy", "o", "że", "dla", "od",
  "przez", "jakie", "jaki", "które", "który", "mi", "mnie", "wyjaśnij", "wytłumacz", "pomóż", "proszę",
  "the", "a", "an", "of", "to", "in", "is", "what", "how", "why", "mi", "mam", "mieć",
]);

export function genericLesson(prompt: string): Built {
  const clean = prompt.replace(/\s+/g, " ").trim();
  const words = clean
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  const keys = Array.from(new Set(words)).slice(0, 5);
  const short = clean.length > 90 ? `${clean.slice(0, 88)}…` : clean;
  const s = [scene(0), scene(1), scene(2), scene(3), scene(4)];

  return {
    steps: [
      s[0].step(
        "Zaczynamy od pytania",
        "Zanim zaczniemy, rozłóżmy twoje pytanie na części. Dobre uczenie się zaczyna się od ustalenia, czego dokładnie nie wiesz. Zapisujemy temat na tablicy i zaznaczamy słowa kluczowe. To one wyznaczają, czego szukać w podręczniku i notatkach. Im precyzyjniej nazwiesz problem, tym szybciej znajdziesz odpowiedź.",
        [
          title(40, 44, "Twój temat", INK.gold),
          { k: "text", x: 40, y: 130, text: short, size: 24, hand: true, maxW: 700, color: INK.ink },
          { k: "text", x: 40, y: 230, text: "Słowa kluczowe:", size: 20, weight: 700, color: INK.green },
          ...keys.flatMap((k, i) => [
            chip(40 + (i % 3) * 250, 282 + Math.floor(i / 3) * 62, k, "#efe4c9"),
          ]),
          { k: "text", x: 40, y: 440, text: "Od czego zacząć: definicja → przykład → zastosowanie.", size: 19, color: INK.soft },
        ],
      ),
      s[1].step(
        "Definicja i kontekst",
        "Teraz budujemy definicję. W jednym zdaniu mówimy, czym dane pojęcie jest, a w drugim — do czego służy. Potem dodajemy kontekst: gdzie w programie się pojawia i z czym się łączy. Jeśli potrafisz wyjaśnić pojęcie komuś bez podręcznika, to znaczy, że naprawdę je rozumiesz. Dlatego warto mówić na głos, nawet samemu.",
        [
          title(40, 44, "Definicja", INK.mint),
          { k: "text", x: 40, y: 130, text: "Czym to jest?", size: 24, weight: 700, color: INK.green },
          { k: "line", x1: 40, y1: 172, x2: 740, y2: 172, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 224, text: "Do czego służy?", size: 24, weight: 700, color: INK.green },
          { k: "line", x1: 40, y1: 266, x2: 740, y2: 266, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 318, text: "Z czym się łączy?", size: 24, weight: 700, color: INK.green },
          { k: "line", x1: 40, y1: 360, x2: 740, y2: 360, color: "#d8d1bf", width: 2 },
          { k: "text", x: 40, y: 440, text: "Test zrozumienia: wyjaśnij to własnymi słowami w 30 sekund.", size: 19, maxW: 740, color: INK.soft },
        ],
      ),
      s[2].step(
        "Przykład krok po kroku",
        "Każde pojęcie trzeba zobaczyć w działaniu. Wybierz jeden konkretny przykład i przejdź przez niego powoli, zapisując każdy krok. Potem zmień jedną wartość i sprawdź, co się stanie. To właśnie porównywanie przypadków buduje rozumienie. Samo przeczytanie rozwiązania nie wystarczy — musisz je odtworzyć bez podglądania.",
        [
          title(40, 44, "Przykład", INK.lilac),
          { k: "text", x: 40, y: 120, text: "1. Zapisz dane", size: 22, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 176, text: "2. Wybierz metodę", size: 22, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 232, text: "3. Wykonaj krok po kroku", size: 22, weight: 700, color: INK.ink },
          { k: "text", x: 40, y: 288, text: "4. Sprawdź wynik", size: 22, weight: 700, color: INK.ink },
          { k: "arrow", x1: 60, y1: 330, x2: 60, y2: 368, color: INK.lilac, width: 3 },
          { k: "text", x: 90, y: 360, text: "i zmień jedną wartość, żeby zobaczyć różnicę", size: 19, color: INK.soft },
          { k: "text", x: 40, y: 440, text: "Nie ucz się na pamięć kroków — ucz się, dlaczego są w tej kolejności.", size: 19, maxW: 740, color: INK.ink },
        ],
      ),
      s[3].step(
        "Sprawdź się",
        "Czas na aktywną powtórkę. Zamknij notatki i odpowiedz na trzy pytania: czym to jest, jak to działa i gdzie się to stosuje. Potem spróbuj rozwiązać jedno zadanie bez podpowiedzi. Jeśli utkniesz, wróć do konkretnego kroku, a nie do całego tematu. To oszczędza czas i pokazuje, gdzie naprawdę jest luka.",
        [
          title(40, 44, "Aktywna powtórka", INK.sky),
          ...bullet(60, 130, "Czym to jest? — definicja własnymi słowami", 0),
          ...bullet(60, 186, "Jak to działa? — mechanizm krok po kroku", 1),
          ...bullet(60, 242, "Gdzie to zastosować? — jeden przykład", 2),
          { k: "rect", x: 40, y: 320, w: 720, h: 120, radius: 14, color: INK.green, width: 2, fill: "#eef5ee" },
          { k: "text", x: 62, y: 354, text: "Zasada 3 dni", size: 19, weight: 700, color: INK.green },
          { k: "text", x: 62, y: 386, text: "Powtórz dziś, za 3 dni i za tydzień. Trzecie powtórzenie utrwala na długo.", size: 19, maxW: 660, color: INK.soft },
        ],
      ),
      s[4].step(
        "Notatka, którą warto mieć",
        "Na koniec zapisz notatkę w formie, którą łatwo powtórzyć. Trzy linijki: definicja, wzór lub schemat, jeden przykład. Nie przepisuj podręcznika — zapisz tylko to, czego nie pamiętasz. Kolorami zaznacz to, co najczęściej mylisz. Taka notatka jest twoja i działa lepiej niż najładniejsza kserówka.",
        [
          title(40, 44, "Twoja notatka", INK.coral),
          { k: "rect", x: 40, y: 120, w: 720, h: 90, radius: 12, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 152, text: "Definicja:", size: 18, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 184, text: "jedno zdanie, bez kopiowania", size: 17, color: INK.soft },
          { k: "rect", x: 40, y: 226, w: 720, h: 90, radius: 12, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 258, text: "Wzór / schemat:", size: 18, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 290, text: "to, co najłatwiej pomylić", size: 17, color: INK.soft },
          { k: "rect", x: 40, y: 332, w: 720, h: 90, radius: 12, color: INK.ink, width: 2, fill: "#fdf6e2" },
          { k: "text", x: 62, y: 364, text: "Przykład:", size: 18, weight: 700, color: INK.ink },
          { k: "text", x: 62, y: 396, text: "jeden, rozwiązany do końca", size: 17, color: INK.soft },
          { k: "text", x: 40, y: 470, text: "Notatka ma ci służyć, nie wyglądać.", size: 20, weight: 700, color: INK.ink },
        ],
      ),
    ],
    takeaways: [
      "Nazwij temat i słowa kluczowe, zanim zaczniesz się uczyć.",
      "Definicja → przykład → zastosowanie.",
      "Odtwórz przykład samodzielnie, bez podglądania.",
      "Powtarzaj po 3 dniach i po tygodniu.",
    ],
    followUps: ["Wyjaśnij to prostszymi słowami", "Daj mi przykład zadania z tego tematu", "Zrób mi z tego krótki quiz"],
  };
}
