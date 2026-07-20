import { useState } from 'react'
import Onboarding from './components/Onboarding.jsx'
import Capture from './components/Capture.jsx'
import Results from './components/Results.jsx'
import { getProfile, saveProfile, addFeedback, summarizeFeedback } from './lib/storage.js'

export default function App() {
  const [profile, setProfile] = useState(getProfile())
  const [view, setView] = useState(profile.onboarded ? 'capture' : 'onboarding')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})

  function completeOnboarding(newProfile) {
    saveProfile(newProfile)
    setProfile(newProfile)
    setView('capture')
  }

  async function analyzePhoto(imageDataUrl) {
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
          feedbackSummary: summarizeFeedback()
        })
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setView('results')
    } catch (e) {
      setError("Couldn't read that list — try a clearer, well-lit photo of the wine section.")
    } finally {
      setLoading(false)
    }
  }

  function handleFeedback(wine, rating) {
    addFeedback({ wineName: wine.name, rating })
    setFeedbackMap(prev => ({ ...prev, [wine.name]: rating }))
  }

  function newPhoto() {
    setResult(null)
    setError(null)
    setView('capture')
  }

  return (
    <>
      {view === 'onboarding' && (
        <Onboarding profile={profile} onComplete={completeOnboarding} />
      )}
      {view === 'capture' && (
        <Capture onAnalyze={analyzePhoto} loading={loading} error={error} />
      )}
      {view === 'results' && (
        <Results result={result} onFeedback={handleFeedback} feedbackMap={feedbackMap} onNewPhoto={newPhoto} />
      )}
    </>
  )
}
