/**
 * AI Client — Provider bağımsız metin üretimi
 * .env.local'de AI_PROVIDER=claude | gemini | openai | deepseek
 */

export async function generateText(prompt, options = {}) {
  const provider = process.env.AI_PROVIDER || 'claude'
  const temperature = options.temperature ?? 0.6
  const maxTokens = options.maxOutputTokens ?? 2048

  if (provider === 'claude') {
    return await callClaude(prompt, temperature, maxTokens)
  } else if (provider === 'gemini') {
    return await callGemini(prompt, temperature, maxTokens)
  } else if (provider === 'openai') {
    return await callOpenAI(prompt, temperature, maxTokens)
  } else if (provider === 'deepseek') {
    return await callDeepSeek(prompt, temperature, maxTokens)
  } else {
    throw new Error(`Bilinmeyen AI_PROVIDER: ${provider}`)
  }
}

// ============================================
// CLAUDE (Anthropic)
// ============================================
async function callClaude(prompt, temperature, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY tanımlı değil')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Claude API hatası: ${err?.error?.message || response.status}`)
  }

  const data = await response.json()
  return data.content[0].text.trim()
}

// ============================================
// GEMİNİ (Google)
// ============================================
async function callGemini(prompt, temperature, maxTokens) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens }
      })
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Gemini API hatası: ${err?.error?.message || response.status}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text.trim()
}

// ============================================
// OPENAI
// ============================================
async function callOpenAI(prompt, temperature, maxTokens) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY tanımlı değil')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`OpenAI API hatası: ${err?.error?.message || response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// ============================================
// DEEPSEEK
// ============================================
async function callDeepSeek(prompt, temperature, maxTokens) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY tanımlı değil')

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`DeepSeek API hatası: ${err?.error?.message || response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}