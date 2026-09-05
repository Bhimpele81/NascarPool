# NascarPool: project notes for Claude Code

This file loads automatically at the start of every Claude Code session in this repo.
`README.md` is the full feature and rules reference (keep it accurate). `HANDOFF.md` has the
history, the hard-won gotchas, and open items. Read HANDOFF.md before changing data-sync or
ESPN code.

## What this is
A two-person weekly NASCAR fantasy contest tracker: **Bill vs Don**. Each week both draft
6 drivers into odds-based tiers; after the race the app scores fantasy points and weekly
dollars, tracks winner streaks and playoff draft picks, and runs a separate Playoffs contest
for the final 10 races. React 18 front end, Supabase (Postgres) for shared state, deployed as
a static site on Render at **https://nascarpool.onrender.com**. Sister apps linked in the
navbar: PGAGolfPool (pgagolfpool.onrender.com) and NCAABowlPool (ncaabowlpool.onrender.com).

## Where things live
- `src/App.js` routing + streak logic; `src/App.css` dark navy theme (Inter font).
- `src/pages/`: `Dashboard.js` (race list, season total), `RaceEntry.js` (weekly draft and
  scoring entry, ESPN Auto Update), `History.js` (charts, season table, Driver Draft Count),
  `DraftPicks.js` (playoff pick tally and draft order), `Playoffs.js` (playoff rosters and payout),
  `Rules.js` (scoring rules).
- `src/utils/`: `scoring.js` (point formulas, validation), `playoffs.js` (playoff math),
  `espnApi.js` (ESPN fetch + fuzzy name matching), `storage.js` (Supabase + localStorage),
  `supabase.js` (client config). `supabase-schema.sql` defines the single `race_weeks` table
  (one JSONB column holding the whole app state).
- `public/health.html` is the UptimeRobot ping target (5-minute interval keeps Render awake).

## Deploy and run
- GitHub `Bhimpele81/NascarPool`, branch **`main`**. Push and Render auto-builds
  (`react-scripts build`). Local: `npm start`.
- Supabase free tier **pauses projects after inactivity**. If saves stop syncing, check the
  Supabase dashboard and reactivate the project (Bill has had to pause another project to
  reactivate this one).

## Rules that are easy to get wrong (all implemented; see README for full tables)
- Tiers by FanDuel odds rank at draft time: 1 to 12 = T1 (1.00x), 13 to 25 = T2 (1.33x), 26+ = T3 (1.66x).
  Each team must have exactly 2 drivers per tier, no duplicates.
- **Eligibility**: a driver with odds of **+200 or more favorable** (for example +150, +100, -200)
  **cannot be drafted**.
- Points = Top-10 bonus + (stage wins x 15) + ((50 minus finish) x tier multiplier).
  Weekly $ = round((Bill pts minus Don pts) / 3) + streak bonus + optional special bonus.
- Playoff draft picks: 1 per race win on your roster, **capped at 16 total picks awarded**.
- Playoffs (final 10 races): driver points = 17 minus final chase position; $2 per point to the
  drafter; $40 for drafting the champion; $40 for the higher total (split on tie).
- Display order everywhere is **Bill first, then Don**.

## Data safety (the most important gotchas)
- State is offline-first: Supabase is the source of truth, localStorage is a cache/fallback.
  Two real incidents of **saved data reverting or disappearing** were caused by a stale device
  writing its old cache back to Supabase. Fixes in place: no auto-save on initial load, and
  stale-device overwrite protection. **Never reintroduce an auto-save on mount** or a blind
  "local overwrites remote" path.
- **ESPN Auto Update must never run without the user clicking the button and entering the
  passcode.** It once fired automatically and spoiled a race Bill planned to watch later.
  The passcode is a 4-digit code hardcoded client-side in the code (the same one gates draft
  mode in the PGA app). Auto Update fills **finishing positions only**, for **only the race
  whose button was clicked**; stage wins are entered by hand and must be preserved.
- ESPN fetch uses ESPN's official JSON API directly (CORS proxies were unreliable), matches the
  race within a 7-day window, and fuzzy-matches names with a confidence threshold; unmatched
  drivers are listed in a banner rather than guessed.

## Standing rules from Bill (follow without being asked)
- **Never use em dashes** anywhere (UI text, README, comments, commits). Use commas, colons,
  parentheses, or separate sentences. (The current README title still has one; fix it only if
  you are already editing the README.)
- **Do not change layout or formatting** beyond what was asked; mobile layout was tuned
  deliberately (last names only, hidden T10/Stage columns, 768px breakpoint).
- Keep `README.md` in sync when a feature ships.
- **Never use the word "corpus."**
- Commit messages end with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Machines
- Windows: `C:\Users\bhimpele\Desktop\GitHub\NascarPool`. Mac: `/Users/billhimpele/Documents/GitHub/NascarPool`.
- **Open Claude Code directly on this folder.** Earlier NASCAR sessions were started from the
  Aapryl-Efficacy or parent GitHub folder, so their conversation history was filed under those
  projects and never showed up here. That is why "conversations were not saving." Opening this
  folder fixes it going forward.
