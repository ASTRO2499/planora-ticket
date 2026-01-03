import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import {
  getOrganizerSecret,
  checkOrganizerRateLimit,
  getClientIp,
  logAuthAttempt,
  requireOrganizerToken,
} from '../../../lib/organizerAuth'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

async function requireOrganizer(req: NextApiRequest, eventId: string) {
  const ip = getClientIp(req)
  
  // Check organizer secret header - verify event ownership
  const secret = getOrganizerSecret(req)
  if (secret) {
    // SECURITY: Rate limit attempts
    if (!checkOrganizerRateLimit(secret, ip)) {
      logAuthAttempt('rate_limit', { ip, endpoint: '/api/organizer/form-settings' })
      return false
    }
    
    try {
      const { data: ev } = await supabase.from('events').select('id, organizer_id').eq('id', eventId).maybeSingle()
      if (ev && ev.organizer_id === secret) {
        logAuthAttempt('success', { ip, endpoint: '/api/organizer/form-settings', method: 'secret' })
        return true
      }
    } catch (err) {
      console.error('[ORGANIZER_ERROR] Event check error:', err)
    }
  }

  // Check Bearer token
  const organizer = await requireOrganizerToken(req)
  if (organizer) {
    logAuthAttempt('success', { ip, endpoint: '/api/organizer/form-settings', method: 'bearer' })
    return true
  }
  
  logAuthAttempt('failure', { ip, endpoint: '/api/organizer/form-settings', reason: 'no_valid_auth' })
  return false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_eventId' })
  const ok = await requireOrganizer(req, eventId)
  if (!ok) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase.from('event_form_settings').select('*').eq('event_id', eventId).maybeSingle()
    return res.json({ settings: data || { event_id: eventId, field_config: {} } })
  }

  if (req.method === 'POST') {
    const { field_config } = req.body || {}
    console.log('POST form-settings - field_config:', field_config)
    if (!field_config || typeof field_config !== 'object') {
      return res.status(400).json({ error: 'invalid_field_config', received: typeof field_config })
    }
    try {
      const { error } = await supabase.from('event_form_settings').upsert({ event_id: eventId, field_config })
      console.log('Upsert result:', { error: error?.message })
      if (error) return res.status(500).json({ error: 'save_failed', details: error.message })
      return res.json({ success: true })
    } catch (err: any) {
      console.error('POST error:', err)
      return res.status(500).json({ error: 'save_failed', details: err.message })
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
