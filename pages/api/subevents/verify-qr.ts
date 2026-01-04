import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST for verification
  if (req.method === 'POST') {
    try {
      const { data } = req.body
      
      if (!data) {
        return res.json({ valid: false, reason: 'Missing QR data' })
      }

      let qrData: any = null
      
      // Try to parse as JSON (new format)
      try {
        qrData = JSON.parse(data)
      } catch (e) {
        // If not JSON, it might be old format or invalid
        return res.json({ valid: false, reason: 'Invalid QR format' })
      }

      const { registrationId, subEventId, email } = qrData

      if (!registrationId || !subEventId || !email) {
        return res.json({ valid: false, reason: 'Missing QR data fields' })
      }

      // Get registration
      const { data: registration, error: regError } = await supabase
        .from('sub_event_registrations')
        .select('*, sub_events(*)')
        .eq('id', registrationId)
        .single()

      if (regError || !registration) {
        console.error('Registration not found:', { registrationId, error: regError })
        return res.json({ valid: false, reason: 'Registration not found' })
      }

      // Verify email matches
      if (registration.email !== email) {
        return res.json({ valid: false, reason: 'Email mismatch' })
      }

      // Verify sub-event matches
      if (registration.sub_event_id !== subEventId) {
        return res.json({ valid: false, reason: 'Sub-event mismatch' })
      }

      // Check if already checked in
      if (registration.checked_in) {
        const checkedInTime = registration.checked_in_at 
          ? new Date(registration.checked_in_at).toLocaleString() 
          : 'Unknown time'
        return res.json({ 
          valid: false, 
          reason: `Already checked in at ${checkedInTime}` 
        })
      }

      // Check registration status
      if (registration.submission_status !== 'submitted') {
        return res.json({ valid: false, reason: `Registration status: ${registration.submission_status}` })
      }

      // All validations passed
      return res.json({ 
        valid: true, 
        id: registration.id,
        name: registration.name,
        email: registration.email,
        subEventId: registration.sub_event_id,
        trackTitle: registration.sub_events?.title,
        registeredAt: registration.registered_at
      })
    } catch (error) {
      console.error('QR verification error:', error)
      return res.json({ valid: false, reason: 'Verification failed' })
    }
  }

  // Handle PUT for marking as checked in
  if (req.method === 'PUT') {
    try {
      const { registrationId } = req.body

      if (!registrationId) {
        return res.status(400).json({ error: 'registrationId required' })
      }

      const { error } = await supabase
        .from('sub_event_registrations')
        .update({ 
          checked_in: true, 
          checked_in_at: new Date().toISOString()
        })
        .eq('id', registrationId)

      if (error) {
        console.error('Check-in update error:', error)
        return res.status(500).json({ error: error.message })
      }

      return res.json({ success: true })
    } catch (error) {
      console.error('Check-in error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
