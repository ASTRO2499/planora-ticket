import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'
import { generateOtpVerificationEmail } from '../../../lib/emailTemplates'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'invalid_email' })

  const code = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  const { error } = await supabase.from('email_otps').insert({ email, code, expires_at: expiresAt })
  if (error) {
    console.error('otp_store_failed', error)
    return res.status(500).json({ error: 'otp_store_failed', detail: error.message })
  }

  try {
    const transport = getTransport()
    const emailHtml = generateOtpVerificationEmail({
      otpCode: code
    })

    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@planora.app',
      to: email,
      subject: 'Verify Your Email - Planora Tickets',
      html: emailHtml
    })
  } catch (e) {
    return res.status(500).json({ error: 'otp_send_failed' })
  }

  return res.json({ ok: true })
}
