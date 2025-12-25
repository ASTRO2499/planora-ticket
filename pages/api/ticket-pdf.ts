import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

async function getEventById(eventId?: string | null) {
  if (!eventId) return null
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
  if (error) return null
  return data
}

async function getTemplateConfig(eventId?: string | null) {
  if (!eventId) return null
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
  const id = String(req.query.id || '')
  if (!id) return res.status(400).json({ error: 'missing id' })

  const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()
  if (error || !ticket) return res.status(404).json({ error: 'not_found' })

  const imgData = ticket.qr || ''

  // Fetch event details and template config
  const event = await getEventById(ticket.event_id)
  const template = await getTemplateConfig(ticket.event_id)

  // Brand colors - use template if available, otherwise use default gradient colors
  const brandPrimary = template?.brandPrimary || '#7C3AED' // Purple
  const brandAccent = template?.brandAccent || '#EC4899' // Pink
  const brandDark = template?.brandDark || '#1F2937' // Dark gray

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}.pdf"`)

  const doc = new PDFDocument({ size: 'A4', margin: 0 })
  const buffers: any[] = []
  const stream = new PassThrough()
  stream.on('data', (chunk) => buffers.push(chunk))
  doc.pipe(stream)

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  // ===== HEADER SECTION =====
  doc.rect(0, 0, pageWidth, 100).fill(brandPrimary)
  doc.fillColor('#FFFFFF')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(template?.headerTitle || 'ENTRY PASS', 40, 28, { align: 'left' })
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('rgba(255,255,255,0.8)')
    .text('Powered by PLANORA', 40, 64)

  // ===== EVENT CARD SECTION =====
  const eventCardTop = 120
  const eventCardHeight = 140
  
  // Card background
  doc.roundedRect(30, eventCardTop, pageWidth - 60, eventCardHeight, 10)
    .fill('rgba(124,58,237,0.05)')
    .stroke(brandPrimary)
    .lineWidth(1.5)

  // Event title
  doc.fillColor(brandDark)
    .fontSize(12)
    .font('Helvetica')
    .text('EVENT', 50, eventCardTop + 15)
  
  const eventTitle = event?.title || String(ticket.event_id || 'Event Ticket')
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(brandPrimary)
    .text(eventTitle, 50, eventCardTop + 32, { width: pageWidth - 200, ellipsis: true })

  // Event date and location if available
  if (event?.date || event?.location) {
    let eventInfo = ''
    if (event?.date) {
      const eventDate = new Date(event.date)
      eventInfo = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    if (event?.location) {
      eventInfo += (eventInfo ? ' • ' : '') + event.location
    }
    doc.fontSize(11)
      .fillColor('#6B7280')
      .text(eventInfo, 50, eventCardTop + 60)
  }

  // Event description preview
  if (event?.description) {
    const descPreview = String(event.description).slice(0, 80)
    doc.fontSize(9)
      .fillColor('#9CA3AF')
      .text(descPreview, 50, eventCardTop + 80, { width: pageWidth - 100 })
  }

  // Ticket ID in event card
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#64748B')
    .text(`ID: ${id.slice(0, 8).toUpperCase()}`, 50, eventCardTop + 110)

  // ===== ATTENDEE INFO SECTION =====
  const attendeeTop = eventCardTop + eventCardHeight + 30
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(brandDark)
    .text('ATTENDEE INFORMATION', 40, attendeeTop)

  // Separator line
  doc.moveTo(40, attendeeTop + 22)
    .lineTo(pageWidth - 40, attendeeTop + 22)
    .stroke('#E5E7EB')
    .lineWidth(1)

  // Info fields with better spacing
  const infoFieldTop = attendeeTop + 40
  const fieldSpacing = 35

  // Name
  doc.fontSize(9)
    .fillColor('#9CA3AF')
    .font('Helvetica')
    .text('FULL NAME', 40, infoFieldTop)
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(String(ticket.name || 'N/A'), 40, infoFieldTop + 16)

  // Email
  doc.fontSize(9)
    .fillColor('#9CA3AF')
    .font('Helvetica')
    .text('EMAIL', 40, infoFieldTop + fieldSpacing)
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#374151')
    .text(String(ticket.email || 'N/A'), 40, infoFieldTop + fieldSpacing + 16)

  // Phone if available
  if (ticket.phone) {
    doc.fontSize(9)
      .fillColor('#9CA3AF')
      .font('Helvetica')
      .text('PHONE', 40, infoFieldTop + fieldSpacing * 2)
    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#374151')
      .text(String(ticket.phone), 40, infoFieldTop + fieldSpacing * 2 + 16)
  }

  // Status badge
  doc.rect(pageWidth - 180, infoFieldTop, 140, 35)
    .fill('#ECFDF5')
    .stroke('#10B981')
    .lineWidth(1)
  
  doc.fontSize(9)
    .fillColor('#059669')
    .font('Helvetica-Bold')
    .text('✓ VERIFIED', pageWidth - 170, infoFieldTop + 10, { align: 'center' })

  // ===== QR CODE SECTION =====
  const qrSectionTop = infoFieldTop + 120
  
  // QR card background
  doc.roundedRect(30, qrSectionTop, pageWidth - 60, 240, 10)
    .fill('rgba(236,72,153,0.03)')
    .stroke(brandAccent)
    .lineWidth(1.5)

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(brandDark)
    .text('SCAN TO VERIFY', 50, qrSectionTop + 15)

  doc.fontSize(9)
    .fillColor('#9CA3AF')
    .font('Helvetica')
    .text('Show this QR code at entry. Do not share publicly.', 50, qrSectionTop + 35)

  // Draw QR code centered in the card
  if (imgData.startsWith('data:image')) {
    try {
      const base64 = imgData.split(',')[1]
      if (base64) {
        const img = Buffer.from(base64, 'base64')
        if (img.length > 0) {
          const qrSize = 140
          const qrX = (pageWidth - qrSize) / 2
          const qrY = qrSectionTop + 65
          doc.image(img, qrX, qrY, { width: qrSize, height: qrSize })
        }
      }
    } catch (e) {
      console.error('pdf qr error', e)
    }
  }

  // ===== FOOTER SECTION =====
  const footerY = pageHeight - 60
  doc.rect(0, footerY, pageWidth, 60).fill(brandDark)
  
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#F3F4F6')
    .text('For support, contact: support@planora.app', 40, footerY + 12)

  doc.fontSize(8)
    .fillColor('rgba(255,255,255,0.6)')
    .text('This pass is valid for one entry. Photo ID may be required. Keep this ticket safe.', 40, footerY + 32)

  doc.end()

  await new Promise<void>((resolve) => stream.on('end', () => resolve()))
  res.end(Buffer.concat(buffers))
}
