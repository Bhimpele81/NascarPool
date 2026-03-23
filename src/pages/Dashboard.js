import React from 'react';
import { exportToCSV } from '../utils/scoring';

export default function Dashboard({ weeks, onAddWeek, onEditWeek, onDeleteWeek }) {
  const completed = weeks.filter(w => w.completed && w.result);
  const runningTotal = weeks.length > 0 ? (weeks[weeks.length - 1].runningTotal || 0) : 0;
  const leaderName = runningTotal > 0 ? 'Bill' : runningTotal < 0 ? 'Don' : null;
  const leaderAmt  = Math.abs(runningTotal);

  // Most recent on top, but keep original index for race number
  const reversedWeeks = [...weeks].map((w, i) => ({ ...w, raceNum: i + 1 })).reverse();

  return (
    <div>
      {/* Season Total Banner */}
      <div style={{
        background: 'var(--navy-mid)', border: '1px solid var(--navy-border)',
        borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow)'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 6 }}>
            2026 Season — Running Total
          </div>
          {leaderName ? (
            <div style={{ fontSize: 42, fontWeight: 800, color: leaderName === 'Bill' ? 'var(--blue-light)' : 'var(--red)', lineHeight: 1 }}>
              {leaderName} leads <span style={{ color: 'var(--green)' }}>${leaderAmt}</span>
            </div>
          ) : (
            <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-muted)' }}>Even</div>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {completed.length} races complete
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={onAddWeek}>+ Add Race</button>
          {completed.length > 0 && (
            <button className="btn btn-ghost" onClick={() => exportToCSV(completed)}>Export CSV</button>
          )}
        </div>
      </div>

      {/* Race Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Race Results</span>
        </div>
        {weeks.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏁</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No races yet</div>
            <div>Click "Add Race" to get started</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 40 }}>Pick</th>
                <th>Location</th>
                <th style={{ width: 80 }}>Date</th>
                <th style={{ width: 60 }}>Status</th>
                <th className="num" style={{ width: 120 }}>Result</th>
                <th className="num" style={{ width: 140 }}>Running Total</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {reversedWeeks.map((w) => {
                const r = w.result;
                const billWon = r && r.billNet > 0;
                const donWon  = r && r.donNet  > 0;
                const amt     = r ? Math.abs(r.billNet > r.donNet ? r.billNet : r.donNet) : null;
                const rt      = w.runningTotal || 0;
                return (
                  <tr key={w.id} onClick={() => onEditWeek(w.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>{w.raceNum}</td>
                    <td>
                      {w.firstPick
                        ? <span style={{ fontWeight: 800, fontSize: 15, color: w.firstPick === 'Bill' ? 'var(--blue-light)' : 'var(--red)' }}>{w.firstPick === 'Bill' ? 'B' : 'D'}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--blue-pale)' }}>
                        {w.track || <span style={{ color: 'var(--text-muted)' }}>Unnamed</span>}
                      </span>
                      {w.notes && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{w.notes}</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {w.raceDate ? new Date(w.raceDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      {w.completed
                        ? <span className="badge badge-green">Done</span>
                        : <span className="badge badge-yellow">In Progress</span>}
                    </td>
                    <td className="num">
                      {amt != null ? (
                        <span style={{ fontSize: 15, fontWeight: 800, color: billWon ? 'var(--blue-light)' : donWon ? 'var(--red)' : 'var(--text-muted)' }}>
                          {billWon ? 'Bill' : donWon ? 'Don' : 'Even'} {amt > 0 ? `+$${amt}` : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="num">
                      {r ? (
                        <span style={{ fontSize: 14, fontWeight: 800, color: rt > 0 ? 'var(--blue-light)' : rt < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                          {rt > 0 ? `Bill +$${rt}` : rt < 0 ? `Don +$${Math.abs(rt)}` : 'Even'}
                        </span>
                      ) : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-danger btn-sm" onClick={() => {
                        if (window.confirm(`Delete ${w.track || 'this race'}?`)) onDeleteWeek(w.id);
                      }}>Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
