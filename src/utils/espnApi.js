// ESPN public API helper for NASCAR Cup Series results

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar-premier';

/**
 * Normalize a driver name for fuzzy matching:
 * lowercase, strip punctuation, collapse spaces
 */
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score how well two driver names match (0 = no match, higher = better).
 * Tries exact, last-name, and partial token matching.
 */
function matchScore(espnName, draftName) {
  const a = normalizeName(espnName);
  const b = normalizeName(draftName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const aLast = a.split(' ').slice(-1)[0];
  const bLast = b.split(' ').slice(-1)[0];
  if (aLast === bLast && aLast.length > 3) return 80;
  // partial: all tokens of b found in a
  const bTokens = b.split(' ');
  if (bTokens.every(t => a.includes(t))) return 60;
  const aTokens = a.split(' ');
  if (aTokens.every(t => b.includes(t))) return 60;
  // at least last names overlap partially
  if (aLast.includes(bLast) || bLast.includes(aLast)) return 40;
  return 0;
}

/**
 * Given a race date string (YYYY-MM-DD) fetch the ESPN event ID
 * for the NASCAR Cup race on or nearest that date.
 */
async function findEventId(raceDateStr) {
  // Extract year from date
  const year = raceDateStr ? raceDateStr.slice(0, 4) : new Date().getFullYear();
  const url = `${BASE}/scoreboard?limit=100&dates=${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN scoreboard fetch failed: ${res.status}`);
  const data = await res.json();

  const events = data.events || [];
  if (events.length === 0) throw new Error('No NASCAR events found from ESPN.');

  if (!raceDateStr) {
    // Return most recent completed event
    const completed = events.filter(e => e.status?.type?.completed);
    if (completed.length === 0) throw new Error('No completed races found.');
    return completed[completed.length - 1].id;
  }

  // Find event closest to the provided race date
  const target = new Date(raceDateStr).getTime();
  let best = null;
  let bestDiff = Infinity;
  for (const e of events) {
    const d = new Date(e.date).getTime();
    const diff = Math.abs(d - target);
    if (diff < bestDiff) { bestDiff = diff; best = e; }
  }
  if (!best) throw new Error('Could not match race date to an ESPN event.');
  return best.id;
}

/**
 * Fetch the full event summary for a given ESPN event ID.
 * Returns an array of { name, finish, stageWins } for all drivers.
 */
async function fetchEventResults(eventId) {
  const url = `${BASE}/summary?event=${eventId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN summary fetch failed: ${res.status}`);
  const data = await res.json();

  const competitors = data?.raceResults?.competitors || [];
  if (competitors.length === 0) throw new Error('No competitor data found in ESPN response.');

  return competitors.map(c => {
    const finish = parseInt(c.order ?? c.place, 10) || null;
    // ESPN encodes stage wins in the stats array as "stagePointsEarned" (3 pts each)
    const stats = c.stats || [];
    const stageStat = stats.find(s =>
      s.name === 'stagePointsEarned' || s.name === 'stageWins' || s.abbreviation === 'STG'
    );
    const stageVal = stageStat ? parseFloat(stageStat.value) : 0;
    // If value looks like points (multiples of 3 in older API), convert; otherwise treat as count
    const stageWins = stageVal > 0
      ? (stageVal % 1 === 0 && stageVal <= 4 ? stageVal : Math.round(stageVal / 3))
      : 0;
    return {
      name: c.athlete?.displayName || c.name || '',
      finish,
      stageWins,
    };
  });
}

/**
 * Main export: given a race date string and arrays of drafted driver names,
 * returns a map of { driverName -> { finish, stageWins } } for matched drivers only.
 *
 * @param {string} raceDateStr  - YYYY-MM-DD
 * @param {string[]} draftNames - all drafted driver name strings to match
 * @returns {Promise<Object>}   - { [draftName]: { finish, stageWins } }
 */
export async function fetchRaceResults(raceDateStr, draftNames) {
  const eventId = await findEventId(raceDateStr);
  const espnDrivers = await fetchEventResults(eventId);

  const result = {};
  for (const draftName of draftNames) {
    if (!draftName) continue;
    let bestScore = 0;
    let bestDriver = null;
    for (const ed of espnDrivers) {
      const score = matchScore(ed.name, draftName);
      if (score > bestScore) { bestScore = score; bestDriver = ed; }
    }
    if (bestDriver && bestScore >= 40) {
      result[draftName] = {
        finish: bestDriver.finish,
        stageWins: bestDriver.stageWins,
      };
    }
  }
  return result;
}
