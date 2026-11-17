"use client";

export function QuickPrompts({
  targetId,
  prompts,
  disabled,
}: {
  targetId: string;
  prompts: string[];
  disabled?: boolean;
}) {
  return (
    <div className="pill-row">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="chip"
          style={{ cursor: "pointer" }}
          disabled={disabled}
          onClick={() => {
            const element = document.getElementById(targetId);
            if (element instanceof HTMLTextAreaElement) {
              element.value = prompt;
              element.focus();
              element.setSelectionRange(prompt.length, prompt.length);
              element.scrollIntoView({ block: "center", behavior: "smooth" });
            }
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
