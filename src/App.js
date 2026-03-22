import React, { useState, useEffect } from 'react';
import { loadData, saveData, emptyWeek, generateId } from './utils/storage';
import { calcWeeklyMoney } from './utils/scoring';
import Dashboard from './pages/Dashboard';
import RaceEntry from './pages/RaceEntry';
import History from './pages/History';
import Rules from './pages/Rules';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(() => loadData());
  const [editingWeekId, setEditingWeekId] = useState(null);

  // Persist on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  function addWeek() {
    const week = emptyWeek();
    setData(prev => ({ ...prev, weeks: [...prev.weeks, week] }));
    setEditingWeekId(week.id);
    setPage('entry');
  }

  function editWeek(id) {
    setEditingWeekId(id);
    setPage('entry');
  }

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

  function recalcRunningTotals(weeks) {
    let running = 0;
    return weeks.map(w => {
      if (w.result) {
        running = parseFloat((running + (w.result.billNet || 0)).toFixed(2));
      }
      return { ...w, runningTotal: running };
    });
  }

  const currentWeek = data.weeks.find(w => w.id === editingWeekId);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="flag-icon">🏁</span>
            <span className="brand-title">NASCAR Fantasy Tracker</span>
            <span className="brand-sub">Bill vs Don</span>
          </div>
          <nav className="header-nav">
            <button className={page === 'dashboard' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('dashboard')}>Dashboard</button>
            <button className={page === 'history' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('history')}>History</button>
            <button className={page === 'rules' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('rules')}>Rules</button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {page === 'dashboard' && (
          <Dashboard
            weeks={data.weeks}
            onAddWeek={addWeek}
            onEditWeek={editWeek}
            onDeleteWeek={deleteWeek}
          />
        )}
        {page === 'entry' && currentWeek && (
          <RaceEntry
            week={currentWeek}
            onSave={saveWeek}
            onBack={() => setPage('dashboard')}
          />
        )}
        {page === 'history' && (
          <History weeks={data.weeks} onEditWeek={editWeek} />
        )}
        {page === 'rules' && <Rules />}
      </main>
    </div>
  );
}
