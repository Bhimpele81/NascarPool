// Driver names offered by the autocomplete on the race entry page.
// The static list below is the starting point. Any driver that ESPN Auto
// Update successfully matches is saved to appData.knownDrivers (under ESPN's
// spelling) and merged in, so the list maintains itself as new drivers race.

export const NASCAR_DRIVERS = [
  'A.J. Allmendinger','Aric Almirola','Alex Bowman','Ryan Blaney',
  'Christopher Bell','Chad Briscoe','Josh Berry','William Byron',
  'Ross Chastain','Austin Cindric','Cole Custer','Austin Dillon',
  'Chase Elliott','Ty Gibbs','Noah Gragson','Denny Hamlin',
  'Carson Hocevar','Erik Jones','Brad Keselowski','Kyle Larson',
  'Corey LaJoie','Joey Logano','Michael McDowell','John Hunter Nemechek',
  'Ryan Preece','Tyler Reddick','Ricky Stenhouse Jr.','Daniel Suarez',
  'Martin Truex Jr.','Shane Van Gisbergen','Bubba Wallace','Zane Smith',
  'Todd Gilliland','Kyle Busch','Chris Buescher','Ty Dillon',
  'Justin Haley','Harrison Burton','Alfredo','Connor Zilisch',
  'Landon Cassill','Corey Heim','Austin Hill'
];

function lastNameOf(n) { return n.split(' ').slice(-1)[0]; }

// Static list plus learned names, deduplicated, sorted by last name.
export function buildDriverList(knownDrivers = []) {
  const all = [...NASCAR_DRIVERS, ...knownDrivers].filter(Boolean);
  return all
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => lastNameOf(a).localeCompare(lastNameOf(b)));
}

// Names from an Auto Update run that are not already offered anywhere.
export function newDriverNames(espnNames, knownDrivers = []) {
  const have = new Set(buildDriverList(knownDrivers));
  return espnNames.filter((n, i, a) => n && !have.has(n) && a.indexOf(n) === i);
}
