// ============================================================
// NASCAR Fantasy League — Playoff Draft Scoring
// ============================================================
// The final 10 races. Each person drafts playoff drivers; the
// number of drivers you get equals how many times you drafted a
// race winner during the regular season (the Draft Picks tab).
//
// Driver points  = 17 - final playoff position  (12th = 5 pts)
// Drafter payout = $2 per point
//                + $40 for owning the champion
//                + $40 for the drafter with the most total points

export const PLAYOFF_RACES        = 10;
export const PLAYOFF_FIELD        = 16;
export const POINTS_BASE          = 17;
export const DOLLARS_PER_POINT    = 2;
export const CHAMPION_BONUS       = 40;
export const POINTS_LEADER_BONUS  = 40;

/**
 * A single driver's playoff points: 17 minus their final position.
 * Anything outside the playoff field (17th or worse) scores 0.
 */
export function driverPoints(position) {
  const pos = parseInt(position, 10);
  if (!pos || pos < 1) return 0;
  return Math.max(0, POINTS_BASE - pos);
}

// ── Regular season picks earned ────────────────────────────
// Shared with the Draft Picks tab so both views always agree.

export function pickHistory(weeks) {
  return weeks
    .filter(w => w.completed && w.result)
    .map((w, i) => {
      const billHasWinner = w.billDrivers.some(d => parseInt(d.finish, 10) === 1);
      const donHasWinner  = w.donDrivers.some(d => parseInt(d.finish, 10) === 1);
      const winner = billHasWinner ? 'Bill' : donHasWinner ? 'Don' : null;
      const winningDriver = billHasWinner
        ? w.billDrivers.find(d => parseInt(d.finish, 10) === 1)?.name
        : donHasWinner
        ? w.donDrivers.find(d => parseInt(d.finish, 10) === 1)?.name
        : null;
      return { race: i + 1, track: w.track || w.raceName, winner, winningDriver, date: w.raceDate };
    })
    .filter(w => w.winner);
}

export function countDraftPicks(weeks) {
  const history = pickHistory(weeks);
  const bill = history.filter(w => w.winner === 'Bill').length;
  const don  = history.filter(w => w.winner === 'Don').length;
  return { bill, don, total: bill + don, history };
}

/**
 * Alternating draft order, most picks earned goes first.
 * Whoever still has picks left keeps taking them once the other runs out.
 */
export function buildDraftOrder(bill, don) {
  const total = bill + don;
  const order = [];
  let b = bill, d = don;
  let first = bill >= don ? 'Bill' : 'Don';
  let second = first === 'Bill' ? 'Don' : 'Bill';
  for (let i = 0; i < total; i++) {
    if (i % 2 === 0) {
      if ((first === 'Bill' && b > 0) || (first === 'Don' && d > 0)) {
        order.push(first);
        first === 'Bill' ? b-- : d--;
      } else {
        order.push(second);
        second === 'Bill' ? b-- : d--;
      }
    } else {
      if ((second === 'Bill' && b > 0) || (second === 'Don' && d > 0)) {
        order.push(second);
        second === 'Bill' ? b-- : d--;
      } else {
        order.push(first);
        first === 'Bill' ? b-- : d--;
      }
    }
  }
  return order;
}

// ── Playoff money ──────────────────────────────────────────

/**
 * Score a drafted playoff roster.
 * `drivers` = [{ id, owner: 'Bill'|'Don', name, position }]
 */
export function calcPlayoffResult(drivers = []) {
  const rows = drivers.map(d => ({ ...d, points: driverPoints(d.position) }));

  const billRows = rows.filter(d => d.owner === 'Bill');
  const donRows  = rows.filter(d => d.owner === 'Don');
  const billPts  = billRows.reduce((s, d) => s + d.points, 0);
  const donPts   = donRows.reduce((s, d) => s + d.points, 0);

  const champion      = rows.find(d => parseInt(d.position, 10) === 1) || null;
  const championOwner = champion?.owner || null;
  const billChampBonus = championOwner === 'Bill' ? CHAMPION_BONUS : 0;
  const donChampBonus  = championOwner === 'Don'  ? CHAMPION_BONUS : 0;

  // Most total points across your drafted drivers. Split on a tie.
  let billLeaderBonus = 0, donLeaderBonus = 0, pointsLeader = null;
  if (billPts > 0 || donPts > 0) {
    if (billPts > donPts)      { billLeaderBonus = POINTS_LEADER_BONUS; pointsLeader = 'Bill'; }
    else if (donPts > billPts) { donLeaderBonus  = POINTS_LEADER_BONUS; pointsLeader = 'Don'; }
    else {
      billLeaderBonus = POINTS_LEADER_BONUS / 2;
      donLeaderBonus  = POINTS_LEADER_BONUS / 2;
      pointsLeader    = 'Tie';
    }
  }

  const billFromPoints = billPts * DOLLARS_PER_POINT;
  const donFromPoints  = donPts  * DOLLARS_PER_POINT;
  const billGross = billFromPoints + billChampBonus + billLeaderBonus;
  const donGross  = donFromPoints  + donChampBonus  + donLeaderBonus;

  return {
    rows,
    billRows, donRows,
    billPts, donPts,
    billFromPoints, donFromPoints,
    billChampBonus, donChampBonus,
    billLeaderBonus, donLeaderBonus,
    champion, championOwner, pointsLeader,
    billGross, donGross,
    net: billGross - donGross,   // positive = Bill up on Don, matching the season running total
    scored: rows.some(d => parseInt(d.position, 10) > 0),
  };
}

/** Non-blocking warnings shown above the draft board. */
export function validatePlayoffs(drivers = [], picks = { bill: 0, don: 0 }) {
  const warnings = [];
  if (drivers.length === 0) return warnings; // board not built yet — nothing to warn about

  const named = drivers.map(d => d.name?.trim().toLowerCase()).filter(Boolean);
  const dupName = named.find((n, i) => named.indexOf(n) !== i);
  if (dupName) warnings.push('The same driver is drafted twice.');

  const positions = drivers.map(d => parseInt(d.position, 10)).filter(p => p > 0);
  const dupPos = positions.find((p, i) => positions.indexOf(p) !== i);
  if (dupPos) warnings.push(`Two drivers are both set to position ${dupPos}.`);

  const billCount = drivers.filter(d => d.owner === 'Bill').length;
  const donCount  = drivers.filter(d => d.owner === 'Don').length;
  if (billCount !== picks.bill) warnings.push(`Bill earned ${picks.bill} picks but has ${billCount} drivers drafted.`);
  if (donCount !== picks.don)   warnings.push(`Don earned ${picks.don} picks but has ${donCount} drivers drafted.`);

  // Only nag about empty slots once the draft is actually under way.
  const unnamed = drivers.length - named.length;
  if (named.length > 0 && unnamed > 0) {
    warnings.push(`${unnamed} pick${unnamed > 1 ? 's have' : ' has'} no driver yet.`);
  }

  return warnings;
}
