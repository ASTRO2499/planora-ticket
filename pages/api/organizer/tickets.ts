import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import {
  getOrganizerSecret,
  checkOrganizerRateLimit,
  getClientIp,
  logAuthAttempt,
  requireOrganizerToken,
} from '../../../lib/organizerAuth'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Accepts per-event organizer secret.
 * DO NOT accept admin session cookies or admin secrets.
 */
function getOrganizerSecretLocal(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role.
 * DO NOT accept admin session cookies or admin secrets.
 */
async function requireOrganizerId(req: NextApiRequest) {
  const user = await requireOrganizerToken(req)
  return user?.id as string || null
}

/**
 * ORGANIZER PORTAL ENDPOINT
 * Authentication: Bearer token (organizer role) OR x-organizer-secret ONLY
 * DO NOT merge with admin authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIp(req)
  
  if (req.method !== 'GET' && req.method !== 'PUT') return res.status(405).end()

  const eventId = String(req.query.eventId || '')
  const statusFilter = String(req.query.status || '').toLowerCase()
  if (!eventId) return res.status(400).json({ error: 'missing_event_id' })

  // CRITICAL: Only organizer auth - reject admin session cookies
  const organizerSecret = getOrganizerSecretLocal(req)
  const organizerId = await requireOrganizerId(req)
  if (!organizerSecret && !organizerId) {
    logAuthAttempt('failure', { ip, endpoint: '/api/organizer/tickets', reason: 'no_credentials' })
    return res.status(401).json({ error: 'unauthorized' })
  }

  // SECURITY: Rate limit organizer secret attempts
  if (organizerSecret && !checkOrganizerRateLimit(organizerSecret, ip)) {
    logAuthAttempt('rate_limit', { ip, endpoint: '/api/organizer/tickets' })
    return res.status(429).json({ error: 'too_many_attempts' })
  }

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
  }

  if (req.method === 'GET') {
    let query = supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (statusFilter === 'checked') {
      query = query.eq('used', true)
    } else if (statusFilter === 'remaining') {
      query = query.eq('used', false)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tickets: data || [] })
  }

  if (req.method === 'PUT') {
    const { id, name, email, phone, college, ieee } = req.body
    if (!id) return res.status(400).json({ error: 'missing id' })

    // Verify ticket belongs to this event
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .eq('event_id', eventId)
      .maybeSingle()
    if (ticketErr || !ticket) return res.status(404).json({ error: 'not_found' })

    const updateData: any = {}
    if (name !== undefined && name.trim()) updateData.name = name.trim()
    if (email !== undefined && email.trim()) updateData.email = email.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (college !== undefined) updateData.college = college.trim()
    if (ieee !== undefined) updateData.ieee = ieee.trim()

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'no_fields_to_update' })
    }

    try {
      const { error } = await supabase.from('tickets').update(updateData).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, message: 'Delegate updated successfully' })
    } catch (e: any) {
      return res.status(500).json({ error: 'update_failed', message: e.message })
    }
  }

  res.status(405).end()
}
