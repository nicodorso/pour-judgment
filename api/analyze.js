// Vercel serverless function (Node runtime).
// Keeps the Anthropic API key server-side. Set ANTHROPIC_API_KEY in your
// Vercel project's environment variables — never in client code.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image, profile, feedbackSummary, mood, foodPairing } = req.body || {}
  if (!image) {
    return res.status(400).json({ error: 'No image provided' })
  }

  // image comes in as a data URL: "data:image/jpeg;base64,...."
  const match = image.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) {
    return res.status(400).json({ error: 'Invalid image format' })
  }
  const mediaType = match[1]
  const base64Data = match[2]

  function describeColorTraits(color, traits) {
    if (!traits) return ''
    const sliderLines = Object.entries(traits)
      .filter(([k]) => k !== 'loved' && k !== 'avoided')
      .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
    let out = `- ${color}: ${sliderLines.join(', ')}`
    if (traits.loved) out += `\n  Loves: ${traits.loved}`
    if (traits.avoided) out += `\n  Avoids: ${traits.avoided}`
    return out
  }

  const relevantColorLines = []
  if (mood && mood !== 'any' && profile?.colorTraits?.[mood]) {
    relevantColorLines.push(describeColorTraits(mood, profile.colorTraits[mood]))
  } else {
    // "surprise me" — include every color the user has already answered
    Object.entries(profile?.answeredColors || {}).forEach(([color, answered]) => {
      if (answered) relevantColorLines.push(describeColorTraits(color, profile.colorTraits[color]))
    })
  }

  const profileText = `
${relevantColorLines.length ? `Taste profile (sliders on a -2 to 2 scale, 0 = neutral):\n${relevantColorLines.join('\n')}` : 'No taste profile collected yet for this color — use general crowd-pleasing judgment and lean on the wine\'s own qualities.'}
${foodPairing ? `Pairing with: ${foodPairing} — factor this into which wine works best.` : ''}
${feedbackSummary ? `\nPast feedback to learn from: ${feedbackSummary}` : ''}
`.trim()

  const moodLine = mood && mood !== 'any'
    ? `\n\nIMPORTANT: The user specifically wants a ${mood.toUpperCase()} wine right now, regardless of what their general taste profile might otherwise suggest. Only recommend wines from the list that match this category. If the list has no wines matching this category, say so honestly in menuSummary and return an empty recommendations array.`
    : ''

  const systemPrompt = `You are a friendly, non-snobby wine guide helping someone pick from a restaurant or bar wine list, using a photo of the menu. The user is NOT a wine expert and dislikes jargon-heavy explanations. Write in plain, warm, conversational language.

Task:
1. Read the wine list in the photo as best you can (it may be imperfectly lit or angled — do your best).
2. Using the user's taste profile below, pick the 3 best matches from the list (fewer if the list is short).
3. For each pick, explain briefly WHY it fits their taste in plain language (1-2 sentences, no jargon like "terroir" or "malolactic" unless immediately explained).
4. Give a short, more detailed "tasting notes" description (2-3 sentences) using accessible language.
5. Give one short "talking point" fact about the wine, grape, or region that would help the user sound informed if they mention it to their date or the sommelier — interesting, not textbook-dry.
6. Score each pick 1-5 for how confident you are it matches their taste (matchScore).
7. Order recommendations best-match first.

User's taste profile:
${profileText}${moodLine}

Respond with ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{
  "menuSummary": "one short friendly sentence about the list overall, e.g. type of list, wine-forward regions present",
  "recommendations": [
    {
      "name": "Wine name as shown on the menu",
      "priceOnMenu": "price if visible, else empty string",
      "matchScore": 1-5,
      "whyRecommended": "plain language, 1-2 sentences",
      "tastingNotes": "plain language, 2-3 sentences",
      "talkingPoint": "one interesting, shareable fact"
    }
  ]
}

If you genuinely cannot read any wine list in the image, respond with:
{ "error": "description of the issue" }`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s safety timeout

    let response
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 3000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64Data }
                },
                {
                  type: 'text',
                  text: 'Here is the wine list. Please recommend wines for me based on my taste profile in your system instructions.'
                }
              ]
            }
          ]
        })
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      return res.status(502).json({ error: `Anthropic API error (${response.status}): ${errText.slice(0, 200)}` })
    }

    const data = await response.json()
    const textBlock = data.content?.find(b => b.type === 'text')
    if (!textBlock) {
      return res.status(502).json({ error: 'No response from model.' })
    }

    let cleaned = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    // Belt-and-suspenders: if there's any stray text around the JSON,
    // extract just the outermost {...} block.
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1)
    }
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch (e) {
      console.error('JSON parse failure:', cleaned)
      return res.status(502).json({ error: "Had trouble reading that list clearly — try another photo." })
    }

    if (parsed.error) {
      return res.status(200).json({ error: parsed.error })
    }

    return res.status(200).json(parsed)
  } catch (e) {
    console.error(e)
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: 'The wine list took too long to analyze — try again.' })
    }
    return res.status(500).json({ error: 'Something went wrong analyzing the photo.' })
  }
}
