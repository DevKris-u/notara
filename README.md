# Notara

Local-first AI learning studio: ask a question, get a narrated whiteboard lesson, then practise with quizzes, flashcards, a study plan and voice recall.

Built from scratch as an original product — Next.js App Router, TypeScript, embedded Postgres (PGlite) and a deterministic lesson engine, so everything runs on your machine without API keys.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and use the one-click demo accounts on `/login`:

| Account | E-mail | Password |
| --- | --- | --- |
| Kasia (Pro, biology) | `kasia@notara.app` | `notara123` |
| Marek (Free, physics) | `marek@notara.app` | `notara123` |
| Ola (Free, biology) | `ola@notara.app` | `notara123` |

Data is created on first request in `.data/notara` (PGlite). Delete that folder to reset the demo.

## What's inside

### Whiteboard AI (`/whiteboard`)
- Type any topic; the planner picks one of 19 authored topics or builds a generic lesson.
- Every step is drawn on its own area of an infinite board; the camera follows the current step and keeps earlier steps visible.
- Narration is synced with drawing (`SpeechSynthesis`, `pl-PL`). Pause stops the voice and drawing; mute keeps drawing.
- Pan/zoom, `Śledź` to snap back, step list, speed control, PDF export (print stylesheet), restart.
- Follow-up questions extend the same board with two new steps.
- Free plan: 2 lessons per 5 days. Pro/Max: unlimited.

### Everything else
| Area | Route | Highlights |
| --- | --- | --- |
| Dashboard | `/home` | greeting, level/XP, streak, next tasks, notifications, recent boards, community picks |
| AI chat | `/chat` | persona-aware replies, suggestions, attachment label, "Rozrysuj na tablicy", usage counter |
| Study plan | `/plans` | add/toggle/delete tasks, AI exam planner, Voice Recall (`SpeechRecognition`) with transcript, score and feedback, recall history |
| Practice | `/practice` | generate quizzes (5 questions, explanations) and flashcard sets, spaced-repetition boxes (1–5), mock exam, attempt history |
| Community | `/community`, `/notes/[slug]` | search + subject filters, likes, saves, comments, Markdown notes, reports |
| Q&A | `/questions`, `/questions/[id]` | ask, answer, vote, accept best answer, resolved state |
| Leaderboard | `/leaderboard` | weekly XP, top 3 podium, streaks, XP rules |
| Plans | `/pricing` | Free / Pro / Max comparison, live usage, instant plan switch (no payments) |
| Library | `/library` | folders, uploads (max 8 MB), auto summaries, editable descriptions, saved notes |
| Settings | `/settings` | profile, avatar hue, persona (style, warmth, emoji, language), account stats |

## Architecture

```
src/
  app/
    (app)/            authenticated shell (rail nav + mobile nav)
      home/ chat/ whiteboard/ plans/ practice/ library/ community/
      notes/[slug]/ questions/ leaderboard/ pricing/ settings/
    login/ signup/ landing page
  components/         icons, board player, quiz runner, flashcard deck, voice recall, markdown
  lib/
    db.ts             PGlite singleton + q/one/exec helpers
    schema.ts         local SQL schema (mirrors supabase/migrations/0001_init.sql)
    seed.ts           demo users, notes, questions, boards, quizzes
    auth.ts           session cookies (local auth)
    actions.ts        all server actions ("use server")
    points.ts         plans, quotas, XP, streak, notifications, leaderboard
    ai/             NVIDIA NIM client + tutors: chat, lessons, quizzes, summaries (server only)
    local.ts        deterministic persona-aware chat replies + extractive summaries (fallback)
    lesson/           topic library, geometry/math/science/human builders, canvas renderer
supabase/             hosted-Postgres migration + RLS notes
```

**Why PGlite?** It is real Postgres compiled to WASM, so SQL stays portable: the same tables, `jsonb` columns, `text[]` tags and interval arithmetic work on Supabase. `supabase/migrations/0001_init.sql` adds `auth.users` linkage, `gen_random_uuid()` defaults and RLS policies for deployment.

**Why a local lesson engine?** Lessons must be instant, offline, free and deterministic. `src/lib/lesson/*` composes typed canvas ops (`text`, `line`, `arrow`, `poly`, `func`, `axes`, …) with hand-drawn wobble; `BoardPlayer` animates them and speaks the narration.

## Scripts

```bash
npm run dev     # local development
npm run build   # production build (Turbopack)
npm start       # serve the build
npm run lint    # eslint
npx tsc --noEmit
```

## Environment

Running locally needs none. `.env.example` lists Supabase variables for when you connect a hosted project — see `supabase/README.md`.

## AI / NVIDIA NIM

Notara works offline out of the box: a deterministic local engine writes chat replies, lessons, quizzes and summaries, and local code draws every step on the whiteboard.

Optionally set a NVIDIA NIM key in `.env.local` (gitignored, server-only). The model then writes lesson content, chat answers, quiz questions and upload summaries; the local renderer still turns that content into canvas geometry, so layouts stay stable and animated.

```bash
# .env.local — never commit this file
NVIDIA_API_KEY=nvapi-...
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
NVIDIA_TIMEOUT_MS=90000
NVIDIA_THINKING=0   # 0 = hidden reasoning off (fast). 1 = thinking on (slower).
```

The key is read only in server code (`src/lib/ai/llm.ts`) — it never reaches the browser. When the key is missing, the API fails or the JSON is invalid, every feature silently falls back to the local engine. `aiEnabled()` / `aiModel()` expose the status on `/settings`.


## Limits and privacy

- No external AI calls by default: replies, lessons, quizzes and summaries are generated by local code.
- Optional NVIDIA NIM key: only text you type/paste (chat, lesson topic, quiz topic, upload text) is sent to the model; the API key never reaches the browser.
- On any API failure or invalid JSON, the app silently falls back to the local engine.
- Uploads never leave the machine; only extracted text and its summary are stored.
- Usage counters live in `usage_events`; plan changes are instant and free (demo).

## Roadmap

- Optional Supabase adapter behind the same `q/one/exec` interface.
- Shared/class boards and parent progress reports (planned for Max).
- Image OCR and PDF text extraction for uploads.
