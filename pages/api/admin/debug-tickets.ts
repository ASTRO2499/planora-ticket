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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check admin auth
  const isValid = checkAuth(req)
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const eventId = req.query.eventId as string

  try {
    // Test 1: Get ALL tickets
    console.log('[DEBUG TICKETS] Test 1: Fetching ALL tickets')
    const { data: allTickets, error: allError } = await supabase.from('tickets').select('*')
    console.log('[DEBUG TICKETS] All tickets:', { count: allTickets?.length || 0, error: allError?.message })
    
    // Test 2: Get tickets with specific SELECT
    console.log('[DEBUG TICKETS] Test 2: Fetching with id,name,email,qr,event_id,sub_event_id')
    const { data: selectTickets, error: selectError } = await supabase.from('tickets').select('id,name,email,qr,event_id,sub_event_id')
    console.log('[DEBUG TICKETS] With SELECT:', { count: selectTickets?.length || 0, error: selectError?.message })
    
    // Test 3: Filter by eventId with all columns
    if (eventId) {
      console.log('[DEBUG TICKETS] Test 3: Filtering for eventId with SELECT *:', eventId)
      const { data: filterAll, error: filterError1 } = await supabase.from('tickets').select('*').eq('event_id', eventId)
      console.log('[DEBUG TICKETS] Result:', { count: filterAll?.length || 0, error: filterError1?.message })
      
      // Test 4: Filter by eventId with specific columns
      console.log('[DEBUG TICKETS] Test 4: Filtering for eventId with specific SELECT:', eventId)
      const { data: filterSelect, error: filterError2 } = await supabase.from('tickets').select('id,name,email,qr,event_id,sub_event_id').eq('event_id', eventId)
      console.log('[DEBUG TICKETS] Result:', { count: filterSelect?.length || 0, error: filterError2?.message })
      
      // Test 5: Check RLS - try with anon key
      const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )
      console.log('[DEBUG TICKETS] Test 5: With anon key')
      const { data: anonResult, error: anonError } = await anonSupabase.from('tickets').select('id,event_id').eq('event_id', eventId)
      console.log('[DEBUG TICKETS] Anon result:', { count: anonResult?.length || 0, error: anonError?.message })
    }

    // Test 6: Show sample ticket structure
    console.log('[DEBUG TICKETS] Test 6: Sample ticket from database')
    if (allTickets && allTickets.length > 0) {
      console.log('[DEBUG TICKETS] First ticket full structure:', JSON.stringify(allTickets[0], null, 2))
    }

    return res.status(200).json({
      success: true,
      tests: {
        allTicketsCount: allTickets?.length || 0,
        selectTicketsCount: selectTickets?.length || 0,
        sampleTicket: allTickets?.[0] || null
      }
    })
  } catch (error) {
    console.error('[DEBUG TICKETS] Exception:', error)
    return res.status(500).json({ error: String(error) })
  }
}
