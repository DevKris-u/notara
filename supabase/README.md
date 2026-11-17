# Supabase (optional)

Notara runs **local-first**: data lives in an embedded Postgres (PGlite) under `.data/notara`, auth is handled by local session cookies, and the whole app works offline.

These files let you move the same schema to a hosted Supabase project when you want sync between devices, real auth, or file storage.

## Files

- `migrations/0001_init.sql` — tables, indexes, `subjects` seed, `handle_new_user()` trigger, and row-level security policies.
- `.env.example` (repo root) — the variables the app will read once a Supabase adapter is wired in.

## Apply the migration

With the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste `migrations/0001_init.sql` into the Supabase SQL editor and run it once.

## What the migration assumes

| Local (PGlite)              | Supabase                                  |
| --------------------------- | ----------------------------------------- |
| `profiles.password_hash`    | removed — passwords live in `auth.users`  |
| `sessions` table + cookies  | `auth.uid()` from Supabase Auth           |
| `crypto.randomUUID()` in app| `default gen_random_uuid()` on every table|
| no RLS (single local user)  | RLS enabled: private rows by `user_id`, community tables public-read |

`public.profiles.id` references `auth.users(id)`. On signup the `on_auth_user_created` trigger creates the profile row from `raw_user_meta_data` (`username`, `display_name`).

## Notes

- `boards.lesson`, `quizzes.questions` and `quiz_attempts.answers` stay `jsonb` — identical shape to the local app (`src/lib/lesson/types.ts`, `QuizQuestion`).
- `notes.tags` is `text[]`.
- Usage limits are derived from `usage_events` (`kind = 'whiteboard' | 'chat' | ...`), so plans behave the same after migration.
- Storage is not used yet: local files are parsed in memory and only extracted text/summary is stored.
