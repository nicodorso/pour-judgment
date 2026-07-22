import { useState } from 'react'
import Capture from './components/Capture.jsx'
import Results from './components/Results.jsx'
import Profile from './components/Profile.jsx'
import { getProfile, addFeedback, summarizeFeedback, resetProfile, saveColorTraits } from './lib/storage.js'

export default function App() {
  const [profile, setProfile] = useState(getProfile())
  const [view, setView] = useState('capture')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})

  async function analyzePhoto(imageDataUrl, mood, foodPairing) {
    setLoading(true)
    setError(null)
    setResult(null)
    setFeedbackMap({})
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          profile,
          feedbackSummary: summarizeFeedback(),
          mood,
          foodPairing
        })
      })
      if (!res.ok) {
        let detail = ''
        try {
          const errBody = await res.json()
          detail = errBody?.error ? ` (${errBody.error})` : ` (status ${res.status})`
        } catch {
          detail = ` (status ${res.status})`
        }
        throw new Error('Request failed' + detail)
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setView('results')
    } catch (e) {
      console.error('Analyze error:', e)
      setError(e.message?.includes('(') ? `Couldn't read that list — ${e.message}` : "Couldn't read that list — try a clearer, well-lit photo of the wine section.")
    } finally {
      setLoading(false)
    }
  }

  function handleFeedback(wine, rating) {
    if (rating === null) {
      setFeedbackMap(prev => {
        const next = { ...prev }
        delete next[wine.name]
        return next
      })
      return
    }
    addFeedback({ wineName: wine.name, rating })
    setFeedbackMap(prev => ({ ...prev, [wine.name]: rating }))
  }

  function newPhoto() {
    setResult(null)
    setError(null)
    setView('capture')
  }

  function handleSaveColorTraits(color, values) {
    const updated = saveColorTraits(color, values)
    setProfile(updated)
  }

  function handleResetColor(color) {
    const updated = resetProfile(color)
    setProfile(updated)
  }

  return (
    <>
      {view === 'capture' && (
        <Capture
          profile={profile}
          onAnalyze={analyzePhoto}
          onSaveColorTraits={handleSaveColorTraits}
          loading={loading}
          error={error}
          onOpenProfile={() => setView('profile')}
        />
      )}
      {view === 'results' && (
        <Results result={result} onFeedback={handleFeedback} feedbackMap={feedbackMap} onNewPhoto={newPhoto} />
      )}
      {view === 'profile' && (
        <Profile profile={profile} onBack={() => setView('capture')} onReset={handleResetColor} />
      )}
    </>
  )
}
