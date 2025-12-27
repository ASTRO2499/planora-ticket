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
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const eventId = String(req.query.eventId || '')
    if (!eventId) return res.status(400).json({ error: 'missing eventId' })

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

  if (req.method === 'POST') {
    const { eventId } = req.body || {}
    if (!eventId) return res.status(400).json({ error: 'missing eventId' })

    try {
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

      const certificatesToCreate: any[] = []
      const ticketsToUpdate: any[] = []

      for (const ticket of tickets) {
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
            certificate_data: { issued_by: 'Admin', bulk_generated: true }
          })
          ticketsToUpdate.push(ticket.id)
        }
      }

      if (certificatesToCreate.length > 0) {
        const { error: insertError } = await supabase.from('certificates').insert(certificatesToCreate)
        if (insertError) throw insertError

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
      console.error('Admin certificate generation error:', error)
      return res.status(500).json({ error: 'certificate_generation_failed', details: error.message })
    }
  }

  return res.status(405).end()
}
