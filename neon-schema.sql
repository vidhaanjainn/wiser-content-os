-- ============================================================
-- WISER OS — Neon Postgres Schema
-- Includes the go-live and payment/TDS columns that were later migrations on Supabase.
-- Load order: this file, then supabase-seed-full.sql (deal history seed)
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
  go_live_date  date,
  payment_days  integer default 30,
  go_live_link  text,
  paid_at          date,
  amount_received  numeric,
  tds_ais_status   text default 'unchecked',
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
