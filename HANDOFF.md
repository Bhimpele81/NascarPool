# Handoff: NascarPool (Bill vs Don NASCAR fantasy tracker)

Read `CLAUDE.md` first (it loads automatically). `README.md` is the complete feature and rules
reference. This file explains how the app got here, the incidents that shaped it, and what is open.
Last updated: 2026-09-05.

## Why the Claude history for this project looked empty
The NASCAR work was done in Claude Code sessions that were opened from the **Aapryl-Efficacy**
folder (and once from the parent `GitHub` folder), so the transcripts were filed under those
projects, not this one. Nothing was lost; this document captures what mattered. Going forward,
open Claude Code directly on the `NascarPool` folder so its history lands here.

## State of the app
Complete and in use for the 2026 season, including the playoff contest for the final 10 races.
Live at https://nascarpool.onrender.com. No build is failing and no data is missing as of this date.

## How it evolved (what shipped and why)
1. **Core tracker**: weekly draft entry (6 drivers each, odds tiers), scoring, weekly dollars,
   consecutive-winner streak bonuses, special bonus with notes, running season total.
2. **ESPN Auto Update** for finish positions. Went through several failure rounds: a scraping
   approach through the allorigins CORS proxy, then multiple proxy fallbacks with timeouts and a
   race-ID regex fix, and finally a switch to **ESPN's official JSON API directly**, which is what
   runs now. Name matching is multi-level fuzzy (exact, last name, token subset, partial) with a
   confidence threshold raised to 60; races more than 7 days off are rejected; unmatched drivers
   are surfaced in a banner. Repeated real-world failures (Phoenix "4 not found") drove the
   threshold and messaging work.
3. **Stage wins**: an attempt to derive them from ESPN's BONUS column (10 pts per stage) was
   removed. Stage wins are **manual** and are **preserved** when Auto Update runs.
4. **Scope of Auto Update**: Bill hit a case where a fetch filled in wrong drivers and positions.
   Rule now enforced: only **finishing positions**, only for the **race whose button was clicked**.
5. **Spoiler incident**: results were pulled without Bill clicking the button, revealing the
   Coca-Cola 600 outcome before he watched his recording. Fix: Auto Update **requires a passcode**
   before it executes (4-digit, hardcoded client-side, same code the PGA app uses for draft mode).
6. **Data loss incidents** (twice): a saved draft reverted to older picks, and two newly entered
   races vanished. Root cause: a device holding an older localStorage cache wrote it back over
   Supabase. Fixes: **no auto-save on initial load** and **stale-device overwrite protection**.
   These are the two most important invariants in `storage.js`.
7. **History page**: running-total line chart, weekly points bar chart (race numbers on the axis,
   track names in tooltips), season table, and a **Driver Draft Count** table (Bill / Don / Total,
   sortable by clicking headers, includes races still in draft mode).
8. **Race list** sorted by date, most recent first.
9. **Draft eligibility rule** added to Rules and enforced: drivers at **+200 or more favorable**
   odds (for example +150, +100, -200) cannot be drafted.
10. **Playoff draft picks**: one pick per race win on your roster, **max 16 picks awarded**.
    Draft order alternates starting with the player holding more picks, who also gets the extra
    picks at the end.
11. **Playoffs tab** for the final 10 races: each player drafts one playoff driver per pick earned.
    Driver points = 17 minus final chase position (outside top 16 = 0), $2 per point to the
    drafter, $40 champion bonus, $40 most-points bonus (split on tie), head-to-head settlement.
    Bill is listed first to match the race pages. A message like "Bill earned 9 picks but has 8
    drivers drafted" means picks earned exceed playoff drivers entered; it is informational.
12. **Mobile**: plain-text last names (tap to edit), T10 and Stage columns hidden, shorter tier
    labels, 768px breakpoint, card layout on the dashboard. An earlier complaint that drafters
    were not visible on mobile drove this work.
13. **Favicons / manifest** for Safari bookmarks; navbar links to the PGA and Bowl pool apps;
    README rewritten to cover everything.

## Operations
- Render static site, auto-deploys from `main`. UptimeRobot pings `/health.html` every 5 minutes
  so the free instance does not sleep.
- Supabase free tier pauses inactive projects; Bill once had to pause a different project to
  reactivate this one. If saves stop reaching other devices, check Supabase first.
- Export CSV (Dashboard and History) is the manual backup path.

## Open items
- **Auto-fill final chase positions** from the ESPN standings API (listed as Coming Soon in the
  README). Playoff positions are entered by hand today.
- The README title still contains an em dash ("NASCAR Pool — Bill vs Don 2026"); replace it with
  a colon the next time the README is edited (Bill's no-em-dash rule).
- Season wrap-up: once the champion is crowned, confirm the Playoffs settlement matches the rules
  and consider archiving the 2026 season before 2027 setup.

## Related projects (same owner, same patterns)
- **PGAGolfPool**: React golf pool using the ESPN golf leaderboard. Draft mode is gated by the
  same passcode; golfers sort by last name in draft mode; tournament selection was updated to the
  Open Championship pool. Shares the Bill/Don conventions.
- **NCAABowlPool**: bowl pool app linked from the navbar.
