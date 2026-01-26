import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'
import { generateTicketConfirmationEmail } from '../../../lib/emailTemplates'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

// Helper function to get template config for branding
async function getTemplateConfig(eventId: string) {
  try {
    const { data } = await supabase
      .from('events')
      .select('brandPrimary, brandAccent, brandDark, headerTitle')
      .eq('id', eventId)
      .single()
    return data
  } catch (err) {
    console.error('Error fetching template config:', err)
    return null
  }
}

// Helper function to generate PDF ticket
async function generateTicketPDF(ticketId: string, ticketData: any, eventData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('ENTRY PASS', { align: 'center' })
    doc.fontSize(12).font('Helvetica').fillColor('#666').text(eventData?.title || 'Event Ticket', { align: 'center' })
    doc.moveDown()

    // Event Details
    if (eventData?.date) {
      doc.fontSize(10).font('Helvetica').fillColor('#000')
      doc.text(`Date: ${new Date(eventData.date).toLocaleDateString()}`)
    }
    if (eventData?.location) {
      doc.text(`Location: ${eventData.location}`)
    }
    doc.moveDown()

    // Attendee Info
    doc.fontSize(11).font('Helvetica-Bold').text('Attendee Information', { underline: true })
    doc.fontSize(10).font('Helvetica').fillColor('#000')
    doc.text(`Name: ${ticketData.name || 'N/A'}`)
    doc.text(`Email: ${ticketData.email || 'N/A'}`)
    doc.text(`Ticket ID: ${ticketId}`)
    doc.moveDown()

    // QR Code
    if (ticketData.qr) {
      const qrBase64 = ticketData.qr
      const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      doc.fontSize(10).font('Helvetica').text('Scan for Check-in:', { underline: true })
      doc.moveDown(0.5)
      doc.image(qrBuffer, { width: 150, height: 150, align: 'center' })
    }

    doc.moveDown()
    doc.fontSize(9).fillColor('#999').text('Please present this ticket at the entrance. Thank you!', { align: 'center' })

    doc.end()
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const organizerSecret = req.headers['x-organizer-secret'] as string
  const { eventId } = req.query

  if (!organizerSecret || !eventId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify organizer owns this event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', eventId)
    .single()

  if (eventError || !event || event.organizer_id !== organizerSecret) {
    return res.status(403).json({ error: 'Unauthorized: not event organizer' })
  }

  // GET: List all UPI payments for event
  if (req.method === 'GET') {
    const { status } = req.query

    try {
      let query = supabase
        .from('upi_payments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch UPI payments' })
      }

      return res.status(200).json({
        payments: data || [],
        total: data?.length || 0
      })
    } catch (err) {
      console.error('Error fetching UPI payments:', err)
      return res.status(500).json({ error: 'Failed to fetch UPI payments' })
    }
  }

  // POST: Verify/Approve or Reject UPI payment
  if (req.method === 'POST') {
    const { paymentId, action, rejection_reason } = req.body

    if (!paymentId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid paymentId or action' })
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'rejection_reason required for rejection' })
    }

    try {
      // Get the payment record
      const { data: payment, error: fetchError } = await supabase
        .from('upi_payments')
        .select('*')
        .eq('id', paymentId)
        .eq('event_id', eventId)
        .single()

      if (fetchError || !payment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      if (action === 'approve') {
        // Update payment status to verified
        const { error: updateError } = await supabase
          .from('upi_payments')
          .update({
            status: 'verified',
            verified_by: organizerSecret,
            verified_at: new Date().toISOString()
          })
          .eq('id', paymentId)

        if (updateError) {
          throw updateError
        }

        // Update ticket status
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            upi_payment_status: 'verified',
            payment_method: 'upi',
            status: 'issued'
          })
          .eq('id', payment.ticket_id)

        if (ticketError) {
          console.error('Error updating ticket:', ticketError)
        }

        // Fetch event details and ticket data for email and PDF
        const [{ data: eventData }, { data: ticketData }] = await Promise.all([
          supabase
            .from('events')
            .select('title, description, date, location')
            .eq('id', eventId)
            .single(),
          supabase
            .from('tickets')
            .select('qr, name, email')
            .eq('id', payment.ticket_id)
            .single()
        ])

        // Generate QR code if not already present
        let qrCodeData = ticketData?.qr
        if (!qrCodeData) {
          try {
            const qrData = `${payment.ticket_id}|${payment.email}`
            qrCodeData = await QRCode.toDataURL(qrData)
            
            // Save QR code to ticket
            await supabase
              .from('tickets')
              .update({ qr: qrCodeData })
              .eq('id', payment.ticket_id)
            
            console.log('[UPI APPROVAL] QR code generated and saved for ticket:', payment.ticket_id)
          } catch (qrErr) {
            console.error('[UPI APPROVAL] Error generating QR code:', qrErr)
          }
        }

        // Get template config for branding
        const template = await getTemplateConfig(eventId as string)
        const brandPrimary = template?.brandPrimary || '#7C3AED'
        const brandAccent = template?.brandAccent || '#EC4899'
        const brandDark = template?.brandDark || '#1F2937'
        const headerTitle = template?.headerTitle || 'ENTRY PASS'

        // Generate and send ticket with PDF to delegate
        try {
          console.log('[UPI APPROVAL] Sending ticket email to:', payment.email)
          
          // Generate ticket URLs
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const ticketPdfUrl = `${appUrl}/api/ticket-pdf?ticketId=${payment.ticket_id}`
          const viewTicketUrl = `${appUrl}/ticket/${payment.ticket_id}`
          
          // Use base64 data URL for embedded QR code (more reliable than CID)
          const qrCodeUrl = qrCodeData || undefined
          
          // Prepare email with full event details and QR code
          const emailHtml = generateTicketConfirmationEmail({
            name: payment.name,
            email: payment.email,
            eventTitle: eventData?.title || 'Event Ticket',
            ticketId: payment.ticket_id,
            qrCodeUrl, // Use CID for embedded QR
            viewTicketUrl,
            pdfDownloadUrl: ticketPdfUrl,
            eventDate: eventData?.date ? new Date(eventData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
            eventLocation: eventData?.location,
            eventDescription: eventData?.description,
            brandPrimary,
            brandAccent,
            brandDark,
            headerTitle
          })

          // Generate PDF ticket
          const pdfBuffer = await generateTicketPDF(payment.ticket_id, { ...ticketData, qr: qrCodeData, ...payment }, eventData)

          // Prepare mail options with attachments
          const mailOptions: any = {
            from: process.env.EMAIL_FROM || 'noreply@planora.io',
            to: payment.email,
            subject: `✅ Your Entry Pass for ${eventData?.title || 'the Event'} is Ready`,
            html: emailHtml,
            attachments: []
          }

          // Attach PDF ticket
          if (pdfBuffer && pdfBuffer.length > 0) {
            mailOptions.attachments.push({
              filename: `ticket-${payment.ticket_id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            })
          }

          // Send email with ticket
          const transport = await getTransport()
          await transport.sendMail(mailOptions)

          console.log('[UPI APPROVAL] Ticket email sent successfully to:', payment.email, 'with', mailOptions.attachments.length, 'attachments')
        } catch (emailErr) {
          console.error('[UPI APPROVAL] Error sending ticket email:', emailErr)
          // Don't fail the approval if email fails, but log it
        }

        return res.status(200).json({
          success: true,
          message: 'Payment verified, ticket issued and email sent to delegate',
          ticketId: payment.ticket_id
        })
      } else {
        // Reject payment - send rejection email
        const { error: updateError } = await supabase
          .from('upi_payments')
          .update({
            status: 'rejected',
            verified_by: organizerSecret,
            verified_at: new Date().toISOString(),
            rejection_reason
          })
          .eq('id', paymentId)

        if (updateError) {
          throw updateError
        }

        // Update ticket status
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            upi_payment_status: 'rejected',
            status: 'cancelled'
          })
          .eq('id', payment.ticket_id)

        if (ticketError) {
          console.error('Error updating ticket:', ticketError)
        }

        // Send rejection email to delegate
        try {
          console.log('[UPI REJECTION] Sending rejection email to:', payment.email)
          
          const transport = await getTransport()
          await transport.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@planora.io',
            to: payment.email,
            subject: '❌ Payment Verification Failed',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Verification Failed</h2>
                <p>Hi ${payment.name},</p>
                <p>Unfortunately, your payment could not be verified.</p>
                <p><strong>Reason:</strong> ${rejection_reason}</p>
                <p>Please contact the organizer or try registering again with another payment method.</p>
                <br/>
                <p>Best regards,<br/>Planora Ticketing Team</p>
              </div>
            `
          })
          
          console.log('[UPI REJECTION] Rejection email sent to:', payment.email)
        } catch (emailErr) {
          console.error('[UPI REJECTION] Error sending rejection email:', emailErr)
        }

        return res.status(200).json({
          success: true,
          message: 'Payment rejected and notification sent to delegate'
        })
      }
    } catch (err) {
      console.error('Error processing UPI payment:', err)
      return res.status(500).json({ error: 'Failed to process payment' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
