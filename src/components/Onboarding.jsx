import { useState, useRef } from 'react'

const WINE_GROUPS = [
  {
    label: 'Reds',
    types: ['Pinot Noir', 'Cabernet Sauvignon', 'Syrah', 'Sangiovese', 'Malbec', 'Zinfandel']
  },
  {
    label: 'Whites',
    types: ['Sauvignon Blanc', 'Chardonnay (rich, buttery style)', 'Riesling', 'Pinot Grigio', 'Viognier']
  },
  {
    label: 'Rosé, sparkling & orange',
    types: ['Rosé', 'Champagne/Sparkling', 'Orange/Skin-contact']
  }
]

const TRAIT_QUESTIONS = [
  { key: 'acidity', label: 'Crisp & tart', left: 'Soft & mellow', right: 'Bright & zippy' },
  { key: 'sweetness', label: 'Sweetness', left: 'Bone dry', right: 'Noticeably sweet' },
  { key: 'body', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
  { key: 'tannin', label: 'Grip (reds)', left: 'Smooth', right: 'Bold & grippy' },
  { key: 'oak', label: 'Oak / butter', left: 'Clean & fresh', right: 'Buttery & toasty' },
  { key: 'fizz', label: 'Bubbles', left: 'Still', right: 'Love bubbles' },
  { key: 'style', label: 'Overall style', left: 'Earthy & restrained', right: 'Ripe & fruit-forward' },
]

export default function Onboarding({ profile, onComplete }) {
  const [step, setStep] = useState(0)
  const [liked, setLiked] = useState(profile.likedTypes)
  const [disliked, setDisliked] = useState(profile.dislikedTypes)
  const [traits, setTraits] = useState(profile.traits)
  const [notes, setNotes] = useState(profile.notes)

  function toggleType(type) {
    if (liked.includes(type)) {
      setLiked(liked.filter(t => t !== type))
    } else if (disliked.includes(type)) {
      setDisliked(disliked.filter(t => t !== type))
      setLiked([...liked, type])
    } else {
      setLiked([...liked, type])
    }
  }

  function longPressDislike(type) {
    if (disliked.includes(type)) {
      setDisliked(disliked.filter(t => t !== type))
    } else {
      setLiked(liked.filter(t => t !== type))
      setDisliked([...disliked, type])
    }
  }

  // Long-press on touch devices fires a click right after touchend,
  // which would immediately undo the dislike we just set. This ref
  // persists across the re-render that longPressDislike triggers,
  // so the click handler can tell it should be ignored.
  const longPressFiredRef = useRef(null) // holds the `type` that was just long-pressed
  const timerRef = useRef(null)

  function makeChipHandlers(type) {
    return {
      onClick: () => {
        if (longPressFiredRef.current === type) {
          longPressFiredRef.current = null
          return
        }
        toggleType(type)
      },
      onContextMenu: (e) => { e.preventDefault(); longPressFiredRef.current = type; longPressDislike(type) },
      onTouchStart: () => {
        timerRef.current = setTimeout(() => {
          longPressFiredRef.current = type
          longPressDislike(type)
        }, 500)
      },
      onTouchEnd: () => clearTimeout(timerRef.current),
      onTouchMove: () => clearTimeout(timerRef.current),
    }
  }

  function finish() {
    onComplete({
      onboarded: true,
      likedTypes: liked,
      dislikedTypes: disliked,
      traits,
      notes
    })
  }

  return (
    <div className="screen">
      <div className="eyebrow">Step {step + 1} of 3</div>

      {step === 0 && (
        <>
          <h1 className="h1" style={{ marginTop: 10 }}>What do you usually reach for?</h1>
          <p className="body-text" style={{ marginTop: 8 }}>
            Tap once for <strong style={{ color: 'var(--verjus)' }}>like</strong>, tap again to clear.
            Tap and hold for <strong style={{ color: 'var(--claret)' }}>dislike</strong>.
          </p>
          {WINE_GROUPS.map(group => (
            <div key={group.label} style={{ marginTop: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{group.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.types.map(type => (
                  <button
                    key={type}
                    className={`chip ${liked.includes(type) ? 'selected-like' : ''} ${disliked.includes(type) ? 'selected-dislike' : ''}`}
                    {...makeChipHandlers(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="h1" style={{ marginTop: 10 }}>How do you like it?</h1>
          <p className="body-text" style={{ marginTop: 8 }}>
            No wine-speak needed — just slide toward what you enjoy.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 24 }}>
            {TRAIT_QUESTIONS.map(q => (
              <div key={q.key}>
                <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 8 }}>{q.label}</div>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={1}
                  value={traits[q.key]}
                  onChange={(e) => setTraits({ ...traits, [q.key]: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--copper-bright)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bone-dim)', fontFamily: 'var(--mono)' }}>
                  <span>{q.left}</span>
                  <span>{q.right}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="h1" style={{ marginTop: 10 }}>Anything else?</h1>
          <p className="body-text" style={{ marginTop: 8 }}>
            Optional — allergies, a wine you loved recently, a region you're curious about.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Loved a Willamette Valley Pinot last month. Not a fan of overly oaky Chardonnay."
            rows={5}
            style={{
              marginTop: 16, background: 'var(--surface)', color: 'var(--bone)',
              border: '1px solid rgba(245,237,228,0.15)', borderRadius: 4, padding: 14,
              fontFamily: 'var(--body)', fontSize: 15, resize: 'vertical'
            }}
          />
        </>
      )}

      <div className="bottom-bar">
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button className="btn-ghost" style={{ flex: '0 0 100px' }} onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < 2 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>Continue</button>
          ) : (
            <button className="btn-primary" onClick={finish}>Start tasting</button>
          )}
        </div>
      </div>
    </div>
  )
}
