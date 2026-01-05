import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, ticketId, originalPrice } = req.body

    if (!code || !ticketId) {
      return res.status(400).json({ error: 'Missing code or ticketId' })
    }

    // Find coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
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
      discountAmount = Math.round((originalPrice * coupon.discount_value) / 100)
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = Math.min(coupon.discount_value, originalPrice) // Can't discount more than price
    } else if (coupon.discount_type === 'free') {
      discountAmount = originalPrice // Free coupon discounts the entire price
    }

    // Record redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .insert([{
        coupon_id: coupon.id,
        ticket_id: ticketId,
        discount_amount: discountAmount
      }])
      .select()
      .single()

    if (redemptionError) {
      // Check if it's a duplicate redemption
      if (redemptionError.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'This ticket already has a coupon redeemed' })
      }
      throw redemptionError
    }

    // Increment used count
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('Error updating coupon count:', updateError)
    }

    return res.json({
      success: true,
      discountAmount,
      finalPrice: Math.max(0, originalPrice - discountAmount),
      couponCode: coupon.code
    })
  } catch (err) {
    console.error('Error redeeming coupon:', err)
    return res.status(500).json({ error: 'Failed to redeem coupon' })
  }
}
