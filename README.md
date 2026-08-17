# Wiser OS

Creator command center for Wiser With Vidhaan.
React + Vite + Google Sheets, deployed on Vercel as a PWA.

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
│   │   ├── sheets.js       ← Google Sheets client (auto-detects live vs demo)
│   │   ├── localCache.js   ← localStorage cache so the app renders instantly
│   │   ├── constants.js    ← All config: statuses, categories, AI prompts, formatters
│   │   └── demo.js         ← Fallback data when Sheets isn't connected
│   ├── App.jsx             ← Root: nav, toast, page routing
│   ├── main.jsx            ← Entry point
│   └── index.css           ← All global styles (tokens, components, layout)
├── public/
│   └── manifest.json       ← PWA config
├── apps-script/
│   └── Code.gs             ← Paste into the Sheet's Apps Script editor — this is the backend
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example            ← Copy to .env and fill keys
└── .gitignore
```

---

## Why Google Sheets instead of Supabase

Supabase's free tier pauses a project after a week of inactivity, which meant
random outages. This app's data needs (a handful of rows across four tables,
one user) don't need a real database — a Google Sheet plus a tiny Apps
Script "API" in front of it is free forever, never sleeps, and you can also
just... open the Sheet and look at or edit your data directly.

## Setup: Step by Step

### 1. Google Sheet + Apps Script backend (5 min)

1. Create a new Google Sheet (any name, e.g. "Wiser OS Database").
2. **Extensions → Apps Script.** Delete the sample `myFunction()` code.
3. Open `apps-script/Code.gs` from this repo, copy the whole file, paste it in.
4. Near the top, change:
   ```js
   const API_TOKEN = 'CHANGE-THIS-TO-A-LONG-RANDOM-STRING'
   ```
   to a long random string of your own (this is the shared secret between the
   app and your Sheet — anyone with it can read/write your data, so don't
   commit it anywhere public).
5. **Deploy → New deployment → type: Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then **Authorize access** and approve the Google
     permission prompts (this is you granting the script permission to edit
     your own Sheet).
6. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`). That's your API URL.

The four tabs (Deals, Topics, Calendar, Stats) and their headers are created
automatically the first time the app reads or writes — nothing else to set
up in the spreadsheet.

---

### 2. Local Setup (2 min)

```bash
# In terminal, inside the wiser-os folder:
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_SHEETS_API_TOKEN=the-same-random-string-you-put-in-Code.gs
```

Then:
```bash
npm install
npm run dev
```

Open http://localhost:5173 — app runs locally with live Google Sheets data.

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
   - `VITE_SHEETS_API_URL` → your Apps Script Web app URL
   - `VITE_SHEETS_API_TOKEN` → your shared secret string
4. Click **Deploy**
5. Vercel gives you a URL like `wiser-os.vercel.app`

**Auto-deploy:** Every `git push` to main auto-redeploys. ✓

**Re-deploying the Apps Script itself:** editing `Code.gs` in the Apps
Script editor doesn't update a live deployment automatically — use
**Deploy → Manage deployments → edit (pencil icon) → New version → Deploy**.

---

### 5. iPhone PWA (1 min)

1. Open Safari → go to your Vercel URL
2. Tap Share button (box with arrow up)
3. **Add to Home Screen** → Name it "Wiser OS" → Add
4. Opens full screen, no browser chrome, feels native ✓

---

## Making Changes

### Add a new field to deals
1. Add the field name to the `Deals` array in `apps-script/Code.gs` (`SCHEMAS.Deals`), then re-deploy the Apps Script (new version).
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

If Sheets keys are not set, the app automatically falls back to demo data.
The sync chip in the top right shows: 🟢 Live / 🔴 Demo

All CRUD operations in demo mode work in-memory for the session — data
resets on refresh. Set up the Sheets backend above to persist everything.

## How syncing works

Every add/edit/delete writes to `localStorage` on the phone **immediately**
(so the UI updates instantly and nothing is lost even mid-flight), and fires
a write to the Google Sheet in the background. If the Sheet can't be reached
right then, the write is queued in `localStorage` and retried automatically
the next time the app loads or the phone comes back online — so a flaky
connection never loses data, it just delays the Sheet catching up.

On launch, the app shows the cached local copy first, then refreshes from
the Sheet and reconciles.

## AI-assisted updates (e.g. "check my email and update brand deals")

When Claude is asked to pull brand-deal info from Gmail and add/update it in
Wiser OS, it writes through the *same* Apps Script endpoint the app itself
uses (`POST` to `VITE_SHEETS_API_URL` with `{ token, sheet: 'Deals', action:
'insert' | 'update', id, data }`) — so there's one single write path and
the Sheet is always the shared source of truth. The app picks up the change
the next time that tab is opened or re-visited (each tab reloads its data on
mount).
