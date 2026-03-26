import React, { useState, useEffect } from 'react';
import { calcDriverPoints, calcWeeklyMoney, validateTeam } from '../utils/scoring';
import { fetchRaceResults } from '../utils/espnApi';

const NASCAR_DRIVERS = [
  'A.J. Allmendinger','Aric Almirola','Alex Bowman','Ryan Blaney',
  'Christopher Bell','Chad Briscoe','Josh Berry','William Byron',
  'Ross Chastain','Austin Cindric','Cole Custer','Austin Dillon',
  'Chase Elliott','Ty Gibbs','Noah Gragson','Denny Hamlin',
  'Carson Hocevar','Erik Jones','Brad Keselowski','Kyle Larson',
  'Corey LaJoie','Joey Logano','Michael McDowell','John Hunter Nemechek',
  'Ryan Preece','Tyler Reddick','Ricky Stenhouse Jr.','Daniel Suarez',
  'Martin Truex Jr.','Shane Van Gisbergen','Bubba Wallace','Zane Smith',
  'Todd Gilliland','Kyle Busch','Chris Buescher','Ty Dillon',
  'Justin Haley','Harrison Burton','Alfredo','Connor Zilisch',
  'Landon Cassill'
].filter((v,i,a) => a.indexOf(v)===i).sort((a,b) => {
  const last = n => n.split(' ').slice(-1)[0];
  return last(a).localeCompare(last(b));
});

function tierForIndex(i) { return i < 2 ? '1' : i < 4 ? '2' : '3'; }
function tierLabel(i) { return i < 2 ? 'T1 (1–12)' : i < 4 ? 'T2 (13–25)' : 'T3 (26+)'; }

