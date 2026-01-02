import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

/**
 * ORGANIZER AUTHENTICATION ONLY
 */
async function requireOrganizer(req: NextApiRequest) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)
  const { data } = await supabase.auth.getUser(token)
  const role = data?.user?.user_metadata?.role
  if (role === 'organizer') return data?.user || null
  return null
}

function getOrganizerSecret(req: NextApiRequest) {
  const secret = req.headers['x-organizer-secret']
  return typeof secret === 'string' ? secret.trim() : null
}

/**
 * SUB-EVENTS MANAGEMENT ENDPOINT
 * Authentication: Bearer token (organizer role) OR x-organizer-secret
 * Methods:
 * - GET: Fetch sub-events for an event
 * - POST: Create a new sub-event
 * - PUT: Update a sub-event
 * - DELETE: Delete a sub-event
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const organizer = await requireOrganizer(req)
  const organizerSecret = getOrganizerSecret(req)
  
  if (!organizer && !organizerSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const eventId = req.query.eventId as string

  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId parameter' })
  }

  // Verify event ownership
  async function verifyEventOwnership() {
    const { data: event, error } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', eventId)
      .maybeSingle()

    if (error || !event) {
      res.status(404).json({ error: 'Event not found' })
      return false
    }

    if (organizerSecret && event.organizer_id !== organizerSecret) {
      res.status(403).json({ error: 'Forbidden: Not your event' })
      return false
    }

    return true
  }

  // GET: Fetch sub-events for the event
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ subEvents: data || [] })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // POST: Create a new sub-event
  if (req.method === 'POST') {
    try {
      if (!(await verifyEventOwnership())) return

      const {
        title,
        description,
        type,
        start_time,
        end_time,
        location,
        max_capacity,
        speaker_name,
        speaker_email,
        speaker_bio,
        image_url,
        price_inr = 0,
        requires_payment = false,
        status = 'active',
        is_published = true,
        metadata = {}
      } = req.body

      if (!title || !type) {
        return res.status(400).json({ error: 'Missing required fields: title, type' })
      }

      const { data, error } = await supabase
        .from('sub_events')
        .insert([
          {
            event_id: eventId,
            title,
            description,
            type,
            start_time: start_time || null,
            end_time: end_time || null,
            location,
            max_capacity: max_capacity || null,
            current_registrations: 0,
            speaker_name,
            speaker_email,
            speaker_bio,
            image_url,
            price_inr: price_inr || 0,
            requires_payment: requires_payment || false,
            payment_collected: 0,
            status,
            is_published,
            metadata
          }
        ])
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ subEvent: data, message: 'Sub-event created successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // PUT: Update a sub-event
  if (req.method === 'PUT') {
    try {
      if (!(await verifyEventOwnership())) return

      const { id, ...updateData } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing sub-event id' })
      }

      // Verify sub-event belongs to this event
      const { data: subEvent, error: checkError } = await supabase
        .from('sub_events')
        .select('id, event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !subEvent || subEvent.event_id !== eventId) {
        return res.status(404).json({ error: 'Sub-event not found or does not belong to this event' })
      }

      const { data, error } = await supabase
        .from('sub_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ subEvent: data, message: 'Sub-event updated successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  // DELETE: Delete a sub-event
  if (req.method === 'DELETE') {
    try {
      if (!(await verifyEventOwnership())) return

      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing sub-event id' })
      }

      // Verify sub-event belongs to this event
      const { data: subEvent, error: checkError } = await supabase
        .from('sub_events')
        .select('id, event_id')
        .eq('id', id)
        .maybeSingle()

      if (checkError || !subEvent || subEvent.event_id !== eventId) {
        return res.status(404).json({ error: 'Sub-event not found or does not belong to this event' })
      }

      const { error } = await supabase
        .from('sub_events')
        .delete()
        .eq('id', id)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.json({ message: 'Sub-event deleted successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
