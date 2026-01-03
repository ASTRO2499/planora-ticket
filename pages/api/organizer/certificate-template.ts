import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import {
  getOrganizerSecret,
  checkOrganizerRateLimit,
  getClientIp,
  logAuthAttempt,
  requireOrganizerToken,
} from '../../../lib/organizerAuth'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIp(req)
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing eventId' })

  // Auth check
  const organizer = await requireOrganizerToken(req)
  const secret = getOrganizerSecret(req)
  
  if (!organizer && !secret) {
    logAuthAttempt('failure', { ip, endpoint: '/api/organizer/certificate-template', reason: 'no_credentials' })
    return res.status(401).json({ error: 'unauthorized' })
  }

  // SECURITY: Rate limit secret attempts
  if (secret && !checkOrganizerRateLimit(secret, ip)) {
    logAuthAttempt('rate_limit', { ip, endpoint: '/api/organizer/certificate-template' })
    return res.status(429).json({ error: 'too_many_attempts' })
  }

  // Verify organizer owns event
  if (secret) {
    const { data: event } = await supabase.from('events').select('organizer_id').eq('id', eventId).single()
    if (!event || event.organizer_id !== secret) {
      logAuthAttempt('failure', { ip, endpoint: '/api/organizer/certificate-template', reason: 'forbidden' })
      return res.status(403).json({ error: 'forbidden' })
    }
  }

  if (req.method === 'GET') {
    // Get existing certificate template
    try {
      const { data, error } = await supabase.storage
        .from('ticket-templates')
        .download(`certificate-templates/${eventId}.json`)
      
      if (error || !data) {
        return res.status(200).json({ template: null })
      }

      const buf = Buffer.from(await data.arrayBuffer())
      const template = JSON.parse(buf.toString('utf-8'))
      return res.status(200).json({ template })
    } catch (err) {
      return res.status(200).json({ template: null })
    }
  }

  if (req.method === 'POST') {
    // Save certificate template
    const template = req.body
    
    if (!template || typeof template !== 'object') {
      return res.status(400).json({ error: 'invalid template data' })
    }

    try {
      const jsonData = JSON.stringify(template, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      
      const { error } = await supabase.storage
        .from('ticket-templates')
        .upload(`certificate-templates/${eventId}.json`, blob, { 
          upsert: true,
          contentType: 'application/json'
        })

      if (error) throw error

      return res.status(200).json({ success: true, message: 'Certificate template saved' })
    } catch (err: any) {
      console.error('Template save error:', err)
      return res.status(500).json({ error: 'failed to save template', details: err.message })
    }
  }

  res.status(405).json({ error: 'method not allowed' })
}
