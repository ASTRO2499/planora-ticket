import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Sub-event ID is required' })
    }

    // Fetch sub-event with registration count
    const { data: subEvent, error: subEventError } = await supabase
      .from('sub_events')
      .select(`
        *,
        current_registrations:sub_event_registrations(count)
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (subEventError || !subEvent) {
      return res.status(404).json({ error: 'Sub-event not found' })
    }

    // Calculate current registrations
    const currentRegistrations = subEvent.current_registrations?.[0]?.count || 0

    return res.status(200).json({
      subEvent: {
        ...subEvent,
        current_registrations: currentRegistrations
      }
    })
  } catch (error: any) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
