// ============================================================
// NASCAR Fantasy League — Scoring Utility Functions
// ============================================================

export const TOP10_BONUS = {
  1: 130, 2: 90, 3: 80, 4: 70, 5: 60,
  6: 50,  7: 40, 8: 30, 9: 20, 10: 10
};

export const TIER_MULTIPLIER = { 1: 1.00, 2: 1.33, 3: 1.66 };

export const TIER_LABELS = {
  1: 'Tier 1 (1–12)',
  2: 'Tier 2 (13–25)',
  3: 'Tier 3 (26+)'
};

// Consecutive winner bonus table
// Earned when same person drafts the race winner in back-to-back weeks
export const STREAK_BONUS = {
  2: 10, 3: 20, 4: 40, 5: 60, 6: 80,
  7: 100, 8: 125, 9: 150, 10: 200
};
export const STREAK_BONUS_11PLUS = 50;

export function getStreakBonus(streak) {
  if (streak < 2) return 0;
  return STREAK_BONUS[streak] ?? STREAK_BONUS_11PLUS;
}

/**
 * Calculate a single driver's fantasy points
 * Total = Top-10 Bonus + Stage Points + ((50 - finish) × Tier Multiplier)
 */
export function calcDriverPoints(finish, tier, stageWins) {
  const finishNum = parseInt(finish, 10);
  const stageNum  = parseInt(stageWins, 10) || 0;
  const tierNum   = parseInt(tier, 10);

  if (!finishNum || finishNum < 1 || !tierNum) {
    return { top10Pts: 0, stagePts: 0, basePoints: 0, multipliedPoints: 0, total: 0 };
  }

  const top10Pts        = TOP10_BONUS[finishNum] || 0;
  const stagePts        = stageNum * 15;
  const basePoints      = 50 - finishNum;
  const multiplier      = TIER_MULTIPLIER[tierNum] || 1.0;
  const multipliedPoints = parseFloat((basePoints * multiplier).toFixed(2));
  const total           = parseFloat((top10Pts + stagePts + multipliedPoints).toFixed(2));

  return { top10Pts, stagePts, basePoints, multipliedPoints, total };
}

export function calcTeamTotal(drivers) {
  return drivers.reduce((sum, d) => {
    const pts = calcDriverPoints(d.finish, d.tier, d.stageWins);
    return parseFloat((sum + pts.total).toFixed(2));
  }, 0);
}

export function hasRaceWinner(drivers) {
  return drivers.some(d => parseInt(d.finish, 10) === 1);
}

/**
 * Calculate weekly money result
 * Formula: round(point diff / 3) + streak bonus + manual bonus
 * billStreakLen / donStreakLen = consecutive winner streak going INTO this week
 * (already incremented for this week's result by App.js)
 */
export function calcWeeklyMoney(billDrivers, donDrivers, manualBonus = 0, billStreakLen = 0, donStreakLen = 0) {
  const billPts   = calcTeamTotal(billDrivers);
  const donPts    = calcTeamTotal(donDrivers);
  const pointDiff = parseFloat((billPts - donPts).toFixed(2));

  const billFromPoints = pointDiff / 3;
  const donFromPoints  = -pointDiff / 3;

  const billStreakBonus = getStreakBonus(billStreakLen);
  const donStreakBonus  = getStreakBonus(donStreakLen);
  const manualNum       = parseFloat(manualBonus) || 0;

  // Round final net to nearest dollar
  const billNet = Math.round(billFromPoints + billStreakBonus - donStreakBonus + manualNum);
  const donNet  = Math.round(donFromPoints  + donStreakBonus  - billStreakBonus - manualNum);

  return {
    billPts,
    donPts,
    pointDiff,
    billFromPoints: parseFloat(billFromPoints.toFixed(2)),
    donFromPoints:  parseFloat(donFromPoints.toFixed(2)),
    billStreakBonus,
    donStreakBonus,
    billStreakLen,
    donStreakLen,
    manualBonus: manualNum,
    billNet,
    donNet,
  };
}

export function validateTiers(drivers) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  drivers.forEach(d => { if (d.tier) counts[d.tier]++; });
  const errors = [];
  if (counts[1] !== 2) errors.push(`Tier 1: need 2, have ${counts[1]}`);
  if (counts[2] !== 2) errors.push(`Tier 2: need 2, have ${counts[2]}`);
  if (counts[3] !== 2) errors.push(`Tier 3: need 2, have ${counts[3]}`);
  return errors;
}

export function validateTeam(drivers, teamName) {
  const errors = [];
  if (drivers.length !== 6) errors.push(`${teamName}: must have exactly 6 drivers`);
  const names = drivers.map(d => d.name?.trim().toLowerCase()).filter(Boolean);
  if (new Set(names).size < names.length) errors.push(`${teamName}: duplicate driver name`);
  validateTiers(drivers).forEach(e => errors.push(`${teamName}: ${e}`));
  drivers.forEach((d, i) => {
    if (!d.name?.trim()) errors.push(`${teamName} driver ${i + 1}: name required`);
    const fin = parseInt(d.finish, 10);
    if (!fin || fin < 1 || fin > 43) errors.push(`${teamName} driver ${i + 1}: invalid finish (1–43)`);
    if (isNaN(parseInt(d.stageWins, 10)) || parseInt(d.stageWins, 10) < 0) errors.push(`${teamName} driver ${i + 1}: stage wins must be 0+`);
  });
  return errors;
}

export function exportToCSV(weeks) {
  const rows = [['Race','Track','Date','Bill Pts','Don Pts','Point Diff','Bill $','Don $','Running Total']];
  weeks.forEach(w => {
    const r = w.result || {};
    rows.push([w.raceName, w.track, w.raceDate,
      r.billPts||0, r.donPts||0, r.pointDiff||0,
      r.billNet||0, r.donNet||0, w.runningTotal||0]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'nascar-season.csv'; a.click();
  URL.revokeObjectURL(url);
}
