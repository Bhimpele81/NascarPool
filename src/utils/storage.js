// Simple localStorage persistence — no backend needed
const STORAGE_KEY = 'nascar_tracker_v3';

const SEED_WEEKS = [
  {
    id: 'race-01-daytona',
    raceName: 'Daytona 500',
    firstPick: 'Don',
    track: 'Daytona International Speedway',
    raceDate: '2025-02-16',
    notes: 'Winnings doubled for Daytona',
    billDrivers: [
      { id: 'b1', name: 'Logano',     tier: '1', finish: '3',  stageWins: '0' },
      { id: 'b2', name: 'Hamlin',     tier: '1', finish: '31', stageWins: '0' },
      { id: 'b3', name: 'Reddick',    tier: '2', finish: '1',  stageWins: '0' },
      { id: 'b4', name: 'Keselowski', tier: '2', finish: '5',  stageWins: '0' },
      { id: 'b5', name: 'Allgaier',   tier: '3', finish: '38', stageWins: '0' },
      { id: 'b6', name: 'Nemechek',   tier: '3', finish: '26', stageWins: '0' },
    ],
    donDrivers: [
      { id: 'd1', name: 'Blaney',  tier: '1', finish: '27', stageWins: '0' },
      { id: 'd2', name: 'Bell',    tier: '1', finish: '35', stageWins: '0' },
      { id: 'd3', name: 'Bowman',  tier: '2', finish: '40', stageWins: '0' },
      { id: 'd4', name: 'Gibbs',   tier: '2', finish: '23', stageWins: '0' },
      { id: 'd5', name: 'Custer',  tier: '3', finish: '24', stageWins: '0' },
      { id: 'd6', name: 'Berry',   tier: '3', finish: '9',  stageWins: '0' },
    ],
    manualBonus: '100.78',
    manualBonusNote: 'Daytona double — winnings doubled for opening race',
    completed: true, result: null, runningTotal: 0
  },
  {
    id: 'race-02-atlanta',
    raceName: 'Ambetter Health 400',
    firstPick: 'Bill',
    track: 'Atlanta Motor Speedway',
    raceDate: '2025-02-23',
    notes: '',
    billDrivers: [
      { id: 'b1', name: 'Logano',  tier: '1', finish: '18', stageWins: '0' },
      { id: 'b2', name: 'Larson',  tier: '1', finish: '32', stageWins: '0' },
      { id: 'b3', name: 'Busch',   tier: '2', finish: '34', stageWins: '0' },
      { id: 'b4', name: 'Wallace', tier: '2', finish: '8',  stageWins: '1' },
      { id: 'b5', name: 'Jones',   tier: '3', finish: '24', stageWins: '0' },
      { id: 'b6', name: 'Dillon',  tier: '3', finish: '29', stageWins: '0' },
    ],
    donDrivers: [
      { id: 'd1', name: 'Blaney',       tier: '1', finish: '10', stageWins: '0' },
      { id: 'd2', name: 'Elliott',      tier: '1', finish: '11', stageWins: '0' },
      { id: 'd3', name: 'Reddick',      tier: '2', finish: '1',  stageWins: '0' },
      { id: 'd4', name: 'Bowman',       tier: '2', finish: '23', stageWins: '0' },
      { id: 'd5', name: 'Smith',        tier: '3', finish: '7',  stageWins: '0' },
      { id: 'd6', name: 'Allmendinger', tier: '3', finish: '12', stageWins: '0' },
    ],
    manualBonus: '0', manualBonusNote: '',
    completed: true, result: null, runningTotal: 0
  },
  {
    id: 'race-03-cota',
    raceName: 'EchoPark Automotive Grand Prix',
    firstPick: 'Don',
    track: 'Circuit of the Americas',
    raceDate: '2025-03-02',
    notes: '',
    billDrivers: [
      { id: 'b1', name: 'Zilisch',  tier: '1', finish: '14', stageWins: '0' },
      { id: 'b2', name: 'Bell',     tier: '1', finish: '3',  stageWins: '0' },
      { id: 'b3', name: 'McDowell', tier: '2', finish: '5',  stageWins: '0' },
      { id: 'b4', name: 'Blaney',   tier: '2', finish: '8',  stageWins: '0' },
      { id: 'b5', name: 'Smith',    tier: '3', finish: '33', stageWins: '0' },
      { id: 'b6', name: 'Dillon',   tier: '3', finish: '19', stageWins: '0' },
    ],
    donDrivers: [
      { id: 'd1', name: 'Van Gisbergen', tier: '1', finish: '2',  stageWins: '0' },
      { id: 'd2', name: 'Reddick',       tier: '1', finish: '1',  stageWins: '0' },
      { id: 'd3', name: 'Busch',         tier: '2', finish: '12', stageWins: '0' },
      { id: 'd4', name: 'Gibbs',         tier: '2', finish: '4',  stageWins: '1' },
      { id: 'd5', name: 'Gragson',       tier: '3', finish: '22', stageWins: '0' },
      { id: 'd6', name: 'Herbst',        tier: '3', finish: '23', stageWins: '0' },
    ],
    manualBonus: '0', manualBonusNote: '',
    completed: true, result: null, runningTotal: 0
  },
  {
    id: 'race-04-lasvegas',
    raceName: 'Pennzoil 400',
    firstPick: 'Bill',
    track: 'Las Vegas Motor Speedway',
    raceDate: '2025-03-09',
    notes: '',
    billDrivers: [
      { id: 'b1', name: 'Bell',    tier: '1', finish: '2',  stageWins: '1' },
      { id: 'b2', name: 'Blaney',  tier: '1', finish: '1',  stageWins: '1' },
      { id: 'b3', name: 'Hocevar', tier: '2', finish: '20', stageWins: '0' },
      { id: 'b4', name: 'Alfredo', tier: '2', finish: '33', stageWins: '0' },
      { id: 'b5', name: 'Jones',   tier: '3', finish: '10', stageWins: '0' },
      { id: 'b6', name: 'Smith',   tier: '3', finish: '27', stageWins: '0' },
    ],
    donDrivers: [
      { id: 'd1', name: 'Larson',     tier: '1', finish: '3',  stageWins: '0' },
      { id: 'd2', name: 'Hamlin',     tier: '1', finish: '5',  stageWins: '0' },
      { id: 'd3', name: 'Keselowski', tier: '2', finish: '15', stageWins: '0' },
      { id: 'd4', name: 'Preece',     tier: '2', finish: '13', stageWins: '0' },
      { id: 'd5', name: 'McDowell',   tier: '3', finish: '9',  stageWins: '0' },
      { id: 'd6', name: 'Suarez',     tier: '3', finish: '30', stageWins: '0' },
    ],
    manualBonus: '0', manualBonusNote: '',
    completed: true, result: null, runningTotal: 0
  },
  {
    id: 'race-05-phoenix',
    raceName: 'United Rentals Work United 500',
    firstPick: 'Don',
    track: 'Phoenix Raceway',
    raceDate: '2025-03-16',
    notes: '',
    billDrivers: [
      { id: 'b1', name: 'Bell',      tier: '1', finish: '4',  stageWins: '1' },
      { id: 'b2', name: 'Hamlin',    tier: '1', finish: '1',  stageWins: '2' },
      { id: 'b3', name: 'Hocevar',   tier: '2', finish: '22', stageWins: '0' },
      { id: 'b4', name: 'Gibbs',     tier: '2', finish: '5',  stageWins: '0' },
      { id: 'b5', name: 'Stenhouse', tier: '3', finish: '29', stageWins: '0' },
      { id: 'b6', name: 'Dillon',    tier: '3', finish: '12', stageWins: '0' },
    ],
    donDrivers: [
      { id: 'd1', name: 'Larson',       tier: '1', finish: '7',  stageWins: '0' },
      { id: 'd2', name: 'Reddick',      tier: '1', finish: '13', stageWins: '0' },
      { id: 'd3', name: 'Keselowski',   tier: '2', finish: '10', stageWins: '0' },
      { id: 'd4', name: 'Preece',       tier: '2', finish: '11', stageWins: '0' },
      { id: 'd5', name: 'Allmendinger', tier: '3', finish: '24', stageWins: '0' },
      { id: 'd6', name: 'Gragson',      tier: '3', finish: '30', stageWins: '0' },
    ],
    manualBonus: '0', manualBonusNote: '',
    completed: true, result: null, runningTotal: 0
  },
];

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return { weeks: SEED_WEEKS };
  } catch {
    return { weeks: SEED_WEEKS };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function emptyDriver() {
  return { id: generateId(), name: '', tier: '', finish: '', stageWins: '0' };
}

export function emptyWeek() {
  return {
    id: generateId(),
    raceName: '',
    track: '',
    raceDate: '',
    notes: '',
    billDrivers: Array.from({ length: 6 }, emptyDriver),
    donDrivers: Array.from({ length: 6 }, emptyDriver),
    result: null,
    runningTotal: 0,
    manualBonus: 0,
    manualBonusNote: '',
    completed: false
  };
}
