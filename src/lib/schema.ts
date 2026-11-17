export const SCHEMA_SQL = /* sql */ `
create table if not exists profiles (
  id uuid primary key,
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  bio text not null default '',
  school text not null default '',
  grade text not null default '',
  avatar_hue integer not null default 152,
  plan text not null default 'free',
  xp integer not null default 0,
  streak integer not null default 0,
  last_active date,
  persona_vibe text not null default 'friend',
  persona_warmth integer not null default 3,
  persona_emojis integer not null default 2,
  persona_language text not null default 'pl',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  slug text primary key,
  name text not null,
  emoji text not null,
  color text not null,
  sort integer not null default 0
);

create table if not exists boards (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  subject_slug text,
  lesson jsonb not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boards_user_idx on boards(user_id, created_at desc);

create table if not exists board_messages (
  id uuid primary key,
  board_id uuid not null references boards(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  mode text not null default 'chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key,
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null,
  content text not null,
  attachment text,
  created_at timestamptz not null default now()
);

create table if not exists folders (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists uploads (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  filename text not null,
  mime text not null default 'application/octet-stream',
  bytes integer not null default 0,
  content text not null default '',
  summary text not null default '',
  subject_slug text,
  created_at timestamptz not null default now()
);

create table if not exists plan_items (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  subject_slug text,
  kind text not null default 'task',
  due_date date not null,
  estimate_min integer not null default 30,
  done boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  subject_slug text,
  topic text not null default '',
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists flashcard_sets (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  subject_slug text,
  created_at timestamptz not null default now()
);

create table if not exists flashcards (
  id uuid primary key,
  set_id uuid not null references flashcard_sets(id) on delete cascade,
  front text not null,
  back text not null,
  box integer not null default 1,
  due_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  subject_slug text,
  body text not null,
  tags text[] not null default '{}',
  read_minutes integer not null default 4,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists note_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  note_id uuid not null references notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists note_saves (
  user_id uuid not null references profiles(id) on delete cascade,
  note_id uuid not null references notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists note_comments (
  id uuid primary key,
  note_id uuid not null references notes(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  subject_slug text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key,
  question_id uuid not null references questions(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  votes integer not null default 0,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'system',
  body text not null,
  href text not null default '/',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists point_events (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  amount integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_user_idx on usage_events(user_id, kind, created_at desc);

create table if not exists recall_sessions (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  topic text not null,
  score integer not null default 0,
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key,
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_kind text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists app_meta (
  key text primary key,
  value text not null
);
`;
