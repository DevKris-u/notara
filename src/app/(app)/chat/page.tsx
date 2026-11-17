import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { createChatAction, deleteChatAction, drawFromChatAction, sendChatMessageAction } from "@/lib/actions";
import { PLANS, usageCount, type PlanKey } from "@/lib/points";
import { chatReply } from "@/lib/ai";
import { ChatComposer } from "@/components/chat-composer";
import { ChatStart } from "@/components/chat-start";
import { Markdown } from "@/components/markdown";
import { ScrollToBottom } from "@/components/scroll-to-bottom";
import { BoardIcon, ChatIcon, PlusIcon, SparkIcon, TrashIcon } from "@/components/icons";
import { relative, truncate } from "@/lib/utils";

export const metadata = { title: "Asystent AI" };

type ChatRow = { id: string; title: string; updated_at: string };
type MessageRow = { id: string; role: string; content: string; attachment: string | null; created_at: string };

const START_SUGGESTIONS = [
  "Wytłumacz mi fotosyntezę krok po kroku",
  "Jak rozwiązywać równania kwadratowe?",
  "Zrób mi plan powtórek na sprawdzian z biologii",
  "Czym różni się prędkość od przyspieszenia?",
];

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; new?: string }>;
}) {
  const user = await requireUser();
  const search = await searchParams;

  const chats = await q<ChatRow>(
    "select id, title, updated_at from chats where user_id = $1 order by updated_at desc limit 40",
    [user.id],
  );

  const active = search.c ? chats.find((chat) => chat.id === search.c) : search.new ? null : chats[0];
  const messages = active
    ? await q<MessageRow>(
        "select id, role, content, attachment, created_at from chat_messages where chat_id = $1 order by created_at asc",
        [active.id],
      )
    : [];

  const used = await usageCount(user.id, "chat", 1);
  const plan = PLANS[(user.plan as PlanKey) ?? "free"] ?? PLANS.free;
  const left = Math.max(0, plan.chatsPerDay - used);

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const suggestions = active
    ? (chatReply(lastUser?.content ?? "", {
        vibe: user.persona_vibe,
        warmth: user.persona_warmth,
        emojis: user.persona_emojis,
        language: user.persona_language,
      }).suggestions ?? [])
    : START_SUGGESTIONS;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <ChatIcon width={13} height={13} /> Asystent AI
          </div>
          <h1 className="page-title">Zapytaj o cokolwiek</h1>
          <p className="page-sub">
            Tłumaczy tematy, układa plan i rozrysowuje lekcje na tablicy. Odpowiada w twoim stylu — bez oceniania.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={left === 0 ? "chip chip-coral" : "chip"}>
            {plan.chatsPerDay > 100 ? "Bez limitu" : `${left} z ${plan.chatsPerDay} pytań na dziś`}
          </span>
          <Link href="/chat?new=1" className="btn btn-primary">
            <PlusIcon width={15} height={15} /> Nowa rozmowa
          </Link>
        </div>
      </div>

      <div className="chat-shell">
        <aside className="chat-list">
          <Link
            href="/chat?new=1"
            className="chat-item"
            data-active={!active ? "true" : "false"}
            style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}
          >
            <PlusIcon width={14} height={14} /> Nowa rozmowa
          </Link>
          {chats.length ? (
            chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat?c=${chat.id}`}
                className="chat-item"
                data-active={active?.id === chat.id ? "true" : "false"}
                title={chat.title}
              >
                {truncate(chat.title, 42)}
                <span className="small" style={{ display: "block", fontSize: 11 }}>
                  {relative(chat.updated_at)}
                </span>
              </Link>
            ))
          ) : (
            <p className="small" style={{ padding: "10px 11px", margin: 0 }}>
              Tu pojawią się twoje rozmowy.
            </p>
          )}
        </aside>

        <section className="chat-panel">
          {active ? (
            <>
              <div
                className="between"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1.5px solid var(--line)",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 14.5, display: "block" }}>{truncate(active.title, 70)}</b>
                  <span className="small">Ostatnia wiadomość {relative(active.updated_at)}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {lastUser ? (
                    <form action={drawFromChatAction}>
                      <input type="hidden" name="prompt" value={lastUser.content} />
                      <button type="submit" className="btn btn-sm">
                        <BoardIcon width={14} height={14} /> Rozrysuj na tablicy
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteChatAction}>
                    <input type="hidden" name="chat_id" value={active.id} />
                    <button type="submit" className="btn btn-sm btn-coral" title="Usuń rozmowę">
                      <TrashIcon width={14} height={14} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="chat-scroll">
                {messages.map((message) => (
                  <div key={message.id} className="bubble" data-role={message.role}>
                    {message.role === "assistant" ? (
                      <Markdown text={message.content} />
                    ) : (
                      <>
                        <p style={{ margin: 0 }}>{message.content}</p>
                        {message.attachment ? (
                          <p className="small" style={{ margin: "8px 0 0" }}>
                            📎 {message.attachment}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
                <ScrollToBottom signal={`${active.id}:${messages.length}`} />
              </div>

              <div style={{ borderTop: "1.5px solid var(--line)", padding: "10px 12px 12px" }}>
                <ChatComposer
                  chatId={active.id}
                  action={sendChatMessageAction}
                  suggestions={suggestions.slice(0, 3)}
                  disabled={left === 0}
                />
                {left === 0 ? (
                  <p className="small" style={{ margin: "8px 12px 0" }}>
                    Limit pytań na dziś wykorzystany.{" "}
                    <Link href="/pricing" style={{ fontWeight: 700 }}>
                      Zwiększ limity w planie
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ padding: 24, overflowY: "auto" }}>
              <div className="stack" style={{ gap: 6, marginBottom: 16 }}>
                <span className="chip chip-gold">
                  <SparkIcon width={12} height={12} /> Nowa rozmowa
                </span>
                <h2 style={{ fontSize: 24, margin: "6px 0 0" }}>Od czego zaczynamy?</h2>
                <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
                  Wpisz pytanie albo wklej treść zadania. Potem możesz poprosić o tablicę, quiz albo plan powtórek.
                </p>
              </div>
              <ChatStart action={createChatAction} suggestions={START_SUGGESTIONS} />
              {left === 0 ? (
                <p className="small" style={{ marginTop: 14 }}>
                  Wykorzystałeś dzisiejszy limit pytań.{" "}
                  <Link href="/pricing" style={{ fontWeight: 700 }}>
                    Sprawdź plany
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
