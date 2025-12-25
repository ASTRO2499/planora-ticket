import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { name, email, amount: bodyAmount } = req.body
  const key = process.env.RAZORPAY_KEY_ID || ''
  const secret = process.env.RAZORPAY_KEY_SECRET || ''
  if (!key || !secret) {
    console.error('Razorpay keys are not configured')
    return res.status(500).json({ error: 'razorpay_not_configured', message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required' })
  }
  const razorpay = new Razorpay({ key_id: key, key_secret: secret })

  // Use amount from body (event price) or fallback to default
  // Ideally we should verify this against DB, but for now we trust the client's fetched data
  const amount = Number(bodyAmount) || Number(process.env.TICKET_PRICE_PAISE || '100000') || 100000

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { name, email } // Optional: add simple notes
    })
    return res.json({ orderId: order.id, amount: order.amount, razorpayKey: key })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'order_failed' })
  }
}
