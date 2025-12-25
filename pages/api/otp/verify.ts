import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { signOtpToken } from '../../../lib/otp'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'missing_params' })

  const { data, error } = await supabase
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return res.status(401).json({ error: 'invalid_code' })
  if (new Date(data.expires_at).getTime() < Date.now()) return res.status(401).json({ error: 'expired' })

  await supabase.from('email_otps').update({ used: true }).eq('id', data.id)

  const token = signOtpToken(email)
  return res.json({ ok: true, token })
}
