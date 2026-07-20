import { useRef, useState } from 'react'

export default function Capture({ onAnalyze, loading, error }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
      onAnalyze(reader.result)
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

          <div style={{ marginTop: 40, width: '100%' }}>
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
            <div className="card" style={{ marginTop: 16, borderColor: 'var(--bordeaux-bright)' }}>
              <p className="body-text" style={{ color: 'var(--parchment)' }}>{error}</p>
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
