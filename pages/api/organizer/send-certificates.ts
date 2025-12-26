import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

/**
 * ORGANIZER AUTHENTICATION ONLY
 */
async function requireOrganizer(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    const { data } = await supabase.auth.getUser(token)
    const role = data?.user?.user_metadata?.role
    if (role === 'organizer') return data?.user || null
  }
  return null
}

function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

// Extract folder ID from Google Drive link
function extractFolderId(link: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/
  ]
  
  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match) return match[1]
  }
  return null
}

// List files from Google Drive folder (public folder)
async function listDriveFiles(folderId: string): Promise<{ name: string; id: string; webViewLink: string }[]> {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY
    if (!apiKey) {
      console.warn('GOOGLE_DRIVE_API_KEY not set, using direct links')
      return []
    }

    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,webViewLink)`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('Drive API error:', await response.text())
      return []
    }
    
    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('Error listing Drive files:', error)
    return []
  }
}

// Match attendee name with file name (fuzzy matching)
function matchFileName(attendeeName: string, fileName: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalizedName = normalize(attendeeName)
  const normalizedFile = normalize(fileName)
  
  // Direct match
  if (normalizedFile.includes(normalizedName)) return true
  
  // Check if all name parts are in filename
  const nameParts = attendeeName.toLowerCase().split(/\s+/)
  const allPartsPresent = nameParts.every(part => normalizedFile.includes(normalize(part)))
  
  return allPartsPresent
}

// Create email transporter
function createTransporter() {
  const provider = process.env.EMAIL_PROVIDER || 'smtp'
  
  if (provider === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
  
  throw new Error('Unsupported email provider')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const organizer = await requireOrganizer(req)
  const organizerSecret = getOrganizerSecret(req)
  if (!organizer && !organizerSecret) return res.status(401).json({ error: 'unauthorized' })

  const { eventId, driveFolderLink, emailContent } = req.body
  
  if (!eventId) return res.status(400).json({ error: 'missing eventId' })
  if (!driveFolderLink) return res.status(400).json({ error: 'missing driveFolderLink' })
  if (!emailContent) return res.status(400).json({ error: 'missing emailContent' })

  // Verify organizer owns this event
  if (organizerSecret) {
    const { data: ev, error: evErr } = await supabase.from('events').select('id, organizer_secret, title').eq('id', eventId).maybeSingle()
    if (evErr || !ev || ev.organizer_secret !== organizerSecret) {
      return res.status(403).json({ error: 'forbidden' })
    }
  }

  try {
    // Get event details
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle()
    if (!event) return res.status(404).json({ error: 'event_not_found' })

    // Get all attendees with certificates
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select(`
        id,
        attendee_name,
        attendee_email,
        ticket_id,
        tickets (
          name,
          email,
          college,
          ieee
        )
      `)
      .eq('event_id', eventId)

    if (certError) throw certError
    if (!certificates || certificates.length === 0) {
      return res.json({ message: 'No certificates to send', sent: 0 })
    }

    // Extract folder ID and list files
    const folderId = extractFolderId(driveFolderLink)
    if (!folderId) {
      return res.status(400).json({ error: 'invalid_drive_link', message: 'Could not extract folder ID from Drive link' })
    }

    const driveFiles = await listDriveFiles(folderId)
    console.log(`Found ${driveFiles.length} files in Drive folder`)

    // Create email transporter
    const transporter = createTransporter()
    
    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send emails
    for (const cert of certificates) {
      try {
        const attendeeName = cert.attendee_name
        const attendeeEmail = cert.attendee_email
        const ticketData = (cert as any).tickets
        const college = ticketData?.college || 'your institution'

        // Find matching certificate file
        let certificateLink = null
        if (driveFiles.length > 0) {
          const matchedFile = driveFiles.find(file => matchFileName(attendeeName, file.name))
          if (matchedFile) {
            certificateLink = matchedFile.webViewLink || `https://drive.google.com/file/d/${matchedFile.id}/view`
          }
        }

        // If no match found, use folder link
        if (!certificateLink) {
          certificateLink = driveFolderLink
          console.warn(`No matching file found for ${attendeeName}, using folder link`)
        }

        // Personalize email content
        let personalizedContent = emailContent
          .replace(/#name/g, attendeeName)
          .replace(/#College/g, college)
          .replace(/#college/g, college)
          .replace(/#event/g, event.title)

        // Send email
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
                  <a href="${certificateLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    📜 View Your Certificate
                  </a>
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                  This is an automated email. If you have any questions, please contact the event organizers.
                </p>
              </div>
            </div>
          `
        })

        sent++
        console.log(`✓ Sent certificate to ${attendeeEmail}`)
      } catch (error: any) {
        failed++
        errors.push(`${cert.attendee_email}: ${error.message}`)
        console.error(`✗ Failed to send to ${cert.attendee_email}:`, error)
      }
    }

    return res.json({
      success: true,
      message: `Successfully sent ${sent} emails${failed > 0 ? `, ${failed} failed` : ''}`,
      sent,
      failed,
      total: certificates.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    })

  } catch (error: any) {
    console.error('Bulk email error:', error)
    return res.status(500).json({ error: 'email_sending_failed', message: error.message })
  }
}
