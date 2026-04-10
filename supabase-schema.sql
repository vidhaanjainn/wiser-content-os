-- ============================================================
-- WISER OS — Supabase Schema
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- DEALS
create table if not exists deals (
  id            uuid default gen_random_uuid() primary key,
  brand         text not null,
  agency        text,
  deliverables  text,
  amount        numeric not null default 0,
  status        text not null default 'negotiating',
  ad_rights_days  integer default 0,
  ad_rights_start date,
  ad_rights_end   date,
  due_date      date,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- TOPICS
create table if not exists topics (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  category    text not null default 'finance',
  stage       text not null default 'ideas',
  hook        text,
  notes       text,
  sort_order  integer default 0,
  posted_date date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- CALENDAR ITEMS
create table if not exists calendar_items (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  item_date  date not null,
  type       text default 'reel',
  notes      text,
  created_at timestamptz default now()
);

-- PERFORMANCE STATS
create table if not exists perf_stats (
  id                   uuid default gen_random_uuid() primary key,
  stat_date            date not null unique,
  followers            integer,
  reel_views           integer,
  saves                integer,
  wisermoney_visits    integer,
  wisermoney_profiles  integer,
  wisermoney_calls     integer,
  created_at           timestamptz default now()
);

-- RLS (open policies — add auth later if needed)
alter table deals enable row level security;
alter table topics enable row level security;
alter table calendar_items enable row level security;
alter table perf_stats enable row level security;

create policy "open_deals"    on deals    for all using (true) with check (true);
create policy "open_topics"   on topics   for all using (true) with check (true);
create policy "open_cal"      on calendar_items for all using (true) with check (true);
create policy "open_stats"    on perf_stats for all using (true) with check (true);

-- SEED DATA
insert into deals (brand, agency, deliverables, amount, status, due_date) values
  ('Lenskart', 'Socioimpulse', '1 Collab Reel + 1 Story', 32500, 'confirmed', '2026-04-18'),
  ('Real Estate Brand', 'Influns', '1 Reel + 1 Story + 3M Ad Rights', 72500, 'negotiating', null),
  ('Insurance Brand', 'Madchatter', '1 Non-Collab Reel', 27500, 'overdue', '2026-03-28');

insert into deals (brand, agency, deliverables, amount, status, due_date, ad_rights_days, ad_rights_start, ad_rights_end) values
  ('Man Matters', 'Direct', '1 Reel + 1-month Ad Rights', 42500, 'confirmed', '2026-04-15', 30, '2026-03-10', '2026-04-20');

insert into topics (title, category, stage, sort_order) values
  ('Naval on leverage — 3 types nobody teaches', 'psych',    'ideas',     1),
  ('SEBI lifecycle fund rules explained',         'finance',  'ideas',     2),
  ('Why current account deficit is misunderstood','macro',    'ideas',     3),
  ('Hormuz — India oil shock exposure',           'macro',    'scripting', 1),
  ('Gold crashes during war — myth bust',         'finance',  'scripting', 2),
  ('₹10L model portfolio breakdown',             'finance',  'shooting',  1),
  ('Lenskart collab script',                      'collab',   'shooting',  2),
  ('SPIVA — why active funds fail',               'finance',  'editing',   1),
  ('Nifty flat periods — pattern',                'finance',  'posted',    1),
  ('Ukraine oil refinery series',                 'macro',    'posted',    2);

insert into perf_stats (stat_date, followers, reel_views, saves, wisermoney_visits, wisermoney_profiles, wisermoney_calls) values
  ('2026-04-09', 60200, 240000, 8400, 347, 89, 12),
  ('2026-04-02', 59380, 210000, 7100, 290, 74, 9),
  ('2026-03-26', 58100, 195000, 6800, 240, 61, 7);
