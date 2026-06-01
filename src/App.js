import React, { useState, useEffect, useRef } from 'react';
import { loadData, saveData, emptyWeek } from './utils/storage';
import { calcWeeklyMoney } from './utils/scoring';
import Dashboard from './pages/Dashboard';
import RaceEntry from './pages/RaceEntry';
import History from './pages/History';
import Rules from './pages/Rules';
import DraftPicks from './pages/DraftPicks';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(null);
  const [editingWeekId, setEditingWeekId] = useState(null);
  // 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  const [saveStatus, setSaveStatus] = useState('idle');
  const isInitialLoad = useRef(true);
  const saveTimer = useRef(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  function reloadFromCloud() {
    return loadData().then(d => {
      setData({ ...d, weeks: recalcRunningTotals(d.weeks) });
      setSaveStatus('idle');
    });
  }

  useEffect(() => {
    reloadFromCloud();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!data) return;
    // Skip saving on the initial load — only save on user-driven changes
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    // Debounce: avoid a network write on every keystroke.
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(data).then(res => {
        if (res.ok) setSaveStatus('saved');
        else if (res.conflict) setSaveStatus('conflict');
        else setSaveStatus('error');
      });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data]);

  // When returning to this tab/device, pull the latest from the cloud — but
  // never while editing, so we don't wipe in-progress entry on this device.
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === 'hidden') return;
      if (pageRef.current === 'entry') return;
      reloadFromCloud();
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

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
         <div className="header-brand" onClick={() => setPage('dashboard')} style={{ cursor: 'pointer' }}>
  <img src="/logo.webp" alt="NASCAR" style={{ height: 36, objectFit: 'contain' }} />
  <span className="brand-title">NASCAR Pool</span>
  <span className="brand-sub">Bill vs Don · 2026</span>
</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {saveStatus === 'saving' && <span style={{ fontSize:11, color:'var(--text-muted)' }}>Saving...</span>}
            {saveStatus === 'saved'  && <span style={{ fontSize:11, color:'var(--green)' }}>Saved ✓</span>}
            {saveStatus === 'error'  && <span style={{ fontSize:11, color:'var(--red)', fontWeight:700 }}>Save failed — check connection</span>}
            <nav className="header-nav">
              <button className={page==='dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('dashboard')}>Dashboard</button>
              <button className={page==='history'   ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('history')}>History</button>
              <button className={page==='picks'     ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('picks')}>Draft Picks</button>
              <button className={page==='rules'     ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('rules')}>Rules</button>
              <a href="https://ncaabowlpool.onrender.com/" target="_blank" rel="noopener noreferrer" className="nav-btn" style={{textDecoration:'none'}}>Bowl Pool</a>
              <a href="https://pgagolfpool.onrender.com/" target="_blank" rel="noopener noreferrer" className="nav-btn" style={{textDecoration:'none'}}>PGA Pool</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="app-main">
        {saveStatus === 'conflict' && (
          <div style={{
            margin: '0 0 14px 0', padding: '12px 16px', borderRadius: 8,
            background: 'rgba(220,53,69,0.12)', border: '1px solid var(--red)',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--red)' }}>⚠ This was updated on another device.</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Your changes here were not saved, to avoid overwriting the newer version. Reload the latest, then re-apply your edits.
            </span>
            <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={reloadFromCloud}>
              Reload latest
            </button>
          </div>
        )}
        {page==='dashboard' && <Dashboard weeks={data.weeks} onAddWeek={addWeek} onEditWeek={editWeek} onDeleteWeek={deleteWeek} />}
        {page==='entry' && currentWeek && <RaceEntry week={currentWeek} onSave={saveWeek} onBack={() => setPage('dashboard')} saveStatus={saveStatus} />}
        {page==='history' && <History weeks={data.weeks} onEditWeek={editWeek} />}
        {page==='rules' && <Rules />}
        {page==='picks' && <DraftPicks weeks={data.weeks} />}
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
    // Store streak info on the week so RaceEntry can display it
    return { ...w, result, runningTotal: running, billStreakLen: billStreak, donStreakLen: donStreak };
  });
}
