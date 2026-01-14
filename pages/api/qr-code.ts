import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticketId } = req.query

  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ error: 'Missing ticketId' })
  }

  try {
    // Get ticket with QR code
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('qr')
      .eq('id', ticketId)
      .single()

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    if (!ticket.qr) {
      return res.status(404).json({ error: 'QR code not found' })
    }

    // Parse the data URL
    const dataUrl = ticket.qr as string
    
    if (dataUrl.startsWith('data:image/png;base64,')) {
      // Extract base64 data
      const base64Data = dataUrl.replace('data:image/png;base64,', '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Set response headers
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Length', buffer.length)
      res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
      
      return res.status(200).send(buffer)
    } else if (dataUrl.startsWith('data:image/jpeg;base64,')) {
      // Extract base64 data
      const base64Data = dataUrl.replace('data:image/jpeg;base64,', '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Set response headers
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', buffer.length)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      
      return res.status(200).send(buffer)
    } else {
      return res.status(400).json({ error: 'Invalid QR code format' })
    }
  } catch (error) {
    console.error('Error serving QR code:', error)
    return res.status(500).json({
      error: 'Failed to serve QR code',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}
