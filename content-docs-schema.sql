-- WISER OS — Documents (scripts, banks, reference docs, reports) synced from the Mac; read on demand by the Today tab. Additive only.
create table if not exists content_docs (
  key        text primary key,
  title      text not null,
  kind       text not null default 'doc',      -- script | bank | doc | report
  code       text,
  series     text,
  status     text,                             -- to record | recorded | idea | menu | ...
  body       text not null default '',
  hash       text,
  updated_at timestamptz default now()
);
create index if not exists content_docs_kind_idx on content_docs (kind, status);
