import React, { useState, useEffect } from 'react';
import { calcDriverPoints, calcWeeklyMoney, validateTeam } from '../utils/scoring';

const TIER_OPTIONS = [
  { value: '', label: '— Tier —' },
  { value: '1', label: 'T1 (1–12)' },
  { value: '2', label: 'T2 (13–25)' },
  { value: '3', label: 'T3 (26+)' },
];

const NASCAR_DRIVERS = [
  'Kyle Larson','William Byron','Chase Elliott','Denny Hamlin','Martin Truex Jr.',
  'Ryan Blaney','Christopher Bell','Ross Chastain','Tyler Reddick','Alex Bowman',
  'Austin Cindric','Brad Keselowski','Chris Buescher','Kyle Busch','Bubba Wallace',
  'Michael McDowell','Harrison Burton','Noah Gragson','Daniel Suarez','Ricky Stenhouse Jr.',
  'Corey LaJoie','Justin Haley','Todd Gilliland','Zane Smith','Josh Berry',
  'Carson Hocevar','Erik Jones','Cole Custer','Shane van Gisbergen','Ty Gibbs',
  'Austin Dillon','A.J. Allmendinger','Aric Almirola','Landon Cassill'
];

export default function RaceEntry({ week, onSave, onBack }) {
  const [form, setForm] = useState(week);
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const result = computeResult(form);
    onSave({ ...form, result });
    // eslint-disable-next-line
  }, [form]);

  function computeResult(f) {
    if (!f.billDrivers.some(d => d.finish) && !f.donDrivers.some(d => d.finish)) return null;
    return calcWeeklyMoney(f.billDrivers, f.donDrivers, parseFloat(f.manualBonus) || 0);
  }

  function updateMeta(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  function updateDriver(team, idx, field, val) {
    setForm(prev => {
      const drivers = [...prev[team]];
      drivers[idx] = { ...drivers[idx], [field]: val };
      return { ...prev, [team]: drivers };
    });
    setSaved(false);
  }

  function handleSave(markComplete) {
    const allErrors = [
      ...validateTeam(form.billDrivers, 'Bill'),
      ...validateTeam(form.donDrivers, 'Don')
    ];
    setErrors(allErrors);
    if (allErrors.length > 0 && markComplete) return;
    const result = computeResult(form);
    onSave({ ...form, result, completed: markComplete || form.completed });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (markComplete) onBack();
  }

  const result = computeResult(form);

  return (
    <div>
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={onBack}>&#8592; Back</button>
        <button className="btn btn-secondary" onClick={() => handleSave(false)}>Save</button>
        <button className="btn btn-green" onClick={() => handleSave(true)}>&#10003; Complete</button>
        {saved && <span style={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Saved!</span>}
        {form.completed && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Done</span>}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="card-title">Race Info</span></div>
        <div className="card-body">
          <div className="race-info-grid">
            <div>
              <label className="form-label">Race Name</label>
              <input className="form-input" placeholder="e.g. Daytona 500" value={form.raceName} onChange={e => updateMeta('raceName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Track</label>
              <input className="form-input" placeholder="Track name" value={form.track} onChange={e => updateMeta('track', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.raceDate} onChange={e => updateMeta('raceDate', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Optional" value={form.notes} onChange={e => updateMeta('notes', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <strong>Fix before completing:</strong>
          <ul style={{ marginTop: 5, paddingLeft: 18 }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {result && (
        <div className={`winner-box ${result.billNet > result.donNet ? 'bill-wins' : result.donNet > result.billNet ? 'don-wins' : 'tie'}`}>
          <div>
            <div className="winner-label">
              {result.billNet > result.donNet ? 'Bill wins' : result.donNet > result.billNet ? 'Don wins' : 'Tied'}
            </div>
            <div className="winner-sub">
              Bill {result.billPts.toFixed(1)} pts &middot; Don {result.donPts.toFixed(1)} pts &middot; Diff {Math.abs(result.pointDiff).toFixed(1)}
            </div>
          </div>
          <div className="winner-amount">
            ${Math.abs(result.billNet > result.donNet ? result.billNet : result.donNet).toFixed(2)}
          </div>
        </div>
      )}

      <div className="driver-tables-grid">
        <DriverTable team="billDrivers" label="Bill's Drivers" headerClass="bill-header" drivers={form.billDrivers} onUpdate={(idx, f2, v) => updateDriver('billDrivers', idx, f2, v)} />
        <DriverTable team="donDrivers"  label="Don's Drivers"  headerClass="don-header"  drivers={form.donDrivers}  onUpdate={(idx, f2, v) => updateDriver('donDrivers',  idx, f2, v)} />
      </div>

      {result && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header"><span className="card-title">Money Breakdown</span></div>
          <div className="card-body">
            <div className="money-breakdown-grid">
              <MoneyBreakdown label="Bill" result={result} side="bill" />
              <MoneyBreakdown label="Don"  result={result} side="don" />
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <div className="bonus-grid">
                <div>
                  <label className="form-label">Manual Bonus $ (Bill+)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.manualBonus || ''} onChange={e => updateMeta('manualBonus', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Bonus Note</label>
                  <input className="form-input" placeholder="e.g. Streak bonus" value={form.manualBonusNote || ''} onChange={e => updateMeta('manualBonusNote', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriverTable({ team, label, headerClass, drivers, onUpdate }) {
  const teamTotal = drivers.reduce((sum, d) => sum + calcDriverPoints(d.finish, d.tier, d.stageWins).total, 0);
  return (
    <div className="card">
      <div className={`section-header ${headerClass}`}>
        <span className="section-header-title">{label}</span>
        {teamTotal > 0 && <span className="section-pts">{teamTotal.toFixed(1)} pts</span>}
      </div>

      {/* Mobile card rows */}
      <div className="driver-mobile-view">
        {drivers.map((d, i) => <DriverRowMobile key={d.id} d={d} i={i} team={team} onUpdate={onUpdate} />)}
        {teamTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f8f8', borderTop: '2px solid var(--border-light)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Team Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{teamTotal.toFixed(1)}</span>
          </div>
        )}
        <TierBar drivers={drivers} />
      </div>

      {/* Desktop table */}
      <div className="driver-table-view">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tier</th><th>Driver</th><th style={{width:50}}>Fin</th><th style={{width:46}}>Stg</th>
                <th className="num">T10</th><th className="num">Stg</th><th className="num">Base</th><th className="num">Total</th>
              </tr>
            </thead>
            <tbody>{drivers.map((d, i) => <DriverRowDesktop key={d.id} d={d} i={i} team={team} onUpdate={onUpdate} />)}</tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={7} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>Team Total</td>
                <td className="num" style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{teamTotal > 0 ? teamTotal.toFixed(1) : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <TierBar drivers={drivers} />
      </div>
    </div>
  );
}

function DriverRowMobile({ d, i, team, onUpdate }) {
  const pts = calcDriverPoints(d.finish, d.tier, d.stageWins);
  const isWinner = parseInt(d.finish, 10) === 1;
  return (
    <div className="driver-row-mobile" style={isWinner ? { background: '#fefce8' } : {}}>
      <div className="full-width">
        <label className="form-label">Driver {i + 1}</label>
        <input className="form-input" list={`drvs-${team}-m`} placeholder="Driver name" value={d.name} onChange={e => onUpdate(i, 'name', e.target.value)} />
        <datalist id={`drvs-${team}-m`}>{NASCAR_DRIVERS.map(n => <option key={n} value={n} />)}</datalist>
      </div>
      <div>
        <label className="form-label">Tier</label>
        <select className="form-select" value={d.tier} onChange={e => onUpdate(i, 'tier', e.target.value)}>
          {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Finish</label>
        <input className="form-input" type="number" min="1" max="43" placeholder="—" value={d.finish} onChange={e => onUpdate(i, 'finish', e.target.value)} style={{ textAlign: 'center' }} />
      </div>
      <div>
        <label className="form-label">Stage Wins</label>
        <input className="form-input" type="number" min="0" max="5" placeholder="0" value={d.stageWins} onChange={e => onUpdate(i, 'stageWins', e.target.value)} style={{ textAlign: 'center' }} />
      </div>
      {(d.finish && d.tier) && (
        <div className="drv-pts-row">
          {pts.top10Pts > 0 && <span style={{ fontSize: 11, color: 'var(--green)' }}>T10: +{pts.top10Pts}</span>}
          {pts.stagePts > 0 && <span style={{ fontSize: 11, color: '#7c3aed' }}>Stg: +{pts.stagePts}</span>}
          <span className="pts-label">Total</span>
          <span className="pts-val" style={{ color: isWinner ? '#ca8a04' : 'var(--text)' }}>
            {pts.total.toFixed(1)}{isWinner ? ' \uD83C\uDFC6' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function DriverRowDesktop({ d, i, team, onUpdate }) {
  const pts = calcDriverPoints(d.finish, d.tier, d.stageWins);
  const isWinner = parseInt(d.finish, 10) === 1;
  return (
    <tr style={isWinner ? { background: '#fefce8' } : {}}>
      <td style={{ minWidth: 98 }}>
        <select className="form-select" value={d.tier} onChange={e => onUpdate(i, 'tier', e.target.value)} style={{ fontSize: 13, padding: '5px 28px 5px 6px' }}>
          {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td style={{ minWidth: 148 }}>
        <input className="form-input" list={`drvs-${team}-d`} placeholder="Driver name" value={d.name} onChange={e => onUpdate(i, 'name', e.target.value)} style={{ fontSize: 13, padding: '5px 8px' }} />
        <datalist id={`drvs-${team}-d`}>{NASCAR_DRIVERS.map(n => <option key={n} value={n} />)}</datalist>
      </td>
      <td><input className="form-input" type="number" min="1" max="43" placeholder="—" value={d.finish} onChange={e => onUpdate(i, 'finish', e.target.value)} style={{ textAlign: 'center', fontSize: 13, padding: '5px 4px' }} /></td>
      <td><input className="form-input" type="number" min="0" max="5" placeholder="0" value={d.stageWins} onChange={e => onUpdate(i, 'stageWins', e.target.value)} style={{ textAlign: 'center', fontSize: 13, padding: '5px 4px' }} /></td>
      <td className="num">{pts.top10Pts > 0 ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>{pts.top10Pts}</span> : <span style={{ color: '#ddd' }}>0</span>}</td>
      <td className="num">{pts.stagePts > 0 ? <span style={{ color: '#7c3aed', fontWeight: 700 }}>{pts.stagePts}</span> : <span style={{ color: '#ddd' }}>0</span>}</td>
      <td className="num" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.finish && d.tier ? pts.multipliedPoints.toFixed(1) : '—'}</td>
      <td className="num">
        {d.finish && d.tier ? <strong style={{ fontSize: 14 }}>{pts.total.toFixed(1)}</strong> : <span style={{ color: '#ddd' }}>—</span>}
        {isWinner && <span style={{ marginLeft: 3 }}>\uD83C\uDFC6</span>}
      </td>
    </tr>
  );
}

function TierBar({ drivers }) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  drivers.forEach(d => { if (d.tier) counts[parseInt(d.tier)]++; });
  if (!drivers.some(d => d.tier)) return null;
  return (
    <div className="tier-bar">
      {[1, 2, 3].map(t => (
        <span key={t} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className={`badge badge-t${t}`}>T{t}</span>
          <span style={{ color: counts[t] === 2 ? 'var(--green)' : counts[t] > 2 ? 'var(--red)' : 'var(--text-muted)', fontWeight: 600 }}>
            {counts[t]}/2 {counts[t] === 2 ? '\u2713' : ''}
          </span>
        </span>
      ))}
    </div>
  );
}

function MoneyBreakdown({ label, result, side }) {
  const fromPts  = side === 'bill' ? result.billFromPoints   : result.donFromPoints;
  const winnerB  = side === 'bill' ? result.billWinnerBonus  : result.donWinnerBonus;
  const matchupB = side === 'bill' ? result.billMatchupBonus : result.donMatchupBonus;
  const stageB   = side === 'bill' ? result.billStageBonus   : result.donStageBonus;
  const manualB  = side === 'bill' ? (result.manualBonus||0) : -(result.manualBonus||0);
  const net      = side === 'bill' ? result.billNet          : result.donNet;
  const color    = side === 'bill' ? 'var(--bill)'          : 'var(--don)';
  const diff     = (side === 'bill' ? result.pointDiff : -result.pointDiff);
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color, marginBottom: 8 }}>{label}</div>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          <MRow label={`Pts diff (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}) \xF7 3`} val={fromPts} />
          {winnerB  > 0 && <MRow label="Race winner on roster" val={winnerB} />}
          {matchupB > 0 && <MRow label="Won weekly matchup"    val={matchupB} />}
          {stageB   > 0 && <MRow label="Stage wins \xD7 $5"   val={stageB} />}
          {manualB !== 0 && <MRow label="Manual bonus"         val={manualB} />}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border-light)' }}>
            <td style={{ paddingTop: 8, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>Net</td>
            <td style={{ paddingTop: 8, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {net >= 0 ? '+' : ''}{net.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MRow({ label, val }) {
  return (
    <tr>
      <td style={{ paddingBottom: 4, color: 'var(--text-muted)', paddingRight: 16, fontSize: 12 }}>{label}</td>
      <td style={{ textAlign: 'right', fontWeight: 600, color: val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
        {val >= 0 ? '+' : ''}{val.toFixed(2)}
      </td>
    </tr>
  );
}
