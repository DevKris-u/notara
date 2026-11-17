"use client";

import { useActionState } from "react";
import { signupAction, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(signupAction, undefined);
  return (
    <form action={action} className="stack" style={{ gap: 13 }}>
      <label className="field">
        <span>Jak masz na imię?</span>
        <input className="input" name="display_name" placeholder="Kasia Nowak" required />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input className="input" name="email" type="email" autoComplete="email" placeholder="ty@szkola.pl" required />
      </label>
      <label className="field">
        <span>Nazwa użytkownika (opcjonalnie)</span>
        <input className="input" name="username" autoComplete="username" placeholder="kasia" />
      </label>
      <label className="field">
        <span>Hasło</span>
        <input className="input" name="password" type="password" autoComplete="new-password" placeholder="min. 8 znaków" required minLength={8} />
      </label>
      {state?.error ? <p className="chip chip-coral" style={{ alignSelf: "flex-start" }}>{state.error}</p> : null}
      <SubmitButton className="btn btn-primary btn-lg" pendingText="Tworzę konto…">
        Załóż konto
      </SubmitButton>
      <p className="small">
        Zakładając konto akceptujesz zasady korzystania. To projekt edukacyjny — dane zostają lokalnie na twoim komputerze.
      </p>
    </form>
  );
}
