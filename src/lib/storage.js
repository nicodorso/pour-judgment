const PROFILE_KEY = 'pj_profile_v3'

// No more upfront onboarding or global traits — everything is
// collected progressively, per color, the first time it's picked.
export const defaultProfile = {
  colorTraits: {
    red: { loved: '', avoided: '', fruitCharacter: 0, texture: 0, weight: 0 },
    white: { loved: '', avoided: '', acidity: 0, minerality: 0, sweetness: 0, weight: 0, oak: 0 },
    rose: { loved: '', avoided: '', acidity: 0, sweetness: 0, weight: 0 },
    sparkling: { loved: '', avoided: '', sweetness: 0 },
    orange: { loved: '', avoided: '', acidity: 0, texture: 0 }
  },
  answeredColors: { red: false, white: false, rose: false, sparkling: false, orange: false }
}

function deepMerge(base, override) {
  const out = { ...base }
  for (const key of Object.keys(base)) {
    if (override && override[key] !== undefined) {
      if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        out[key] = deepMerge(base[key], override[key])
      } else {
        out[key] = override[key]
      }
    }
  }
  return out
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...defaultProfile }
    return deepMerge(defaultProfile, JSON.parse(raw))
  } catch {
    return { ...defaultProfile }
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// Saves answers to a single color's quiz (sliders + loved/avoided text)
// and marks that color as answered so we don't ask again.
export function saveColorTraits(color, values) {
  const profile = getProfile()
  const updated = {
    ...profile,
    colorTraits: { ...profile.colorTraits, [color]: { ...profile.colorTraits[color], ...values } },
    answeredColors: { ...profile.answeredColors, [color]: true }
  }
  saveProfile(updated)
  return updated
}

// Resets one color's preferences (so its mini-quiz will be asked again),
// or wipes the whole profile if no color is given.
export function resetProfile(color) {
  if (color) {
    const profile = getProfile()
    const updated = {
      ...profile,
      colorTraits: { ...profile.colorTraits, [color]: { ...defaultProfile.colorTraits[color] } },
      answeredColors: { ...profile.answeredColors, [color]: false }
    }
    saveProfile(updated)
    return updated
  }
  localStorage.removeItem(PROFILE_KEY)
  return { ...defaultProfile }
}

const SCANS_KEY = 'pj_scans_v1'

export function getScans() {
  try {
    const raw = localStorage.getItem(SCANS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Logs a full scan result — menu summary + every recommendation with
// its tasting notes — so it doubles as a personal log of what you've
// had (and liked) at past dinners, not just a thumbs-up/down tally.
export function addScan({ mood, foodPairing, menuSummary, recommendations }) {
  const scans = getScans()
  const scan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    mood,
    foodPairing: foodPairing || '',
    menuSummary: menuSummary || '',
    recommendations: (recommendations || []).map(r => ({ ...r, feedback: null }))
  }
  scans.unshift(scan)
  localStorage.setItem(SCANS_KEY, JSON.stringify(scans.slice(0, 100)))
  return scan
}

// Sets (or clears, with rating=null) the feedback rating for one wine
// within a specific scan.
export function setWineFeedback(scanId, wineName, rating) {
  const scans = getScans()
  const scan = scans.find(s => s.id === scanId)
  if (scan) {
    const wine = scan.recommendations.find(r => r.name === wineName)
    if (wine) wine.feedback = rating
    localStorage.setItem(SCANS_KEY, JSON.stringify(scans))
  }
  return scans
}

export function clearScans() {
  localStorage.removeItem(SCANS_KEY)
}

// Turns recent feedback into a short natural-language summary
// that gets folded into the next recommendation prompt.
export function summarizeFeedback() {
  const scans = getScans()
  const allRated = scans.flatMap(s => s.recommendations.filter(r => r.feedback))
  if (allRated.length === 0) return ''
  const good = allRated.filter(r => r.feedback === 'good').slice(0, 5)
  const miss = allRated.filter(r => r.feedback === 'miss').slice(0, 5)
  const soso = allRated.filter(r => r.feedback === 'soso').slice(0, 3)
  let out = []
  if (good.length) out.push(`Wines the user rated as GOOD past recommendations: ${good.map(g => g.name).join('; ')}.`)
  if (soso.length) out.push(`Wines rated SO-SO (fine but not exciting): ${soso.map(g => g.name).join('; ')}.`)
  if (miss.length) out.push(`Wines rated a MISS (avoid similar): ${miss.map(g => g.name).join('; ')}.`)
  return out.join(' ')
}
