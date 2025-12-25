import type { NextApiRequest, NextApiResponse } from 'next'

// Lazy import to avoid build errors if SDK missing at runtime
let GoogleGenerativeAI: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI
} catch {}

const SYSTEM_PROMPT = `You are ASTRO, the Planora event assistant. Your personality:
- Friendly, enthusiastic, and helpful
- Concise responses (2-3 sentences max)
- Focus on AKCOMSOC 2025, event registration, tickets, pricing, payment, venue, schedule
- Can help with technical issues like OTP, email verification, ticket downloads
- If uncertain, direct to support@planora.app or /my-tickets page

Key facts:
- Event: AKCOMSOC 2025 (5G networks and Communication IoT)
- Fee: ₹1000
- Registration: /akcomsoc-2025
- Tickets: /my-tickets (email verification required)
- Payment: Razorpay (secure, instant)
- Support: support@planora.app

Always be encouraging about registration and events!`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey || !GoogleGenerativeAI) {
    return res.status(501).json({ error: 'not_configured' })
  }

  try {
    const { message, history } = req.body as { message?: string; history?: Array<{ role: string; text: string }> }
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return res.status(400).json({ error: 'invalid_request' })
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Build context with conversation history
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Got it! I\'m ASTRO, ready to help with AKCOMSOC 2025 and Planora.' }] },
      ...(Array.isArray(history) && history.length > 0
        ? history.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          }))
        : []),
      { role: 'user', parts: [{ text: message }] }
    ]

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7
      }
    })

    const text =
      result?.response?.text?.() ||
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I couldn\'t process that. Try asking about registration, tickets, or pricing!'

    return res.status(200).json({ text: text.trim() })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return res.status(500).json({
      error: 'gemini_error',
      text: 'Sorry, I\'m having trouble. Try again or contact support@planora.app'
    })
  }
}
