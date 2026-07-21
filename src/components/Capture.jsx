import { useRef, useState } from 'react'

const MOODS = [
  { key: 'any', label: 'Surprise me' },
  { key: 'red', label: 'Red' },
  { key: 'white', label: 'White' },
  { key: 'sparkling', label: 'Sparkling' },
  { key: 'rose', label: 'Rosé' },
  { key: 'orange', label: 'Orange' },
]

export default function Capture({ onAnalyze, loading, error, onResetProfile }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [mood, setMood] = useState('any')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
      onAnalyze(reader.result, mood)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen" style={{ justifyContent: loading || preview ? 'flex-start' : 'center', alignItems: 'center', textAlign: 'center' }}>
      {!preview && !loading && (
        <>
          <div className="eyebrow">Pour Judgment</div>
          <h1 className="h1" style={{ marginTop: 10 }}>Snap the wine list.</h1>
          <p className="body-text" style={{ marginTop: 10, maxWidth: 320 }}>
            We'll read it and point you toward something you'll actually enjoy — no wine vocabulary required.
          </p>

          <div style={{ marginTop: 32, width: '100%' }}>
            <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 10, textAlign: 'left' }}>
              What are you in the mood for?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MOODS.map(m => (
                <button
                  key={m.key}
                  className={`chip ${mood === m.key ? 'selected-like' : ''}`}
                  onClick={() => setMood(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28, width: '100%' }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button className="btn-primary" onClick={() => fileRef.current.click()}>
              Take or choose a photo
            </button>
          </div>

          <button
            className="body-text"
            style={{ marginTop: 24, background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 13 }}
            onClick={onResetProfile}
          >
            Retake taste quiz
          </button>
        </>
      )}

      {preview && (
        <div style={{ width: '100%' }}>
          <img src={preview} alt="Wine list" style={{ width: '100%', borderRadius: 6, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }} />
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <div className="spinner" />
              <span className="body-text">Reading the list…</span>
            </div>
          )}
          {error && (
            <div className="card" style={{ marginTop: 16, borderColor: 'var(--claret)' }}>
              <p className="body-text" style={{ color: 'var(--bone)' }}>{error}</p>
              <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => fileRef.current.click()}>Try another photo</button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
