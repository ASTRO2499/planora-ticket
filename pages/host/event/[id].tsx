import { useRouter } from 'next/router'
import { useState } from 'react'
import Script from 'next/script'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { DollarSign } from 'lucide-react'

const HOSTING_FEE = 500 // ₹500 hosting fee
const HOSTING_FEE_PAISE = HOSTING_FEE * 100

export default function EventCheckoutPage() {
  const router = useRouter()
  const { id } = router.query
  const [organizer, setOrganizer] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePayment() {
    setLoading(true)
    try {
      if (!organizer.trim() || !email.trim() || !phone.trim()) {
        toast.error('Please fill all fields')
        return
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizer,
          email: email,
          amount: HOSTING_FEE_PAISE
        })
      })

      const order = await res.json()
      if (!res.ok) {
        toast.error(order?.message || 'Failed to create order')
        return
      }

      const options: any = {
        key: order.razorpayKey,
        amount: order.amount,
        currency: 'INR',
        name: 'Planora - Event Hosting',
        description: 'Event Hosting Fee',
        order_id: order.orderId,
        prefill: { name: organizer, email: email, contact: phone },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                metadata: {
                  name: organizer,
                  email: email,
                  phone: phone,
                  eventId: id,
                  type: 'hosting_fee'
                }
              })
            })
            const v = await verifyRes.json()
            if (verifyRes.ok) {
              toast.success('Payment successful! Your event is now live.')
              router.push(`/events`)
            } else {
              toast.error('Payment verified but processing failed')
            }
          } catch (err) {
            toast.error('Verification failed')
          }
        },
        theme: { color: '#7C3AED' }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-white">Complete Your Event Setup</h1>
          <p className="text-slate-400">One-time hosting fee to publish your event</p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Event Hosting Fee</h2>
              <p className="text-slate-400 text-sm">
                A one-time fee to publish and manage your event on Planora. Includes event page, registration management, and payment processing.
              </p>
            </div>
            <div className="text-3xl font-bold text-violet-400 flex items-center gap-1 whitespace-nowrap">
              <DollarSign className="w-8 h-8" /> ₹{HOSTING_FEE}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Organizer Details</h3>
          <div className="space-y-3">
            <Input
              placeholder="Full Name"
              value={organizer}
              onChange={e => setOrganizer(e.target.value)}
              disabled={loading}
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400">Hosting Fee</span>
            <span className="text-white">₹{HOSTING_FEE}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="font-semibold text-white">Total</span>
            <span className="font-bold text-lg text-violet-400">₹{HOSTING_FEE}</span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          isLoading={loading}
          disabled={loading}
          variant="primary"
          className="w-full h-12"
        >
          Proceed to Payment
        </Button>
      </motion.div>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  )
}
