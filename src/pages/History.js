import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { exportToCSV } from '../utils/scoring';

export default function History({ weeks, onEditWeek }) {
  const completed = weeks.filter(w => w.completed && w.result);

  const chartData = completed.map((w, i) => ({
    name: w.raceName ? (w.raceName.length > 12 ? w.raceName.slice(0, 11) + '\u2026' : w.raceName) : `R${i+1}`,
    bill: parseFloat(w.result.billPts.toFixed(1)),
    don:  parseFloat(w.result.donPts.toFixed(1)),
    running: w.runningTotal,
  }));

  function fmt(val, pos) {
    const n = parseFloat(val) || 0;
    if (n === 0) return <span style={{ color: 'var(--text-muted)' }}>$0</span>;
    return n > 0
      ? <span className="money-positive">+${n.toFixed(2)}</span>
      : <span className="money-negative">-${Math.abs(n).toFixed(2)}</span>;
  }

  if (completed.length === 0) {
    return (
      <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>No completed races yet</div>
        <div style={{ marginTop: 8, fontSize: 13 }}>Complete a race week to see charts here.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" onClick={() => exportToCSV(completed)}>Export CSV</button>
      </div>

      {/* Charts */}
      {completed.length > 1 && (
        <div className="charts-grid">
          <div className="card">
            <div className="card-header"><span className="card-title">Running Total (Bill net $)</span></div>
            <div className="card-body" style={{ padding: '12px 8px 12px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'Bill net']} />
                  <Line type="monotone" dataKey="running" stroke="#1a3a6b" strokeWidth={2} dot={{ r: 3 }} name="Running Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Weekly Fantasy Points</span></div>
            <div className="card-body" style={{ padding: '12px 8px 12px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="bill" name="Bill" fill="#1a3a6b" />
                  <Bar dataKey="don"  name="Don"  fill="#6b1a1a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Season table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Season Results</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{completed.length} races</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Race</th>
                <th className="num dash-hide">Bill Pts</th>
                <th className="num dash-hide">Don Pts</th>
                <th>Winner</th>
                <th className="num">Bill $</th>
                <th className="num">Don $</th>
                <th className="num dash-hide">Running</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {completed.map((w, i) => {
                const r = w.result;
                return (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{w.raceName}</div>
                      {w.track && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.track}</div>}
                    </td>
                    <td className="num dash-hide" style={{ color: 'var(--bill-accent)', fontWeight: r.billPts > r.donPts ? 700 : 400 }}>{r.billPts.toFixed(1)}</td>
                    <td className="num dash-hide" style={{ color: 'var(--don-accent)',  fontWeight: r.donPts > r.billPts ? 700 : 400 }}>{r.donPts.toFixed(1)}</td>
                    <td>
                      {r.billNet > r.donNet ? <span className="badge badge-bill">Bill</span> :
                       r.donNet  > r.billNet ? <span className="badge badge-don">Don</span>  :
                       <span className="badge badge-yellow">Tie</span>}
                    </td>
                    <td className="num">{fmt(r.billNet)}</td>
                    <td className="num">{fmt(r.donNet)}</td>
                    <td className="num dash-hide" style={{ fontWeight: 700, fontSize: 12 }}>
                      {w.runningTotal >= 0
                        ? <span style={{ color: 'var(--bill-accent)' }}>Bill +${w.runningTotal.toFixed(2)}</span>
                        : <span style={{ color: 'var(--don-accent)' }}>Don +${Math.abs(w.runningTotal).toFixed(2)}</span>}
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => onEditWeek(w.id)}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
