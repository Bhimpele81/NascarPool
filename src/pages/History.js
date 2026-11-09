import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { exportToCSV } from '../utils/scoring';
import { seasonHighlights, listSeasons } from '../utils/seasons';
import { AUTO_UPDATE_PASSCODE } from '../utils/espnApi';

const money = n => `$${Math.abs(n).toLocaleString()}`;

export default function History({ weeks, playoffs, season, seasons, onEditWeek, onArchiveSeason }) {
  const past = listSeasons({ seasons });
  const [selectedYear, setSelectedYear] = useState(past[0]?.year || null);
  const selected = past.find(p => p.year === selectedYear) || past[0] || null;
  const liveCompleted = weeks.filter(w => w.completed && w.result).length;

  function handleArchive() {
    const code = window.prompt(`Enter passcode to archive the ${season} season:`);
    if (code === null) return;
    if (code !== AUTO_UPDATE_PASSCODE) { window.alert('Incorrect passcode. Nothing was changed.'); return; }
    const ok = window.confirm(
      `Archive the ${season} season?\n\nAll ${weeks.length} races and the playoff board move to Past Seasons on this tab, `
      + `and the Dashboard starts ${season + 1} empty. Nothing is deleted.`
    );
    if (ok) onArchiveSeason();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
          {season} Season
        </div>
        {liveCompleted > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleArchive} title={`Move ${season} to Past Seasons and start ${season + 1}`}>
            Archive {season} season, start {season + 1}
          </button>
        )}
      </div>

      <SeasonView weeks={weeks} onEditWeek={onEditWeek} />

      {past.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
              Past Seasons
            </div>
            {past.map(p => (
              <button key={p.year}
                className={p.year === selected?.year ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                onClick={() => setSelectedYear(p.year)}>
                {p.year}
              </button>
            ))}
          </div>
          {selected && (
            <>
              <SeasonRecap season={selected} />
              <SeasonView weeks={selected.weeks} readOnly />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Season recap: the headline numbers for a finished season ──
function SeasonRecap({ season }) {
  const h = seasonHighlights(season.weeks, season.playoffs);
  const p = h.playoff;
  const leader = n => (n > 0 ? 'Bill' : n < 0 ? 'Don' : null);
  const leaderColor = n => (n > 0 ? 'var(--blue-light)' : n < 0 ? 'var(--red)' : 'var(--text-muted)');
  const combinedLeader = leader(h.combinedNet);

  return (
    <div>
      <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 6 }}>
          {season.year} Final
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, color: leaderColor(h.combinedNet) }}>
          {combinedLeader ? <>{combinedLeader} won {season.year} by <span style={{ color: 'var(--green)' }}>{money(h.combinedNet)}</span></> : 'All square'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <span>Regular season: <b style={{ color: leaderColor(h.seasonNet) }}>{leader(h.seasonNet) ? `${leader(h.seasonNet)} +${money(h.seasonNet)}` : 'Even'}</b> over {h.races} races</span>
          <span>Playoffs: <b style={{ color: leaderColor(h.playoffNet) }}>{p.scored ? (leader(h.playoffNet) ? `${leader(h.playoffNet)} +${money(h.playoffNet)}` : 'Even') : 'not scored'}</b>{p.scored ? ` (Bill ${money(p.billGross)} · Don ${money(p.donGross)})` : ''}</span>
          {p.champion?.name && <span>Champion: <b style={{ color: p.championOwner === 'Bill' ? 'var(--blue-light)' : 'var(--red)' }}>{p.champion.name}</b> ({p.championOwner})</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Stat label="Weeks won" bill={h.billWins} don={h.donWins} sub={h.ties > 0 ? `${h.ties} tie${h.ties > 1 ? 's' : ''}` : null} />
        <Stat label="Longest win streak" bill={h.billLongest} don={h.donLongest} suffix=" wks" />
        <Stat label="Fantasy points" bill={h.billPts.toLocaleString()} don={h.donPts.toLocaleString()} mid />
        <Stat label="Race winners drafted" bill={h.billPicks} don={h.donPicks} sub="playoff picks earned" />
        <Stat label="Biggest week" bill={h.billBest ? `+${money(h.billBest.amount)}` : '—'} don={h.donBest ? `+${money(h.donBest.amount)}` : '—'}
          sub={[h.billBest && `Bill: ${h.billBest.track}`, h.donBest && `Don: ${h.donBest.track}`].filter(Boolean).join(' · ')} />
        <Stat label="Biggest lead" bill={h.billLead ? `+${money(h.billLead.amount)}` : '—'} don={h.donLead ? `+${money(h.donLead.amount)}` : '—'}
          sub={[h.billLead && `Bill after ${h.billLead.track}`, h.donLead && `Don after ${h.donLead.track}`].filter(Boolean).join(' · ')} />
        {p.scored && <Stat label="Playoff points" bill={p.billPts} don={p.donPts} sub={`Bill ${money(p.billGross)} · Don ${money(p.donGross)}`} />}
        <Stat label="Most drafted"
          bill={h.billTopDrivers[0] ? `${h.billTopDrivers[0].name} (${h.billTopDrivers[0].count})` : '—'}
          don={h.donTopDrivers[0] ? `${h.donTopDrivers[0].name} (${h.donTopDrivers[0].count})` : '—'} small />
      </div>
    </div>
  );
}

function Stat({ label, bill, don, sub, suffix = '', small, mid }) {
  const size = small ? 14 : mid ? 18 : 24;
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontSize: size, fontWeight: 800, color: 'var(--blue-light)' }}>{bill}{suffix}</span>
        <span style={{ fontSize: size, fontWeight: 800, color: 'var(--red)' }}>{don}{suffix}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── One season's charts, results table, and driver draft count ──
// Used for the live season (rows open the race) and for archived seasons (read only).
function SeasonView({ weeks, onEditWeek, readOnly = false }) {
  const completed = weeks.filter(w => w.completed && w.result);

  const chartData = completed.map((w, i) => ({
    name: w.track || `R${i+1}`,
    raceNum: i + 1,
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

  const [driverSort, setDriverSort] = useState({ col: 'total', dir: 'desc' });

  if (completed.length === 0) {
    return (
      <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>No completed races yet</div>
        <div style={{ marginTop: 8, fontSize: 13 }}>Complete a race week to see charts here.</div>
      </div>
    );
  }

  // Build driver draft counts — include all weeks (completed + drafts)
  const driverCounts = {};
  weeks.forEach(week => {
    week.billDrivers.forEach(d => {
      if (!d.name) return;
      if (!driverCounts[d.name]) driverCounts[d.name] = { bill: 0, don: 0 };
      driverCounts[d.name].bill++;
    });
    week.donDrivers.forEach(d => {
      if (!d.name) return;
      if (!driverCounts[d.name]) driverCounts[d.name] = { bill: 0, don: 0 };
      driverCounts[d.name].don++;
    });
  });
  const driverList = Object.entries(driverCounts)
    .map(([name, c]) => ({ name, bill: c.bill, don: c.don, total: c.bill + c.don }))
    .sort((a, b) => {
      const dir = driverSort.dir === 'desc' ? -1 : 1;
      return (a[driverSort.col] - b[driverSort.col]) * dir || a.name.localeCompare(b.name);
    });

  function handleDriverSort(col) {
    setDriverSort(prev => ({ col, dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc' }));
  }

  function sortArrow(col) {
    if (driverSort.col !== col) return <span style={{ color: 'var(--text-dim)', marginLeft: 3 }}>↕</span>;
    return <span style={{ marginLeft: 3 }}>{driverSort.dir === 'desc' ? '↓' : '↑'}</span>;
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
                  <XAxis dataKey="raceNum" tick={axisStyle} />
                  <YAxis tick={axisStyle} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1a2d42', border: '1px solid #2a4060', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: '#e2eaf4' }}
                    labelFormatter={(num) => {
                      const row = chartData.find(d => d.raceNum === num);
                      return row ? `Race ${num}: ${row.name}` : `Race ${num}`;
                    }}
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
                  <tr key={w.id} onClick={readOnly ? undefined : () => onEditWeek(w.id)} style={{ cursor: readOnly ? 'default' : 'pointer' }}>
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
                      {!readOnly && <button className="btn btn-ghost btn-sm" onClick={() => onEditWeek(w.id)}>View</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Driver Draft Count</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{driverList.length} drivers drafted</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Driver</th>
                <th className="num" style={{ color: '#60a5fa', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleDriverSort('bill')}>Bill{sortArrow('bill')}</th>
                <th className="num" style={{ color: '#ef4444', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleDriverSort('don')}>Don{sortArrow('don')}</th>
                <th className="num" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleDriverSort('total')}>Total{sortArrow('total')}</th>
              </tr>
            </thead>
            <tbody>
              {driverList.map(d => (
                <tr key={d.name}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td className="num" style={{ color: d.bill > 0 ? '#60a5fa' : 'var(--text-dim)' }}>{d.bill > 0 ? d.bill : '—'}</td>
                  <td className="num" style={{ color: d.don > 0 ? '#ef4444' : 'var(--text-dim)' }}>{d.don > 0 ? d.don : '—'}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
