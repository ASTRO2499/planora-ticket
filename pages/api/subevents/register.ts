import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

interface RegistrationRequest {
  subEventId: string
  eventId: string
  name: string
  email: string
  phone?: string
  college?: string
  notes?: string
  paymentMethod?: 'online' | 'offline'
  isDraft?: boolean
  editCount?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subEventId, eventId, name, email, phone, college, notes, paymentMethod, isDraft = false, editCount = 0 }: RegistrationRequest = req.body

    // Validate inputs
    if (!subEventId || !eventId || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if sub-event exists and get details
    const { data: subEvent, error: subEventError } = await supabase
      .from('sub_events')
      .select('*, current_registrations:sub_event_registrations(count)')
      .eq('id', subEventId)
      .single()

    if (subEventError || !subEvent) {
      return res.status(404).json({ error: 'Sub-event not found' })
    }

    // Check if sub-event belongs to the correct event
    if (subEvent.event_id !== eventId) {
      return res.status(400).json({ error: 'Invalid event ID' })
    }

    // Check capacity (only for non-draft submissions)
    const currentRegistrations = subEvent.current_registrations?.[0]?.count || 0
    if (!isDraft && subEvent.max_capacity && currentRegistrations >= subEvent.max_capacity) {
      return res.status(400).json({ error: 'This session is at full capacity' })
    }

    // Check if user already registered with submitted status (not draft)
    const { data: existingReg, error: checkError } = await supabase
      .from('sub_event_registrations')
      .select('id, is_draft')
      .eq('sub_event_id', subEventId)
      .eq('email', email)
      .single()

    if (existingReg && !isDraft) {
      // If existing is draft, allow update to submitted
      if (!existingReg.is_draft) {
        return res.status(400).json({ error: 'You are already registered for this session' })
      }
      // Update draft to submitted
      const { data: registration, error: updateError } = await supabase
        .from('sub_event_registrations')
        .update({
          name,
          email,
          phone: phone || null,
          college: college || null,
          notes: notes || null,
          payment_method: paymentMethod || 'offline',
          payment_status: paymentMethod === 'online' ? 'pending' : 'not_required',
          registered_at: new Date().toISOString(),
          is_draft: false,
          submission_status: 'submitted',
          edit_count: editCount,
          last_edited_at: new Date().toISOString()
        })
        .eq('id', existingReg.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return res.status(500).json({ error: 'Failed to update registration' })
      }

      // Update registration count only if transitioning from draft to submitted
      const newCount = currentRegistrations + 1
      await supabase
        .from('sub_events')
        .update({ current_registrations: newCount })
        .eq('id', subEventId)

      // Send confirmation email (don't fail registration if email fails)
      try {
        const emailRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subevents/send-confirmation-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: registration.id })
        })
        if (!emailRes.ok) {
          console.error('Email send failed:', { status: emailRes.status, registrationId: registration.id })
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr, { registrationId: registration.id })
      }

      return res.status(200).json({
        success: true,
        registrationId: registration.id,
        message: 'Registration submitted successfully'
      })
    }

    // Create new registration
    const { data: registration, error: createError } = await supabase
      .from('sub_event_registrations')
      .insert({
        sub_event_id: subEventId,
        name,
        email,
        phone: phone || null,
        college: college || null,
        notes: notes || null,
        payment_method: paymentMethod || 'offline',
        payment_status: paymentMethod === 'online' ? 'pending' : 'not_required',
        registered_at: new Date().toISOString(),
        is_draft: isDraft,
        submission_status: isDraft ? 'draft' : 'submitted',
        edit_count: editCount,
        last_edited_at: isDraft ? new Date().toISOString() : null,
        form_version: 1
      })
      .select()
      .single()

    if (createError) {
      console.error('Registration error:', createError)
      return res.status(500).json({ error: 'Failed to register' })
    }

    // Update registration count only for submitted registrations
    if (!isDraft) {
      const newCount = currentRegistrations + 1
      await supabase
        .from('sub_events')
        .update({ current_registrations: newCount })
        .eq('id', subEventId)

      // Send confirmation email (don't fail registration if email fails)
      try {
        const emailRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subevents/send-confirmation-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: registration.id })
        })
        if (!emailRes.ok) {
          console.error('Email send failed:', { status: emailRes.status, registrationId: registration.id })
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr, { registrationId: registration.id })
      }
    }

    return res.status(201).json({
      success: true,
      registrationId: registration.id,
      message: isDraft ? 'Draft saved successfully' : 'Registered successfully'
    })
  } catch (error: any) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
