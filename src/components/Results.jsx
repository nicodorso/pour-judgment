import { useState, useId } from 'react'

function GlassFill({ score }) {
  const pct = Math.max(0, Math.min(5, score || 3)) / 5
  const uid = useId()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="20" height="26" viewBox="0 0 20 26" aria-hidden="true">
        <defs>
          <clipPath id={uid}>
            <rect x="0" y={26 - (16 * pct)} width="20" height={16 * pct} />
          </clipPath>
        </defs>
        {/* glass outline */}
        <path d="M3 2 L6.5 15 A3.5 3.5 0 0 0 13.5 15 L17 2"
          fill="none" stroke="var(--bone-dim)" strokeWidth="1.2" />
        <line x1="10" y1="15.5" x2="10" y2="23" stroke="var(--bone-dim)" strokeWidth="1.2" />
        <line x1="5.5" y1="23" x2="14.5" y2="23" stroke="var(--bone-dim)" strokeWidth="1.2" />
        {/* wine fill, clipped to glass bowl shape */}
        <path d="M3 2 L6.5 15 A3.5 3.5 0 0 0 13.5 15 L17 2"
          fill="var(--copper)" clipPath={`url(#${uid})`} opacity="0.9" />
      </svg>
      <span className="eyebrow" style={{ color: 'var(--bone-dim)' }}>{score}/5</span>
    </div>
  )
}

function WineCard({ wine, isTop, onFeedback }) {
  const [expanded, setExpanded] = useState(isTop)
  const feedbackGiven = !!wine.feedback

  return (
    <div className="card" style={{ marginBottom: 14, borderColor: isTop ? 'var(--copper-bright)' : undefined }}>
      {isTop && <div className="eyebrow" style={{ marginBottom: 8 }}>Top pick</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div className="h2">{wine.name}</div>
          {wine.priceOnMenu && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-dim)', marginTop: 4 }}>
              {wine.priceOnMenu}
            </div>
          )}
        </div>
        <GlassFill score={wine.matchScore || 3} />
      </div>

      <p className="note" style={{ marginTop: 12 }}>{wine.whyRecommended}</p>

      {expanded && (
        <>
          {wine.tastingNotes && (
            <p className="body-text" style={{ marginTop: 12 }}>{wine.tastingNotes}</p>
          )}
          {wine.talkingPoint && (
            <div className="divider" />
          )}
          {wine.talkingPoint && (
            <p className="body-text" style={{ fontSize: 13, fontStyle: 'italic' }}>
              💬 Sound smart: {wine.talkingPoint}
            </p>
          )}
        </>
      )}

      {!expanded && (
        <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setExpanded(true)}>
          Tell me more
        </button>
      )}

      <div className="divider" />
      <div>
        {feedbackGiven && (
          <p className="body-text" style={{ fontSize: 13, color: 'var(--copper-bright)', marginBottom: 8 }}>
            Thanks — that'll sharpen future picks. <button
              onClick={() => onFeedback(wine, null)}
              style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 13, padding: 0, cursor: 'pointer' }}
            >Change</button>
          </p>
        )}
        {!feedbackGiven && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'good')}>👍 Good pick</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'soso')}>😐 So-so</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'miss')}>👎 Miss</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Results({ result, onFeedback, onNewPhoto }) {
  if (!result) return null
  const { recommendations = [], menuSummary } = result

  return (
    <div className="screen">
      <div className="eyebrow">Your list, decoded</div>
      <h1 className="h1" style={{ marginTop: 10 }}>Here's what we'd pour.</h1>
      {menuSummary && <p className="body-text" style={{ marginTop: 8 }}>{menuSummary}</p>}

      <div style={{ marginTop: 24 }}>
        {recommendations.map((wine, i) => (
          <WineCard
            key={wine.name + i}
            wine={wine}
            isTop={i === 0}
            onFeedback={onFeedback}
          />
        ))}
      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={onNewPhoto}>Scan another list</button>
      </div>
    </div>
  )
}
