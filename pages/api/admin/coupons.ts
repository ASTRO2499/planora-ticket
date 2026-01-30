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

  if (req.method === 'POST') {
    return createCoupon(req, res)
  } else if (req.method === 'GET') {
    return getCoupons(req, res)
  } else if (req.method === 'PUT') {
    return updateCoupon(req, res)
  } else if (req.method === 'DELETE') {
    return deleteCoupon(req, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function createCoupon(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      code,
      eventId,
      maxRedemptions,
      discountType,
      discountValue,
      expiresAt,
      description
    } = req.body

    if (!code || !eventId) {
      return res.status(400).json({ error: 'Missing required fields: code, eventId' })
    }

    // Validate discount
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' })
    }

    if (discountType === 'fixed_amount' && discountValue < 0) {
      return res.status(400).json({ error: 'Fixed amount must be positive' })
    }

    // Handle free coupon discount value
    const finalDiscountValue = discountType === 'free' ? 0 : discountValue

    const { data, error } = await supabase
      .from('coupons')
      .insert([
        {
          code: code.toUpperCase().trim(),
          event_id: eventId,
          max_redemptions: maxRedemptions || 100,
          discount_type: discountType,
          discount_value: finalDiscountValue,
          expires_at: expiresAt || null,
          description: description || null,
          is_active: true,
          used_count: 0
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Coupon creation error:', error)
      if (error.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Coupon code already exists' })
      }
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(data)
  } catch (err: any) {
    console.error('Error creating coupon:', err)
    return res.status(500).json({ error: 'Failed to create coupon' })
  }
}

async function getCoupons(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eventId } = req.query

    let query = supabase.from('coupons').select('*')

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json(data || [])
  } catch (err: any) {
    console.error('Error fetching coupons:', err)
    return res.status(500).json({ error: 'Failed to fetch coupons' })
  }
}

async function updateCoupon(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, isActive, description } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Coupon ID required' })
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.is_active = isActive
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json(data)
  } catch (err: any) {
    console.error('Error updating coupon:', err)
    return res.status(500).json({ error: 'Failed to update coupon' })
  }
}

async function deleteCoupon(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Coupon ID required' })
    }

    const { error } = await supabase.from('coupons').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting coupon:', err)
    return res.status(500).json({ error: 'Failed to delete coupon' })
  }
}
