import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, eventId } = req.body

    if (!code || !eventId) {
      return res.status(400).json({ error: 'Missing code or eventId' })
    }

    // Find coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return res.status(400).json({ error: 'Invalid coupon code' })
    }

    // Check if expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' })
    }

    // Check redemption limit
    if (coupon.used_count >= coupon.max_redemptions) {
      return res.status(400).json({ error: 'Coupon redemption limit reached' })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      // This will be calculated with the actual price during checkout
      discountAmount = coupon.discount_value
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = coupon.discount_value
    } else if (coupon.discount_type === 'free') {
      // For free coupons, we'll mark it as 100% in the response
      discountAmount = 100
    }

    return res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      description: coupon.description,
      remaining: coupon.max_redemptions - coupon.used_count
    })
  } catch (err) {
    console.error('Error validating coupon:', err)
    return res.status(500).json({ error: 'Failed to validate coupon' })
  }
}
