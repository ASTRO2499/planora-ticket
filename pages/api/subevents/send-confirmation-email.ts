import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'

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
      return res.status(404).json({ error: 'Registration not found' })
    }

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
    }

    // Generate PDF
    const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subevents/registration-pdf?id=${registrationId}`)
    let pdfBuffer = null
    if (pdfRes.ok) {
      const pdfData = await pdfRes.arrayBuffer()
      pdfBuffer = Buffer.from(pdfData)
    }

    // Send confirmation email
    const transporter = getTransport()
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          
          /* Header */
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header p { font-size: 14px; opacity: 0.95; }
          
          /* Success Badge */
          .success-badge { display: inline-block; background: #059669; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          /* Main Content */
          .content { background: white; padding: 40px 30px; }
          .content h2 { color: #111827; font-size: 24px; margin-bottom: 15px; font-weight: 700; }
          .content p { color: #374151; margin-bottom: 20px; line-height: 1.8; }
          .content strong { color: #111827; font-weight: 600; }
          
          /* Details Section */
          .details { background: #f3f4f6; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 8px; margin: 30px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1d5db; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #4b5563; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .detail-value { color: #111827; font-weight: 600; }
          
          /* QR Code */
          .qr-section { text-align: center; padding: 30px 0; }
          .qr-section h3 { color: #111827; margin-bottom: 15px; font-size: 16px; font-weight: 600; }
          .qr-code { display: inline-block; background: white; padding: 15px; border-radius: 8px; border: 2px dashed #4f46e5; }
          .qr-code img { width: 250px; height: 250px; display: block; }
          .qr-hint { color: #4b5563; font-size: 13px; margin-top: 10px; }
          
          /* Action Buttons */
          .actions { margin: 30px 0; text-align: center; }
          .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0 10px; font-size: 14px; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
          .btn-outline { background: white; color: #4f46e5; border: 2px solid #4f46e5; }
          .btn-outline:hover { background: #f3f4f6; }
          
          /* Info Box */
          .info-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 30px 0; }
          .info-box h4 { color: #111827; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
          .info-box ul { list-style: none; }
          .info-box li { color: #374151; font-size: 13px; padding: 5px 0; line-height: 1.6; }
          .info-box li:before { content: "✓ "; color: #059669; font-weight: 700; margin-right: 8px; }
          
          /* Footer */
          .footer { background: #111827; color: #e5e7eb; padding: 30px; border-radius: 0 0 16px 16px; text-align: center; font-size: 12px; }
          .footer a { color: #818cf8; text-decoration: none; font-weight: 500; }
          .footer a:hover { color: #a5b4fc; text-decoration: underline; }
          
          /* Responsive */
          @media (max-width: 600px) {
            .content { padding: 25px 20px; }
            .header h1 { font-size: 24px; }
            .qr-code img { width: 200px; height: 200px; }
            .btn { display: block; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Registration Confirmed</h1>
            <p>Your spot is reserved!</p>
          </div>
          
          <div class="content">
            <div style="text-align: center;">
              <span class="success-badge">Registration Successful</span>
            </div>
            
            <h2>Hello ${registration.name}!</h2>
            <p>Thank you for registering for <strong>${registration.sub_events?.title}</strong>. Your registration has been confirmed and we're excited to have you attend!</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">${registration.sub_events?.title}</span>
              </div>
              ${registration.sub_events?.type ? `
              <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">${registration.sub_events.type}</span>
              </div>
              ` : ''}
              ${registration.sub_events?.start_time ? `
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${new Date(registration.sub_events.start_time).toLocaleString()}</span>
              </div>
              ` : ''}
              ${registration.sub_events?.location ? `
              <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">${registration.sub_events.location}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Registration ID</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${registrationId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Status</span>
                <span class="detail-value" style="color: #10b981; text-transform: capitalize;">${registration.payment_status}</span>
              </div>
            </div>
            
            ${qrCodeBuffer ? `
            <div class="qr-section">
              <h3>Your Check-in QR Code</h3>
              <div class="qr-code">
                <img src="cid:qrcode" alt="Check-in QR Code" />
              </div>
              <p class="qr-hint">📱 Show this code at the event for quick check-in</p>
            </div>
            ` : ''}
            
            <div class="info-box">
              <h4>What's Next?</h4>
              <ul>
                <li>Save this email or download the QR code to your phone</li>
                <li>Arrive 15 minutes early for smooth entry</li>
                <li>Come prepared with any required materials</li>
                <li>Have fun and enjoy the event!</li>
              </ul>
            </div>
            
            <div class="actions">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planora.com'}/track-success?registrationId=${registrationId}" class="btn">View Details</a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://planora.com'}/events" class="btn btn-outline">Explore More Events</a>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">If you have any questions or need assistance, please reach out to the event organizer.</p>
          </div>
          
          <div class="footer">
            <p style="margin-bottom: 10px;">🎉 See you at the event!</p>
            <p>&copy; 2026 Planora. All rights reserved.</p>
            <p style="margin-top: 10px;"><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
          </div>
        </div>
      </body>
      </html>
    `

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

    await transporter.sendMail(mailOptions)

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
