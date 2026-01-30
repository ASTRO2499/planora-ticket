import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ADMIN ONLY: Check authentication
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' })

  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_eventId' })

  // GET: Fetch form settings for event
  if (req.method === 'GET') {
    try {
      const { data } = await supabase
        .from('event_form_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle()
      
      return res.json({
        settings: data || { event_id: eventId, field_config: {} }
      })
    } catch (err: any) {
      console.error('Error fetching form settings:', err)
      return res.status(500).json({ error: 'fetch_failed', details: err.message })
    }
  }

  // POST: Save form settings for event
  if (req.method === 'POST') {
    try {
      const { field_config } = req.body || {}

      if (!field_config || typeof field_config !== 'object') {
        return res.status(400).json({
          error: 'invalid_field_config',
          received: typeof field_config
        })
      }

      const { error } = await supabase
        .from('event_form_settings')
        .upsert({ event_id: eventId, field_config })

      if (error) {
        return res.status(500).json({
          error: 'save_failed',
          details: error.message
        })
      }

      return res.json({ success: true })
    } catch (err: any) {
      console.error('Error saving form settings:', err)
      return res.status(500).json({
        error: 'save_failed',
        details: err.message
      })
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
