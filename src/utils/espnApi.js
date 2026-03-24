// NASCAR race results fetcher
// Fetches the ESPN race results page via a CORS proxy and parses the HTML table.
// The ESPN JSON APIs are blocked by CORS from browser apps, but the HTML page
// works fine when routed through allorigins.win.

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

// Known 2026 race IDs from ESPN (raceId in URL: espn.com/racing/raceresults?series=sprint&raceId=...)
// We look up by race date to find the right one, then scrape that page.
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
 * Parse the ESPN race results HTML table into driver objects.
 * Columns: POS | DRIVER | CAR | MANUFACTURER | LAPS | START | LED | PTS | BONUS | PENALTY
 * Stage wins are reverse-engineered from the BONUS points column:
 *   Each stage win = 1 bonus point for winning a stage segment.
 *   ESPN shows total bonus pts which include stage wins (1pt each) + other bonuses.
 *   We extract stage wins conservatively as Math.floor(bonus / 1) capped at 2.
 * NOTE: ESPN does not expose a clean stage win count in the HTML — we use
 *   the bonus column as a proxy and cap at 2 (max stage wins per race).
 */
function parseESPNResultsTable(html) {
  const drivers = [];
  // Find the results table rows via regex on the HTML
  // Each data row looks like: <tr>...<td>1</td><td>Tyler Reddick</td>...
  // We use a DOMParser if available (browser), else regex fallback
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      if (cells.length < 9) return;
      const pos    = parseInt(cells[0], 10);
      const name   = cells[1];
      const bonus  = parseInt(cells[8], 10) || 0;
      if (!pos || !name || pos > 43) return;
      // Stage wins: ESPN bonus includes 1pt per stage win + other bonuses (pole, etc.)
      // Pole = 1 bonus pt, stage win = 1 bonus pt each, race win bonus varies.
      // We cannot perfectly separate them, so we note stageWins as bonus-derived.
      // User can override manually if needed.
      const stageWins = Math.min(bonus, 2); // conservative: cap at 2
      drivers.push({ name, finish: pos, stageWins });
    });
  } catch (e) {
    throw new Error('Failed to parse ESPN results table: ' + e.message);
  }
  if (drivers.length === 0) throw new Error('No driver rows found in ESPN results page.');
  return drivers;
}

/**
 * Fetch the ESPN schedule page and extract raceIds with their dates.
 */
async function getESPNRaceId(raceDateStr) {
  const html = await proxyFetch(ESPN_SCHEDULE_URL);
  // ESPN schedule page embeds race links like:
  // href="/racing/raceresults?raceId=202603220030&series=sprint"
  const raceRegex = /raceId=(\d+)&series=sprint/g;
  const dateRegex = /(\d{4})(\d{2})(\d{2})/; // from raceId prefix YYYYMMDD
  const ids = new Set();
  let match;
  while ((match = raceRegex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  if (ids.size === 0) throw new Error('No race IDs found on ESPN schedule page.');

  if (!raceDateStr) {
    // Return last found ID (most recent)
    return [...ids].pop();
  }

  // Match raceId by embedded date (first 8 chars of raceId = YYYYMMDD)
  const target = raceDateStr.replace(/-/g, ''); // YYYYMMDD
  for (const id of ids) {
    if (id.startsWith(target)) return id;
  }

  // Fallback: find closest by date prefix
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
