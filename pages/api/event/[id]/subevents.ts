import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Missing event ID' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', id)
        .eq('is_published', true)
        .order('start_time', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ subEvents: data || [] })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