export default function RaceEntry({ week, onSave, onBack }) {
  const [form, setForm] = useState(() => {
    const fixTiers = (drivers) => drivers.map((d, i) => ({ ...d, tier: tierForIndex(i) }));
    return { ...week, billDrivers: fixTiers(week.billDrivers), donDrivers: fixTiers(week.donDrivers) };
  });
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const [autoStatus, setAutoStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [autoMessage, setAutoMessage] = useState('');

  useEffect(() => {
    onSave({ ...form, result: computeResult(form) });
    // eslint-disable-next-line
  }, [form]);

  function computeResult(f) {
    if (!f.billDrivers.some(d => d.finish) && !f.donDrivers.some(d => d.finish)) return null;
    return calcWeeklyMoney(f.billDrivers, f.donDrivers, parseFloat(f.manualBonus) || 0, week.billStreakLen || 0, week.donStreakLen || 0);
  }

  function updateMeta(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  function updateDriver(team, idx, field, val) {
    setForm(prev => {
      const drivers = [...prev[team]];
      drivers[idx] = { ...drivers[idx], [field]: val, tier: tierForIndex(idx) };
      return { ...prev, [team]: drivers };
    });
    setSaved(false);
  }

  function handleSave(markComplete) {
    if (markComplete) {
      const allErrors = [...validateTeam(form.billDrivers, 'Bill'), ...validateTeam(form.donDrivers, 'Don')];
      setErrors(allErrors);
      if (allErrors.length > 0) return;
    } else {
      setErrors([]);
    }
    onSave({ ...form, result: computeResult(form), completed: markComplete || form.completed });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (markComplete) onBack();
  }

  async function handleAutoUpdate() {
    setAutoStatus('loading');
    setAutoMessage('');
    try {
      // Collect all drafted driver names
      const allNames = [
        ...form.billDrivers.map(d => d.name),
        ...form.donDrivers.map(d => d.name),
      ].filter(Boolean);

      if (allNames.length === 0) {
        setAutoStatus('error');
        setAutoMessage('No drivers entered yet. Add driver names first, then auto-update.');
        return;
      }

      const resultsMap = await fetchRaceResults(form.raceDate, allNames);
      const matched = Object.keys(resultsMap).length;

      if (matched === 0) {
        setAutoStatus('error');
        setAutoMessage('No drivers could be matched to ESPN results. The race may not be finished yet, or driver names may not match.');
        return;
      }

      // Apply results to Bill's drivers
      setForm(prev => {
        const updatedBill = prev.billDrivers.map(d => {
          const r = resultsMap[d.name];
          if (!r) return d;
          return { ...d, finish: String(r.finish ?? ''), stageWins: d.stageWins || String(r.stageWins ?? 0) };
        });
        const updatedDon = prev.donDrivers.map(d => {
          const r = resultsMap[d.name];
          if (!r) return d;
          return { ...d, finish: String(r.finish ?? ''), stageWins: d.stageWins || String(r.stageWins ?? 0) };
        });
        return { ...prev, billDrivers: updatedBill, donDrivers: updatedDon };
      });

      const total = form.billDrivers.length + form.donDrivers.length;
      const unmatchedNames = allNames.filter(n => n && !resultsMap[n]);
      setAutoStatus(unmatchedNames.length > 0 ? 'warning' : 'success');
      setAutoMessage(
        `✓ Updated ${matched} of ${total} drivers from ESPN.${
          unmatchedNames.length > 0
            ? ` Not found: ${unmatchedNames.join(', ')} — check names manually.`
            : ''
        }`
      );
    } catch (err) {
      setAutoStatus('error');
      setAutoMessage(`ESPN fetch failed: ${err.message}`);
    }
  }

  const result = computeResult(form);
  const billStreakBonus = result?.billStreakBonus || 0;
  const donStreakBonus  = result?.donStreakBonus  || 0;

  return (
    <div>
      <div className="action-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-secondary" onClick={() => handleSave(false)}>Save Draft</button>
        <button className="btn btn-green" onClick={() => handleSave(true)}>✓ Complete</button>
        {saved && <span style={{ color: 'var(--green)', fontWeight: 700 }}>Saved!</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {form.completed && <span className="badge badge-green">Completed</span>}
          <button
            className="btn btn-primary"
            onClick={handleAutoUpdate}
            disabled={autoStatus === 'loading'}
            style={{ opacity: autoStatus === 'loading' ? 0.7 : 1 }}
          >
            {autoStatus === 'loading' ? '⏳ Fetching…' : '⚡ Auto Update Results'}
          </button>
        </div>
      </div>

      {/* Auto-update status banner */}
      {autoStatus && autoStatus !== 'loading' && (autoStatus === 'success' || autoStatus === 'warning' || autoStatus === 'error') && (
        <div style={{
          margin: '0 0 12px 0',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          background: autoStatus === 'success' ? 'rgba(74,222,128,0.1)' : autoStatus === 'warning' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${autoStatus === 'success' ? 'rgba(74,222,128,0.3)' : autoStatus === 'warning' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: autoStatus === 'success' ? 'var(--green)' : autoStatus === 'warning' ? 'var(--yellow)' : 'var(--red)',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {autoMessage}
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="card-title">Race Info</span></div>
        <div className="card-body">
          <div className="race-info-grid">
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. Daytona" value={form.track} onChange={e => updateMeta('track', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.raceDate} onChange={e => updateMeta('raceDate', e.target.value)} />
            </div>
            <div>
              <label className="form-label">First Pick</label>
              <select className="form-select" value={form.firstPick || ''} onChange={e => updateMeta('firstPick', e.target.value)}>
                <option value="">— Select —</option>
                <option value="Bill">Bill</option>
                <option value="Don">Don</option>
              </select>
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
          <ul style={{ marginTop: 5, paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {result && (
        <div className={`winner-box ${result.billNet > result.donNet ? 'bill-wins' : result.donNet > result.billNet ? 'don-wins' : 'tie'}`}>
          <div>
            <div className="winner-label">
              {result.billNet > result.donNet ? '🏆 Bill Wins' : result.donNet > result.billNet ? '🏆 Don Wins' : 'Tied'}
            </div>
            <div className="winner-sub">Bill {result.billPts.toFixed(1)} pts · Don {result.donPts.toFixed(1)} pts · Diff {Math.abs(result.pointDiff).toFixed(1)}</div>
            {billStreakBonus > 0 && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--yellow)' }}>🔥 Bill consecutive winner streak bonus +${billStreakBonus}</div>}
            {donStreakBonus  > 0 && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--yellow)' }}>🔥 Don consecutive winner streak bonus +${donStreakBonus}</div>}
          </div>
          <div className="winner-amount">${Math.abs(result.billNet > result.donNet ? result.billNet : result.donNet)}</div>
        </div>
      )}

      <div className="driver-tables-grid">
        <DriverTable label="Bill's Drivers" team="billDrivers" headerClass="bill-header"
          drivers={form.billDrivers} onUpdate={(i,f2,v) => updateDriver('billDrivers',i,f2,v)} />
        <DriverTable label="Don's Drivers" team="donDrivers" headerClass="don-header"
          drivers={form.donDrivers} onUpdate={(i,f2,v) => updateDriver('donDrivers',i,f2,v)} />
      </div>

      {result && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header"><span className="card-title">Money Breakdown</span></div>
          <div className="card-body">
            <div className="money-breakdown-grid">
              <MoneyBreakdown label="Bill" result={result} side="bill" />
              <MoneyBreakdown label="Don"  result={result} side="don" />
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--navy-border)' }}>
              <div className="bonus-grid">
                <div>
                  <label className="form-label">Special Bonus $ (Bill+)</label>
                  <input className="form-input" type="number" placeholder="0"
                    value={form.manualBonus || ''} onChange={e => updateMeta('manualBonus', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Bonus Note</label>
                  <input className="form-input" placeholder="e.g. Daytona double"
                    value={form.manualBonusNote || ''} onChange={e => updateMeta('manualBonusNote', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriverTable({ label, team, headerClass, drivers, onUpdate }) {
  const teamTotal = drivers.reduce((s, d) => s + calcDriverPoints(d.finish, d.tier, d.stageWins).total, 0);
  return (
    <div className="card">
      <div className={`section-header ${headerClass}`}>
        <span className="section-header-title">{label}</span>
        {teamTotal > 0 && <span className="section-pts">{teamTotal.toFixed(1)} pts</span>}
      </div>
      <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 75 }}>Tier</th>
            <th>Driver</th>
            <th style={{ width: 48, textAlign: 'center' }}>Fin</th>
            <th style={{ width: 44, textAlign: 'center' }}>Stg</th>
            <th className="num" style={{ width: 38 }}>T10</th>
            <th className="num" style={{ width: 38 }}>Stg</th>
            <th className="num" style={{ width: 58 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d, i) => {
            const pts = calcDriverPoints(d.finish, tierForIndex(i), d.stageWins);
            const isWinner = parseInt(d.finish, 10) === 1;
            return (
              <tr key={d.id} style={isWinner ? { background: 'rgba(37,99,235,0.08)' } : {}}>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{tierLabel(i)}</td>
                <td>
                  <input
                    className="form-input"
                    list={`drivers-${team}-${i}`}
                    placeholder="— Driver —"
                    value={d.name}
                    onChange={e => onUpdate(i, 'name', e.target.value)}
                    style={{ fontSize: 12, padding: '4px 6px', width: '100%' }}
                  />
                  <datalist id={`drivers-${team}-${i}`}>
                    {NASCAR_DRIVERS.map(n => <option key={n} value={n} />)}
                  </datalist>
                </td>
                <td>
                  <input className="form-input" type="number" min="1" max="43" placeholder="—"
                    value={d.finish} onChange={e => onUpdate(i, 'finish', e.target.value)}
                    style={{ textAlign: 'center', fontSize: 12, padding: '4px 2px' }} />
                </td>
                <td>
                  <input className="form-input" type="number" min="0" max="5" placeholder="0"
                    value={d.stageWins} onChange={e => onUpdate(i, 'stageWins', e.target.value)}
                    style={{ textAlign: 'center', fontSize: 12, padding: '4px 2px' }} />
                </td>
                <td className="num" style={{ fontSize: 12 }}>{pts.top10Pts > 0 ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>{pts.top10Pts}</span> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                <td className="num" style={{ fontSize: 12 }}>{pts.stagePts > 0 ? <span style={{ color: 'var(--blue-light)', fontWeight: 600 }}>{pts.stagePts}</span> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                <td className="num" style={{ position: 'relative' }}>
                  {d.finish ? <strong style={{ fontSize: 13, color: isWinner ? 'var(--green)' : 'var(--text)' }}>{pts.total.toFixed(1)}</strong> : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                  {isWinner && <span style={{ position: 'absolute', marginLeft: 2, fontSize: 10 }}>🏆</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan={6} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, color: 'var(--text-muted)' }}>Team Total</td>
            <td className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue-pale)' }}>{teamTotal > 0 ? teamTotal.toFixed(1) : '—'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MoneyBreakdown({ label, result, side }) {
  const fromPts    = side === 'bill' ? result.billFromPoints : result.donFromPoints;
  const myStreakB  = side === 'bill' ? result.billStreakBonus : result.donStreakBonus;
  const myStreakL  = side === 'bill' ? result.billStreakLen   : result.donStreakLen;
  const oppStreakB = side === 'bill' ? result.donStreakBonus  : result.billStreakBonus;
  const manualB    = side === 'bill' ? (parseFloat(result.manualBonus)||0) : -(parseFloat(result.manualBonus)||0);
  const net        = side === 'bill' ? result.billNet : result.donNet;
  const myPts      = side === 'bill' ? result.billPts : result.donPts;
  const oppPts     = side === 'bill' ? result.donPts  : result.billPts;
  const diff       = parseFloat((myPts - oppPts).toFixed(2));
  const color      = side === 'bill' ? 'var(--blue-light)' : 'var(--red)';
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', color, marginBottom: 10 }}>{label}</div>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          <tr><td colSpan={2} style={{ paddingBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>
            {myPts.toFixed(2)} pts − {oppPts.toFixed(2)} pts = {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
          </td></tr>
          <MRow label="Point diff ÷ 3" val={fromPts} />
          {myStreakB  > 0 && <MRow label={`🔥 Consecutive winner bonus (${myStreakL} weeks)`} val={myStreakB} />}
          {oppStreakB > 0 && <MRow label="Opponent streak bonus" val={-oppStreakB} />}
          {manualB   !== 0 && <MRow label="Special bonus" val={manualB} />}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid var(--navy-border)' }}>
            <td style={{ paddingTop: 8, fontWeight: 800, fontSize: 13, color: 'var(--text-muted)' }}>Net</td>
            <td style={{ paddingTop: 8, textAlign: 'right', fontWeight: 800, fontSize: 22, color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {net >= 0 ? '+$' : '-$'}{Math.abs(net)}
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
      <td style={{ paddingBottom: 5, color: 'var(--text-muted)', paddingRight: 16, fontSize: 12 }}>{label}</td>
      <td style={{ textAlign: 'right', fontWeight: 600, color: val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
        {val >= 0 ? '+' : ''}${Math.abs(parseFloat(val.toFixed(2)))}
      </td>
    </tr>
  );
}
