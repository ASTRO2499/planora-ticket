import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'
import { getTransport } from '../../../lib/mailer'
import { generateTicketConfirmationEmail } from '../../../lib/emailTemplates'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ADMIN AUTHENTICATION ONLY
 * This function validates ONLY admin session cookies.
 * DO NOT accept bearer tokens or organizer secrets.
 */
function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

/**
 * ADMIN PORTAL ENDPOINT
 * Authentication: Admin session cookie ONLY
 * DO NOT merge with organizer authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Only admin session auth - reject all organizer credentials
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const q = (req.query.q as string | undefined)?.trim()
    const eventId = (req.query.eventId as string | undefined)?.trim()
    const statusFilter = (req.query.status as string | undefined)?.trim()?.toLowerCase()
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(limit)
    if (eventId && eventId !== 'ALL') {
      query = query.eq('event_id', eventId)
    }
    if (statusFilter === 'checked') {
      query = query.eq('used', true)
    } else if (statusFilter === 'remaining') {
      query = query.eq('used', false)
    }
    if (q) {
      // search by id or email (case-insensitive)
      query = query.or(`id.ilike.%${q}%,email.ilike.%${q}%`, { foreignTable: 'tickets' })
    }
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'POST') {
    const { id, action } = req.body
    if (!id) return res.status(400).json({ error: 'missing id' })
    
    if (action === 'toggle') {
      const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()
      if (error) return res.status(404).json({ error: 'not_found' })
      const { error: e2 } = await supabase.from('tickets').update({ used: !ticket.used, used_at: ticket.used ? null : new Date() }).eq('id', id)
      if (e2) return res.status(500).json({ error: e2.message })
      return res.json({ ok: true })
    }
    
    if (action === 'delete') {
      const { error } = await supabase.from('tickets').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
    
    if (action === 'resend') {
      const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()
      if (error || !ticket) return res.status(404).json({ error: 'not_found' })

      try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
        const ticketUrl = `${baseUrl}/ticket/${ticket.id}`

        // Fetch event for title (optional)
        let eventTitle = 'Your Event'
        if (ticket.event_id) {
          const { data: event } = await supabase.from('events').select('title').eq('id', ticket.event_id).maybeSingle()
          if (event?.title) eventTitle = event.title
        }

        // Try to get signed PDF url if present in storage
        let pdfUrl: string | undefined = undefined
        try {
          const expires = Number(process.env.STORAGE_URL_EXPIRES || '604800')
          const { data: signed } = await supabase.storage.from('tickets').createSignedUrl(`${ticket.id}.pdf`, expires)
          pdfUrl = signed?.signedUrl
        } catch {}

        const pdfUrlToUse = pdfUrl || ticketUrl
        const emailHtml = generateTicketConfirmationEmail({
          name: ticket.name,
          email: ticket.email,
          eventTitle,
          ticketId: ticket.id,
          qrCodeUrl: 'cid:qrcode',
          viewTicketUrl: ticketUrl,
          pdfDownloadUrl: pdfUrlToUse,
        })

        // Convert QR code data URL to buffer for email attachment
        const qrCodeBuffer = ticket.qr ? Buffer.from(ticket.qr.replace(/^data:image\/\w+;base64,/, ''), 'base64') : null

        const transporter = getTransport()
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@planora.app',
          to: ticket.email,
          subject: `Your Entry Pass for ${eventTitle} (Resent)`,
          html: emailHtml,
          attachments: qrCodeBuffer ? [{
            filename: 'qrcode.png',
            content: qrCodeBuffer,
            cid: 'qrcode'
          }] : []
        })

        return res.json({ ok: true, message: 'Email resent successfully' })
      } catch (e: any) {
        return res.status(500).json({ error: 'resend_failed', message: e.message })
      }
    }
    
    return res.status(400).json({ error: 'invalid_action' })
  }

  if (req.method === 'PUT') {
    const { id, name, email, phone, college, ieee } = req.body
    if (!id) return res.status(400).json({ error: 'missing id' })

    const updateData: any = {}
    if (name !== undefined && name.trim()) updateData.name = name.trim()
    if (email !== undefined && email.trim()) updateData.email = email.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (college !== undefined) updateData.college = college.trim()
    if (ieee !== undefined) updateData.ieee = ieee.trim()

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'no_fields_to_update' })
    }

    try {
      const { error } = await supabase.from('tickets').update(updateData).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, message: 'Delegate updated successfully' })
    } catch (e: any) {
      return res.status(500).json({ error: 'update_failed', message: e.message })
    }
  }

  res.status(405).end()
}
