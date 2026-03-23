import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { exportToCSV } from '../utils/scoring';

export default function History({ weeks, onEditWeek }) {
  const completed = weeks.filter(w => w.completed && w.result);

  const chartData = completed.map((w, i) => ({
    name: w.track || `R${i+1}`,
    bill: parseFloat(w.result.billPts.toFixed(1)),
    don:  parseFloat(w.result.donPts.toFixed(1)),
    running: w.runningTotal,
  }));

  function fmt(val) {
    const n = parseFloat(val) || 0;
    if (n === 0) return <span style={{ color: 'var(--text-muted)' }}>$0</span>;
    return n > 0
      ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>+${n}</span>
      : <span style={{ color: 'var(--red)', fontWeight: 600 }}>-${Math.abs(n)}</span>;
  }

  if (completed.length === 0) {
    return (
      <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>No completed races yet</div>
        <div style={{ marginTop: 8, fontSize: 13 }}>Complete a race week to see charts here.</div>
      </div>
    );
  }

  const axisStyle = { fill: '#6b8aaa', fontSize: 11 };
  const gridStyle = { stroke: '#2a4060', strokeDasharray: '3 3' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-ghost" onClick={() => exportToCSV(completed)}>Export CSV</button>
      </div>

      {completed.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Running Total (Bill net $)</span></div>
            <div className="card-body" style={{ padding: '12px 8px 12px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="name" tick={axisStyle} />
                  <YAxis tickFormatter={v => `$${v}`} tick={axisStyle} width={48} />
                  <Tooltip
                    contentStyle={{ background: '#1a2d42', border: '1px solid #2a4060', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#e2eaf4' }}
                    formatter={v => [`$${parseFloat(v).toFixed(0)}`, 'Bill net']}
                  />
                  <Line type="monotone" dataKey="running" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#60a5fa' }} name="Running Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Weekly Fantasy Points</span></div>
            <div className="card-body" style={{ padding: '12px 8px 12px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="name" tick={axisStyle} />
                  <YAxis tick={axisStyle} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1a2d42', border: '1px solid #2a4060', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#e2eaf4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#6b8aaa' }} />
                  <Bar dataKey="bill" name="Bill" fill="#2563eb" radius={[3,3,0,0]} />
                  <Bar dataKey="don"  name="Don"  fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
                <th>Location</th>
                <th className="num">Bill Pts</th>
                <th className="num">Don Pts</th>
                <th>Winner</th>
                <th className="num">Bill $</th>
                <th className="num">Don $</th>
                <th className="num">Running</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {completed.map((w, i) => {
                const r = w.result;
                return (
                  <tr key={w.id} onClick={() => onEditWeek(w.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{w.track || w.raceName}</td>
                    <td className="num" style={{ color: r.billPts > r.donPts ? 'var(--blue-light)' : 'var(--text-muted)' }}>{r.billPts.toFixed(1)}</td>
                    <td className="num" style={{ color: r.donPts > r.billPts ? 'var(--red)' : 'var(--text-muted)' }}>{r.donPts.toFixed(1)}</td>
                    <td>
                      {r.billNet > r.donNet ? <span className="badge badge-blue">Bill</span> :
                       r.donNet  > r.billNet ? <span className="badge badge-red">Don</span>  :
                       <span className="badge badge-yellow">Tie</span>}
                    </td>
                    <td className="num">{fmt(r.billNet)}</td>
                    <td className="num">{fmt(r.donNet)}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {w.runningTotal >= 0
                        ? <span style={{ color: 'var(--blue-light)' }}>Bill +${w.runningTotal}</span>
                        : <span style={{ color: 'var(--red)' }}>Don +${Math.abs(w.runningTotal)}</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEditWeek(w.id)}>View</button>
                    </td>
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
