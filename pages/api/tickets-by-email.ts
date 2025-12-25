import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyOtpToken } from '../../lib/otp'

const BUCKET = 'tickets'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_KEY || ''
  if (!url || !key) throw new Error('Supabase credentials missing')
  return createClient(url, key)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const otpTokenHeader = req.headers['x-otp-token']
  const otpToken = typeof otpTokenHeader === 'string' ? otpTokenHeader : undefined
  const v = verifyOtpToken(otpToken)
  if (!v.ok || v.email?.toLowerCase() !== email) return res.status(401).json({ error: 'otp_required' })
  if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'invalid_email' })

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) return res.status(500).json({ error: error.message })

    const tickets = data || [] as any[]
    // Attach signed PDF links
    const enriched = await Promise.all(tickets.map(async (t: any) => {
      const filePath = `${t.id}.pdf`
      const expires = Number(process.env.STORAGE_URL_EXPIRES || '604800')
      const { data: signed, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expires)
      return {
        ...t,
        pdfUrl: signed?.signedUrl || `${process.env.BASE_URL || 'http://localhost:3000'}/ticket/${t.id}`,
        storageError: signedErr?.message,
      }
    }))

    return res.json({ tickets: enriched })
  } catch (err) {
    console.error('tickets-by-email error', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
