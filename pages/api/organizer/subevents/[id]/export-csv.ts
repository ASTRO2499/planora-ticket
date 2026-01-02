import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

async function requireOrganizer(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data } = await supabase.auth.getUser(token)
  const role = data?.user?.user_metadata?.role
  if (role === 'organizer' || role === 'admin') return data?.user || null
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const organizerSecretRaw = typeof req.headers['x-organizer-secret'] === 'string'
      ? req.headers['x-organizer-secret'].trim()
      : ''
    const organizerSecret = organizerSecretRaw || null
    const organizerUser = await requireOrganizer(req)

    if (!organizerSecret && !organizerUser) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Sub-event ID is required' })
    }

    // Fetch sub-event and parent event
    const { data: subEvent, error: subEventError } = await supabase
      .from('sub_events')
      .select('id, event_id, title')
      .eq('id', id)
      .single()

    if (subEventError || !subEvent) {
      return res.status(404).json({ error: 'Sub-event not found' })
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', subEvent.event_id)
      .single()

    const organizerUserId = organizerUser?.user_metadata?.organizer_id || organizerUser?.id
    const secretMatches = Boolean(organizerSecret && event?.organizer_id === organizerSecret)
    const bearerMatches = Boolean(organizerUser && organizerUserId && event?.organizer_id === organizerUserId)

    if (eventError || !event || (!secretMatches && !bearerMatches)) {
      return res.status(403).json({
        error: 'Unauthorized',
        details: {
          secretProvided: Boolean(organizerSecret),
          bearerProvided: Boolean(organizerUser),
          eventOrganizerIdPresent: Boolean(event?.organizer_id),
          eventOrganizerSecretPresent: false,
          secretMatches,
          bearerMatches
        }
      })
    }

    // Get registrations
    const { data: registrations, error } = await supabase
      .from('sub_event_registrations')
      .select('*')
      .eq('sub_event_id', id)
      .order('registered_at', { ascending: false })

    if (error) {
      console.error('Error fetching registrations:', error)
      return res.status(500).json({ error: 'Failed to fetch registrations' })
    }

    // Generate CSV
    const csvRows = []
    csvRows.push(['Name', 'Email', 'Phone', 'College', 'Notes', 'Payment Method', 'Payment Status', 'Checked In', 'Registered At'])

    registrations?.forEach(reg => {
      csvRows.push([
        reg.name || '',
        reg.email || '',
        reg.phone || '',
        reg.college || '',
        reg.notes || '',
        reg.payment_method || '',
        reg.payment_status || '',
        reg.checked_in ? 'Yes' : 'No',
        reg.registered_at || ''
      ])
    })

    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${id}.csv"`)
    return res.status(200).send(csvContent)
  } catch (error: any) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
