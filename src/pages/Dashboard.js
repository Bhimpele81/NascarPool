import React from 'react';
import { exportToCSV } from '../utils/scoring';

export default function Dashboard({ weeks, onAddWeek, onEditWeek, onDeleteWeek }) {
  const completedWeeks = weeks.filter(w => w.completed);
  const runningTotal = completedWeeks.length > 0 ? (weeks.filter(w => w.completed).reduce((_, w) => w.runningTotal, 0)) : 0;
  const lastCompleted = completedWeeks[completedWeeks.length - 1];
  const rt = lastCompleted ? lastCompleted.runningTotal : 0;
  const billWins = completedWeeks.filter(w => (w.result?.billNet||0) > (w.result?.donNet||0)).length;
  const donWins  = completedWeeks.filter(w => (w.result?.donNet||0)  > (w.result?.billNet||0)).length;

  function fmt(val) {
    const n = parseFloat(val) || 0;
    if (n === 0) return <span className="money-neutral">$0.00</span>;
    return n > 0
      ? <span className="money-positive">+${n.toFixed(2)}</span>
      : <span className="money-negative">-${Math.abs(n).toFixed(2)}</span>;
  }

  function weekWinner(week) {
    if (!week.result) return null;
    if (week.result.billNet > week.result.donNet) return 'bill';
    if (week.result.donNet > week.result.billNet) return 'don';
    return 'tie';
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Running Total</div>
          <div className="stat-value" style={{ fontSize: rt !== 0 ? 22 : 26 }}>
            {rt === 0
              ? <span style={{ color: 'var(--text-muted)' }}>Even</span>
              : rt > 0
                ? <span style={{ color: 'var(--bill-accent)' }}>Bill +${rt.toFixed(2)}</span>
                : <span style={{ color: 'var(--don-accent)' }}>Don +${Math.abs(rt).toFixed(2)}</span>}
          </div>
          <div className="stat-sub">{completedWeeks.length} races done</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Races</div>
          <div className="stat-value">{weeks.length}</div>
          <div className="stat-sub">{weeks.length - completedWeeks.length} pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bill Wins</div>
          <div className="stat-value" style={{ color: 'var(--bill-accent)' }}>{billWins}</div>
          <div className="stat-sub">of {completedWeeks.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Don Wins</div>
          <div className="stat-value" style={{ color: 'var(--don-accent)' }}>{donWins}</div>
          <div className="stat-sub">of {completedWeeks.length}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onAddWeek}>+ Add Race Week</button>
        {completedWeeks.length > 0 && (
          <button className="btn btn-ghost" onClick={() => exportToCSV(completedWeeks)}>Export CSV</button>
        )}
      </div>

      {/* Race List */}
      <div className="card">
        <div className="card-header"><span className="card-title">Race Weeks</span></div>
        {weeks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏁</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>No races yet</div>
            <div style={{ marginTop: 8, marginBottom: 20, fontSize: 13 }}>Tap "Add Race Week" to get started</div>
            <button className="btn btn-primary" onClick={onAddWeek}>+ Add Race Week</button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Race</th>
                  <th className="dash-hide">Track</th>
                  <th className="dash-hide">Date</th>
                  <th className="num dash-hide">Bill Pts</th>
                  <th className="num dash-hide">Don Pts</th>
                  <th>Winner</th>
                  <th className="num">Bill $</th>
                  <th className="num">Don $</th>
                  <th className="num dash-hide">Running</th>
                  <th className="dash-hide">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w, i) => {
                  const winner = weekWinner(w);
                  return (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td><strong style={{ fontSize: 13 }}>{w.raceName || <span style={{ color: '#aaa' }}>Unnamed</span>}</strong></td>
                      <td className="dash-hide" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{w.track || '—'}</td>
                      <td className="dash-hide" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{w.raceDate || '—'}</td>
                      <td className="num dash-hide">{w.result ? w.result.billPts.toFixed(1) : '—'}</td>
                      <td className="num dash-hide">{w.result ? w.result.donPts.toFixed(1) : '—'}</td>
                      <td>
                        {winner === 'bill' && <span className="badge badge-bill">Bill</span>}
                        {winner === 'don'  && <span className="badge badge-don">Don</span>}
                        {winner === 'tie'  && <span className="badge badge-yellow">Tie</span>}
                        {!winner && '—'}
                      </td>
                      <td className="num">{w.result ? fmt(w.result.billNet) : '—'}</td>
                      <td className="num">{w.result ? fmt(w.result.donNet)  : '—'}</td>
                      <td className="num dash-hide" style={{ fontWeight: 700, fontSize: 12 }}>
                        {w.result
                          ? (w.runningTotal >= 0
                            ? <span style={{ color: 'var(--bill-accent)' }}>Bill +${w.runningTotal.toFixed(2)}</span>
                            : <span style={{ color: 'var(--don-accent)' }}>Don +${Math.abs(w.runningTotal).toFixed(2)}</span>)
                          : '—'}
                      </td>
                      <td className="dash-hide">
                        {w.completed ? <span className="badge badge-green">Done</span> : <span className="badge badge-yellow">Draft</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => onEditWeek(w.id)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => {
                            if (window.confirm(`Delete "${w.raceName || 'this race'}"?`)) onDeleteWeek(w.id);
                          }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
