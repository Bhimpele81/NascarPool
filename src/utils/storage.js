import { supabase } from './supabase';

const LOCAL_KEY = 'nascar_tracker_v4';
const ROW_ID    = 'nascar-pool-2025';

// ── Seed data ──────────────────────────────────────────────
const SEED_WEEKS = [
  {
    id: 'race-01-daytona',
    raceName: 'Daytona 500', firstPick: 'Don', track: 'Daytona',
    raceDate: '2025-02-16', notes: 'Winnings doubled for Daytona',
    billDrivers: [
      { id:'b1', name:'Joey Logano',          tier:'1', finish:'3',  stageWins:'0' },
      { id:'b2', name:'Denny Hamlin',         tier:'1', finish:'31', stageWins:'0' },
      { id:'b3', name:'Tyler Reddick',        tier:'2', finish:'1',  stageWins:'0' },
      { id:'b4', name:'Brad Keselowski',      tier:'2', finish:'5',  stageWins:'0' },
      { id:'b5', name:'Alfredo',              tier:'3', finish:'38', stageWins:'0' },
      { id:'b6', name:'John Hunter Nemechek', tier:'3', finish:'26', stageWins:'0' },
    ],
    donDrivers: [
      { id:'d1', name:'Ryan Blaney',      tier:'1', finish:'27', stageWins:'0' },
      { id:'d2', name:'Christopher Bell', tier:'1', finish:'35', stageWins:'0' },
      { id:'d3', name:'Alex Bowman',      tier:'2', finish:'40', stageWins:'0' },
      { id:'d4', name:'Ty Gibbs',         tier:'2', finish:'23', stageWins:'0' },
      { id:'d5', name:'Cole Custer',      tier:'3', finish:'24', stageWins:'0' },
      { id:'d6', name:'Josh Berry',       tier:'3', finish:'9',  stageWins:'0' },
    ],
    manualBonus:'100.78', manualBonusNote:'Daytona double — winnings doubled',
    completed:true, result:null, runningTotal:0
  },
  {
    id: 'race-02-atlanta',
    raceName: 'Ambetter Health 400', firstPick: 'Bill', track: 'Atlanta',
    raceDate: '2025-02-23', notes: '',
    billDrivers: [
      { id:'b1', name:'Joey Logano',   tier:'1', finish:'18', stageWins:'0' },
      { id:'b2', name:'Kyle Larson',   tier:'1', finish:'32', stageWins:'0' },
      { id:'b3', name:'Kyle Busch',    tier:'2', finish:'34', stageWins:'0' },
      { id:'b4', name:'Bubba Wallace', tier:'2', finish:'8',  stageWins:'1' },
      { id:'b5', name:'Erik Jones',    tier:'3', finish:'24', stageWins:'0' },
      { id:'b6', name:'Austin Dillon', tier:'3', finish:'29', stageWins:'0' },
    ],
    donDrivers: [
      { id:'d1', name:'Ryan Blaney',       tier:'1', finish:'10', stageWins:'0' },
      { id:'d2', name:'Chase Elliott',     tier:'1', finish:'11', stageWins:'0' },
      { id:'d3', name:'Tyler Reddick',     tier:'2', finish:'1',  stageWins:'0' },
      { id:'d4', name:'Alex Bowman',       tier:'2', finish:'23', stageWins:'0' },
      { id:'d5', name:'Zane Smith',        tier:'3', finish:'7',  stageWins:'0' },
      { id:'d6', name:'A.J. Allmendinger', tier:'3', finish:'12', stageWins:'0' },
    ],
    manualBonus:'0', manualBonusNote:'',
    completed:true, result:null, runningTotal:0
  },
  {
    id: 'race-03-cota',
    raceName: 'EchoPark Automotive Grand Prix', firstPick: 'Don', track: 'COTA',
    raceDate: '2025-03-02', notes: '',
    billDrivers: [
      { id:'b1', name:'Connor Zilisch',   tier:'1', finish:'14', stageWins:'0' },
      { id:'b2', name:'Christopher Bell', tier:'1', finish:'3',  stageWins:'0' },
      { id:'b3', name:'Michael McDowell', tier:'2', finish:'5',  stageWins:'0' },
      { id:'b4', name:'Ryan Blaney',      tier:'2', finish:'8',  stageWins:'0' },
      { id:'b5', name:'Zane Smith',       tier:'3', finish:'33', stageWins:'0' },
      { id:'b6', name:'Austin Dillon',    tier:'3', finish:'19', stageWins:'0' },
    ],
    donDrivers: [
      { id:'d1', name:'Shane Van Gisbergen', tier:'1', finish:'2',  stageWins:'0' },
      { id:'d2', name:'Tyler Reddick',       tier:'1', finish:'1',  stageWins:'0' },
      { id:'d3', name:'Kyle Busch',          tier:'2', finish:'12', stageWins:'0' },
      { id:'d4', name:'Ty Gibbs',            tier:'2', finish:'4',  stageWins:'1' },
      { id:'d5', name:'Noah Gragson',        tier:'3', finish:'22', stageWins:'0' },
      { id:'d6', name:'Todd Gilliland',      tier:'3', finish:'23', stageWins:'0' },
    ],
    manualBonus:'0', manualBonusNote:'',
    completed:true, result:null, runningTotal:0
  },
  {
    id: 'race-04-lasvegas',
    raceName: 'Pennzoil 400', firstPick: 'Bill', track: 'Las Vegas',
    raceDate: '2025-03-09', notes: '',
    billDrivers: [
      { id:'b1', name:'Christopher Bell', tier:'1', finish:'2',  stageWins:'1' },
      { id:'b2', name:'Ryan Blaney',      tier:'1', finish:'1',  stageWins:'1' },
      { id:'b3', name:'Carson Hocevar',   tier:'2', finish:'20', stageWins:'0' },
      { id:'b4', name:'Alfredo',          tier:'2', finish:'33', stageWins:'0' },
      { id:'b5', name:'Erik Jones',       tier:'3', finish:'10', stageWins:'0' },
      { id:'b6', name:'Zane Smith',       tier:'3', finish:'27', stageWins:'0' },
    ],
    donDrivers: [
      { id:'d1', name:'Kyle Larson',      tier:'1', finish:'3',  stageWins:'0' },
      { id:'d2', name:'Denny Hamlin',     tier:'1', finish:'5',  stageWins:'0' },
      { id:'d3', name:'Brad Keselowski',  tier:'2', finish:'15', stageWins:'0' },
      { id:'d4', name:'Ryan Preece',      tier:'2', finish:'13', stageWins:'0' },
      { id:'d5', name:'Michael McDowell', tier:'3', finish:'9',  stageWins:'0' },
      { id:'d6', name:'Daniel Suarez',    tier:'3', finish:'30', stageWins:'0' },
    ],
    manualBonus:'0', manualBonusNote:'',
    completed:true, result:null, runningTotal:0
  },
  {
    id: 'race-05-phoenix',
    raceName: 'United Rentals Work United 500', firstPick: 'Don', track: 'Phoenix',
    raceDate: '2025-03-16', notes: '',
    billDrivers: [
      { id:'b1', name:'Christopher Bell',    tier:'1', finish:'4',  stageWins:'1' },
      { id:'b2', name:'Denny Hamlin',        tier:'1', finish:'1',  stageWins:'2' },
      { id:'b3', name:'Carson Hocevar',      tier:'2', finish:'22', stageWins:'0' },
      { id:'b4', name:'Ty Gibbs',            tier:'2', finish:'5',  stageWins:'0' },
      { id:'b5', name:'Ricky Stenhouse Jr.', tier:'3', finish:'29', stageWins:'0' },
      { id:'b6', name:'Austin Dillon',       tier:'3', finish:'12', stageWins:'0' },
    ],
    donDrivers: [
      { id:'d1', name:'Kyle Larson',       tier:'1', finish:'7',  stageWins:'0' },
      { id:'d2', name:'Tyler Reddick',     tier:'1', finish:'13', stageWins:'0' },
      { id:'d3', name:'Brad Keselowski',   tier:'2', finish:'10', stageWins:'0' },
      { id:'d4', name:'Ryan Preece',       tier:'2', finish:'11', stageWins:'0' },
      { id:'d5', name:'A.J. Allmendinger', tier:'3', finish:'24', stageWins:'0' },
      { id:'d6', name:'Noah Gragson',      tier:'3', finish:'30', stageWins:'0' },
    ],
    manualBonus:'0', manualBonusNote:'',
    completed:true, result:null, runningTotal:0
  },
];

