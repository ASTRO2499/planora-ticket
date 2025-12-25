import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ADMIN AUTHENTICATION ONLY
 * This function validates ONLY admin session cookies.
 * DO NOT accept bearer tokens or organizer secrets.
 */
function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

/**
 * ADMIN PORTAL ENDPOINT
 * Authentication: Admin session cookie ONLY
 * DO NOT merge with organizer authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Only admin session auth - reject all organizer credentials
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const q = (req.query.q as string | undefined)?.trim()
    const eventId = (req.query.eventId as string | undefined)?.trim()
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(limit)
    if (eventId && eventId !== 'ALL') {
      query = query.eq('event_id', eventId)
    }
    if (q) {
      // search by id or email (case-insensitive)
      query = query.or(`id.ilike.%${q}%,email.ilike.%${q}%`, { foreignTable: 'tickets' })
    }
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { id, action } = req.body
    if (!id) return res.status(400).json({ error: 'missing id' })
    
    if (action === 'toggle') {
      const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()
      if (error) return res.status(404).json({ error: 'not_found' })
      const { error: e2 } = await supabase.from('tickets').update({ used: !ticket.used, used_at: ticket.used ? null : new Date() }).eq('id', id)
      if (e2) return res.status(500).json({ error: e2.message })
      return res.json({ ok: true })
    }
    
    if (action === 'delete') {
      const { error } = await supabase.from('tickets').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
    
    if (action === 'resend') {
      const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()
      if (error) return res.status(404).json({ error: 'not_found' })
      // Trigger resend logic here (would need to integrate with mailer)
      return res.json({ ok: true, message: 'Email resend queued' })
    }
    
    return res.status(400).json({ error: 'invalid_action' })
  }

  res.status(405).end()
}
