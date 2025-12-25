// Developed by: Kalidas KJ
import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import { insertTicketWithStatus, setTicketStatus } from '../../lib/ticketStatus'
import { getTransport } from '../../lib/mailer'
import { logError, logInfo, logWarn } from '../../lib/logger'
import { generateTicketConfirmationEmail } from '../../lib/emailTemplates'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
const BUCKET = 'tickets'
const TEMPLATE_BUCKET = 'ticket-templates'

async function ensureBucket() {
  try {
    await supabase.storage.createBucket(BUCKET, { public: false })
  } catch (e) {
    // ignore bucket exists or insufficient permissions errors
  }
}

async function ensureTemplateBucket() {
  try {
    await supabase.storage.createBucket(TEMPLATE_BUCKET, { public: false })
  } catch {}
}

async function getEventById(eventId?: string | null) {
  if (!eventId) return null
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
  if (error) return null
  return data
}

async function getTemplateConfig(eventId?: string | null) {
  await ensureTemplateBucket()
  if (!eventId) return null
  const path = `templates/${eventId}.json`
  const { data, error } = await supabase.storage.from(TEMPLATE_BUCKET).download(path)
  if (error || !data) return null
  try {
    const buf = Buffer.from(await data.arrayBuffer())
    const json = JSON.parse(buf.toString('utf-8'))
    return json as { brandPrimary?: string; brandAccent?: string; brandDark?: string; headerTitle?: string }
  } catch { return null }
}

async function createSignedPdfUrl(id: string, ticketId?: string) {
  const filePath = `${id}.pdf`
  const expires = Number(process.env.STORAGE_URL_EXPIRES || '604800')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expires)
  if (error) {
    logError('signed url err', { error: error, ticketId: ticketId || id })
    return undefined
  }
  return data?.signedUrl
}

async function uploadPdfAndGetUrl(id: string, pdfBuffer: Buffer, ticketId: string) {
  await ensureBucket()
  const filePath = `${id}.pdf`
  const uploadRes = await supabase.storage.from(BUCKET).upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
  if (uploadRes.error) {
    logError('upload error', { error: uploadRes.error, ticketId })
  }
  return (await createSignedPdfUrl(id, ticketId)) || `${process.env.BASE_URL || 'http://localhost:3000'}/ticket/${id}`
}

let transporter: any = null

