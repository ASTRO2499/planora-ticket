import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

/**
 * ORGANIZER AUTHENTICATION ONLY
 * Validates bearer token with organizer role or organizer secret.
 */
async function requireOrganizer(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    const { data } = await supabase.auth.getUser(token)
    const role = data?.user?.user_metadata?.role
    if (role === 'organizer') return data?.user || null
  }
  return null
}

function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const organizer = await requireOrganizer(req)
  const organizerSecret = getOrganizerSecret(req)
  if (!organizer && !organizerSecret) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'POST') {
    // Generate certificates for all checked-in attendees of an event
    const { eventId } = req.body
    if (!eventId) return res.status(400).json({ error: 'missing eventId' })

    // Verify organizer owns this event
    if (organizerSecret) {
      const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_secret').eq('id', eventId).maybeSingle()
      if (evErr || !ev || ev.organizer_secret !== organizerSecret) {
        console.error('Event verification failed:', evErr, 'Event:', ev)
        return res.status(403).json({ error: 'forbidden', details: 'Invalid organizer secret for this event' })
      }
    }

    try {
      // Get all tickets that were used (checked in) for this event
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('used', true)
        .eq('status', 'issued')

      if (ticketsError) throw ticketsError
      if (!tickets || tickets.length === 0) {
        return res.json({ message: 'No attendees to generate certificates for', count: 0 })
      }

      // Generate certificates for tickets that don't have one yet
      const certificatesToCreate = []
      const ticketsToUpdate = []

      for (const ticket of tickets) {
        // Check if certificate already exists
        const { data: existing } = await supabase
          .from('certificates')
          .select('id')
          .eq('ticket_id', ticket.id)
          .maybeSingle()

        if (!existing) {
          certificatesToCreate.push({
            ticket_id: ticket.id,
            event_id: ticket.event_id,
            attendee_name: ticket.name,
            attendee_email: ticket.email,
            certificate_data: { issued_by: 'Event Organizer', bulk_generated: true }
          })
          ticketsToUpdate.push(ticket.id)
        }
      }

      if (certificatesToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('certificates')
          .insert(certificatesToCreate)

        if (insertError) throw insertError

        // Update tickets to mark certificate as issued
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ certificate_issued: true })
          .in('id', ticketsToUpdate)

        if (updateError) throw updateError
      }

      return res.json({
        success: true,
        message: `Generated ${certificatesToCreate.length} new certificates`,
        total_attendees: tickets.length,
        new_certificates: certificatesToCreate.length,
        existing_certificates: tickets.length - certificatesToCreate.length
      })
    } catch (error: any) {
      console.error('Certificate generation error:', error)
      return res.status(500).json({ error: 'certificate_generation_failed', details: error.message })
    }
  }

  if (req.method === 'GET') {
    // Get certificate stats for an event
    const eventId = String(req.query.eventId || '')
    if (!eventId) return res.status(400).json({ error: 'missing eventId' })

    if (organizerSecret) {
      const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_secret').eq('id', eventId).maybeSingle()
      if (evErr || !ev || ev.organizer_secret !== organizerSecret) {
        console.error('Event verification failed for stats:', evErr)
        return res.status(403).json({ error: 'forbidden', details: 'Invalid organizer secret for this event' })
      }
    }

    try {
      const { count: totalAttended } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('used', true)

      const { count: certificatesIssued } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      return res.json({
        event_id: eventId,
        total_attended: totalAttended || 0,
        certificates_issued: certificatesIssued || 0,
        pending: Math.max(0, (totalAttended || 0) - (certificatesIssued || 0))
      })
    } catch (error: any) {
      return res.status(500).json({ error: 'stats_fetch_failed', details: error.message })
    }
  }

  return res.status(405).end()
}
