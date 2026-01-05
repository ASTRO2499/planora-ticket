import React, { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { toast } from 'react-hot-toast'
import { Trash2, Plus, Eye, EyeOff, Copy, Check } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount' | 'free'
  discount_value: number
  max_redemptions: number
  used_count: number
  is_active: boolean
  description: string
  expires_at: string | null
}

interface CouponManagerProps {
  eventId: string
  organizerId: string
  onClose?: () => void
}

export default function CouponManager({ eventId, organizerId, onClose }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount' | 'free'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchCoupons = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizer/coupons?eventId=${eventId}&organizerId=${organizerId}`)
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch (err) {
      console.error('Error fetching coupons:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, organizerId])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    if (discountType !== 'free' && !discountValue) {
      toast.error('Please enter a discount value')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/organizer/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          eventId,
          organizerId,
          discountType,
          discountValue: parseInt(discountValue),
          maxRedemptions: parseInt(maxRedemptions),
          expiresAt: expiresAt || null,
          description
        })
      })

      if (res.ok) {
        toast.success('Coupon created successfully!')
        setCode('')
        setDiscountValue('')
        setMaxRedemptions('100')
        setExpiresAt('')
        setDescription('')
        setShowForm(false)
        fetchCoupons()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create coupon')
      }
    } catch (err) {
      toast.error('Error creating coupon')
    } finally {
      setCreating(false)
    }
  }

  async function toggleCoupon(id: string, isActive: boolean) {
    try {
      const res = await fetch('/api/organizer/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })

      if (res.ok) {
        toast.success(isActive ? 'Coupon deactivated' : 'Coupon activated')
        fetchCoupons()
      }
    } catch (err) {
      toast.error('Error updating coupon')
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const res = await fetch(`/api/organizer/coupons?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        toast.success('Coupon deleted')
        fetchCoupons()
      }
    } catch (err) {
      toast.error('Error deleting coupon')
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Coupon Codes</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="primary"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Coupon Code *
                </label>
                <Input
                  placeholder="e.g., SUMMER2025"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Discount Type *
                </label>
                <select
                  value={discountType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount (₹)</option>
                  <option value="free">Free (100% off)</option>
                </select>
              </div>

              {discountType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Discount Value *
                  </label>
                  <Input
                    type="number"
                    placeholder={discountType === 'percentage' ? '0-100' : '0'}
                    value={discountValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountValue(e.target.value)}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Redemptions
                {/* Removed duplicate closing label tag */}
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={maxRedemptions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxRedemptions(e.target.value)}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expires At (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Early bird offer, VIP discount, etc."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-slate-400">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No coupons created yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first coupon to offer discounts</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className={`p-4 ${
                coupon.is_active
                  ? 'bg-slate-700/50 border-slate-600'
                  : 'bg-slate-800/30 border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-lg font-bold text-violet-400">
                      {coupon.code}
                    </code>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="p-1 hover:bg-slate-600 rounded transition-colors"
                      title="Copy code"
                    >
                      {copied === coupon.code ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    {!coupon.is_active && (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-400">Discount:</span>
                      {' '}
                      <span className="font-semibold">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : coupon.discount_type === 'free'
                          ? 'FREE (100%)'
                          : `₹${coupon.discount_value}`}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Redemptions:</span>
                      {' '}
                      <span className="font-semibold">
                        {coupon.used_count}/{coupon.max_redemptions}
                      </span>
                    </p>
                    {coupon.expires_at && (
                      <p>
                        <span className="text-slate-400">Expires:</span>
                        {' '}
                        {new Date(coupon.expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {coupon.description && (
                      <p className="text-slate-400 italic">{coupon.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCoupon(coupon.id, coupon.is_active)}
                    className="p-2 hover:bg-slate-600 rounded transition-colors"
                    title={coupon.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {coupon.is_active ? (
                      <Eye className="w-4 h-4 text-slate-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteCoupon(coupon.id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
