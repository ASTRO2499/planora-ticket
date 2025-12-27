import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

async function requireOrganizer(req: NextApiRequest, eventId: string) {
  // Check organizer secret header - just verify the event exists
  const secret = req.headers['x-organizer-secret']
  console.log('requireOrganizer - secret header:', secret, 'eventId:', eventId)
  if (typeof secret === 'string' && secret.trim()) {
    try {
      const { data: ev } = await supabase.from('events').select('id').eq('id', eventId).maybeSingle()
      console.log('Event exists for secret auth:', !!ev)
      if (ev) return true
    } catch (err) {
      console.error('Event check error:', err)
    }
  }

  // Check Bearer token
  const auth = req.headers.authorization
  console.log('requireOrganizer - auth header:', auth ? 'present' : 'missing')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    try {
      const { data } = await supabase.auth.getUser(token)
      const role = data?.user?.user_metadata?.role
      console.log('Bearer token - role:', role)
      if (role === 'organizer') return true
    } catch (err) {
      console.error('Bearer token check error:', err)
    }
  }
  
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
