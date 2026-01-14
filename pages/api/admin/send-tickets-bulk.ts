import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'
import { getTransport } from '../../../lib/mailer'
import { generateTicketConfirmationEmail } from '../../../lib/emailTemplates'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

async function getEventDetails(eventId: string) {
  const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
  return data
}

async function getSubEventDetails(subEventId: string) {
  const { data } = await supabase.from('sub_events').select('*').eq('id', subEventId).single()
  return data
}

async function getTicketsBySubEvent(subEventId: string) {
  const { data } = await supabase.from('tickets').select('id,name,email,qr,event_id').eq('event_id', subEventId)
  return data || []
}

async function getTicketsByEvent(eventId: string) {
  console.log('[GET TICKETS BY EVENT] Querying for eventId:', eventId)
  const { data, error } = await supabase.from('tickets').select('id,name,email,qr,event_id').eq('event_id', eventId)
  console.log('[GET TICKETS BY EVENT] Result:', { count: data?.length || 0, error: error?.message })
  if (error) console.error('[GET TICKETS BY EVENT] Error:', error)
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

  // Check admin auth
  const isValid = checkAuth(req)
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { eventId, subEventId } = req.body
  console.log('[SEND TICKETS BULK] Received body:', { eventId, subEventId })

  if (!eventId) {
    console.error('[SEND TICKETS BULK] Missing eventId!')
    return res.status(400).json({ error: 'Missing eventId' })
  }

  try {
    // Get event details
    const event = await getEventDetails(eventId)
    console.log('[SEND TICKETS BULK] Event found:', event?.title || 'NOT FOUND')

    if (!event) {
      console.error('[SEND TICKETS BULK] Event not found for eventId:', eventId)
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get tickets - either for sub-event or for the entire event
    let tickets
    if (subEventId) {
      const subEvent = await getSubEventDetails(subEventId)
      if (!subEvent) {
        console.error('[SEND TICKETS BULK] Sub-event not found for subEventId:', subEventId)
        return res.status(404).json({ error: 'Sub-event not found' })
      }
      tickets = await getTicketsBySubEvent(subEventId)
    } else {
      tickets = await getTicketsByEvent(eventId)
    }
    
    console.log('[SEND TICKETS BULK] Tickets found:', tickets.length)

    if (tickets.length === 0) {
      console.log('[SEND TICKETS BULK] No tickets found for eventId:', eventId)
      
      // Debug: check what event_ids exist in the database
      const { data: allTickets } = await supabase.from('tickets').select('id,event_id,sub_event_id,email').limit(20)
      console.log('[SEND TICKETS BULK] All tickets in database (first 20):', allTickets?.map((t: any) => ({
        id: t.id,
        email: t.email,
        event_id: t.event_id,
        sub_event_id: t.sub_event_id
      })))
      
      const uniqueEventIds = [...new Set(allTickets?.map((t: any) => t.event_id) || [])]
      console.log('[SEND TICKETS BULK] Unique event_ids in database:', uniqueEventIds)
      console.log('[SEND TICKETS BULK] Searching for eventId:', eventId)
      
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
    console.error('Error sending bulk tickets:', error)
    return res.status(500).json({
      error: 'Failed to send tickets',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
