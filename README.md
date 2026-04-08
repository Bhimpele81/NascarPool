# NASCAR Pool — Bill vs Don 2026

A web app to track a two-person weekly NASCAR fantasy contest. Built with React, backed by Supabase, deployed on Render.

**Live site**: https://nascarpool.onrender.com

---

## How It Works

Each week, Bill and Don each draft 6 drivers before the race. Drivers are assigned to tiers based on their FanDuel odds at draft time. After the race, finish positions and stage wins are entered and the app calculates fantasy points and weekly dollar results automatically.

---

## Scoring System

### Driver Points
```
Total = Top-10 Bonus + (Stage Wins × 15) + ((50 − Finish) × Tier Multiplier)
```

| Tier | Odds Rank | Multiplier |
|------|-----------|------------|
| Tier 1 | 1–12 | 1.00× |
| Tier 2 | 13–25 | 1.33× |
| Tier 3 | 26+ | 1.66× |

### Top-10 Bonus Table
| Finish | Bonus |
|--------|-------|
| 1st | 130 |
| 2nd | 90 |
| 3rd | 80 |
| 4th | 70 |
| 5th | 60 |
| 6th | 50 |
| 7th | 40 |
| 8th | 30 |
| 9th | 20 |
| 10th | 10 |

### Weekly Money
```
Weekly Net = round( (Bill pts − Don pts) ÷ 3 )
           + consecutive winner streak bonus
           + optional special bonus (e.g. Daytona double)
```

All dollar amounts rounded to nearest dollar.

### Consecutive Winner Streak Bonus
Earned when the same person drafts the race-winning driver in back-to-back weeks.

| Streak | Bonus |
|--------|-------|
| 2 weeks | $10 |
| 3 weeks | $20 |
| 4 weeks | $40 |
| 5 weeks | $60 |
| 6 weeks | $80 |
| 7 weeks | $100 |
| 8 weeks | $125 |
| 9 weeks | $150 |
| 10 weeks | $200 |
| 11+ weeks | $50 |

### Draft Picks
Each time a player has the race-winning driver on their roster, they earn 1 playoff draft pick. Picks determine draft order when the playoffs begin — the player with more picks gets first pick, then they alternate, with the player having more picks getting the extra consecutive picks at the end.

---

## Pages

- **Dashboard** — Season running total, all races listed most recent first, click any race to open it
- **History** — Charts of running total and weekly fantasy points, full season results table
- **Draft Picks** — Pick tally, projected playoff draft order, pick history by race
- **Rules** — Full scoring rules reference with worked examples

---

## Weekly Workflow

### Draft Day (before the race)
1. Click **+ Add Race** on the dashboard
2. Enter the location, date, and who has first pick
3. Select all 12 drivers (6 per team) — rows 1–2 = Tier 1, rows 3–4 = Tier 2, rows 5–6 = Tier 3
4. Click **Save Draft** — data is saved to Supabase, both Bill and Don can see it

### Race Day (after the race)
1. Click the race on the dashboard
2. Click **Auto Update Results** to pull finish positions from ESPN automatically
3. Verify and adjust any unmatched drivers or stage wins manually
4. Points and money calculate automatically in real time
5. Click **✓ Complete** to mark the race done

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 |
| Styling | CSS with Inter font |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Hosting | Render (Static Site) |
| Uptime | UptimeRobot |
| Repo | GitHub (Bhimpele81/NascarPool) |

---

## Data Storage

All race data is stored in **Supabase** — a cloud PostgreSQL database. This means both Bill and Don can access the app from any device and always see the same data in real time.

A **localStorage cache** is also maintained as a fallback in case Supabase is temporarily unavailable.

To back up your data, use the **Export CSV** button on the Dashboard or History pages.

---

## File Structure
```
NascarPool/
├── public/
│   ├── index.html
│   ├── health.html          # UptimeRobot ping endpoint
│   └── logo.webp            # NASCAR logo
├── src/
│   ├── App.js               # Main app, routing, streak logic
│   ├── App.css              # Global dark navy theme
│   ├── index.js             # React entry point
│   ├── pages/
│   │   ├── Dashboard.js     # Season summary, race list
│   │   ├── RaceEntry.js     # Weekly scoring entry page
│   │   ├── History.js       # Charts and season history
│   │   ├── DraftPicks.js    # Playoff draft pick tracker
│   │   └── Rules.js         # Scoring rules reference
│   └── utils/
│       ├── scoring.js       # All fantasy point formulas
│       ├── storage.js       # Supabase + localStorage persistence
│       └── supabase.js      # Supabase client config
├── supabase-schema.sql      # Database schema
└── package.json
```

---

## Supabase Setup

The database uses a single table `race_weeks` with a JSONB column storing the full app state.

To set up from scratch, run `supabase-schema.sql` in the Supabase SQL Editor.

---

## UptimeRobot

Monitor URL: `https://nascarpool.onrender.com/health.html`
Interval: 5 minutes

---

## Mobile Optimizations

- **Driver names** display as clean plain text (last names only) on mobile — no input boxes, larger font, high contrast
- Tap any driver name to edit it via prompt
- Empty driver slots still show the full input field with autocomplete
- Desktop view remains unchanged with full input boxes and datalist autocomplete

---

## Coming Soon

- Playoff scoring system
