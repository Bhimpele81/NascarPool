// Simple localStorage persistence — no backend needed
const STORAGE_KEY = 'nascar_tracker_v1';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { weeks: [] };
  } catch {
    return { weeks: [] };
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
