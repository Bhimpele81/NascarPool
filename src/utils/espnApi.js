// NASCAR race results fetcher
// Fetches the ESPN race results page via a CORS proxy and parses the HTML table.
// The ESPN JSON APIs are blocked by CORS from browser apps, but the HTML page
// works fine when routed through allorigins.win.

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const ESPN_SCHEDULE_URL = 'https://www.espn.com/racing/schedule/_/series/sprint';

/**
 * Normalize a driver name for fuzzy matching.
 */
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

/**
 * Fetch a URL via the allorigins CORS proxy and return the HTML string.
 */
async function proxyFetch(targetUrl) {
  const proxied = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.contents) throw new Error('Proxy returned empty contents.');
  return json.contents;
}

/**
 * Derive stage wins from the ESPN BONUS column.
 *
 * NASCAR bonus point breakdown (from ESPN results table):
 *   - Each stage win:       +10 pts
 *   - Most laps led:        +5 pts  (only one driver per race)
 *   - Each laps-led bonus:  +1 pt per "block" of laps led (up to ~5 pts)
 *   - Race winner playoff:  +5 pts  (pos === 1 only)
 *
 * Strategy: strip the known non-stage bonuses, then divide by 10.
 *   1. If pos === 1, subtract 5 (race winner playoff bonus)
 *   2. Remaining non-stage bonuses (laps led) are always < 10
 *      so floor(adjusted / 10) gives stage wins cleanly.
 *   3. Cap at 2 (max stages per race).
 */
function deriveStageWins(bonus, pos) {
  let adj = bonus;
  if (pos === 1) adj = Math.max(0, adj - 5); // strip race winner playoff pts
  return Math.min(2, Math.floor(adj / 10));
}

/**
 * Parse the ESPN race results HTML table into driver objects.
 * Columns (0-indexed): POS | DRIVER | CAR | MANUFACTURER | LAPS | START | LED | PTS | BONUS | PENALTY
 */
function parseESPNResultsTable(html) {
  const drivers = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      if (cells.length < 9) return;
      const pos   = parseInt(cells[0], 10);
      const name  = cells[1];
      const bonus = parseInt(cells[8], 10) || 0;
      if (!pos || !name || pos > 43) return;
      const stageWins = deriveStageWins(bonus, pos);
      drivers.push({ name, finish: pos, stageWins });
    });
  } catch (e) {
    throw new Error('Failed to parse ESPN results table: ' + e.message);
  }
  if (drivers.length === 0) throw new Error('No driver rows found in ESPN results page.');
  return drivers;
}

/**
 * Fetch the ESPN schedule page and extract raceIds.
 */
async function getESPNRaceId(raceDateStr) {
  const html = await proxyFetch(ESPN_SCHEDULE_URL);
  const raceRegex = /raceId=(\d+)&series=sprint/g;
  const ids = new Set();
  let match;
  while ((match = raceRegex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  if (ids.size === 0) throw new Error('No race IDs found on ESPN schedule page.');

  if (!raceDateStr) return [...ids].pop();

  const target = raceDateStr.replace(/-/g, '');
  for (const id of ids) {
    if (id.startsWith(target)) return id;
  }

  // Fallback: closest by date prefix
  const targetNum = parseInt(target, 10);
  let bestId = null, bestDiff = Infinity;
  for (const id of ids) {
    const dateStr = id.slice(0, 8);
    if (!/^\d{8}$/.test(dateStr)) continue;
    const diff = Math.abs(parseInt(dateStr, 10) - targetNum);
    if (diff < bestDiff) { bestDiff = diff; bestId = id; }
  }
  if (!bestId) throw new Error('Could not match race date to an ESPN race ID.');
  return bestId;
}

/**
 * Main export: fetch finishing positions and stage wins for all drafted drivers.
 * @param {string}   raceDateStr - YYYY-MM-DD format
 * @param {string[]} draftNames  - driver names to look up
 * @returns {Promise<Object>}    - { [draftName]: { finish, stageWins } }
 */
export async function fetchRaceResults(raceDateStr, draftNames) {
  const raceId  = await getESPNRaceId(raceDateStr);
  const pageUrl = `https://www.espn.com/racing/raceresults?series=sprint&raceId=${raceId}`;
  const html    = await proxyFetch(pageUrl);
  const drivers = parseESPNResultsTable(html);

  console.info(`[fetchRaceResults] raceId=${raceId}, drivers found: ${drivers.length}`);

  const result = {};
  for (const draftName of draftNames) {
    if (!draftName) continue;
    let bestScore = 0, bestDriver = null;
    for (const d of drivers) {
      const score = matchScore(d.name, draftName);
      if (score > bestScore) { bestScore = score; bestDriver = d; }
    }
    if (bestDriver && bestScore >= 40) {
      result[draftName] = { finish: bestDriver.finish, stageWins: bestDriver.stageWins };
    }
  }
  return result;
}
