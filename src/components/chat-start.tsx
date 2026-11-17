"use client";

import { useRef } from "react";
import { ArrowIcon, SparkIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

export function ChatStart({
  action,
  suggestions,
}: {
  action: (formData: FormData) => Promise<void>;
  suggestions: string[];
}) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <form action={action} className="stack" style={{ gap: 10 }}>
        <textarea
          ref={areaRef}
          name="prompt"
          className="textarea"
          rows={3}
          placeholder="Np. wytłumacz mi fotosyntezę albo pomóż rozwiązać to zadanie…"
          required
        />
        <div className="between">
          <span className="small">Możesz wkleić treść zadania. Odpowiedź dopasuje się do twojego stylu nauki.</span>
          <SubmitButton className="btn btn-primary" pendingText="Myślę…">
            Zapytaj <ArrowIcon width={15} height={15} />
          </SubmitButton>
        </div>
      </form>

      <div className="pill-row">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="chip"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (areaRef.current) {
                areaRef.current.value = suggestion;
                areaRef.current.focus();
              }
            }}
          >
            <SparkIcon width={12} height={12} /> {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
