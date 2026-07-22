import { useRef, useState } from 'react'

const MOODS = [
  { key: 'any', label: 'Surprise me' },
  { key: 'red', label: 'Red' },
  { key: 'white', label: 'White' },
  { key: 'sparkling', label: 'Sparkling' },
  { key: 'rose', label: 'Rosé' },
  { key: 'orange', label: 'Orange' },
]

// Color-specific taste questions, asked once per color the first time
// it's picked. Each color only asks what's actually relevant to it —
// no tannin question for whites, no minerality question for reds, etc.
const COLOR_QUESTIONS = {
  red: [
    { key: 'fruitCharacter', label: 'Fruit character', left: 'Earthy & savory', right: 'Juicy & fruit-forward' },
    { key: 'texture', label: 'Texture', left: 'Smooth & silky', right: 'Dry & grippy, like strong black tea' },
    { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
  ],
  white: [
    { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
    { key: 'minerality', label: 'Minerality', left: 'Round & fruity', right: 'Stony / flinty' },
    { key: 'sweetness', label: 'Sweetness', left: 'Bone dry', right: 'Noticeably sweet' },
    { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
    { key: 'oak', label: 'Oak influence', left: 'Clean & fresh', right: 'Buttery & toasty' },
  ],
  rose: [
    { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
    { key: 'sweetness', label: 'Sweetness', left: 'Bone dry', right: 'Noticeably sweet' },
    { key: 'weight', label: 'Weight', left: 'Light & easy', right: 'Rich & full' },
  ],
  sparkling: [
    { key: 'sweetness', label: 'Dryness', left: 'Bone dry (Brut)', right: 'Off-dry / sweet' },
  ],
  orange: [
    { key: 'acidity', label: 'Acidity', left: 'Soft & mellow', right: 'Bright & zippy' },
    { key: 'texture', label: 'Texture', left: 'Smooth & silky', right: 'Dry & grippy, like strong black tea' },
  ],
}

const COLOR_LABELS = { red: 'red', white: 'white', rose: 'rosé', sparkling: 'sparkling', orange: 'orange' }

// Resizes/compresses the photo before upload so we stay well under
// serverless request-size limits (phone photos are often 3-8MB raw).
function compressImage(dataUrl, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > height && width > maxDimension) {
        height = Math.round(height * (maxDimension / width))
        width = maxDimension
      } else if (height > maxDimension) {
        width = Math.round(width * (maxDimension / height))
        height = maxDimension
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export default function Capture({ profile, onAnalyze, onSaveColorTraits, loading, error, onOpenProfile }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [mood, setMood] = useState('any')
  const [foodPairing, setFoodPairing] = useState('')
  const [quizAnswers, setQuizAnswers] = useState({})

  const needsQuiz = mood !== 'any' && !profile.answeredColors?.[mood]

  function selectMood(key) {
    setMood(key)
    if (key !== 'any' && !profile.answeredColors?.[key]) {
      const existing = profile.colorTraits?.[key] || {}
      const seeded = { loved: existing.loved || '', avoided: existing.avoided || '' }
      COLOR_QUESTIONS[key].forEach(q => { seeded[q.key] = existing[q.key] ?? 0 })
      setQuizAnswers(seeded)
    }
  }

  function submitColorQuiz() {
    onSaveColorTraits(mood, quizAnswers)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result)
        setPreview(compressed)
        onAnalyze(compressed, mood, foodPairing)
      } catch {
        setPreview(reader.result)
        onAnalyze(reader.result, mood, foodPairing)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen" style={{ justifyContent: loading || preview ? 'flex-start' : 'center', alignItems: 'center', textAlign: 'center' }}>
      {!preview && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="eyebrow">Pour Judgment</div>
            <button
              className="body-text"
              style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'var(--bone-dim)', fontSize: 13 }}
              onClick={onOpenProfile}
            >
              Your profile
            </button>
          </div>
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
                  onClick={() => selectMood(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {needsQuiz && (
            <div className="card" style={{ marginTop: 20, width: '100%', textAlign: 'left' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Quick — just for {COLOR_LABELS[mood]}</div>
              <p className="body-text" style={{ fontSize: 13, marginBottom: 16 }}>
                A few questions specific to {COLOR_LABELS[mood]}. We'll only ask this once.
              </p>

              <div style={{ marginBottom: 18 }}>
                <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  {COLOR_LABELS[mood]} you always love?
                </div>
                <input
                  type="text"
                  value={quizAnswers.loved || ''}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, loved: e.target.value })}
                  placeholder="e.g. Chablis, Willamette Pinot Noir"
                  style={{
                    width: '100%', background: 'var(--ink)', color: 'var(--bone)',
                    border: '1px solid rgba(30,42,34,0.22)', borderRadius: 4, padding: '10px 12px',
                    fontFamily: 'var(--body)', fontSize: 14
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  {COLOR_LABELS[mood]} you consistently avoid?
                </div>
                <input
                  type="text"
                  value={quizAnswers.avoided || ''}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, avoided: e.target.value })}
                  placeholder="e.g. overly oaky Chardonnay"
                  style={{
                    width: '100%', background: 'var(--ink)', color: 'var(--bone)',
                    border: '1px solid rgba(30,42,34,0.22)', borderRadius: 4, padding: '10px 12px',
                    fontFamily: 'var(--body)', fontSize: 14
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {COLOR_QUESTIONS[mood].map(q => (
                  <div key={q.key}>
                    <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{q.label}</div>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={1}
                      value={quizAnswers[q.key] ?? 0}
                      onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.key]: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--copper-bright)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--bone-dim)', fontFamily: 'var(--mono)' }}>
                      <span>{q.left}</span>
                      <span>{q.right}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: 18 }} onClick={submitColorQuiz}>Got it</button>
            </div>
          )}

          {!needsQuiz && (
            <div style={{ marginTop: 20, width: '100%', textAlign: 'left' }}>
              <div className="body-text" style={{ color: 'var(--bone)', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Pairing with food? <span style={{ fontWeight: 400, color: 'var(--bone-dim)' }}>(optional)</span>
              </div>
              <input
                type="text"
                value={foodPairing}
                onChange={(e) => setFoodPairing(e.target.value)}
                placeholder="e.g. steak, or just cheese and snacks"
                style={{
                  width: '100%', background: 'var(--surface)', color: 'var(--bone)',
                  border: '1px solid rgba(30,42,34,0.22)', borderRadius: 4, padding: '10px 12px',
                  fontFamily: 'var(--body)', fontSize: 14
                }}
              />
            </div>
          )}

          {!needsQuiz && (
            <div style={{ marginTop: 24, width: '100%' }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <button className="btn-primary" onClick={() => fileRef.current.click()}>
                Take or choose a photo
              </button>
            </div>
          )}
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
