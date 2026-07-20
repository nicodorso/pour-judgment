import { useState } from 'react'

function RatingDots({ score }) {
  return (
    <div className="rating-dots">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`rating-dot ${i <= score ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

function WineCard({ wine, isTop, onFeedback, feedbackGiven }) {
  const [expanded, setExpanded] = useState(isTop)

  return (
    <div className="card" style={{ marginBottom: 14, borderColor: isTop ? 'var(--gold)' : undefined }}>
      {isTop && <div className="eyebrow" style={{ marginBottom: 8 }}>Top pick</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div className="h2">{wine.name}</div>
          {wine.priceOnMenu && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--parchment-dim)', marginTop: 4 }}>
              {wine.priceOnMenu}
            </div>
          )}
        </div>
        <RatingDots score={wine.matchScore || 3} />
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
      {feedbackGiven ? (
        <p className="body-text" style={{ fontSize: 13, color: 'var(--gold)' }}>Thanks — that'll sharpen future picks.</p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'good')}>👍 Good pick</button>
          <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'soso')}>😐 So-so</button>
          <button className="btn-ghost" style={{ fontSize: 13, padding: '10px 12px' }} onClick={() => onFeedback(wine, 'miss')}>👎 Miss</button>
        </div>
      )}
    </div>
  )
}

export default function Results({ result, onFeedback, feedbackMap, onNewPhoto }) {
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
            feedbackGiven={!!feedbackMap[wine.name]}
          />
        ))}
      </div>

      <div className="bottom-bar">
        <button className="btn-primary" onClick={onNewPhoto}>Scan another list</button>
      </div>
    </div>
  )
}
