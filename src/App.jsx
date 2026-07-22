import { useState } from 'react'
import Capture from './components/Capture.jsx'
import Results from './components/Results.jsx'
import Profile from './components/Profile.jsx'
import History from './components/History.jsx'
import { getProfile, summarizeFeedback, resetProfile, saveColorTraits, addScan, setWineFeedback } from './lib/storage.js'

export default function App() {
  const [profile, setProfile] = useState(getProfile())
  const [view, setView] = useState('capture')
  const [result, setResult] = useState(null)
  const [currentScanId, setCurrentScanId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function analyzePhoto(imageDataUrl, mood, foodPairing) {
    setLoading(true)
    setError(null)
    setResult(null)
    setCurrentScanId(null)
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
      const scan = addScan({ mood, foodPairing, menuSummary: data.menuSummary, recommendations: data.recommendations })
      setCurrentScanId(scan.id)
      setResult({ ...data, recommendations: scan.recommendations })
      setView('results')
    } catch (e) {
      console.error('Analyze error:', e)
      const detail = e.message || 'unknown error'
      setError(`Couldn't read that list — ${detail}`)
    } finally {
      setLoading(false)
    }
  }

  function handleFeedback(wine, rating) {
    setWineFeedback(currentScanId, wine.name, rating)
    setResult(prev => ({
      ...prev,
      recommendations: prev.recommendations.map(r => r.name === wine.name ? { ...r, feedback: rating } : r)
    }))
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
        <Results result={result} onFeedback={handleFeedback} onNewPhoto={newPhoto} />
      )}
      {view === 'profile' && (
        <Profile profile={profile} onBack={() => setView('capture')} onReset={handleResetColor} onViewHistory={() => setView('history')} />
      )}
      {view === 'history' && (
        <History onBack={() => setView('profile')} />
      )}
    </>
  )
}
