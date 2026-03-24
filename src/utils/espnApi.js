// NASCAR race results fetcher
// Fetches the ESPN race results page via a CORS proxy and parses finish positions.
// Stage wins are not available from ESPN HTML — enter those manually.

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const ESPN_SCHEDULE_URL = 'https://www.espn.com/racing/schedule/_/series/sprint';

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

async function proxyFetch(targetUrl) {
  const proxied = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.contents) throw new Error('Proxy returned empty contents.');
  return json.contents;
}

/**
 * Parse ESPN race results HTML — extract POS and DRIVER only.
 * Columns: POS | DRIVER | CAR | MANUFACTURER | LAPS | START | LED | PTS | BONUS | PENALTY
 */
function parseESPNResultsTable(html) {
  const drivers = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      if (cells.length < 2) return;
      const pos  = parseInt(cells[0], 10);
      const name = cells[1];
      if (!pos || !name || pos > 43) return;
      drivers.push({ name, finish: pos, stageWins: 0 });
    });
  } catch (e) {
    throw new Error('Failed to parse ESPN results table: ' + e.message);
  }
  if (drivers.length === 0) throw new Error('No driver rows found in ESPN results page.');
  return drivers;
}

async function getESPNRaceId(raceDateStr) {
  const html = await proxyFetch(ESPN_SCHEDULE_URL);
  const raceRegex = /raceId=(\d+)&series=sprint/g;
  const ids = new Set();
  let match;
  while ((match = raceRegex.exec(html)) !== null) ids.add(match[1]);
  if (ids.size === 0) throw new Error('No race IDs found on ESPN schedule page.');

  if (!raceDateStr) return [...ids].pop();

  const target = raceDateStr.replace(/-/g, '');
  for (const id of ids) {
    if (id.startsWith(target)) return id;
  }

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
 * Fetch finishing positions for all drafted drivers from ESPN.
 * Stage wins are not populated — enter them manually after the race.
 *
 * @param {string}   raceDateStr - YYYY-MM-DD
 * @param {string[]} draftNames  - drafted driver names to match
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
      result[draftName] = { finish: bestDriver.finish, stageWins: 0 };
    }
  }
  return result;
}
