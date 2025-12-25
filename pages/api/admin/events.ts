import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('events').select('id, title, organizer_id').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ events: data || [] })
  }

  if (req.method === 'PUT') {
    const { id, organizer_id } = req.body || {}
    if (!id || typeof organizer_id !== 'string' || !organizer_id.trim()) return res.status(400).json({ error: 'missing_params' })
    const { error } = await supabase.from('events').update({ organizer_id: organizer_id.trim() }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  return res.status(405).end()
}
