import React, { useState, useEffect } from 'react';
import { loadData, saveData, emptyWeek } from './utils/storage';
import { calcWeeklyMoney } from './utils/scoring';
import Dashboard from './pages/Dashboard';
import RaceEntry from './pages/RaceEntry';
import History from './pages/History';
import Rules from './pages/Rules';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(null); // null = loading
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    loadData().then(d => {
      setData({ ...d, weeks: recalcRunningTotals(d.weeks) });
    });
  }, []);

  // Save to Supabase on every change
  useEffect(() => {
    if (!data) return;
    setSyncing(true);
    saveData(data).finally(() => setSyncing(false));
  }, [data]);

  function addWeek() {
    const week = emptyWeek();
    setData(prev => ({ ...prev, weeks: [...prev.weeks, week] }));
    setEditingWeekId(week.id);
    setPage('entry');
  }

  function editWeek(id) { setEditingWeekId(id); setPage('entry'); }

  function deleteWeek(id) {
    setData(prev => {
      const weeks = prev.weeks.filter(w => w.id !== id);
      return { ...prev, weeks: recalcRunningTotals(weeks) };
    });
  }

  function saveWeek(updatedWeek) {
    setData(prev => {
      const weeks = prev.weeks.map(w => w.id === updatedWeek.id ? updatedWeek : w);
      return { ...prev, weeks: recalcRunningTotals(weeks) };
    });
  }

  const currentWeek = data?.weeks.find(w => w.id === editingWeekId);

  // Loading screen
  if (!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16, background:'var(--navy)', color:'var(--text-muted)' }}>
      <div style={{ fontSize: 36 }}>🏁</div>
      <div style={{ fontWeight: 600 }}>Loading NASCAR Pool...</div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="flag-icon">🏁</span>
            <span className="brand-title">NASCAR Pool</span>
            <span className="brand-sub">Bill vs Don · 2026</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {syncing && <span style={{ fontSize:11, color:'var(--text-muted)' }}>Saving...</span>}
            <nav className="header-nav">
              <button className={page==='dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('dashboard')}>Dashboard</button>
              <button className={page==='history'   ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('history')}>History</button>
              <button className={page==='rules'     ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('rules')}>Rules</button>
            </nav>
          </div>
        </div>
      </header>
      <main className="app-main">
        {page==='dashboard' && <Dashboard weeks={data.weeks} onAddWeek={addWeek} onEditWeek={editWeek} onDeleteWeek={deleteWeek} />}
        {page==='entry' && currentWeek && <RaceEntry week={currentWeek} onSave={saveWeek} onBack={() => setPage('dashboard')} />}
        {page==='history' && <History weeks={data.weeks} onEditWeek={editWeek} />}
        {page==='rules' && <Rules />}
      </main>
    </div>
  );
}

function recalcRunningTotals(weeks) {
  let running = 0;
  let billStreak = 0, donStreak = 0;
  return weeks.map(w => {
    const hasFills = w.billDrivers && w.billDrivers.some(d => d.finish);
    if (!hasFills) return { ...w, runningTotal: running };
    const billHasWinner = w.billDrivers.some(d => parseInt(d.finish,10) === 1);
    const donHasWinner  = w.donDrivers.some(d => parseInt(d.finish,10) === 1);
    if (billHasWinner)     { billStreak++; donStreak = 0; }
    else if (donHasWinner) { donStreak++;  billStreak = 0; }
    else                   { billStreak = 0; donStreak = 0; }
    const result = calcWeeklyMoney(w.billDrivers, w.donDrivers, w.manualBonus||0, billStreak, donStreak);
    running = running + (result.billNet || 0);
    return { ...w, result, runningTotal: running };
  });
}
