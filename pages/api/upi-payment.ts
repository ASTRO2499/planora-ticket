import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    eventId,
    ticketId,
    name,
    email,
    phone,
    college,
    amount_inr,
    upi_id,
    transaction_id,
    screenshotBase64,
    mimeType = 'image/jpeg'
  } = req.body

  // Validate required fields
  if (!eventId || !ticketId || !name || !email || !amount_inr || !upi_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    let screenshotUrl = null

    // Upload screenshot if provided
    if (screenshotBase64) {
      try {
        // Convert base64 to buffer
        const base64Data = screenshotBase64.split(',')[1] || screenshotBase64
        const buffer = Buffer.from(base64Data, 'base64')
        
        // Generate unique filename for Supabase
        const supabaseFileName = `${eventId}/${ticketId}-${Date.now()}.png`
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('upi-screenshots')
          .upload(supabaseFileName, buffer, {
            contentType: 'image/png',
            upsert: false
          })

        if (uploadError) {
          console.error('[UPI PAYMENT] Screenshot upload to Supabase error:', uploadError)
        } else {
          // Get signed URL (valid for 24 hours)
          const { data, error: urlError } = await supabase.storage
            .from('upi-screenshots')
            .createSignedUrl(supabaseFileName, 86400) // 24 hours
          
          if (urlError) {
            console.error('[UPI PAYMENT] Error generating signed URL:', urlError)
          } else {
            screenshotUrl = data?.signedUrl || null
            console.log('[UPI PAYMENT] Screenshot uploaded to Supabase:', screenshotUrl)
          }
        }
      } catch (uploadErr) {
        console.error('[UPI PAYMENT] Error processing screenshot:', uploadErr)
      }
    }

    // Create ticket entry first if it doesn't exist
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .single()

    if (!existingTicket) {
      // Create ticket entry
      const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
          id: ticketId,
          event_id: eventId,
          name,
          email,
          phone,
          payment_method: 'upi',
          upi_payment_status: 'pending',
          status: 'pending',
          upi_screenshot_url: screenshotUrl
        })

      if (ticketError) {
        console.error('[UPI PAYMENT] Error creating ticket:', ticketError)
      }
    } else {
      // Update existing ticket with UPI info
      await supabase
        .from('tickets')
        .update({
          payment_method: 'upi',
          upi_payment_status: 'pending',
          upi_screenshot_url: screenshotUrl
        })
        .eq('id', ticketId)
    }

    // Create UPI payment record
    const { data: upiPayment, error: insertError } = await supabase
      .from('upi_payments')
      .insert({
        event_id: eventId,
        ticket_id: ticketId,
        name,
        email,
        phone,
        amount_inr,
        upi_id,
        transaction_id: transaction_id || null,
        screenshot_url: screenshotUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[UPI PAYMENT] Error creating UPI payment record:', insertError)
      return res.status(500).json({ error: 'Failed to save payment record' })
    }

    console.log('[UPI PAYMENT] Payment record created:', {
      paymentId: upiPayment.id,
      supabaseUrl: !!screenshotUrl
    })

    return res.status(200).json({
      success: true,
      message: 'Payment screenshot submitted successfully. Please wait for organizer confirmation.',
      payment_id: upiPayment.id,
      status: 'pending',
      supabaseUrl: screenshotUrl
    })
  } catch (err) {
    console.error('[UPI PAYMENT] UPI payment submission error:', err)
    return res.status(500).json({ 
      error: 'Failed to process payment submission',
      details: err instanceof Error ? err.message : String(err)
    })
  }
}
