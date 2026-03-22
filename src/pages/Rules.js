import React from 'react';

export default function Rules() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div className="card">
          <div className="card-header"><span className="card-title">Draft Structure</span></div>
          <div className="card-body">
            <p style={{ marginBottom: 12 }}>Each week, Bill and Don each draft <strong>6 drivers</strong> with this tier distribution:</p>
            <table className="data-table">
              <thead><tr><th>Tier</th><th>Odds Rank</th><th>Multiplier</th><th>Required</th></tr></thead>
              <tbody>
                <tr><td><span className="badge badge-t1">Tier 1</span></td><td>1–12</td><td>1.00×</td><td><strong>2 drivers</strong></td></tr>
                <tr><td><span className="badge badge-t2">Tier 2</span></td><td>13–25</td><td>1.33×</td><td><strong>2 drivers</strong></td></tr>
                <tr><td><span className="badge badge-t3">Tier 3</span></td><td>26+</td><td>1.66×</td><td><strong>2 drivers</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Driver Scoring Formula</span></div>
          <div className="card-body">
            <div style={{ background: '#f8f8f8', borderRadius: 4, padding: 12, fontFamily: 'monospace', fontSize: 13, marginBottom: 12 }}>
              Total = Top-10 Bonus + Stage Points + (Base × Multiplier)
            </div>
            <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 2 }}>
              <li><strong>Base Points</strong> = 50 − Finishing Position</li>
              <li><strong>Tier Multiplier</strong> applied to Base only</li>
              <li><strong>Stage Points</strong> = Stage Wins × 15</li>
              <li><strong>Top-10 Bonus</strong> = separate table (see below)</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top-10 Finish Bonus</span></div>
          <div className="card-body">
            <table className="data-table">
              <thead><tr><th>Position</th><th className="num">Bonus Points</th></tr></thead>
              <tbody>
                {[[1,130],[2,90],[3,80],[4,70],[5,60],[6,50],[7,40],[8,30],[9,20],[10,10]].map(([pos,pts]) => (
                  <tr key={pos}><td>{pos}{pos===1?'st':pos===2?'nd':pos===3?'rd':'th'}</td><td className="num"><strong>{pts}</strong></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Weekly Money Rules</span></div>
          <div className="card-body">
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Item</th><th className="num">Amount</th></tr></thead>
              <tbody>
                <tr><td>Point differential (÷ 3)</td><td className="num">Variable</td></tr>
                <tr><td>Race winner on your roster</td><td className="num"><strong>+$10</strong></td></tr>
                <tr><td>Win the weekly matchup</td><td className="num"><strong>+$10</strong></td></tr>
                <tr><td>Each stage win by your driver</td><td className="num"><strong>+$5</strong></td></tr>
                <tr><td>Manual/streak bonus</td><td className="num">Configurable</td></tr>
              </tbody>
            </table>
            <div style={{ background: '#f8f8f8', borderRadius: 4, padding: 12, fontFamily: 'monospace', fontSize: 12 }}>
              Net = (Bill pts − Don pts) / 3<br/>
              + $10 race winner bonus<br/>
              + $10 matchup winner bonus<br/>
              + $5 × stage wins
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span className="card-title">Worked Examples</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <Example
                title="Example 1"
                desc="Tier 1 driver, 2nd place, 1 stage win"
                rows={[
                  ['Top-10 Bonus (2nd)', '90'],
                  ['Stage Points (1 × 15)', '15'],
                  ['Base (50−2=48) × 1.00', '48.00'],
                  ['TOTAL', '153.00'],
                ]}
              />
              <Example
                title="Example 2"
                desc="Tier 2 driver, 5th place, 0 stage wins"
                rows={[
                  ['Top-10 Bonus (5th)', '60'],
                  ['Stage Points', '0'],
                  ['Base (50−5=45) × 1.33', '59.85'],
                  ['TOTAL', '119.85'],
                ]}
              />
              <Example
                title="Example 3"
                desc="Tier 3 driver, 10th place, 0 stage wins"
                rows={[
                  ['Top-10 Bonus (10th)', '10'],
                  ['Stage Points', '0'],
                  ['Base (50−10=40) × 1.66', '66.40'],
                  ['TOTAL', '76.40'],
                ]}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Example({ title, desc, rows }) {
  return (
    <div style={{ background: '#f8f8f8', borderRadius: 6, padding: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{desc}</div>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          {rows.map(([label, val], i) => (
            <tr key={i} style={i === rows.length - 1 ? { borderTop: '2px solid var(--border-light)' } : {}}>
              <td style={{ paddingBottom: 4, paddingTop: i === rows.length - 1 ? 6 : 0 }}>{label}</td>
              <td style={{ textAlign: 'right', fontWeight: i === rows.length - 1 ? 800 : 400, paddingBottom: 4, paddingTop: i === rows.length - 1 ? 6 : 0 }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
