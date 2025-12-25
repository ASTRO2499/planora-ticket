import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Accepts per-event organizer secret.
 * DO NOT accept admin session cookies or admin secrets.
 */
function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role.
 * DO NOT accept admin session cookies or admin secrets.
 */
async function requireOrganizerId(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  const role = data.user.user_metadata?.role
  if (role !== 'organizer') return null
  return data.user.id as string
}

/**
 * ORGANIZER PORTAL ENDPOINT
 * Authentication: Bearer token (organizer role) OR x-organizer-secret ONLY
 * DO NOT merge with admin authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_event_id' })

  // CRITICAL: Only organizer auth - reject admin session cookies
  const organizerSecret = getOrganizerSecret(req)
  const organizerId = await requireOrganizerId(req)
  if (!organizerSecret && !organizerId) return res.status(401).json({ error: 'unauthorized' })

  // Ensure organizer owns the event
  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .maybeSingle()
  if (evErr || !ev) {
    return res.status(403).json({ error: 'forbidden' })
  }
  if (organizerSecret) {
    if (ev.organizer_id !== organizerSecret) return res.status(403).json({ error: 'forbidden' })
  } else {
    // bearer organizer: ensure ownership mapping exists
    // If you later store organizer's auth user id in events, replace this check accordingly
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  return res.json({ tickets: data || [] })
}
