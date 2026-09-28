// NASCAR race results fetcher
// Uses ESPN's official JSON API, which sends `Access-Control-Allow-Origin: *`,
// so the browser can call it directly — no CORS proxy or HTML scraping needed.
// Stage wins are not exposed by this endpoint — enter those manually.

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar-premier';
const ESPN_STANDINGS = 'https://site.web.api.espn.com/apis/v2/sports/racing/nascar-premier/standings';

// Passcode required before anything is pulled from ESPN (see HANDOFF: spoiler incident).
export const AUTO_UPDATE_PASSCODE = '1716';

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchScore(espnName, draftName) {
  const a = normalizeName(espnName);
  const b = normalizeName(draftName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const aLast = a.split(' ').slice(-1)[0];
  const bLast = b.split(' ').slice(-1)[0];
  if (aLast === bLast && aLast.length > 3) return 80;
  if (b.split(' ').every(t => a.includes(t))) return 60;
  if (a.split(' ').every(t => b.includes(t))) return 60;
  if (aLast.includes(bLast) || bLast.includes(aLast)) return 40;
  return 0;
}

function ymd(dateStr) {
  return (dateStr || '').replace(/-/g, '');
}

async function getJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`ESPN responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Find the ESPN race event closest to the given date.
 * Tries the exact date first, then a ±4-day window, then picks the nearest.
 */
async function findEvent(raceDateStr) {
  const target = ymd(raceDateStr);

  // 1. Exact date
  if (target) {
    const exact = await getJSON(`${ESPN_BASE}/scoreboard?dates=${target}`);
    if (exact.events && exact.events.length > 0) return exact.events[0];
  }

  // 2. ±4-day window, pick the event nearest the target date
  if (target && /^\d{8}$/.test(target)) {
    const t = new Date(`${raceDateStr}T12:00:00`);
    const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const start = new Date(t); start.setDate(start.getDate() - 4);
    const end   = new Date(t); end.setDate(end.getDate() + 4);

    const range = await getJSON(`${ESPN_BASE}/scoreboard?dates=${fmt(start)}-${fmt(end)}`);
    const events = range.events || [];
    if (events.length === 0) {
      throw new Error(`No NASCAR Cup race found near ${raceDateStr}. Check the race date is correct.`);
    }
    let best = null, bestDiff = Infinity;
    for (const e of events) {
      const diff = Math.abs(new Date(e.date) - t);
      if (diff < bestDiff) { bestDiff = diff; best = e; }
    }
    return best;
  }

  // 3. No date given — use the most recent event on the default scoreboard
  const latest = await getJSON(`${ESPN_BASE}/scoreboard`);
  if (latest.events && latest.events.length > 0) return latest.events[latest.events.length - 1];
  throw new Error('Could not find any NASCAR Cup race on ESPN.');
}

/**
 * Fetch finishing positions for all drafted drivers from ESPN.
 * Stage wins are not populated — enter them manually after the race.
 *
 * @param {string}   raceDateStr - YYYY-MM-DD
 * @param {string[]} draftNames  - drafted driver names to match
 * @returns {Promise<Object>}    - { [draftName]: { finish, stageWins } }
 */
export async function fetchRaceResults(raceDateStr, draftNames) {
  let event;
  try {
    event = await findEvent(raceDateStr);
  } catch (err) {
    throw new Error(err.message || 'Could not reach ESPN. Try again in a few minutes.');
  }

  const comp = event.competitions && event.competitions[0];
  const statusName = comp?.status?.type?.name;
  const competitors = comp?.competitors || [];

  if (competitors.length === 0) {
    throw new Error(`ESPN has no results yet for "${event.name}". The race may not have started.`);
  }
  if (statusName && statusName !== 'STATUS_FINAL') {
    throw new Error(`"${event.name}" is not final yet on ESPN (status: ${statusName}). Try again after the race finishes.`);
  }

  // Build a finish list: { name, finish }
  const drivers = competitors
    .map(c => ({
      name: c.athlete?.fullName || c.athlete?.displayName || '',
      finish: parseInt(c.order, 10),
    }))
    .filter(d => d.name && d.finish && d.finish >= 1 && d.finish <= 43);

  console.info(`[fetchRaceResults] event="${event.name}", drivers found: ${drivers.length}`);

  const result = {};
  for (const draftName of draftNames) {
    if (!draftName) continue;
    let bestScore = 0, bestDriver = null;
    for (const d of drivers) {
      const score = matchScore(d.name, draftName);
      if (score > bestScore) { bestScore = score; bestDriver = d; }
    }
    if (bestDriver && bestScore >= 60) {
      result[draftName] = { finish: bestDriver.finish, stageWins: 0, espnName: bestDriver.name };
    }
  }
  return result;
}

/**
 * Current Cup Series championship standings from ESPN.
 * Returns [{ name, rank, points }] sorted by rank. With the 2026 format there
 * are no elimination rounds, so rank is the live championship order and the
 * Playoffs tab can use it as an "if the playoffs ended today" snapshot.
 */
export async function fetchPlayoffStandings(seasonYear) {
  const year = seasonYear || new Date().getFullYear();
  let data;
  try {
    data = await getJSON(`${ESPN_STANDINGS}?season=${year}`);
  } catch (err) {
    throw new Error(err.message || 'Could not reach ESPN. Try again in a few minutes.');
  }
  const groups = data?.children || [];
  const entries = groups.flatMap(g => g?.standings?.entries || []);
  const standings = entries
    .map(e => {
      const stats = e.stats || [];
      const rank = stats.find(s => s.name === 'rank' || s.type === 'rank');
      const pts  = stats.find(s => s.name === 'championshipPts' || s.type === 'points');
      return {
        name: e.athlete?.displayName || e.athlete?.name || '',
        rank: parseInt(rank?.value ?? rank?.displayValue, 10),
        points: parseInt(pts?.value ?? pts?.displayValue, 10) || 0,
      };
    })
    .filter(d => d.name && d.rank >= 1)
    .sort((a, b) => a.rank - b.rank);

  if (standings.length === 0) {
    throw new Error(`ESPN returned no standings for ${year}.`);
  }
  console.info(`[fetchPlayoffStandings] season=${year}, drivers: ${standings.length}`);
  return standings;
}

/**
 * Match drafted playoff names to standings rows using the same fuzzy
 * matcher as race results. Returns { [draftName]: { rank, espnName } }.
 */
export function matchStandings(draftNames, standings) {
  const result = {};
  for (const draftName of draftNames) {
    if (!draftName) continue;
    let bestScore = 0, best = null;
    for (const d of standings) {
      const score = matchScore(d.name, draftName);
      if (score > bestScore) { bestScore = score; best = d; }
    }
    if (best && bestScore >= 60) result[draftName] = { rank: best.rank, espnName: best.name };
  }
  return result;
}
