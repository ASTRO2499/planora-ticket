import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'missing eventId' })

  // Auth check
  const token = req.headers.authorization?.replace('Bearer ', '')
  const secret = req.headers['x-organizer-secret']
  
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'unauthorized' })
  } else if (secret) {
    const { data: event } = await supabase.from('events').select('organizer_secret').eq('id', eventId).single()
    if (!event || event.organizer_secret !== secret) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  } else {
    return res.status(401).json({ error: 'unauthorized' })
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
