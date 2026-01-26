import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { paymentId } = req.query

  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'paymentId required' })
  }

  try {
    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('upi_payments')
      .select('screenshot_url, ticket_id, event_id')
      .eq('id', paymentId)
      .single()

    if (fetchError || !payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (!payment.screenshot_url) {
      return res.status(404).json({ error: 'No screenshot available' })
    }

    // If it's a data URL (base64), return it as is
    if (payment.screenshot_url.startsWith('data:')) {
      return res.status(200).json({ url: payment.screenshot_url })
    }

    // If it's a Supabase storage URL, return it
    if (payment.screenshot_url.includes('supabase')) {
      return res.status(200).json({ url: payment.screenshot_url })
    }

    // Try to get from storage if it's a path
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('upi-screenshots')
        .download(payment.screenshot_url)

      if (downloadError) {
        console.error('Download error:', downloadError)
        return res.status(200).json({ url: payment.screenshot_url, error: 'Storage access failed but URL provided' })
      }

      // Convert blob to data URL
      const blob = data as Blob
      const reader = new FileReader()
      let dataUrl = ''

      return new Promise((resolve) => {
        reader.onloadend = () => {
          dataUrl = reader.result as string
          resolve(res.status(200).json({ url: dataUrl }))
        }
        reader.readAsDataURL(blob)
      })
    } catch (err) {
      console.error('Error retrieving screenshot:', err)
      // Return the URL anyway, let client handle it
      return res.status(200).json({ url: payment.screenshot_url })
    }
  } catch (err) {
    console.error('Screenshot API error:', err)
    return res.status(500).json({ error: 'Failed to retrieve screenshot' })
  }
}
