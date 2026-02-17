import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { toast } from 'react-hot-toast'
import { ChevronLeft, AlertCircle } from 'lucide-react'

type SubEvent = {
  id: string
  event_id: string
  title: string
  type: string
  description?: string
  start_time?: string
  location?: string
  speaker_name?: string
  image_url?: string
  max_capacity?: number
  current_registrations: number
  price_inr?: number
  requires_payment?: boolean
}

export default function TrackRegisterPage() {
  const router = useRouter()
  const { id } = router.query

  const [subEvent, setSubEvent] = useState<SubEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    notes: ''
  })
  const [isDraft, setIsDraft] = useState(false)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [editCount, setEditCount] = useState(0)

  useEffect(() => {
    if (!id) return
    loadSubEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadSubEvent() {
    try {
      const res = await fetch(`/api/subevents/${encodeURIComponent(id as string)}`)
      if (res.ok) {
        const data = await res.json()
        setSubEvent(data.subEvent)
      } else {
        toast.error('Sub-event not found')
        router.push('/events')
      }
    } catch (error) {
      console.error('Error loading sub-event:', error)
      toast.error('Failed to load sub-event')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent, asDraft: boolean = false) {
    e.preventDefault()

    if (!subEvent) return

    // Validate form
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    // Check capacity
    if (!asDraft && subEvent.max_capacity && subEvent.current_registrations >= subEvent.max_capacity) {
      toast.error('This session is at full capacity')
      return
    }

    setRegistering(true)

    try {
      // If payment is required and online method selected, process payment
      if (!asDraft && subEvent.requires_payment && paymentMethod === 'online') {
        // Initiate Razorpay payment
        const paymentRes = await fetch('/api/organizer/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: subEvent.price_inr || 0,
            email: formData.email,
            eventType: 'sub_event',
            subEventId: subEvent.id,
            userName: formData.name
          })
        })

        if (!paymentRes.ok) {
          throw new Error('Failed to initiate payment')
        }

        const paymentData = await paymentRes.json()

        // Redirect to payment verification
        router.push(`/payment-pending?orderId=${paymentData.orderId}&subEventId=${subEvent.id}&userEmail=${formData.email}&userName=${formData.name}`)
        return
      }

      // Register without payment or with offline payment
      const registerRes = await fetch('/api/subevents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subEventId: subEvent.id,
          eventId: subEvent.event_id,
          ...formData,
          paymentMethod,
          isDraft: asDraft,
          editCount
        })
      })

      if (!registerRes.ok) {
        const error = await registerRes.json()
        
        // Check if already registered
        if (error.error && error.error.includes('already registered')) {
          router.push(`/registration-error?eventId=${subEvent.event_id}&message=${encodeURIComponent(error.error)}`)
          return
        }
        
        throw new Error(error.error || 'Registration failed')
      }

      const result = await registerRes.json()
      setRegistrationId(result.registrationId)
      
      if (asDraft) {
        toast.success('Draft saved successfully!')
        setIsDraft(true)
      } else {
        toast.success('Registered successfully!')
        router.push(`/track-generating?registrationId=${result.registrationId}`)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!subEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Sub-event not found</div>
      </div>
    )
  }

  const isFull = subEvent.max_capacity && subEvent.current_registrations >= subEvent.max_capacity

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <Head>
        <title>Register - {subEvent.title}</title>
      </Head>

      {/* Back Button */}
      <Link href={`/event/${subEvent.event_id}/track`} passHref>
        <Button variant="ghost" className="px-2 mb-4">
          <ChevronLeft className="w-5 h-5" />
          Back to Track
        </Button>
      </Link>

      {/* Sub-Event Info */}
      <Card className="p-4 sm:p-6 bg-white/5 border-white/10 space-y-3">
        {subEvent.image_url && (
          <div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden mb-4">
            <img 
              src={subEvent.image_url} 
              alt={subEvent.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{subEvent.title}</h1>
        <p className="text-slate-300 text-sm sm:text-base">{subEvent.description}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-sm">
          <div>
            <span className="text-slate-400">Type:</span>
            <p className="text-white font-medium">{subEvent.type}</p>
          </div>
          <div>
            <span className="text-slate-400">Location:</span>
            <p className="text-white font-medium">{subEvent.location || 'TBA'}</p>
          </div>
          <div>
            <span className="text-slate-400">Speaker:</span>
            <p className="text-white font-medium">{subEvent.speaker_name || 'TBA'}</p>
          </div>
          <div>
            <span className="text-slate-400">Start Time:</span>
            <p className="text-white font-medium">
              {subEvent.start_time ? new Date(subEvent.start_time).toLocaleString() : 'TBA'}
            </p>
          </div>
        </div>

        {/* Capacity Warning */}
        {isFull && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">This session is at full capacity</p>
          </div>
        )}
      </Card>

      {/* Registration Form */}
      {!isFull && (
        <Card className="p-4 sm:p-6 bg-white/5 border-white/10 space-y-4">
          <h2 className="text-xl font-bold text-white">Register for Session</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-slate-300 block mb-1">Full Name *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setEditCount(editCount + 1)
                }}
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-slate-300 block mb-1">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setEditCount(editCount + 1)
                }}
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-slate-300 block mb-1">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value })
                  setEditCount(editCount + 1)
                }}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            {/* College */}
            <div>
              <label className="text-sm text-slate-300 block mb-1">College/Institution</label>
              <Input
                type="text"
                value={formData.college}
                onChange={(e) => {
                  setFormData({ ...formData, college: e.target.value })
                  setEditCount(editCount + 1)
                }}
                placeholder="Your college/institution"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-slate-300 block mb-1">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value })
                  setEditCount(editCount + 1)
                }}
                placeholder="Any special requirements or questions..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                rows={3}
              />
            </div>

            {/* Payment Section */}
            {subEvent.requires_payment && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Payment</h3>
                  <span className="text-lg font-bold text-white">₹{subEvent.price_inr || 0}</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'offline')}
                      className="cursor-pointer"
                    />
                    <span className="text-slate-300 text-sm">Pay Online (Razorpay)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="offline"
                      checked={paymentMethod === 'offline'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'offline')}
                      className="cursor-pointer"
                    />
                    <span className="text-slate-300 text-sm">Offline Payment / Bank Transfer</span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex gap-2">
              <Link href={`/event/${subEvent.event_id}/track`} className="flex-1" passHref>
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={registering}
                className="flex-1"
                disabled={isFull || false}
              >
                {subEvent.requires_payment && paymentMethod === 'online' ? 'Proceed to Payment' : 'Register'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