function getMailer() {
  if (transporter) return transporter
  transporter = getTransport()
  return transporter
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, metadata } = req.body
  const paymentId = String(razorpay_payment_id || '').trim()
  if (!paymentId) return res.status(400).json({ error: 'missing_payment_id' })
  // verify signature using HMAC SHA256
  const secret = process.env.RAZORPAY_KEY_SECRET || ''
  const generated_signature = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
  if (generated_signature !== razorpay_signature) {
    logWarn('invalid razorpay signature', { generated_signature, razorpay_signature })
    return res.status(400).json({ error: 'invalid_signature' })
  }

  const name = (metadata?.name || '').trim()
  const email = (metadata?.email || '').trim()
  const phone = (metadata?.phone || '').trim()
  const college = (metadata?.college || '').trim()
  const ieee = (metadata?.ieee || '').trim()
  if (!name || !email) return res.status(400).json({ error: 'missing_user_details' })

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

  // Return existing ticket if this payment was already processed
  const { data: existingTicket, error: existingError } = await supabase
    .from('tickets')
    .select('*')
    .eq('payment_id', paymentId)
    .limit(1)
    .maybeSingle()
  if (existingError) {
    logError('ticket lookup error', { error: existingError })
  }
  if (existingTicket) {
    const ticketUrl = `${baseUrl}/ticket/${existingTicket.id}`
    const pdfUrl = await createSignedPdfUrl(existingTicket.id, existingTicket.id)
    logInfo('returning existing ticket for payment', { paymentId, ticketId: existingTicket.id })
    return res.json({ ticketUrl, pdfUrl })
  }

  // create ticket record in Supabase
  let ticketId: string = ''
  let insertedTicket: any | null = null
  try {
    // Let Supabase generate UUID, then create QR with it
    const tempTicket = await supabase.from('tickets').insert([{
      name,
      email,
      phone,
      college,
      ieee,
      event_id: metadata?.eventId || null,
      payment_id: paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount_paid: metadata?.amount || null,
      status: 'pending',
      created_at: new Date(),
    }]).select().single()
    
    if (tempTicket.error) throw tempTicket.error
    
    ticketId = tempTicket.data.id
    const qrData = `${ticketId}|${email}`
    const qrSvg = await QRCode.toDataURL(qrData)
    
    // Update ticket with QR code
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({ qr: qrSvg })
      .eq('id', ticketId)
      .select()
      .single()
    
    if (updateError) throw updateError
    insertedTicket = updatedTicket
    // send email with ticket link and attach PDF
    const ticketUrl = `${baseUrl}/ticket/${ticketId}`

    // gather event info and optional template
    const event = await getEventById(insertedTicket?.event_id)
    const template = await getTemplateConfig(insertedTicket?.event_id)

    // generate PDF in-memory with themed colors
    const brandPrimary = template?.brandPrimary || '#7C3AED'
    const brandAccent = template?.brandAccent || '#EC4899'
    const brandDark = template?.brandDark || '#0F172A'

    const doc = new PDFDocument({ size: 'A4', margin: 36 })
    // collect buffer
    const buffers: any[] = []
    const stream = new PassThrough()
    stream.on('data', (chunk) => buffers.push(chunk))

    doc.pipe(stream)

    // Header bar
    doc.rect(0, 0, doc.page.width, 100).fill(brandPrimary)
    doc.fillColor('#FFFFFF')
      .fontSize(26)
      .text(template?.headerTitle || 'ENTRY PASS', 36, 32, { align: 'left' })
    doc.fontSize(12)
      .text('Powered by PLANORA', 36, 64)

    // Event block card with preview
    doc.fillColor('#000000')
    doc.roundedRect(36, 120, doc.page.width - 72, 160, 12).stroke(brandPrimary)
    doc.fontSize(18).fillColor(brandDark).text('Event', 52, 132)
    const eventTitle = event?.title || String(insertedTicket?.event_id || 'AKCOMSOC 2025')
    doc.fontSize(22).fillColor(brandPrimary).text(eventTitle, 52, 156, { width: doc.page.width - 240, ellipsis: true })
    doc.fontSize(12).fillColor('#64748B').text(`Ticket ID: ${ticketId}`, 52, 188)
    if (event?.image_url) {
      try {
        const resp = await fetch(event.image_url)
        const arr = await resp.arrayBuffer()
        const imgBuf = Buffer.from(arr)
        doc.image(imgBuf, doc.page.width - 36 - 120, 132, { width: 120, height: 80 })
      } catch {}
    }
    if (event?.description) {
      doc.fontSize(10).fillColor('#6B7280').text(String(event.description).slice(0, 140), 52, 206, { width: doc.page.width - 240 })
    }

    // Attendee info
    const infoTop = 300
    doc.fontSize(16).fillColor(brandDark).text('Attendee', 36, infoTop)
    doc.moveTo(36, infoTop + 24).lineTo(doc.page.width - 36, infoTop + 24).stroke('#E5E7EB')
    doc.fontSize(12).fillColor('#111827')
    doc.text(`Name`, 36, infoTop + 36)
    doc.text(`Email`, 36, infoTop + 60)
    doc.text(`Status`, 36, infoTop + 84)
    doc.font('Helvetica-Bold').fillColor(brandPrimary)
    doc.text(String(metadata?.name || name), 120, infoTop + 36)
    doc.text(String(metadata?.email || email), 120, infoTop + 60)
    doc.fillColor('#16A34A').text('Issued', 120, infoTop + 84)
    doc.font('Helvetica')

    // QR section card
    const qrTop = infoTop + 120
    doc.roundedRect(36, qrTop, doc.page.width - 72, 220, 12).stroke(brandAccent)
    doc.fontSize(16).fillColor(brandDark).text('Scan at Entry', 52, qrTop + 16)
    doc.moveTo(52, qrTop + 40).lineTo(doc.page.width - 52, qrTop + 40).stroke('#FCE7F3')
    if (qrSvg.startsWith('data:image')) {
      try {
        const base64 = qrSvg.split(',')[1]
        if (!base64) throw new Error('Invalid base64 data')
        const img = Buffer.from(base64, 'base64')
        if (img.length === 0) throw new Error('Empty image data')
        // Place QR centered in the QR card
        const qrSize = 180
        const qrX = 52 + ((doc.page.width - 104 - qrSize) / 2)
        const qrY = qrTop + 56
        doc.image(img, qrX, qrY, { width: qrSize, height: qrSize })
        // Below QR: helpful note
        doc.fontSize(10).fillColor('#6B7280').text('Show this QR at entry. Do not share publicly.', 52, qrTop + 56 + qrSize + 12, { align: 'center', width: doc.page.width - 104 })
      } catch (e) { logError('pdf image error', { error: e }) }
    }

    // Footer strip
    const footerY = doc.page.height - 80
    doc.rect(0, footerY, doc.page.width, 80).fill(brandPrimary)
    doc.fillColor('#FFFFFF').fontSize(12).text('Need help? Contact support@planora.app', 36, footerY + 26)
    doc.fontSize(10).text('This pass is valid for one entry. Photo ID may be required.', 36, footerY + 46)
    doc.end()

    await new Promise<void>((resolve) => stream.on('end', () => resolve()))
    const pdfBuffer = Buffer.concat(buffers)

    const pdfUrl = await uploadPdfAndGetUrl(ticketId, pdfBuffer, ticketId)

    // send email via SMTP with professional HTML template
    try {
      const brandPrimary = template?.brandPrimary || '#7C3AED'
      const brandAccent = template?.brandAccent || '#EC4899'
      const emailHtml = generateTicketConfirmationEmail({
        name,
        email,
        eventTitle: event?.title || String(insertedTicket?.event_id || 'Your Event'),
        ticketId,
        qrCodeUrl: qrSvg,
        viewTicketUrl: ticketUrl,
        pdfDownloadUrl: pdfUrl,
        eventDate: event?.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
        eventLocation: event?.location,
        eventDescription: event?.description,
        brandPrimary,
        brandAccent,
        headerTitle: template?.headerTitle || 'ENTRY PASS'
      })

      await getMailer().sendMail({
        from: process.env.EMAIL_FROM || 'noreply@planora.app',
        to: email,
        subject: `Your Entry Pass for ${event?.title || 'the Event'} is Ready ✅`,
        html: emailHtml,
      })
      logInfo('ticket email sent', { ticketId, email })
    } catch (emailErr) {
      logWarn('email sending failed, but ticket still issued', { ticketId, email, error: (emailErr as Error)?.message })
    }
    
    await setTicketStatus(supabase, ticketId, 'issued')
    logInfo('ticket issued', { ticketId, paymentId, email })
    return res.json({
      ticketUrl,
      pdfUrl,
      ticketId,
      message: 'Successfully registered for the event. Your ticket has been emailed.'
    })
  } catch (err) {
    logError('ticket issuance failed', { ticketId, paymentId, error: (err as Error)?.message })
    if (ticketId && insertedTicket?.id) {
      await setTicketStatus(supabase, ticketId, 'failed')
    }
    return res.status(500).json({ error: 'ticket_failed' })
  }
}
