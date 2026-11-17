"use client";

import { useRef } from "react";
import { followUpBoardAction } from "@/lib/actions";

export function FollowUpBox({
  boardId,
  suggestions,
}: {
  boardId: string;
  suggestions: string[];
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const fillSuggestion = (value: string) => {
    if (ref.current) {
      ref.current.value = value;
      ref.current.focus();
      ref.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  return (
    <form action={followUpBoardAction} className="stack" style={{ gap: 10 }}>
      <input type="hidden" name="board_id" value={boardId} />
      <label className="field">
        <span>Dopytaj na tej samej tablicy</span>
        <textarea
          ref={ref}
          name="question"
          className="textarea"
          rows={2}
          placeholder="Np. a co, jeśli delta jest ujemna?"
          required
        />
      </label>
      <div className="pill-row">
        {suggestions.slice(0, 3).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="chip"
            style={{ cursor: "pointer" }}
            onClick={() => fillSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}>
        Dopisz do tablicy
      </button>
    </form>
  );
}
