import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import QRCode from 'qrcode'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || '')
  if (!id) return res.status(400).json({ error: 'missing registration id' })

  const { data: registration, error } = await supabase
    .from('sub_event_registrations')
    .select('*, sub_events(*)')
    .eq('id', id)
    .single()

  if (error || !registration) return res.status(404).json({ error: 'registration not found' })

  // Generate QR code
  const qrData = JSON.stringify({
    registrationId: id,
    subEventId: registration.sub_event_id,
    email: registration.email,
    timestamp: new Date().toISOString()
  })
  
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2
  })

  // Brand colors
  const brandPrimary = '#7C3AED'
  const brandAccent = '#EC4899'
  const brandDark = '#1F2937'

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="registration-${id}.pdf"`)

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
    .text('REGISTRATION PASS', 40, 28, { align: 'left' })
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('rgba(255,255,255,0.8)')
    .text('Powered by PLANORA', 40, 64)

  // ===== EVENT CARD SECTION =====
  const eventCardTop = 120
  const eventCardHeight = 160
  
  doc.roundedRect(30, eventCardTop, pageWidth - 60, eventCardHeight, 10)
    .fill('rgba(124,58,237,0.05)')
    .stroke(brandPrimary)
    .lineWidth(1.5)

  // Event title
  doc.fillColor(brandDark)
    .fontSize(12)
    .font('Helvetica')
    .text('SESSION', 50, eventCardTop + 15)
  
  const sessionTitle = registration.sub_events?.title || 'Session Registration'
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(brandPrimary)
    .text(sessionTitle, 50, eventCardTop + 32, { width: pageWidth - 100, ellipsis: true })

  // Session details
  let yPos = eventCardTop + 65
  if (registration.sub_events?.type) {
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor(brandDark)
      .text(`Type: ${registration.sub_events.type}`, 50, yPos)
    yPos += 18
  }

  if (registration.sub_events?.start_time) {
    const startTime = new Date(registration.sub_events.start_time)
    doc.text(`Date: ${startTime.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 50, yPos)
    yPos += 18
  }

  if (registration.sub_events?.location) {
    doc.text(`Location: ${registration.sub_events.location}`, 50, yPos, { width: pageWidth - 100, ellipsis: true })
  }

  // ===== ATTENDEE SECTION =====
  const attendeeTop = 300
  doc.fillColor(brandDark)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('ATTENDEE INFORMATION', 40, attendeeTop)

  doc.roundedRect(30, attendeeTop + 25, pageWidth - 60, 120, 8)
    .stroke(brandPrimary)
    .lineWidth(1)

  yPos = attendeeTop + 45
  const leftCol = 50
  const rightCol = 320

  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#6B7280')
    .text('Name', leftCol, yPos)
  doc.font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(registration.name, leftCol, yPos + 14, { width: 240 })

  doc.font('Helvetica')
    .fillColor('#6B7280')
    .text('Email', rightCol, yPos)
  doc.font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(registration.email, rightCol, yPos + 14, { width: 240 })

  yPos += 48
  doc.font('Helvetica')
    .fillColor('#6B7280')
    .text('Phone', leftCol, yPos)
  doc.font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(registration.phone || 'N/A', leftCol, yPos + 14)

  doc.font('Helvetica')
    .fillColor('#6B7280')
    .text('College', rightCol, yPos)
  doc.font('Helvetica-Bold')
    .fillColor(brandDark)
    .text(registration.college || 'N/A', rightCol, yPos + 14, { width: 240 })

  // ===== QR CODE SECTION =====
  const qrTop = 470
  doc.fillColor(brandDark)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('CHECK-IN QR CODE', 40, qrTop)

  doc.roundedRect(30, qrTop + 25, pageWidth - 60, 240, 8)
    .fill('#F9FAFB')
    .stroke(brandPrimary)
    .lineWidth(1)

  // QR code image
  const qrImageData = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '')
  const qrBuffer = Buffer.from(qrImageData, 'base64')
  
  const qrSize = 180
  const qrX = (pageWidth - qrSize) / 2
  const qrY = qrTop + 45

  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize })

  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#6B7280')
    .text('Show this code at the event entrance', 40, qrTop + 235, { width: pageWidth - 80, align: 'center' })

  // ===== REGISTRATION ID =====
  doc.fontSize(9)
    .font('Helvetica')
    .fillColor('#9CA3AF')
    .text(`Registration ID: ${id}`, 40, pageHeight - 60)
  
  doc.fontSize(8)
    .text(`Registered: ${new Date(registration.registered_at).toLocaleString()}`, 40, pageHeight - 45)

  doc.fontSize(8)
    .fillColor(brandPrimary)
    .text('planora.com', pageWidth - 100, pageHeight - 45, { width: 60, align: 'right' })

  doc.end()

  stream.on('end', () => {
    const pdfData = Buffer.concat(buffers)
    res.send(pdfData)
  })
}
