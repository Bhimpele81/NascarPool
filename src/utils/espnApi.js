// NASCAR race results fetcher
// Primary:  ESPN hidden API (no key required)
// Fallback: NASCAR official feed API (no key required)

const ESPN_SITE    = 'https://site.api.espn.com/apis/site/v2/sports/racing';
const ESPN_SUMMARY = 'https://site.web.api.espn.com/apis/site/v2/sports/racing';
// NASCAR slugs to try in order
const ESPN_SLUGS = ['nascar-premier', 'nascar-cup-series', 'nascar'];

// Official NASCAR feed API — no key needed, public
const NASCAR_FEED = 'https://feed.nascar.com/feeds/series/1/races';

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
 */
function matchScore(espnName, draftName) {
  const a = normalizeName(espnName);
  const b = normalizeName(draftName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const aLast = a.split(' ').slice(-1)[0];
  const bLast = b.split(' ').slice(-1)[0];
  if (aLast === bLast && aLast.length > 3) return 80;
  const bTokens = b.split(' ');
  if (bTokens.every(t => a.includes(t))) return 60;
  const aTokens = a.split(' ');
  if (aTokens.every(t => b.includes(t))) return 60;
  if (aLast.includes(bLast) || bLast.includes(aLast)) return 40;
  return 0;
}

// ─── ESPN PATH ──────────────────────────────────────────────────────────────

async function espnFindEventId(raceDateStr) {
  const year = raceDateStr ? raceDateStr.slice(0, 4) : new Date().getFullYear();
  // Try each slug until one works
  for (const slug of ESPN_SLUGS) {
    try {
      const url = `${ESPN_SITE}/${slug}/scoreboard?limit=100&dates=${year}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const events = data.events || [];
      if (events.length === 0) continue;

      if (!raceDateStr) {
        const completed = events.filter(e => e.status?.type?.completed);
        if (completed.length > 0) return { slug, id: completed[completed.length - 1].id };
        continue;
      }
      const target = new Date(raceDateStr).getTime();
      let best = null, bestDiff = Infinity;
      for (const e of events) {
        const diff = Math.abs(new Date(e.date).getTime() - target);
        if (diff < bestDiff) { bestDiff = diff; best = e; }
      }
      if (best) return { slug, id: best.id };
    } catch (_) { /* try next slug */ }
  }
  throw new Error('Could not find NASCAR event on ESPN scoreboard.');
}

async function espnFetchResults(slug, eventId) {
  // Use site.web.api.espn.com for summary — site.api returns 502 for racing
  const url = `${ESPN_SUMMARY}/${slug}/summary?event=${eventId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`);
  const data = await res.json();

  // ESPN race results live under raceResults.competitors or boxscore.players
  const competitors =
    data?.raceResults?.competitors ||
    data?.boxscore?.players?.[0]?.statistics?.[0]?.athletes ||
    [];
  if (competitors.length === 0) throw new Error('ESPN returned no competitor data.');

  return competitors.map(c => {
    const finish = parseInt(c.order ?? c.place ?? c.statistics?.find(s => s.name === 'finish')?.value, 10) || null;
    const stats  = c.stats || c.statistics || [];
    const stageStat = stats.find(s =>
      s.name === 'stageWins' || s.name === 'stagePointsEarned' || s.abbreviation === 'STG'
    );
    const stageVal  = stageStat ? parseFloat(stageStat.value) : 0;
    const stageWins = stageVal > 0
      ? (stageVal <= 4 ? stageVal : Math.round(stageVal / 3))
      : 0;
    return {
      name: c.athlete?.displayName || c.name || '',
      finish,
      stageWins,
    };
  });
}

// ─── NASCAR FEED FALLBACK ────────────────────────────────────────────────────

async function nascarFeedFetch(raceDateStr) {
  // GET /feeds/series/1/races?season=YYYY  — series 1 = Cup Series
  const year = raceDateStr ? raceDateStr.slice(0, 4) : new Date().getFullYear();
  const schedUrl = `${NASCAR_FEED}?season=${year}`;
  const schedRes = await fetch(schedUrl);
  if (!schedRes.ok) throw new Error(`NASCAR feed schedule ${schedRes.status}`);
  const races = await schedRes.json();

  // Find the race closest to raceDateStr
  const target = raceDateStr ? new Date(raceDateStr).getTime() : Date.now();
  let bestRace = null, bestDiff = Infinity;
  for (const r of (races || [])) {
    const d = new Date(r.race_date || r.date_scheduled).getTime();
    const diff = Math.abs(d - target);
    if (diff < bestDiff) { bestDiff = diff; bestRace = r; }
  }
  if (!bestRace) throw new Error('NASCAR feed: no matching race found.');

  // Fetch results for that race
  const raceId  = bestRace.race_id || bestRace.id;
  const resultsUrl = `${NASCAR_FEED}/${raceId}/results/race-result.json`;
  const resRes  = await fetch(resultsUrl);
  if (!resRes.ok) throw new Error(`NASCAR feed results ${resRes.status}`);
  const resultsData = await resRes.json();

  const entries = resultsData?.results?.finishing_position_in_race
    ? [resultsData.results]
    : (resultsData?.results || resultsData || []);

  return entries.map(e => ({
    name:       e.driver_fullname || e.driver_name || '',
    finish:     parseInt(e.finishing_position, 10) || null,
    stageWins:  parseInt(e.stage_wins, 10) || 0,
  }));
}

// ─── PUBLIC EXPORT ───────────────────────────────────────────────────────────

/**
 * Fetch race results for the given date, trying ESPN first then NASCAR feed.
 * Returns { [draftName]: { finish, stageWins } } for all matched drivers.
 */
export async function fetchRaceResults(raceDateStr, draftNames) {
  let drivers = [];
  let source  = 'ESPN';

  try {
    const { slug, id } = await espnFindEventId(raceDateStr);
    drivers = await espnFetchResults(slug, id);
  } catch (espnErr) {
    console.warn('ESPN failed, trying NASCAR feed:', espnErr.message);
    source = 'NASCAR feed';
    drivers = await nascarFeedFetch(raceDateStr); // throws if also fails
  }

  console.info(`[fetchRaceResults] Source: ${source}, drivers found: ${drivers.length}`);

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
