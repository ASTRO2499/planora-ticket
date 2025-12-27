import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_eventId' })

  const { data } = await supabase.from('event_form_settings').select('*').eq('event_id', eventId).maybeSingle()
  return res.json({ settings: data || { event_id: eventId, field_config: {} } })
}
