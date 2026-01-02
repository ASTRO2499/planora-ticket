import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Missing registration ID' })
    }

    const { data: registration, error } = await supabase
      .from('sub_event_registrations')
      .select('*, sub_events(*)')
      .eq('id', id)
      .single()

    if (error || !registration) {
      return res.status(404).json({ error: 'Registration not found' })
    }

    return res.status(200).json({
      success: true,
      registration
    })
  } catch (error: any) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
