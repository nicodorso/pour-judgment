import { useState } from 'react'
import { getScans, clearScans } from '../lib/storage.js'

const MOOD_LABELS = { any: 'Surprise me', red: 'Red', white: 'White', rose: 'Rosé', sparkling: 'Sparkling', orange: 'Orange' }
const FEEDBACK_ICON = { good: '👍', soso: '😐', miss: '👎' }

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function ScanEntry({ scan }) {
  const [expandedWine, setExpandedWine] = useState(null)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="eyebrow">{formatDate(scan.ts)}</div>
        <div className="eyebrow">{MOOD_LABELS[scan.mood] || scan.mood}</div>
      </div>
      {scan.foodPairing && (
        <p className="body-text" style={{ fontSize: 12, marginTop: 4 }}>Paired with: {scan.foodPairing}</p>
      )}
      {scan.menuSummary && (
        <p className="body-text" style={{ fontSize: 13, marginTop: 8 }}>{scan.menuSummary}</p>
      )}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scan.recommendations.map((wine, i) => {
          const isOpen = expandedWine === i
          return (
            <div key={wine.name + i} style={{ borderTop: '1px solid rgba(30,42,34,0.1)', paddingTop: 10 }}>
              <button
                onClick={() => setExpandedWine(isOpen ? null : i)}
                style={{
                  background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0
                }}
              >
                <span className="body-text" style={{ color: 'var(--bone)', fontWeight: 600 }}>
                  {wine.feedback && <span style={{ marginRight: 6 }}>{FEEDBACK_ICON[wine.feedback]}</span>}
                  {wine.name}
                </span>
                <span style={{ color: 'var(--bone-dim)', fontSize: 12 }}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div style={{ marginTop: 8 }}>
                  {wine.priceOnMenu && (
                    <p className="body-text" style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>{wine.priceOnMenu}</p>
                  )}
                  {wine.tastingNotes && (
                    <p className="body-text" style={{ fontSize: 13, marginTop: 6 }}>{wine.tastingNotes}</p>
                  )}
                  {wine.talkingPoint && (
                    <p className="body-text" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>💬 {wine.talkingPoint}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function History({ onBack }) {
  const [scans, setScans] = useState(getScans())

  function handleClear() {
    clearScans()
    setScans([])
  }

  return (
    <div className="screen">
      <button
        className="body-text"
        style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 13, textAlign: 'left', marginBottom: 16 }}
        onClick={onBack}
      >
        ← Back
      </button>
      <div className="eyebrow">Your history</div>
      <h1 className="h1" style={{ marginTop: 10, marginBottom: 6 }}>Every list you've scanned.</h1>
      <p className="body-text" style={{ marginBottom: 20, fontSize: 13 }}>
        Tap a wine to see its notes again — handy if you want to track one down to buy.
      </p>

      {scans.length === 0 && (
        <p className="body-text">No scans yet — once you scan a menu, it'll show up here.</p>
      )}

      {scans.map(scan => <ScanEntry key={scan.id} scan={scan} />)}

      {scans.length > 0 && (
        <button className="btn-ghost" style={{ marginTop: 8 }} onClick={handleClear}>
          Clear history
        </button>
      )}
    </div>
  )
}
