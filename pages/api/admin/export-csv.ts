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

async function checkOrganizerAuth(req: NextApiRequest, eventId: string) {
  // Check organizer secret header - just verify it's provided for now
  const secret = req.headers['x-organizer-secret']
  console.log('checkOrganizerAuth - secret header:', secret, 'eventId:', eventId)
  if (typeof secret === 'string' && secret.trim()) {
    // For now, just verify the event exists
    try {
      const { data: ev } = await supabase.from('events').select('id').eq('id', eventId).maybeSingle()
      console.log('Event exists:', !!ev)
      if (ev) return true
    } catch (err) {
      console.error('Event check error:', err)
    }
  }

  // Check Bearer token
  const auth = req.headers.authorization
  console.log('checkOrganizerAuth - auth header:', auth ? 'present' : 'missing')
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

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow both admin and organizer access
  const isAdmin = checkAuth(req)
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing_eventId' })
  
  const isOrganizer = await checkOrganizerAuth(req, eventId)
  console.log('Export CSV - eventId:', eventId, 'isAdmin:', isAdmin, 'isOrganizer:', isOrganizer)
  if (!isAdmin && !isOrganizer) return res.status(403).json({ error: 'unauthorized' })
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(
        'id, event_id, name, email, phone, college, ieee, extra1, extra2, extra3, extra4, extra5, payment_id, razorpay_order_id, razorpay_payment_id, amount_paid, status, used, used_at, checked_in_at, certificate_issued, created_at'
      )
      .eq('event_id', eventId)

    console.log('Tickets query result:', { count: tickets?.length, error })
    if (error) throw error

    const header = [
      'event_id',
      'ticket_id',
      'name',
      'email',
      'phone',
      'college',
      'ieee',
      'extra1',
      'extra2',
      'extra3',
      'extra4',
      'extra5',
      'payment_id',
      'razorpay_order_id',
      'razorpay_payment_id',
      'amount_paid',
      'status',
      'used',
      'used_at',
      'checked_in_at',
      'certificate_issued',
      'created_at'
    ]

    const rows = (tickets || []).map((t: any) => [
      t.event_id || '',
      t.id,
      t.name || '',
      t.email || '',
      t.phone || '',
      t.college || '',
      t.ieee || '',
      t.extra1 || '',
      t.extra2 || '',
      t.extra3 || '',
      t.extra4 || '',
      t.extra5 || '',
      t.payment_id || '',
      t.razorpay_order_id || '',
      t.razorpay_payment_id || '',
      t.amount_paid ?? '',
      t.status || '',
      t.used ? 'TRUE' : 'FALSE',
      t.used_at || '',
      t.checked_in_at || '',
      t.certificate_issued ? 'TRUE' : 'FALSE',
      t.created_at || ''
    ])

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}-tickets.csv"`)
    return res.status(200).send(csv)
  } catch (err: any) {
    console.error('CSV export error:', err)
    return res.status(500).json({ error: 'csv_export_failed', message: err.message, details: err })
  }
}
