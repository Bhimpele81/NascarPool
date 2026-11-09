// ============================================================
// Season archive: freezing a finished season and summarizing it
// ============================================================
// appData.season  = the year the Dashboard is tracking right now
// appData.seasons = { [year]: { year, weeks, playoffs, archivedAt } }
//
// Archiving copies the current weeks (with their computed results and
// running totals) and the playoff board into appData.seasons, then clears
// the live season for the next year. Nothing is deleted.

import { calcPlayoffResult, countDraftPicks } from './playoffs';
import { emptyPlayoffs } from './storage';

export const DEFAULT_SEASON = 2026;

export function archiveSeasonData(appData) {
  const year = appData.season || DEFAULT_SEASON;
  const seasons = { ...(appData.seasons || {}) };
  seasons[year] = {
    year,
    weeks: appData.weeks || [],
    playoffs: appData.playoffs || emptyPlayoffs(),
    archivedAt: new Date().toISOString(),
  };
  return {
    ...appData,
    seasons,
    season: year + 1,
    weeks: [],
    playoffs: emptyPlayoffs(),
  };
}

/** Archived seasons, newest first. */
export function listSeasons(appData) {
  return Object.values(appData?.seasons || {}).sort((a, b) => b.year - a.year);
}

/**
 * Everything the recap card shows for one season.
 * Works for the live season too (pass the current weeks and playoffs).
 */
export function seasonHighlights(weeks = [], playoffs = null) {
  const completed = weeks.filter(w => w.completed && w.result);
  const seasonNet = completed.length ? (completed[completed.length - 1].runningTotal || 0) : 0;

  let billWins = 0, donWins = 0, ties = 0;
  let billPts = 0, donPts = 0;
  let billBest = null, donBest = null;
  let billStreak = 0, donStreak = 0, billLongest = 0, donLongest = 0;
  let billLead = null, donLead = null;

  completed.forEach(w => {
    const r = w.result;
    billPts += r.billPts || 0;
    donPts  += r.donPts  || 0;
    if (r.billNet > r.donNet) {
      billWins++; billStreak++; donStreak = 0;
      if (!billBest || r.billNet > billBest.amount) billBest = { track: w.track || w.raceName, amount: r.billNet };
    } else if (r.donNet > r.billNet) {
      donWins++; donStreak++; billStreak = 0;
      if (!donBest || r.donNet > donBest.amount) donBest = { track: w.track || w.raceName, amount: r.donNet };
    } else {
      ties++; billStreak = 0; donStreak = 0;
    }
    billLongest = Math.max(billLongest, billStreak);
    donLongest  = Math.max(donLongest,  donStreak);
    const rt = w.runningTotal || 0;
    if (rt > 0 && (!billLead || rt > billLead.amount)) billLead = { track: w.track || w.raceName, amount: rt };
    if (rt < 0 && (!donLead  || -rt > donLead.amount)) donLead  = { track: w.track || w.raceName, amount: -rt };
  });

  // Most drafted drivers per player (all weeks, including drafts)
  const counts = {};
  weeks.forEach(w => {
    (w.billDrivers || []).forEach(d => { if (d.name) { counts[d.name] = counts[d.name] || { bill: 0, don: 0 }; counts[d.name].bill++; } });
    (w.donDrivers  || []).forEach(d => { if (d.name) { counts[d.name] = counts[d.name] || { bill: 0, don: 0 }; counts[d.name].don++; } });
  });
  const top = key => Object.entries(counts)
    .filter(([, c]) => c[key] > 0)
    .sort((a, b) => b[1][key] - a[1][key] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, c]) => ({ name, count: c[key] }));

  const picks = countDraftPicks(weeks);
  const playoff = calcPlayoffResult(playoffs?.drivers || []);

  return {
    races: completed.length,
    seasonNet,                              // positive = Bill up on Don (regular season)
    playoffNet: playoff.scored ? playoff.net : 0,
    combinedNet: seasonNet + (playoff.scored ? playoff.net : 0),
    billWins, donWins, ties,
    billPts: Math.round(billPts * 10) / 10,
    donPts:  Math.round(donPts  * 10) / 10,
    billBest, donBest,
    billLongest, donLongest,
    billLead, donLead,
    billPicks: picks.bill, donPicks: picks.don,
    billTopDrivers: top('bill'), donTopDrivers: top('don'),
    playoff,
  };
}
