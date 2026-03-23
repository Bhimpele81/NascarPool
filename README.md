# NASCAR Fantasy Tracker — Bill vs Don

A clean, spreadsheet-style web app to track your weekly NASCAR fantasy contest.

## Features
- Enter race weeks with Bill's and Don's 6 drivers each
- Tier assignment (T1/T2/T3) with automatic multipliers
- Real-time fantasy point calculations (exact formula from your rules)
- Weekly money calculation: point diff ÷ 3, winner bonus, matchup bonus, stage bonuses
- Running season total
- Manual/streak bonus per race
- Race history with charts (running total, weekly points comparison)
- Tier validation (must have exactly 2 per tier)
- CSV export
- All data saved to browser localStorage — no backend required
- Fully responsive (desktop-first, mobile-friendly)

## Scoring Logic (Implemented Exactly)

```
Driver Total = Top-10 Bonus + (Stage Wins × 15) + ((50 − Finish) × Tier Multiplier)

Tier multipliers: T1=1.00, T2=1.33, T3=1.66

Weekly Net = (Bill pts − Don pts) / 3
           + $10 if race winner on roster
           + $10 if won weekly matchup
           + $5 × stage wins by your drivers
           + manual bonus (optional)
```

---

## Local Development

### Prerequisites
- Node.js 18+ (https://nodejs.org)
- npm (comes with Node)

### Steps

```bash
# 1. Clone or unzip this project
cd nascar-tracker

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The app will open at **http://localhost:3000**

---

## Deploy to GitHub + Render

### Step 1: Push to GitHub

```bash
# Initialize git repo (if not already done)
git init
git add .
git commit -m "Initial NASCAR tracker app"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nascar-tracker.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render (Free Plan)

1. Go to **https://render.com** and sign in
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub account and select `nascar-tracker`
4. Configure:
   - **Name**: `nascar-tracker` (or whatever you like)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
5. Click **"Create Static Site"**
6. Render will build and deploy — takes ~2–3 minutes

Your app will be live at: `https://nascar-tracker.onrender.com` (or similar)

### Step 3: Keep It Active with UptimeRobot

Render's free static sites don't sleep (only web services sleep), so UptimeRobot is mainly for peace of mind and uptime monitoring.

1. Go to **https://uptimerobot.com** and create a free account
2. Click **"Add New Monitor"**
3. Choose **HTTP(s)** monitor
4. Enter your Render URL
5. Set interval to **5 minutes**
6. Save — you'll get email alerts if the site ever goes down

> **Note**: Since this is a static site (not a Render web service), it won't sleep. UptimeRobot is still useful to alert you if anything goes wrong.

---

## Data Storage

All race data is stored in your **browser's localStorage** under the key `nascar_tracker_v1`.

- ✅ No backend needed
- ✅ No login required
- ✅ Instant saves
- ⚠️  Data is per-browser — use the same browser/device each week, or export CSV to keep a backup

### Backup your data
Use the **Export CSV** button on the Dashboard or History pages to download a CSV of all completed races.

---

## Future: Live Race Results via NASCAR API

When you're ready to pull live finishing positions automatically, here's the approach:

1. **NASCAR Stats API** (unofficial): `https://statsapi.web.nhl.com` — NASCAR doesn't have an official public API, but several third-party options exist:
   - **Racing Reference** (raceref.com) has data files
   - **SportRadar** has a NASCAR feed (paid)
   - **TheRundown API** / **API-Sports** have NASCAR results

2. Add a `fetchResults(raceId)` function in `src/utils/api.js` that calls the API and maps driver names to finishing positions.

3. Wire it into the Race Entry page with a "Fetch Live Results" button.

---

## File Structure

```
nascar-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js              # Main app + routing
│   ├── App.css             # Global styles
│   ├── index.js            # React entry point
│   ├── utils/
│   │   ├── scoring.js      # All fantasy point formulas
│   │   └── storage.js      # localStorage helpers
│   └── pages/
│       ├── Dashboard.js    # Home / season summary
│       ├── RaceEntry.js    # Weekly scoring sheet (main page)
│       ├── History.js      # Season history + charts
│       └── Rules.js        # Scoring rules reference
└── package.json
```

---

## Scoring Formula Verification

### Example 1 — Tier 1, 2nd place, 1 stage win
- Top-10 Bonus: 90
- Stage: 15
- Base: (50−2) × 1.00 = 48.00
- **Total: 153.00** ✓

### Example 2 — Tier 2, 5th place, 0 stage wins
- Top-10 Bonus: 60
- Stage: 0
- Base: (50−5) × 1.33 = 59.85
- **Total: 119.85** ✓

### Example 3 — Tier 3, 10th place, 0 stage wins
- Top-10 Bonus: 10
- Stage: 0
- Base: (50−10) × 1.66 = 66.40
- **Total: 76.40** ✓
