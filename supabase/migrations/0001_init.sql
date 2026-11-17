-- Notara — initial schema for Supabase (Postgres 15+)
-- Local development uses PGlite with the same tables (see src/lib/schema.ts).
-- Run with: supabase db push   (or paste into the SQL editor)

create extension if not exists "pgcrypto";

/* ------------------------------- profiles ------------------------------- */

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  display_name text not null,
  bio text not null default '',
  school text not null default '',
  grade text not null default '',
  avatar_hue integer not null default 152,
  plan text not null default 'free' check (plan in ('free','pro','max')),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0,
  last_active date,
  persona_vibe text not null default 'friend',
  persona_warmth integer not null default 3 check (persona_warmth between 1 and 5),
  persona_emojis integer not null default 2 check (persona_emojis between 0 and 3),
  persona_language text not null default 'pl',
  created_at timestamptz not null default now()
);

/* ------------------------------- subjects ------------------------------- */

create table if not exists public.subjects (
  slug text primary key,
  name text not null,
  emoji text not null,
  color text not null,
  sort integer not null default 0
);

insert into public.subjects (slug, name, emoji, color, sort) values
  ('matematyka', 'Matematyka', '📐', '#2f6f96', 1),
  ('fizyka', 'Fizyka', '🚀', '#6b5bbd', 2),
  ('chemia', 'Chemia', '⚗️', '#0d7a55', 3),
  ('biologia', 'Biologia', '🌿', '#b0562f', 4),
  ('polski', 'Język polski', '📖', '#c68a12', 5),
  ('historia', 'Historia', '🏛️', '#8b5e3c', 6),
  ('angielski', 'Angielski', '🇬🇧', '#2f6f96', 7),
  ('inne', 'Nauka własna', '✨', '#0e4d3a', 8)
on conflict (slug) do nothing;

/* ------------------------------ whiteboard ----------------------------- */

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  subject_slug text references public.subjects(slug) on delete set null,
  lesson jsonb not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boards_user_idx on public.boards(user_id, created_at desc);

create table if not exists public.board_messages (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists board_messages_board_idx on public.board_messages(board_id, created_at);

/* --------------------------------- chat -------------------------------- */

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mode text not null default 'chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chats_user_idx on public.chats(user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  attachment text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_chat_idx on public.chat_messages(chat_id, created_at);

/* -------------------------------- library ------------------------------ */

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  filename text not null,
  mime text not null default 'application/octet-stream',
  bytes integer not null default 0,
  content text not null default '',
  summary text not null default '',
  subject_slug text references public.subjects(slug) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists uploads_user_idx on public.uploads(user_id, created_at desc);

/* ------------------------------ study plan ----------------------------- */

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject_slug text references public.subjects(slug) on delete set null,
  kind text not null default 'task' check (kind in ('task','exam','review')),
  due_date date not null,
  estimate_min integer not null default 30,
  done boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists plan_items_user_idx on public.plan_items(user_id, due_date);

create table if not exists public.recall_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  score integer not null default 0 check (score between 0 and 100),
  feedback text not null default '',
  created_at timestamptz not null default now()
);

/* -------------------------------- practice ----------------------------- */

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject_slug text references public.subjects(slug) on delete set null,
  topic text not null default '',
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts(quiz_id, created_at desc);

create table if not exists public.flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject_slug text references public.subjects(slug) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  front text not null,
  back text not null,
  box integer not null default 1 check (box between 1 and 5),
  due_at timestamptz not null default now()
);
create index if not exists flashcards_set_idx on public.flashcards(set_id, due_at);

/* ------------------------------- community ----------------------------- */

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  subject_slug text references public.subjects(slug) on delete set null,
  body text not null,
  tags text[] not null default '{}',
  read_minutes integer not null default 4,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notes_subject_idx on public.notes(subject_slug, created_at desc);
create index if not exists notes_search_idx on public.notes using gin (to_tsvector('simple', title || ' ' || body));

create table if not exists public.note_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.note_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.note_comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  subject_slug text references public.subjects(slug) on delete set null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  votes integer not null default 0,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists answers_question_idx on public.answers(question_id, votes desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_kind text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

/* ------------------------- gamification + limits ----------------------- */

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'system',
  body text not null,
  href text not null default '/',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  amount integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists point_events_user_idx on public.point_events(user_id, created_at desc);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_user_idx on public.usage_events(user_id, kind, created_at desc);

/* -------------------------- profile on signup -------------------------- */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'uczen-' || substr(new.id::text, 1, 8)),
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* --------------------------------- RLS --------------------------------- */

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_messages enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.folders enable row level security;
alter table public.uploads enable row level security;
alter table public.plan_items enable row level security;
alter table public.recall_sessions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.flashcard_sets enable row level security;
alter table public.flashcards enable row level security;
alter table public.notes enable row level security;
alter table public.note_likes enable row level security;
alter table public.note_saves enable row level security;
alter table public.note_comments enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.point_events enable row level security;
alter table public.usage_events enable row level security;

-- profiles: public read, own write
create policy "profiles are public" on public.profiles for select using (true);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- private study data
create policy "own boards" on public.boards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own board messages" on public.board_messages for all
  using (exists (select 1 from public.boards b where b.id = board_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.boards b where b.id = board_id and b.user_id = auth.uid()));

create policy "own chats" on public.chats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chat messages" on public.chat_messages for all
  using (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));

create policy "own folders" on public.folders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own uploads" on public.uploads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plan items" on public.plan_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recall sessions" on public.recall_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own quizzes" on public.quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quiz attempts" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own flashcard sets" on public.flashcard_sets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own flashcards" on public.flashcards for all
  using (exists (select 1 from public.flashcard_sets s where s.id = set_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.flashcard_sets s where s.id = set_id and s.user_id = auth.uid()));

-- community: public read, own write
create policy "notes are public" on public.notes for select using (true);
create policy "insert own notes" on public.notes for insert with check (auth.uid() = author_id);
create policy "update own notes" on public.notes for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own notes" on public.notes for delete using (auth.uid() = author_id);

create policy "likes are public" on public.note_likes for select using (true);
create policy "manage own likes" on public.note_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saves are own" on public.note_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments are public" on public.note_comments for select using (true);
create policy "insert own comments" on public.note_comments for insert with check (auth.uid() = author_id);
create policy "delete own comments" on public.note_comments for delete using (auth.uid() = author_id);

create policy "questions are public" on public.questions for select using (true);
create policy "insert own questions" on public.questions for insert with check (auth.uid() = author_id);
create policy "update own questions" on public.questions for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own questions" on public.questions for delete using (auth.uid() = author_id);

create policy "answers are public" on public.answers for select using (true);
create policy "insert own answers" on public.answers for insert with check (auth.uid() = author_id);
create policy "update answers" on public.answers for update
  using (auth.uid() = author_id or exists (select 1 from public.questions q where q.id = question_id and q.author_id = auth.uid()))
  with check (true);
create policy "delete own answers" on public.answers for delete using (auth.uid() = author_id);

create policy "insert own reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- personal notifications and counters
create policy "own notifications" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own point events" on public.point_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage events" on public.usage_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
