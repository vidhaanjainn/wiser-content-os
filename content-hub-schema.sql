-- WISER OS — Content hub (dashboard snapshots, notification feed, push subscriptions). Additive only.

-- One row per dashboard section (stats, queue, menu, radar, inbox, health); replaced on every push.
create table if not exists content_snapshots (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz default now()
);

-- Notification / activity feed. dedupe_key makes re-runs of a task harmless (no double notify).
create table if not exists content_feed (
  id          uuid default gen_random_uuid() primary key,
  dedupe_key  text unique,
  kind        text not null default 'update',
  urgency     text not null default 'update',   -- urgent | update | info
  title       text not null,
  body        text,
  url         text default '/',
  source      text,
  read        boolean default false,
  pushed      integer default 0,
  created_at  timestamptz default now()
);
create index if not exists content_feed_created_idx on content_feed (created_at desc);

-- Web Push subscriptions (one per installed device / browser).
create table if not exists push_subscriptions (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  device     text,
  created_at timestamptz default now(),
  last_ok_at timestamptz
);
