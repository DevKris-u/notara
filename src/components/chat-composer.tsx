"use client";

import { useRef, useTransition } from "react";
import { ArrowIcon, SparkIcon } from "@/components/icons";

export function ChatComposer({
  chatId,
  action,
  suggestions,
  disabled,
}: {
  chatId: string;
  action: (formData: FormData) => Promise<void>;
  suggestions: string[];
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();

  const fill = (text: string) => {
    if (areaRef.current) {
      areaRef.current.value = text;
      areaRef.current.focus();
    }
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      {suggestions.length ? (
        <div className="pill-row" style={{ padding: "0 12px" }}>
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip"
              style={{ cursor: "pointer" }}
              onClick={() => fill(suggestion)}
            >
              <SparkIcon width={12} height={12} /> {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        ref={formRef}
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const message = String(data.get("message") ?? "").trim();
          if (!message) return;
          data.set("message", message);
          form.reset();
          start(() => {
            void action(data);
          });
        }}
      >
        <input type="hidden" name="chat_id" value={chatId} />
        <textarea
          ref={areaRef}
          name="message"
          className="input textarea"
          rows={1}
          placeholder="Napisz pytanie… (Enter wysyła, Shift+Enter nowa linia)"
          disabled={disabled || pending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || pending}>
          {pending ? "Myślę…" : "Wyślij"} <ArrowIcon width={15} height={15} />
        </button>
      </form>
    </div>
  );
}
