import React, { useMemo } from 'react';
import { generateId } from '../utils/storage';
import {
  countDraftPicks, calcPlayoffResult, validatePlayoffs, driverPoints,
  PLAYOFF_RACES, PLAYOFF_FIELD, POINTS_BASE,
  DOLLARS_PER_POINT, CHAMPION_BONUS, POINTS_LEADER_BONUS,
} from '../utils/playoffs';

const money = n => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString()}`;

export default function Playoffs({ weeks, playoffs, onSave }) {
  const picks = useMemo(() => countDraftPicks(weeks), [weeks]);

  const drivers  = playoffs?.drivers || [];
  const result   = useMemo(() => calcPlayoffResult(drivers), [drivers]);
  const warnings = useMemo(() => validatePlayoffs(drivers, picks), [drivers, picks]);

  // Every driver either side has drafted this season, for the name dropdown.
  const knownDrivers = useMemo(() => {
    const names = new Set();
    weeks.forEach(w => {
      [...(w.billDrivers || []), ...(w.donDrivers || [])].forEach(d => {
        if (d.name?.trim()) names.add(d.name.trim());
      });
    });
    return [...names].sort((a, b) => {
      const last = n => n.split(' ').slice(-1)[0];
      return last(a).localeCompare(last(b));
    });
  }, [weeks]);

  function update(nextDrivers) {
    onSave({ ...(playoffs || {}), drivers: nextDrivers });
  }

  function generateBoard() {
    const blank = (owner, n) =>
      Array.from({ length: n }, () => ({ id: generateId(), owner, name: '', position: '' }));
    update([...blank('Bill', picks.bill), ...blank('Don', picks.don)]);
  }

  function updateDriver(id, field, val) {
    update(drivers.map(d => (d.id === id ? { ...d, [field]: val } : d)));
  }

  function addPick(owner) {
    update([...drivers, { id: generateId(), owner, name: '', position: '' }]);
  }

  function removePick(id) {
    update(drivers.filter(d => d.id !== id));
  }

  const billWinning = result.net > 0;
  const donWinning  = result.net < 0;

  const rosterProps = { knownDrivers, updateDriver, addPick, removePick };

  return (
    <div>
      {/* ── Picks earned ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <PickCard name="Bill" count={picks.bill} drafted={result.billRows.length} color="var(--blue-light)" />
        <PickCard name="Don"  count={picks.don}  drafted={result.donRows.length}  color="var(--red)" />
      </div>

      {/* ── Payout summary ── */}
      <div className={`winner-box ${billWinning ? 'bill-wins' : donWinning ? 'don-wins' : ''}`}>
        <div>
          <div className="winner-label">
            {!result.scored
              ? 'Playoffs not scored yet'
              : result.net === 0
              ? 'Dead even'
              : `${billWinning ? 'Bill' : 'Don'} takes the playoffs`}
          </div>
          <div className="winner-sub">
            {result.scored
              ? `Bill ${money(result.billGross)} · Don ${money(result.donGross)}`
              : `Enter final chase positions below to score the last ${PLAYOFF_RACES} races`}
          </div>
        </div>
        <div className="winner-amount" style={{ color: result.net === 0 ? 'var(--text-muted)' : 'var(--green)' }}>
          {result.scored ? money(Math.abs(result.net)) : '—'}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="alert alert-warning">
          {warnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* ── Draft board: one roster per person ── */}
      {drivers.length === 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Playoff Draft Board</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{picks.total} picks earned</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {picks.total === 0
                ? 'No picks earned yet. Draft a race winner during the regular season to earn playoff picks.'
                : `Bill gets ${picks.bill} drivers, Don gets ${picks.don}. Build the board to start the draft.`}
            </div>
            {picks.total > 0 && (
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={generateBoard}>
                Generate draft board
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="driver-tables-grid">
          <Roster owner="Bill" rows={result.billRows} earned={picks.bill} {...rosterProps} />
          <Roster owner="Don"  rows={result.donRows}  earned={picks.don}  {...rosterProps} />
        </div>
      )}

      <datalist id="playoff-driver-names">
        {knownDrivers.map(n => <option key={n} value={n} />)}
      </datalist>

      {/* ── Money breakdown ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Playoff Payout</span>
          {result.champion?.name && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Champion: {result.champion.name} ({result.championOwner})
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="money-breakdown-grid">
            <Breakdown
              name="Bill" color="var(--blue-light)"
              pts={result.billPts} fromPoints={result.billFromPoints}
              champBonus={result.billChampBonus} leaderBonus={result.billLeaderBonus}
              gross={result.billGross}
            />
            <Breakdown
              name="Don" color="var(--red)"
              pts={result.donPts} fromPoints={result.donFromPoints}
              champBonus={result.donChampBonus} leaderBonus={result.donLeaderBonus}
              gross={result.donGross}
            />
          </div>
          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--navy-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Head to head, {result.net === 0 ? 'nobody owes anybody' : `${result.net > 0 ? 'Don pays Bill' : 'Bill pays Don'}`}
            </span>
            <span className={result.net >= 0 ? 'money-pos' : 'money-neg'} style={{ fontSize: 20 }}>
              {money(Math.abs(result.net))}
            </span>
          </div>
        </div>
      </div>

      {/* ── Rules ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Playoff Rules</span>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div>· The playoff draft covers the final {PLAYOFF_RACES} races of the season.</div>
          <div>· You draft one playoff driver for every race winner you drafted in the regular season.</div>
          <div>· A driver scores {POINTS_BASE} minus their final chase position, so 12th place earns 5 points. Outside the top {PLAYOFF_FIELD} scores 0.</div>
          <div>· Every point is worth {money(DOLLARS_PER_POINT)} to the drafter who owns it.</div>
          <div>· {money(CHAMPION_BONUS)} to whoever drafted the champion.</div>
          <div>· {money(POINTS_LEADER_BONUS)} to the drafter with the most total points, split on a tie.</div>
        </div>
      </div>
    </div>
  );
}

function Roster({ owner, rows, earned, knownDrivers, updateDriver, addPick, removePick }) {
  const isBill = owner === 'Bill';
  const points = rows.reduce((s, d) => s + d.points, 0);

  return (
    <div className="card">
      <div className={`section-header ${isBill ? 'bill-header' : 'don-header'}`}>
        <span className="section-header-title" style={{ color: isBill ? 'var(--blue-light)' : 'var(--red)' }}>
          {owner.toUpperCase()}
        </span>
        <span className="section-pts">{rows.length} of {earned} picks</span>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th style={{ width: 80 }}>Pos.</th>
              <th style={{ width: 60 }} className="num">Pts</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(d => {
              const isChamp = parseInt(d.position, 10) === 1;
              return (
                <tr key={d.id}>
                  <td>
                    <input
                      className="form-input"
                      list="playoff-driver-names"
                      placeholder="Driver"
                      value={d.name}
                      onChange={e => updateDriver(d.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="40"
                      placeholder="—"
                      value={d.position}
                      onChange={e => updateDriver(d.id, 'position', e.target.value)}
                    />
                  </td>
                  <td className="num" style={{ fontWeight: 700, color: d.points > 0 ? 'var(--text)' : 'var(--text-dim)' }}>
                    {d.points}
                    {isChamp && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>C</span>}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removePick(d.id)} title="Remove pick">×</button>
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td>
                Totals
                <span style={{ marginLeft: 8, color: 'var(--green)' }}>{money(points * DOLLARS_PER_POINT)}</span>
              </td>
              <td></td>
              <td className="num">{points}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => addPick(owner)}>+ Add pick</button>
      </div>
    </div>
  );
}

function PickCard({ name, count, drafted, color }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>
        {name}'s Playoff Drivers
      </div>
      <div style={{ fontSize: 52, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
        picks earned · {drafted} drafted
      </div>
    </div>
  );
}

function Breakdown({ name, color, pts, fromPoints, champBonus, leaderBonus, gross }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 10 }}>{name}</div>
      <Line label={`${pts} points × ${money(DOLLARS_PER_POINT)}`} value={fromPoints} />
      <Line label="Champion bonus" value={champBonus} dim={champBonus === 0} />
      <Line label="Most points bonus" value={leaderBonus} dim={leaderBonus === 0} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8,
        borderTop: '1px solid var(--navy-border)', fontWeight: 700,
      }}>
        <span>Total</span>
        <span style={{ color: 'var(--green)' }}>{money(gross)}</span>
      </div>
    </div>
  );
}

function Line({ label, value, dim }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: dim ? 'var(--text-dim)' : 'var(--text)' }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(value)}</span>
    </div>
  );
}
