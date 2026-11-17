"use client";

import { useActionState } from "react";
import { createNoteAction, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export function NoteEditor({ subjects }: { subjects: Array<{ slug: string; name: string; emoji: string }> }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(createNoteAction, undefined);

  return (
    <form action={action} className="stack" style={{ gap: 12 }}>
      <label className="field">
        <span>Tytuł notatki</span>
        <input className="input" name="title" placeholder="Np. Funkcja kwadratowa — wszystko, co musisz wiedzieć" required />
      </label>
      <div className="row" style={{ gap: 8 }}>
        <label className="field" style={{ flex: 1 }}>
          <span>Przedmiot</span>
          <select className="select" name="subject" defaultValue="">
            <option value="">—</option>
            {subjects.map((subject) => (
              <option key={subject.slug} value={subject.slug}>
                {subject.emoji} {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>Tagi (oddziel przecinkami)</span>
          <input className="input" name="tags" placeholder="delta, wykres, zadania" />
        </label>
      </div>
      <label className="field">
        <span>Treść</span>
        <textarea
          className="textarea"
          name="body"
          rows={8}
          placeholder={"Możesz pisać Markdownem:\n\n## Nagłówek\n**Ważne pojęcie** — wyjaśnienie\n- punkt pierwszy"}
          required
        />
      </label>
      {state?.error ? <p className="chip chip-coral" style={{ alignSelf: "flex-start" }}>{state.error}</p> : null}
      <div className="between">
        <span className="small">Publikacja daje 50 XP. Notatka trafia do Community od razu.</span>
        <SubmitButton className="btn btn-primary" pendingText="Publikuję…">
          Opublikuj notatkę
        </SubmitButton>
      </div>
    </form>
  );
}
