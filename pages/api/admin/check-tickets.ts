import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get recent tickets from Supabase
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Supabase query error:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch tickets',
        details: error.message 
      })
    }

    // Get count of all tickets
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    return res.json({
      success: true,
      total_tickets: count || 0,
      recent_tickets: tickets || [],
      sample_ticket: tickets?.[0] || null,
      message: `Found ${count || 0} tickets in database`
    })
  } catch (err) {
    console.error('Check tickets error:', err)
    return res.status(500).json({ 
      error: 'Server error',
      details: (err as Error)?.message 
    })
  }
}
