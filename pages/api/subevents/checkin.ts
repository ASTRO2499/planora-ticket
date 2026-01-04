import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTransport } from '../../../lib/mailer'
import {
  checkOrganizerRateLimit,
  getClientIp,
  logAuthAttempt,
  recordAuthFailure,
} from '../../../lib/organizerAuth'
import {
  enforceHttps,
  validateRequestOrigin,
  validateLocalhost,
  applySecurityHeaders,
} from '../../../lib/mitigation'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

interface CheckInRequest {
  registrationId: string
  organizerSecret: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // SECURITY: Apply MITM prevention headers
  applySecurityHeaders(res)
  
  // SECURITY: Enforce HTTPS
  if (!enforceHttps(req, res)) {
    return res.status(403).json({ error: 'https_required' })
  }
  
  // SECURITY: Prevent localhost spoofing
  if (!validateLocalhost(req)) {
    return res.status(403).json({ error: 'localhost_spoofing_detected' })
  }
  
  const ip = getClientIp(req)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { registrationId, organizerSecret }: CheckInRequest = req.body

    if (!registrationId || !organizerSecret) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // SECURITY: Rate limit organizer secret attempts
    if (!checkOrganizerRateLimit(organizerSecret, ip)) {
      recordAuthFailure(ip)
      logAuthAttempt('rate_limit', { ip, endpoint: '/api/subevents/checkin' })
      return res.status(429).json({ error: 'too_many_attempts' })
    }

    // Verify organizer
    const { data: organizer, error: orgError } = await supabase
      .from('organizers')
      .select('id')
      .eq('secret', organizerSecret)
      .single()

    if (orgError || !organizer) {
      recordAuthFailure(ip)
      logAuthAttempt('failure', { ip, endpoint: '/api/subevents/checkin', reason: 'invalid_credentials' })
      return res.status(401).json({ error: 'Invalid organizer credentials' })
    }

    // Get registration
    const { data: registration, error: regError } = await supabase
      .from('sub_event_registrations')
      .select('*, sub_events(*)')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return res.status(404).json({ error: 'Registration not found' })
    }

    // Check if already checked in
    if (registration.checked_in) {
      return res.status(400).json({ error: 'Already checked in' })
    }

    // Update check-in status
    const { data: updated, error: updateError } = await supabase
      .from('sub_event_registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', registrationId)
      .select()
      .single()

    if (updateError) {
      console.error('Check-in error:', updateError)
      return res.status(500).json({ error: 'Failed to check in' })
    }

    // Send check-in confirmation email
    const transporter = getTransport()
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Checked In Successfully</h1>
          </div>
          
          <div class="content">
            <div class="success">
              <p>You have been checked in for <strong>${registration.sub_events?.title}</strong></p>
              <p><strong>Time:</strong> ${new Date(registration.checked_in_at).toLocaleString()}</p>
            </div>
            
            <p>Thank you for attending! Enjoy the event.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 Planora. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@planora.com',
      to: registration.email,
      subject: `Check-in Confirmed: ${registration.sub_events?.title}`,
      html: emailContent
    })

    return res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      registration: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        checkedInAt: updated.checked_in_at
      }
    })
  } catch (error: any) {
    console.error('Check-in API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
