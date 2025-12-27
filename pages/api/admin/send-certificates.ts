import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

function extractFolderId(link: string): string | null {
  const patterns = [/\/folders\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /^([a-zA-Z0-9_-]{20,})$/]
  for (const p of patterns) { const m = link.match(p); if (m) return m[1] }
  return null
}

async function listDriveFiles(folderId: string): Promise<{ name: string; id: string; webViewLink: string }[]> {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY
    if (!apiKey) return []
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,webViewLink)`
    const resp = await fetch(url)
    if (!resp.ok) return []
    const data = await resp.json()
    return data.files || []
  } catch { return [] }
}

function matchFileName(attendeeName: string, fileName: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const name = normalize(attendeeName)
  const file = normalize(fileName)
  if (file.includes(name)) return true
  const parts = attendeeName.toLowerCase().split(/\s+/)
  return parts.every(p => file.includes(normalize(p)))
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { eventId, driveFolderLink, emailContent } = req.body || {}
  if (!eventId || !driveFolderLink || !emailContent) return res.status(400).json({ error: 'missing_params' })

  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
    if (!event) return res.status(404).json({ error: 'event_not_found' })

    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select(`
        id,
        attendee_name,
        attendee_email,
        ticket_id,
        tickets ( name, email, college, ieee )
      `)
      .eq('event_id', eventId)
    if (certError) throw certError
    if (!certificates || certificates.length === 0) return res.json({ message: 'No certificates to send', sent: 0 })

    const folderId = extractFolderId(driveFolderLink)
    if (!folderId) return res.status(400).json({ error: 'invalid_drive_link' })
    const driveFiles = await listDriveFiles(folderId)

    const transporter = createTransporter()
    let sent = 0, failed = 0
    const errors: string[] = []

    for (const cert of certificates) {
      try {
        const attendeeName = cert.attendee_name
        const attendeeEmail = cert.attendee_email
        const ticketData: any = (cert as any).tickets
        const college = ticketData?.college || 'your institution'

        let certificateLink: string | null = null
        if (driveFiles.length > 0) {
          const matched = driveFiles.find(f => matchFileName(attendeeName, f.name))
          if (matched) certificateLink = matched.webViewLink || `https://drive.google.com/file/d/${matched.id}/view`
        }
        if (!certificateLink) certificateLink = driveFolderLink

        const personalizedContent = String(emailContent)
          .replace(/#name/g, attendeeName)
          .replace(/#College/g, college)
          .replace(/#college/g, college)
          .replace(/#event/g, event.title)

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: attendeeEmail,
          subject: `Certificate of Participation - ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Certificate Ready!</h1>
              </div>
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">${personalizedContent}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${certificateLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">📜 View Your Certificate</a>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">This is an automated email. If you have any questions, please contact the event organizers.</p>
              </div>
            </div>`
        })
        sent++
      } catch (err: any) {
        failed++
        errors.push(`${(cert as any).attendee_email}: ${err.message}`)
      }
    }

    return res.json({ success: true, message: `Successfully sent ${sent} emails${failed ? `, ${failed} failed` : ''}`, sent, failed, total: certificates.length, errors: errors.length ? errors.slice(0, 10) : undefined })
  } catch (error: any) {
    console.error('Admin bulk email error:', error)
    return res.status(500).json({ error: 'email_sending_failed', message: error.message })
  }
}
