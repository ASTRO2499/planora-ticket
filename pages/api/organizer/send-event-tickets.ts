import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'
import { generateTicketConfirmationEmail } from '../../../lib/emailTemplates'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

async function verifyOrganizerAuth(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret'] as string
  const token = req.headers['authorization'] as string

  // If organizer secret is provided, verify it
  if (secret) {
    const { data: event } = await supabase
      .from('events')
      .select('organizer_secret')
      .eq('organizer_secret', secret)
      .single()
    return !!event
  }

  // If token is provided, verify it
  if (token) {
    try {
      const { data } = await supabase.auth.getUser(token.replace('Bearer ', ''))
      return data.user?.user_metadata?.role === 'organizer'
    } catch {
      return false
    }
  }

  return false
}

async function getEventDetails(eventId: string) {
  const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
  return data
}

async function getTicketsByEvent(eventId: string) {
  console.log('[SEND TICKETS] Fetching tickets for eventId:', eventId)
  const { data } = await supabase.from('tickets').select('id,name,email,qr,event_id').eq('event_id', eventId)
  console.log('[SEND TICKETS] Found tickets:', data?.length || 0)
  
  // Also check what event_ids exist in database
  const { data: allTickets } = await supabase.from('tickets').select('event_id')
  const uniqueEventIds = [...new Set(allTickets?.map((t: any) => t.event_id) || [])]
  console.log('[SEND TICKETS] All unique event_ids in database:', uniqueEventIds)
  
  return data || []
}

async function getTemplateConfig(eventId: string) {
  try {
    const { data, error } = await supabase.storage.from('ticket-templates').download(`templates/${eventId}.json`)
    if (error || !data) return null
    const buf = Buffer.from(await data.arrayBuffer())
    const json = JSON.parse(buf.toString('utf-8'))
    return json as { brandPrimary?: string; brandAccent?: string; brandDark?: string; headerTitle?: string }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check organizer auth
  const isValid = await verifyOrganizerAuth(req)
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { eventId } = req.body

  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' })
  }

  try {
    // Get event details
    const event = await getEventDetails(eventId)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get all tickets for this event
    const tickets = await getTicketsByEvent(eventId)

    if (tickets.length === 0) {
      return res.status(400).json({ error: 'No tickets found for this event' })
    }

    // Get template config
    const template = await getTemplateConfig(eventId)
    const brandPrimary = template?.brandPrimary || '#7C3AED'
    const brandAccent = template?.brandAccent || '#EC4899'
    const brandDark = template?.brandDark || '#1F2937'
    const headerTitle = template?.headerTitle || 'ENTRY PASS'

    // Get email transporter
    const transporter = getTransport()
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' })
    }

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    // Send email to each ticket holder
    for (const ticket of tickets) {
      try {
        const viewTicketUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://planora.app'}/ticket/${ticket.id}`
        const pdfDownloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://planora.app'}/api/ticket-pdf?id=${ticket.id}`
        // Use CID for embedded QR code instead of data URL
        const qrCodeUrl = ticket.qr ? 'cid:qrcode' : undefined

        const emailHtml = generateTicketConfirmationEmail({
          name: ticket.name || 'Attendee',
          email: ticket.email || '',
          eventTitle: event.title || 'Event',
          ticketId: ticket.id,
          qrCodeUrl,
          viewTicketUrl,
          pdfDownloadUrl,
          eventDate: event.date,
          eventLocation: event.location,
          eventDescription: event.description,
          brandPrimary,
          brandAccent,
          brandDark,
          headerTitle
        })

        // Convert QR code base64 data URL to buffer for email attachment
        const qrCodeBuffer = ticket.qr 
          ? Buffer.from(ticket.qr.replace(/^data:image\/\w+;base64,/, ''), 'base64') 
          : null

        const mailOptions: any = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@planora.app',
          to: ticket.email,
          subject: `Your ${event.title || 'Event'} Ticket is Ready`,
          html: emailHtml,
          attachments: []
        }

        // Attach QR code as inline image
        if (qrCodeBuffer) {
          mailOptions.attachments.push({
            filename: 'qrcode.png',
            content: qrCodeBuffer,
            cid: 'qrcode'
          })
        }

        await transporter.sendMail(mailOptions)

        successCount++
      } catch (error) {
        failureCount++
        errors.push(`Failed to send to ${ticket.email}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sent ${successCount}/${tickets.length} emails`,
      successCount,
      failureCount,
      totalTickets: tickets.length,
      errors: errors.slice(0, 5) // Return first 5 errors
    })
  } catch (error) {
    console.error('Error sending event tickets:', error)
    return res.status(500).json({
      error: 'Failed to send tickets',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
