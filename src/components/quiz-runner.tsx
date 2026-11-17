"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon, CheckIcon, ChevronLeft, ChevronRight, SparkIcon, XIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

export type RunnerQuestion = { q: string; options: string[]; answer: number; explain: string };

export function QuizRunner({
  quizId,
  title,
  questions,
  action,
}: {
  quizId: string;
  title: string;
  questions: RunnerQuestion[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [index, setIndex] = useState(0);
  const current = questions[index];
  const answered = answers.filter((value) => value >= 0).length;
  const isLast = index === questions.length - 1;

  const pick = (option: number) => {
    setAnswers((previous) => previous.map((value, i) => (i === index ? option : value)));
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <span className="label">
            Pytanie {index + 1} z {questions.length}
          </span>
          <span className="small">{answered} odpowiedzi</span>
        </div>
        <div className="progress" style={{ marginBottom: 18 }}>
          <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>

        <h2 style={{ fontSize: 21, margin: "0 0 14px", lineHeight: 1.35 }}>{current.q}</h2>

        <div className="stack" style={{ gap: 8 }}>
          {current.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              className="quiz-option"
              data-state={answers[index] === optionIndex ? "picked" : undefined}
              onClick={() => pick(optionIndex)}
            >
              <span className="quiz-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{option}</span>
              {answers[index] === optionIndex ? <CheckIcon width={16} height={16} /> : null}
            </button>
          ))}
        </div>

        <form action={action} className="between" style={{ marginTop: 20, gap: 10 }}>
          <input type="hidden" name="quiz_id" value={quizId} />
          {questions.map((question, questionIndex) => (
            <input
              key={question.q}
              type="hidden"
              name={`q${questionIndex}`}
              value={answers[questionIndex] >= 0 ? String(answers[questionIndex]) : "-1"}
            />
          ))}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={index === 0}
          >
            <ChevronLeft width={15} height={15} /> Wstecz
          </button>

          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={isLast}
            >
              Dalej <ChevronRight width={15} height={15} />
            </button>
            <SubmitButton className="btn btn-primary" pendingText="Sprawdzam…">
              Zakończ quiz <ArrowIcon width={15} height={15} />
            </SubmitButton>
          </div>
        </form>
      </div>

      <div className="between">
        <Link href="/practice" className="btn btn-sm btn-ghost">
          <ChevronLeft width={14} height={14} /> Wszystkie ćwiczenia
        </Link>
        <span className="small">Quiz: {title}</span>
      </div>
    </div>
  );
}

export function QuizResult({
  questions,
  answers,
  title,
  quizId,
}: {
  questions: RunnerQuestion[];
  answers: number[];
  title: string;
  quizId: string;
}) {
  const score = questions.reduce((sum, question, i) => (answers[i] === question.answer ? sum + 1 : sum), 0);
  const pct = Math.round((score / questions.length) * 100);
  const message =
    pct >= 80
      ? "Świetnie — możesz przejść do trudniejszych zadań."
      : pct >= 50
        ? "Dobry wynik. Wróć do wyjaśnień przy błędnych odpowiedziach."
        : "To trudny temat. Obejrzyj tablicę i spróbuj ponownie za dzień lub dwa.";

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 22 }}>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <span className="label">Wynik</span>
            <h1 style={{ fontSize: 34, margin: "4px 0 2px" }}>
              {score} / {questions.length}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
              {message}
            </p>
          </div>
          <span className={pct >= 80 ? "chip chip-green" : pct >= 50 ? "chip chip-gold" : "chip chip-coral"}>
            {pct}%
          </span>
        </div>
        <div className="progress" style={{ marginTop: 16 }}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <Link href={`/practice/quiz/${quizId}?retry=1`} className="btn btn-primary">
            <SparkIcon width={15} height={15} /> Jeszcze raz
          </Link>
          <Link href={`/practice?topic=${encodeURIComponent(title)}`} className="btn">
            Nowy quiz z tematu
          </Link>
          <Link href={`/practice?flashcards=${encodeURIComponent(title)}`} className="btn">
            Fiszki z tematu
          </Link>
        </div>
      </div>

      <section className="stack" style={{ gap: 10 }}>
        <h2 className="section-title">Przegląd odpowiedzi</h2>
        {questions.map((question, questionIndex) => {
          const picked = answers[questionIndex] ?? -1;
          const correct = picked === question.answer;
          return (
            <div key={question.q} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                <span className={correct ? "chip chip-green" : "chip chip-coral"}>
                  {correct ? <CheckIcon width={13} height={13} /> : <XIcon width={13} height={13} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 14.5 }}>{question.q}</b>
                  <p className="small" style={{ margin: "6px 0 0" }}>
                    Twoja odpowiedź:{" "}
                    <b style={{ color: correct ? "var(--green-2)" : "var(--coral)" }}>
                      {picked >= 0 ? question.options[picked] : "brak"}
                    </b>
                  </p>
                  {!correct ? (
                    <p className="small" style={{ margin: "2px 0 0" }}>
                      Poprawna: <b>{question.options[question.answer]}</b>
                    </p>
                  ) : null}
                  <p className="muted" style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>
                    {question.explain}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
