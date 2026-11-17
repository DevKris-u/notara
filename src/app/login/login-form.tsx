"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(loginAction, undefined);
  return (
    <form action={action} className="stack" style={{ gap: 14 }}>
      <label className="field">
        <span>E-mail lub nazwa użytkownika</span>
        <input className="input" name="login" autoComplete="username" placeholder="kasia@notara.app" required />
      </label>
      <label className="field">
        <span>Hasło</span>
        <input className="input" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </label>
      {state?.error ? <p className="chip chip-coral" style={{ alignSelf: "flex-start" }}>{state.error}</p> : null}
      <SubmitButton className="btn btn-primary btn-lg" pendingText="Loguję…">
        Zaloguj się
      </SubmitButton>
    </form>
  );
}
