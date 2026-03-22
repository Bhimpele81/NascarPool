// ============================================================
// NASCAR Fantasy League — Scoring Utility Functions
// Implements exact formulas from league rules
// ============================================================

export const TOP10_BONUS = {
  1: 130, 2: 90, 3: 80, 4: 70, 5: 60,
  6: 50,  7: 40, 8: 30, 9: 20, 10: 10
};

export const TIER_MULTIPLIER = {
  1: 1.00,
  2: 1.33,
  3: 1.66
};

export const TIER_LABELS = {
  1: 'Tier 1 (1–12)',
  2: 'Tier 2 (13–25)',
  3: 'Tier 3 (26+)'
};

/**
 * Calculate a single driver's fantasy points
 * Driver Total = Top-10 Bonus + Stage Points + (Base Points × Tier Multiplier)
 */
export function calcDriverPoints(finish, tier, stageWins) {
  const finishNum = parseInt(finish, 10);
  const stageNum = parseInt(stageWins, 10) || 0;
  const tierNum = parseInt(tier, 10);

  if (!finishNum || finishNum < 1 || !tierNum) return { top10Pts: 0, stagePts: 0, basePoints: 0, multipliedPoints: 0, total: 0 };

  const top10Pts = TOP10_BONUS[finishNum] || 0;
  const stagePts = stageNum * 15;
  const basePoints = 50 - finishNum;
  const multiplier = TIER_MULTIPLIER[tierNum] || 1.0;
  const multipliedPoints = parseFloat((basePoints * multiplier).toFixed(2));
  const total = parseFloat((top10Pts + stagePts + multipliedPoints).toFixed(2));

  return { top10Pts, stagePts, basePoints, multipliedPoints, total };
}

/**
 * Calculate team total from 6 drivers
 */
export function calcTeamTotal(drivers) {
  return drivers.reduce((sum, d) => {
    const pts = calcDriverPoints(d.finish, d.tier, d.stageWins);
    return parseFloat((sum + pts.total).toFixed(2));
  }, 0);
}

/**
 * Did this team's drivers include the race winner (finish=1)?
 */
export function hasRaceWinner(drivers) {
  return drivers.some(d => parseInt(d.finish, 10) === 1);
}

/**
 * Count total stage wins for a team
 */
export function teamStageWins(drivers) {
  return drivers.reduce((sum, d) => sum + (parseInt(d.stageWins, 10) || 0), 0);
}

/**
 * Calculate full weekly money result for both teams
 * Returns { billDollars, donDollars, billNet, donNet, pointDiff }
 */
export function calcWeeklyMoney(billDrivers, donDrivers, manualBonus = 0) {
  const billPts = calcTeamTotal(billDrivers);
  const donPts = calcTeamTotal(donDrivers);
  const pointDiff = parseFloat((billPts - donPts).toFixed(2));

  // Base point conversion: diff / 3
  const billFromPoints = parseFloat((pointDiff / 3).toFixed(2));
  const donFromPoints = parseFloat((-pointDiff / 3).toFixed(2));

  // Winner on roster bonus
  const billWinnerBonus = hasRaceWinner(billDrivers) ? 10 : 0;
  const donWinnerBonus = hasRaceWinner(donDrivers) ? 10 : 0;

  // Weekly matchup bonus (winner of the week gets +$10)
  const billMatchupBonus = billPts > donPts ? 10 : 0;
  const donMatchupBonus = donPts > billPts ? 10 : 0;

  // Stage win bonus: +$5 per stage win
  const billStageBonus = teamStageWins(billDrivers) * 5;
  const donStageBonus = teamStageWins(donDrivers) * 5;

  // Net for each player (positive = they win money from opponent)
  const billNet = parseFloat((billFromPoints + billWinnerBonus + billMatchupBonus + billStageBonus + (manualBonus || 0)).toFixed(2));
  const donNet = parseFloat((donFromPoints + donWinnerBonus + donMatchupBonus + donStageBonus - (manualBonus || 0)).toFixed(2));

  return {
    billPts,
    donPts,
    pointDiff,
    billFromPoints,
    donFromPoints,
    billWinnerBonus,
    donWinnerBonus,
    billMatchupBonus,
    donMatchupBonus,
    billStageBonus,
    donStageBonus,
    billNet,
    donNet,
    manualBonus
  };
}

/**
 * Validate tier distribution: exactly 2 per tier
 */
export function validateTiers(drivers) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  drivers.forEach(d => { if (d.tier) counts[d.tier]++; });
  const errors = [];
  if (counts[1] !== 2) errors.push(`Tier 1: need 2, have ${counts[1]}`);
  if (counts[2] !== 2) errors.push(`Tier 2: need 2, have ${counts[2]}`);
  if (counts[3] !== 2) errors.push(`Tier 3: need 2, have ${counts[3]}`);
  return errors;
}

/**
 * Validate a full team entry
 */
export function validateTeam(drivers, teamName) {
  const errors = [];
  if (drivers.length !== 6) errors.push(`${teamName}: must have exactly 6 drivers`);

  const names = drivers.map(d => d.name?.trim().toLowerCase()).filter(Boolean);
  const uniqueNames = new Set(names);
  if (uniqueNames.size < names.length) errors.push(`${teamName}: duplicate driver name`);

  const tierErrors = validateTiers(drivers);
  tierErrors.forEach(e => errors.push(`${teamName}: ${e}`));

  drivers.forEach((d, i) => {
    if (!d.name?.trim()) errors.push(`${teamName} driver ${i + 1}: name required`);
    const fin = parseInt(d.finish, 10);
    if (!fin || fin < 1 || fin > 43) errors.push(`${teamName} driver ${i + 1}: invalid finish (1–43)`);
    const sw = parseInt(d.stageWins, 10);
    if (isNaN(sw) || sw < 0) errors.push(`${teamName} driver ${i + 1}: stage wins must be 0 or more`);
  });

  return errors;
}

/**
 * Export season data to CSV
 */
export function exportToCSV(weeks) {
  const rows = [
    ['Race', 'Track', 'Date', 'Bill Pts', 'Don Pts', 'Point Diff', 'Bill $', 'Don $', 'Running Total (Bill owes Don)']
  ];
  weeks.forEach(w => {
    const r = w.result || {};
    rows.push([
      w.raceName, w.track, w.raceDate,
      r.billPts || 0, r.donPts || 0, r.pointDiff || 0,
      r.billNet || 0, r.donNet || 0, w.runningTotal || 0
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nascar-season.csv';
  a.click();
  URL.revokeObjectURL(url);
}
