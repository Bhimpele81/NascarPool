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
Earned when the same person drafts the race-winning driver in back-to-back weeks. The streak bonus is awarded to the streak holder and deducted from the opponent.

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

- **Dashboard** — Season running total banner, all races listed most recent first (desktop table + mobile cards), click any race to open it, Export CSV button
- **History** — Running total line chart, weekly fantasy points bar chart (Bill vs Don), full season results table (click to edit), and a sortable driver draft count table showing how often each driver was picked by Bill, Don, or both
- **Draft Picks** — Pick tally per player, projected playoff draft order with alternating pick visualization, pick history showing which player had the race winner each week
- **Rules** — Full scoring rules reference with worked examples

---

## Weekly Workflow

### Draft Day (before the race)
1. Click **+ Add Race** on the dashboard
2. Enter the location, date, and who has first pick
3. Select all 12 drivers (6 per team) — rows 1–2 = Tier 1, rows 3–4 = Tier 2, rows 5–6 = Tier 3
4. Built-in **autocomplete** suggests from a list of 41 NASCAR drivers as you type
5. Click **Save Draft** — data is saved to Supabase, both Bill and Don can see it

### Race Day (after the race)
1. Click the race on the dashboard
2. Click **Auto Update Results** to pull finish positions from ESPN automatically
3. The app uses **fuzzy name matching** (exact, last name, token subset, partial substring) to match drivers to ESPN results
4. Verify results — unmatched drivers are listed in a warning banner
5. **Stage wins must be entered manually** (not available from ESPN)
6. Points and money calculate automatically in real time
7. Click **✓ Complete** to mark the race done

**Note:** The app validates that each team has exactly 2 drivers per tier and no duplicate drivers before allowing completion.

---

## Features

### ESPN Auto-Update
- Fetches live race results from the ESPN NASCAR API
- Matches drafted driver names to ESPN results using multi-level fuzzy matching with confidence scoring
- Intelligently matches race dates within a 7-day window
- Color-coded status banners show success, warnings (partial match), or errors after each fetch

### Winner Highlights & Streak Tracking
- Race-winning driver's row is highlighted with a blue background and 🏆 emoji
- Consecutive winner streaks are tracked automatically across all completed races
- Streak bonuses are calculated and displayed in the money breakdown

### Money Breakdown
- Each race shows an itemized breakdown per player: point differential, streak bonuses, and special bonuses
- **Special Bonus** field for manual adjustments (e.g., Daytona double) with a notes field to document the reason

### Charts & Analytics (History Page)
- **Running Total** line chart showing season-long trend
- **Weekly Fantasy Points** bar chart comparing Bill vs Don per race
- **Driver Draft Counts** sortable table — click column headers to sort by Bill, Don, or Total (with ↑/↓ indicators)
- Full **season results table** with color-coded winner badges

### Mobile Optimizations
- **Driver names** display as clean plain text (last names only) on mobile — no input boxes, larger font, high contrast
- Tap any driver name to edit it via prompt
- Empty driver slots still show the full input field with autocomplete
- **T10 and Stage bonus columns hidden** on mobile to give driver names more room
- **Tier labels shortened** from "T1 (1-12)" to "T1" on mobile
- Mobile breakpoint set at **768px** to cover larger phones and tablets
- Dashboard switches from table to compact card layout on mobile
- Responsive grid layouts adapt to screen width with resize detection
- Desktop view remains unchanged with full input boxes and datalist autocomplete

### Offline-First Architecture
- All data synced to **Supabase** cloud database for real-time cross-device access
- **localStorage cache** maintained as automatic fallback if Supabase is unavailable
- App continues to work offline using cached data
- **Export CSV** available on Dashboard and History pages for manual backups

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 |
| Styling | CSS with Inter font |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Live Data | ESPN NASCAR API |
| Hosting | Render (Static Site) |
| Uptime | UptimeRobot |
| Repo | GitHub (Bhimpele81/NascarPool) |

---

## Navigation

Header includes links to related apps:
- **PGA Pool** → [pgagolfpool.onrender.com](https://pgagolfpool.onrender.com)
- **Bowl Pool** → [ncaabowlpool.onrender.com](https://ncaabowlpool.onrender.com)

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
│   │   ├── History.js       # Charts, stats, and season history
│   │   ├── DraftPicks.js    # Playoff draft pick tracker
│   │   └── Rules.js         # Scoring rules reference
│   └── utils/
│       ├── scoring.js       # Fantasy point formulas & validation
│       ├── espnApi.js       # ESPN race results fetching & fuzzy matching
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

## Coming Soon

- Playoff scoring system
