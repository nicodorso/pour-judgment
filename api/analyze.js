// Vercel serverless function (Node runtime).
// Keeps the Anthropic API key server-side. Set ANTHROPIC_API_KEY in your
// Vercel project's environment variables — never in client code.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image, profile, feedbackSummary } = req.body || {}
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

  const traitLine = (label, val) => {
    if (val === undefined) return null
    const sign = val > 0 ? '+' : ''
    return `${label}: ${sign}${val}`
  }

  const profileText = `
Liked wine types: ${profile?.likedTypes?.join(', ') || 'none specified'}
Disliked wine types: ${profile?.dislikedTypes?.join(', ') || 'none specified'}
Taste traits (scale -2 to 2, 0 = neutral):
- Acidity (soft -2 to bright +2): ${profile?.traits?.acidity}
- Sweetness (bone dry -2 to sweet +2): ${profile?.traits?.sweetness}
- Body (light -2 to full +2): ${profile?.traits?.body}
- Tannin (smooth -2 to bold/grippy +2): ${profile?.traits?.tannin}
- Oak/butter (clean -2 to buttery/toasty +2): ${profile?.traits?.oak}
- Fizz (still -2 to loves bubbles +2): ${profile?.traits?.fizz}
Freeform notes from user: ${profile?.notes || 'none'}
${feedbackSummary ? `\nPast feedback to learn from: ${feedbackSummary}` : ''}
`.trim()

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
${profileText}

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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
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

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      return res.status(502).json({ error: 'Could not analyze the photo right now.' })
    }

    const data = await response.json()
    const textBlock = data.content?.find(b => b.type === 'text')
    if (!textBlock) {
      return res.status(502).json({ error: 'No response from model.' })
    }

    let cleaned = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '')
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
    return res.status(500).json({ error: 'Something went wrong analyzing the photo.' })
  }
}
