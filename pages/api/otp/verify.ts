import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { signOtpToken } from '../../../lib/otp'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

interface VerifyOtpRequest {
  email: string
  code: string
}

interface VerifyOtpResponse {
  success?: boolean
  token?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyOtpResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, code } = req.body as VerifyOtpRequest

  // Validate input
  if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Email and code are required' })
  }

  try {
    // Query for the OTP record
    const { data: otpRecord, error: queryError } = await supabase
      .from('email_otps')
      .select('id, email, code, expires_at')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (queryError) {
      console.error('[OTP] Query error:', queryError)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!otpRecord) {
      console.warn(`[OTP] Invalid OTP attempt for email: ${email}`)
      return res.status(401).json({ error: 'Invalid OTP code' })
    }

    // Check if OTP has expired
    const expiresAt = new Date(otpRecord.expires_at)
    if (expiresAt < new Date()) {
      console.warn(`[OTP] Expired OTP for email: ${email}`)
      return res.status(401).json({ error: 'OTP has expired' })
    }

    // Mark OTP as used by deleting it
    await supabase
      .from('email_otps')
      .delete()
      .eq('id', otpRecord.id)

    // Generate a properly signed verification token (HMAC-based, 10 minute TTL)
    const verificationToken = signOtpToken(email, 600)

    console.log(`[OTP] Successful verification for email: ${email}`)

    return res.status(200).json({
      success: true,
      token: verificationToken
    })
  } catch (err: any) {
    console.error('[OTP] Verification error:', err)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
