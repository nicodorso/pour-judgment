const PROFILE_KEY = 'pj_profile_v1'
const HISTORY_KEY = 'pj_history_v1'

export const defaultProfile = {
  onboarded: false,
  likedTypes: [],   // e.g. ['Pinot Noir', 'Sauvignon Blanc']
  dislikedTypes: [],
  traits: {
    // -2 = strongly dislike, 0 = neutral, 2 = strongly like
    acidity: 0,      // tart/crisp <-> soft
    sweetness: 0,     // bone dry <-> sweet
    body: 0,          // light <-> full/rich
    tannin: 0,         // smooth <-> grippy/bold
    oak: 0,            // clean/fresh <-> buttery/oaky
    fizz: 0            // still <-> bubbly
  },
  notes: ''
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...defaultProfile }
    return { ...defaultProfile, ...JSON.parse(raw) }
  } catch {
    return { ...defaultProfile }
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// Clears the taste profile so the user can retake the questionnaire.
// Feedback history is left intact by default since it's tied to actual
// wines tried, not the quiz answers — pass clearHistory=true to wipe both.
export function resetProfile(clearHistory = false) {
  localStorage.removeItem(PROFILE_KEY)
  if (clearHistory) localStorage.removeItem(HISTORY_KEY)
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addFeedback(entry) {
  const history = getHistory()
  history.unshift({ ...entry, ts: Date.now() })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)))
  return history
}

// Turns recent feedback into a short natural-language summary
// that gets folded into the next recommendation prompt.
export function summarizeFeedback() {
  const history = getHistory()
  if (history.length === 0) return ''
  const good = history.filter(h => h.rating === 'good').slice(0, 5)
  const miss = history.filter(h => h.rating === 'miss').slice(0, 5)
  const soso = history.filter(h => h.rating === 'soso').slice(0, 3)
  let out = []
  if (good.length) out.push(`Wines the user rated as GOOD past recommendations: ${good.map(g => g.wineName).join('; ')}.`)
  if (soso.length) out.push(`Wines rated SO-SO (fine but not exciting): ${soso.map(g => g.wineName).join('; ')}.`)
  if (miss.length) out.push(`Wines rated a MISS (avoid similar): ${miss.map(g => g.wineName).join('; ')}.`)
  return out.join(' ')
}
