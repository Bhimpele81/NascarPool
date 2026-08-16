import React from 'react';
import { countDraftPicks, buildDraftOrder } from '../utils/playoffs';

export default function DraftPicks({ weeks }) {
  const { bill: billPicks, don: donPicks, total: totalPicks, history: pickHistory } = countDraftPicks(weeks);
  const draftOrder = buildDraftOrder(billPicks, donPicks);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>Bill's Picks</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--blue-light)', lineHeight: 1 }}>{billPicks}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>draft picks earned</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>Don's Picks</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--red)', lineHeight: 1 }}>{donPicks}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>draft picks earned</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Projected Playoff Draft Order</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{totalPicks} total picks</span>
        </div>
        <div className="card-body">
          {draftOrder.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No picks earned yet</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {draftOrder.map((person, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: person === 'Bill' ? 'rgba(37,99,235,0.15)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${person === 'Bill' ? 'var(--blue)' : 'var(--red)'}`,
                  borderRadius: 8, padding: '10px 16px', minWidth: 70,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Pick {i + 1}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: person === 'Bill' ? 'var(--blue-light)' : 'var(--red)' }}>{person}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Pick History</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weeks where someone had the winning driver</span>
        </div>
        {pickHistory.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>No picks earned yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th style={{ width: 120 }}>Pick Earned By</th>
                <th>Location</th>
                <th>Winning Driver</th>
                <th style={{ width: 100 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {pickHistory.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.race}</td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.winner === 'Bill' ? 'var(--blue-light)' : 'var(--red)' }}>
                      {p.winner}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.track}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.winningDriver || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {p.date ? new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
