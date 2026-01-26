import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query
  const organizerSecret = req.headers['x-organizer-secret'] as string

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' })
  }

  // GET: Fetch UPI settings for event
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('upi_enabled, upi_id')
        .eq('id', eventId)
        .single()

      if (error) {
        return res.status(404).json({ error: 'Event not found' })
      }

      return res.status(200).json({
        upi_enabled: data?.upi_enabled || false,
        upi_id: data?.upi_id || ''
      })
    } catch (err) {
      console.error('Error fetching UPI settings:', err)
      return res.status(500).json({ error: 'Failed to fetch UPI settings' })
    }
  }

  // POST/PUT: Update UPI settings for event
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!organizerSecret) {
      return res.status(401).json({ error: 'Unauthorized: organizer secret required' })
    }

    const { upi_enabled, upi_id } = req.body

    if (typeof upi_enabled !== 'boolean' || !upi_id || typeof upi_id !== 'string') {
      return res.status(400).json({ error: 'Invalid upi_enabled (boolean) or upi_id (string)' })
    }

    try {
      // Verify organizer owns this event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      if (event.organizer_id !== organizerSecret) {
        return res.status(403).json({ error: 'Unauthorized: not event organizer' })
      }

      // Update UPI settings
      const { error: updateError } = await supabase
        .from('events')
        .update({
          upi_enabled,
          upi_id: upi_enabled ? upi_id : null
        })
        .eq('id', eventId)

      if (updateError) {
        throw updateError
      }

      return res.status(200).json({
        success: true,
        message: 'UPI settings updated',
        upi_enabled,
        upi_id: upi_enabled ? upi_id : null
      })
    } catch (err) {
      console.error('Error updating UPI settings:', err)
      return res.status(500).json({ error: 'Failed to update UPI settings' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
