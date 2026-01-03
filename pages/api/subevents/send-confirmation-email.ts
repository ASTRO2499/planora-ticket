import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'
import { generateTrackRegistrationEmail } from '../../../lib/emailTemplates'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { registrationId } = req.body

    if (!registrationId) {
      return res.status(400).json({ error: 'Missing registration ID' })
    }

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('sub_event_registrations')
      .select('*, sub_events(*)')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      console.error('Registration not found:', { registrationId, error: regError })
      return res.status(404).json({ error: 'Registration not found' })
    }

    console.log('Starting email process:', { registrationId, email: registration.email, subEvent: registration.sub_events?.title })

    // Generate QR code
    const qrRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subevents/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId,
        subEventId: registration.sub_event_id,
        email: registration.email
      })
    })

    let qrCodeDataUrl = null
    let qrCodeBuffer = null
    if (qrRes.ok) {
      const qrData = await qrRes.json()
      qrCodeDataUrl = qrData.qrCodeUrl
      
      // Convert data URL to buffer for email attachment
      if (qrCodeDataUrl) {
        const base64Data = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '')
        qrCodeBuffer = Buffer.from(base64Data, 'base64')
      }
      console.log('QR code generated successfully:', { registrationId, hasBuffer: !!qrCodeBuffer })
    } else {
      console.error('QR code generation failed:', { status: qrRes.status, registrationId })
    }

    // Generate PDF
    const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subevents/registration-pdf?id=${registrationId}`)
    let pdfBuffer = null
    if (pdfRes.ok) {
      const pdfData = await pdfRes.arrayBuffer()
      pdfBuffer = Buffer.from(pdfData)
      console.log('PDF generated successfully:', { registrationId, size: pdfBuffer.length })
    } else {
      console.error('PDF generation failed:', { status: pdfRes.status, registrationId })
    }

    // Send confirmation email
    const transporter = getTransport()
    
    // Validate email and transport
    if (!registration.email) {
      console.error('Registration has no email:', { registrationId })
      return res.status(400).json({ error: 'Registration missing email address' })
    }

    if (!transporter) {
      console.error('Email transporter not initialized')
      return res.status(500).json({ error: 'Email service not configured' })
    }

    console.log('Email transporter ready, preparing email:', { registrationId, to: registration.email })
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const viewUrl = `${baseUrl}/track-success?registrationId=${registrationId}`
    
    const emailContent = generateTrackRegistrationEmail({
      name: registration.name,
      email: registration.email,
      registrationId,
      trackTitle: registration.sub_events?.title || 'Track Event',
      trackType: registration.sub_events?.type,
      trackDescription: registration.sub_events?.description,
      startTime: registration.sub_events?.start_time,
      endTime: registration.sub_events?.end_time,
      location: registration.sub_events?.location,
      paymentStatus: registration.payment_status || 'not_required',
      speakerName: registration.sub_events?.speaker_name,
      speakerEmail: registration.sub_events?.speaker_email,
      qrCodeCid: qrCodeBuffer ? 'qrcode' : undefined,
      viewUrl,
      brandPrimary: '#667eea',
      brandAccent: '#764ba2'
    })

    const mailOptions: any = {
      from: process.env.SMTP_FROM || 'noreply@planora.com',
      to: registration.email,
      subject: `✓ Registration Confirmed: ${registration.sub_events?.title}`,
      html: emailContent,
      attachments: []
    }

    // Attach QR code as inline image
    if (qrCodeBuffer) {
      mailOptions.attachments.push({
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        cid: 'qrcode' // Referenced in img src="cid:qrcode"
      })
    }

    // Attach PDF
    if (pdfBuffer) {
      mailOptions.attachments.push({
        filename: `registration-${registrationId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      })
    }

    console.log('Sending email with attachments:', { registrationId, attachmentCount: mailOptions.attachments.length })
    
    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', { registrationId, messageId: info.messageId })
    } catch (mailErr) {
      console.error('Failed to send email:', { registrationId, error: mailErr instanceof Error ? mailErr.message : String(mailErr) })
      throw mailErr
    }

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent',
      qrCodeUrl: qrCodeDataUrl
    })
  } catch (error: any) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send confirmation email' })
  }
}