// ── Helpers ────────────────────────────────────────────────
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function emptyDriver() {
  return { id: generateId(), name: '', tier: '', finish: '', stageWins: '0' };
}

export function emptyWeek() {
  return {
    id: generateId(),
    raceName: '', track: '', raceDate: '', notes: '', firstPick: '',
    billDrivers: Array.from({ length: 6 }, emptyDriver),
    donDrivers:  Array.from({ length: 6 }, emptyDriver),
    result: null, runningTotal: 0,
    manualBonus: 0, manualBonusNote: '',
    completed: false
  };
}

// ── localStorage helpers ───────────────────────────────────
function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function localSave(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

// ── Supabase load ──────────────────────────────────────────
export async function loadData() {
  try {
    const { data, error } = await supabase
      .from('race_weeks')
      .select('data')
      .eq('id', ROW_ID)
      .single();

    if (error || !data) {
      // Nothing in DB yet — use seed data and save it
      const seed = { weeks: SEED_WEEKS };
      await saveData(seed);
      localSave(seed);
      return seed;
    }

    localSave(data.data); // keep local in sync
    return data.data;
  } catch (err) {
    console.warn('Supabase unavailable, using local cache:', err);
    return localLoad() || { weeks: SEED_WEEKS };
  }
}

// ── Supabase save ──────────────────────────────────────────
export async function saveData(appData) {
  localSave(appData); // always save locally first
  try {
    await supabase
      .from('race_weeks')
      .upsert({ id: ROW_ID, data: appData, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('Supabase save failed, data kept locally:', err);
  }
}
