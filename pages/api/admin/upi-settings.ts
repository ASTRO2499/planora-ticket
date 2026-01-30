import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/adminSession'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ADMIN ONLY: Check authentication
  if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' })

  const { eventId } = req.query

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
    } catch (err: any) {
      console.error('Error fetching UPI settings:', err)
      return res.status(500).json({ error: 'Failed to fetch UPI settings' })
    }
  }

  // POST/PUT: Update UPI settings for event
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { upi_enabled, upi_id } = req.body

      if (typeof upi_enabled !== 'boolean' || !upi_id || typeof upi_id !== 'string') {
        return res.status(400).json({
          error: 'Invalid upi_enabled (boolean) or upi_id (string)'
        })
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
    } catch (err: any) {
      console.error('Error updating UPI settings:', err)
      return res.status(500).json({
        error: 'Failed to update UPI settings',
        details: err.message
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
