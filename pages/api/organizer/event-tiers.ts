import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { eventId } = req.query
  const bodyEventId = (req.method === 'POST' && req.body?.eventId) ? req.body.eventId : undefined
  const eventIdStr = String(bodyEventId || eventId || '')
  const organizerSecret = req.headers['x-organizer-secret'] as string | undefined

  if (!eventIdStr) {
    return res.status(400).json({ error: 'Missing eventId' })
  }

  // Verify organizer ownership
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, organizer_id')
    .eq('id', eventIdStr)
    .single()

  if (eventError || !event) {
    return res.status(404).json({ error: 'Event not found' })
  }

  if (organizerSecret && event.organizer_id !== organizerSecret) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  // GET tier configuration
  if (req.method === 'GET') {
    const { data: tierData, error: tierError } = await supabase
      .from('events')
      .select('tier_1_enabled, tier_1_name, tier_1_price, tier_2_enabled, tier_2_name, tier_2_price, tier_3_enabled, tier_3_name, tier_3_price, price_inr')
      .eq('id', eventIdStr)
      .single()

    const defaults = {
      tier_1_enabled: false,
      tier_1_name: 'Tier 1',
      tier_1_price: null,
      tier_2_enabled: false,
      tier_2_name: 'Tier 2',
      tier_2_price: null,
      tier_3_enabled: false,
      tier_3_name: 'Tier 3',
      tier_3_price: null,
      price_inr: null
    }

    if (tierError) {
      console.error('Tier fetch error:', tierError)
    }

    const tiers = tierData || defaults

    return res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        tier_1_enabled: tiers.tier_1_enabled ?? defaults.tier_1_enabled,
        tier_1_name: tiers.tier_1_name ?? defaults.tier_1_name,
        tier_1_price: tiers.tier_1_price ?? defaults.tier_1_price,
        tier_2_enabled: tiers.tier_2_enabled ?? defaults.tier_2_enabled,
        tier_2_name: tiers.tier_2_name ?? defaults.tier_2_name,
        tier_2_price: tiers.tier_2_price ?? defaults.tier_2_price,
        tier_3_enabled: tiers.tier_3_enabled ?? defaults.tier_3_enabled,
        tier_3_name: tiers.tier_3_name ?? defaults.tier_3_name,
        tier_3_price: tiers.tier_3_price ?? defaults.tier_3_price,
        price_inr: tiers.price_inr ?? defaults.price_inr
      }
    })
  }

  // POST to update tier configuration
  if (req.method === 'POST') {
    const {
      tier1Enabled,
      tier1Name,
      tier1Price,
      tier2Enabled,
      tier2Name,
      tier2Price,
      tier3Enabled,
      tier3Name,
      tier3Price
    } = req.body

    // Validate inputs
    if (typeof tier1Enabled !== 'boolean' || typeof tier2Enabled !== 'boolean' || typeof tier3Enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid tier enable flags' })
    }

    const price1 = tier1Enabled ? Number(tier1Price) : null
    const price2 = tier2Enabled ? Number(tier2Price) : null
    const price3 = tier3Enabled ? Number(tier3Price) : null

    if (tier1Enabled && (isNaN(price1 as number) || (price1 as number) < 0)) {
      return res.status(400).json({ error: 'Tier 1 price must be a non-negative number' })
    }

    if (tier2Enabled && (isNaN(price2 as number) || (price2 as number) < 0)) {
      return res.status(400).json({ error: 'Tier 2 price must be a non-negative number' })
    }

    if (tier3Enabled && (isNaN(price3 as number) || (price3 as number) < 0)) {
      return res.status(400).json({ error: 'Tier 3 price must be a non-negative number' })
    }

    if (!tier1Enabled && !tier2Enabled && !tier3Enabled) {
      return res.status(400).json({ error: 'At least one tier must be enabled' })
    }

    const { error: updateError } = await supabase
      .from('events')
      .update({
        tier_1_enabled: tier1Enabled,
        tier_1_name: tier1Name || 'Option 1',
        tier_1_price: price1,
        tier_2_enabled: tier2Enabled,
        tier_2_name: tier2Name || 'Option 2',
        tier_2_price: price2,
        tier_3_enabled: tier3Enabled,
        tier_3_name: tier3Name || 'Option 3',
        tier_3_price: price3
      })
      .eq('id', eventIdStr)

    if (updateError) {
      console.error('Tier update error:', updateError)
      return res.status(500).json({
        error: updateError.message || 'Failed to update tiers',
        details: updateError
      })
    }

    return res.json({
      success: true,
      message: 'Tiers updated successfully'
    })
  }
}
