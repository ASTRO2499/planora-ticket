import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

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

async function getCertificateTemplateConfig(eventId?: string | null) {
  if (!eventId) return null
  try {
    const { data, error } = await supabase.storage.from('ticket-templates').download(`certificate-templates/${eventId}.json`)
    if (error || !data) return null
    const buf = Buffer.from(await data.arrayBuffer())
    const json = JSON.parse(buf.toString('utf-8'))
    return json as {
      brandPrimary?: string
      brandAccent?: string
      brandDark?: string
      headerTitle?: string
      layout?: 'modern' | 'classic' | 'elegant' | 'minimal'
      showLogo?: boolean
      logoText?: string
      borderStyle?: 'double' | 'single' | 'decorative' | 'none'
      signatureName?: string
      signatureTitle?: string
      showWatermark?: boolean
      customText?: string
    }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ticketId = String(req.query.ticketId || '')
  if (!ticketId) return res.status(400).json({ error: 'missing ticketId' })

  // Fetch ticket
  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*').eq('id', ticketId).single()
  if (ticketError || !ticket) return res.status(404).json({ error: 'ticket not found' })

  // Check if ticket was used (attended)
  if (!ticket.used) {
    return res.status(403).json({ error: 'certificate_not_available', message: 'Certificate only available for attendees who checked in' })
  }

  // Fetch or create certificate record
  let certificate
  const { data: existingCert } = await supabase.from('certificates').select('*').eq('ticket_id', ticketId).maybeSingle()
  
  if (existingCert) {
    certificate = existingCert
  } else {
    // Create certificate record
    const { data: newCert, error: certError } = await supabase.from('certificates').insert({
      ticket_id: ticketId,
      event_id: ticket.event_id,
      attendee_name: ticket.name,
      attendee_email: ticket.email,
      certificate_data: { issued_by: 'Planora System' }
    }).select().single()
    
    if (certError) return res.status(500).json({ error: 'certificate creation failed' })
    certificate = newCert

    // Mark ticket as having certificate
    await supabase.from('tickets').update({ certificate_issued: true }).eq('id', ticketId)
  }

  // Fetch event details and template
  const event = await getEventById(ticket.event_id)
  const ticketTemplate = await getTemplateConfig(ticket.event_id)
  const certTemplate = await getCertificateTemplateConfig(ticket.event_id)

  // Use certificate template if available, fallback to ticket template
  const template = certTemplate || ticketTemplate

  const brandPrimary = template?.brandPrimary || '#7C3AED'
  const brandAccent = template?.brandAccent || '#EC4899'
  const brandDark = template?.brandDark || '#1F2937'
  const layout = (certTemplate as any)?.layout || 'modern'
  const borderStyle = (certTemplate as any)?.borderStyle || 'double'
  const showLogo = (certTemplate as any)?.showLogo !== false
  const logoText = (certTemplate as any)?.logoText || 'PLANORA'
  const signatureName = (certTemplate as any)?.signatureName || ''
  const signatureTitle = (certTemplate as any)?.signatureTitle || ''
  const customText = (certTemplate as any)?.customText || ''

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${ticketId.slice(0, 8)}.pdf"`)

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 })
  const buffers: any[] = []
  const stream = new PassThrough()
  stream.on('data', (chunk) => buffers.push(chunk))
  doc.pipe(stream)

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  // ===== DECORATIVE BORDER (based on borderStyle) =====
  if (borderStyle === 'double' || borderStyle === 'decorative') {
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(3)
      .stroke(brandPrimary)

    doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
      .lineWidth(1)
      .stroke(brandAccent)
  } else if (borderStyle === 'single') {
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(2)
      .stroke(brandPrimary)
  }

  // ===== HEADER =====
  if (showLogo) {
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(brandPrimary)
      .text(logoText, 0, 70, { align: 'center', width: pageWidth })

    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#666')
      .text('EVENT MANAGEMENT PLATFORM', 0, 92, { align: 'center', width: pageWidth })
  }

  // ===== TITLE =====
  const titleY = showLogo ? 150 : 120
  doc.fontSize(48)
    .font('Helvetica-Bold')
    .fillColor(brandDark)
    .text('CERTIFICATE', 0, titleY, { align: 'center', width: pageWidth })

  doc.fontSize(20)
    .font('Helvetica')
    .fillColor('#666')
    .text('OF PARTICIPATION', 0, titleY + 60, { align: 'center', width: pageWidth })

  // ===== DECORATIVE LINE =====
  const lineY = titleY + 100
  doc.moveTo(pageWidth / 2 - 100, lineY)
    .lineTo(pageWidth / 2 + 100, lineY)
    .lineWidth(2)
    .stroke(brandAccent)

  // ===== PRESENTED TO TEXT =====
  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#666')
    .text('This certificate is proudly presented to', 0, lineY + 30, { align: 'center', width: pageWidth })

  // ===== ATTENDEE NAME =====
  doc.fontSize(36)
    .font('Helvetica-Bold')
    .fillColor(brandPrimary)
    .text(ticket.name.toUpperCase(), 0, lineY + 70, { align: 'center', width: pageWidth })

  // ===== DESCRIPTION =====
  const eventTitle = event?.title || String(ticket.event_id || 'Event')
  const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  
  let descY = lineY + 130
  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#333')
    .text(customText || `for successfully participating in`, 0, descY, { align: 'center', width: pageWidth })

  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(eventTitle, 0, descY + 30, { align: 'center', width: pageWidth })

  if (eventDate) {
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#666')
      .text(`Held on ${eventDate}`, 0, descY + 60, { align: 'center', width: pageWidth })
    descY += 20
  }

  if (event?.location) {
    doc.fontSize(12)
      .fillColor('#666')
      .text(`at ${event.location}`, 0, descY + 80, { align: 'center', width: pageWidth })
  }

  // ===== SIGNATURE (if provided) =====
  if (signatureName) {
    const sigY = pageHeight - 180
    doc.moveTo(pageWidth / 2 - 80, sigY)
      .lineTo(pageWidth / 2 + 80, sigY)
      .lineWidth(1)
      .stroke('#999')
    
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(brandDark)
      .text(signatureName, 0, sigY + 10, { align: 'center', width: pageWidth })
    
    if (signatureTitle) {
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text(signatureTitle, 0, sigY + 30, { align: 'center', width: pageWidth })
    }
  }

  // ===== CERTIFICATE ID & DATE =====
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#999')
    .text(`Certificate ID: ${certificate.id.slice(0, 16).toUpperCase()}`, 0, pageHeight - 100, { align: 'center', width: pageWidth })

  doc.fontSize(10)
    .fillColor('#999')
    .text(`Issued on: ${issuedDate}`, 0, pageHeight - 80, { align: 'center', width: pageWidth })

  // ===== FOOTER =====
  doc.fontSize(8)
    .fillColor('#aaa')
    .text('This is an electronically generated certificate. Verify authenticity at planora.app/verify', 0, pageHeight - 50, { align: 'center', width: pageWidth })

  // ===== DECORATIVE ELEMENTS =====
  if (borderStyle === 'decorative') {
    // Top corners
    doc.circle(80, 80, 5).fill(brandAccent)
    doc.circle(pageWidth - 80, 80, 5).fill(brandAccent)
    // Bottom corners
    doc.circle(80, pageHeight - 80, 5).fill(brandAccent)
    doc.circle(pageWidth - 80, pageHeight - 80, 5).fill(brandAccent)
  }

  doc.end()

  await new Promise<void>((resolve) => stream.on('end', () => resolve()))
  res.end(Buffer.concat(buffers))
}
