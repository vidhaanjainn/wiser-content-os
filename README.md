# Wiser OS

Creator command center for Wiser With Vidhaan.
React + Vite + Supabase, deployed on Vercel as a PWA.

---

## File Structure

```
wiser-os/
├── src/
│   ├── pages/
│   │   ├── Money.jsx       ← Revenue, deals, ad alerts, invoices
│   │   ├── Calendar.jsx    ← Weekly calendar, deadlines
│   │   ├── Topics.jsx      ← Pipeline board (Ideas → Posted)
│   │   ├── Stats.jsx       ← Followers, views, WiserMoney funnel
│   │   └── AI.jsx          ← One-tap Claude launchers
│   ├── components/
│   │   ├── UI.jsx          ← Shared: Card, StatTile, Btn, Badge etc.
│   │   └── Modal.jsx       ← Modal sheet + form helpers
│   ├── hooks/
│   │   ├── useDeals.js     ← All deal data + CRUD
│   │   ├── useTopics.js    ← All topic data + CRUD
│   │   ├── useCalendar.js  ← Calendar items data + CRUD
│   │   └── useStats.js     ← Performance stats data
│   ├── lib/
│   │   ├── supabase.js     ← Supabase client (auto-detects live vs demo)
│   │   ├── constants.js    ← All config: statuses, categories, AI prompts, formatters
│   │   └── demo.js         ← Fallback data when Supabase not connected
│   ├── App.jsx             ← Root: nav, toast, page routing
│   ├── main.jsx            ← Entry point
│   └── index.css           ← All global styles (tokens, components, layout)
├── public/
│   └── manifest.json       ← PWA config
├── index.html
├── vite.config.js
├── vercel.json
├── supabase-schema.sql     ← Run this in Supabase once
├── .env.example            ← Copy to .env and fill keys
└── .gitignore
```

---

## Setup: Step by Step

### 1. Supabase (5 min)

1. Go to https://supabase.com → Sign up → **New Project**
   - Name: `wiser-os`
   - Region: **ap-south-1 (Mumbai)**
   - Click Create Project, wait ~2 min

2. Left sidebar → **SQL Editor** → **New Query**
   - Paste everything from `supabase-schema.sql`
   - Click **Run** → should say "Success"

3. Left sidebar → **Project Settings** → **API**
   - Copy **Project URL** (e.g. `https://xyzxyz.supabase.co`)
   - Copy **anon public** key (long `eyJ...` string)

---

### 2. Local Setup (2 min)

```bash
# In terminal, inside the wiser-os folder:
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your_key...
```

Then:
```bash
npm install
npm run dev
```

Open http://localhost:5173 — app runs locally with live Supabase data.

---

### 3. GitHub (2 min)

```bash
git init
git add .
git commit -m "Initial commit — Wiser OS"
git branch -M main
git remote add origin https://github.com/vidhaanjainn/wiser-os.git
git push -u origin main
```

---

### 4. Vercel (3 min)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `wiser-os` repo
3. **Before deploying** — add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy**
5. Vercel gives you a URL like `wiser-os.vercel.app`

**Auto-deploy:** Every `git push` to main auto-redeploys. ✓

---

### 5. iPhone PWA (1 min)

1. Open Safari → go to your Vercel URL
2. Tap Share button (box with arrow up)
3. **Add to Home Screen** → Name it "Wiser OS" → Add
4. Opens full screen, no browser chrome, feels native ✓

---

## Making Changes

### Add a new field to deals
1. Add column to Supabase: SQL Editor → `ALTER TABLE deals ADD COLUMN field_name text;`
2. Add input in `src/pages/Money.jsx` inside the deal modal form
3. Add it to the `payload` object in `handleSaveDeal()`
4. Done — `git push` to deploy

### Add a new AI tool
1. Open `src/lib/constants.js`
2. Add entry to `AI_TOOLS` array with `key`, `icon`, `name`, `desc`, `prompt`
3. Done — shows up automatically in AI tab

### Change colors / fonts
1. Open `src/index.css`
2. Edit CSS variables at the top inside `:root { ... }`
3. `--lime` is the main accent, `--bg` through `--bg5` are background shades

### Add a new page/tab
1. Create `src/pages/NewPage.jsx`
2. Add entry to `TABS` array in `src/App.jsx`
3. Add case to `renderPage()` in `src/App.jsx`
4. Done

---

## Offline / Demo Mode

If Supabase keys are not set, the app automatically falls back to demo data.
The sync chip in the top right shows: 🟢 Live / 🔴 Demo

All CRUD operations in demo mode work in-memory for the session — data resets on refresh.
Set up Supabase to persist everything.
