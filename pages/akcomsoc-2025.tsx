import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { toast } from 'react-hot-toast'

const PRICE_RUPEES = 1000
const PRICE_PAISE = PRICE_RUPEES * 100

export default function AKCOMSOC2025Page() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    ieee: '',
  })
  const [loading, setLoading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const startPayment = useCallback(async () => {
    setLoading(true)
    try {
      // Basic client-side validation
      const emailValid = /.+@.+\..+/.test(form.email)
      const phoneValid = /^(\+\d{1,3}[- ]?)?\d{10}$/.test(form.phone)
      if (!form.name.trim()) {
        toast.error('Please enter your full name')
        return
      }
      if (!emailValid) {
        toast.error('Please enter a valid email')
        return
      }
      if (!phoneValid) {
        toast.error('Please enter a valid 10-digit phone number')
        return
      }
      if (!form.college.trim()) {
        toast.error('Please enter your college')
        return
      }
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, amount: PRICE_PAISE })
      })
      const order = await orderRes.json()
      if (!orderRes.ok) {
        toast.error(order?.message || 'Failed to create order')
        return
      }
      const options: any = {
        key: order.razorpayKey,
        amount: order.amount,
        currency: 'INR',
        name: 'AKCOMSOC 2025',
        description: 'Registration Fee',
        order_id: order.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        notes: { event: 'AKCOMSOC2025' },
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
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                  college: form.college,
                  ieee: form.ieee,
                  eventId: 'AKCOMSOC2025'
                }
              })
            })
            const v = await verifyRes.json()
            if (verifyRes.ok && v.ticketUrl) {
              toast.success('🎉 Registration Successful! Check your email for ticket details.', {
                duration: 5000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '16px',
                  padding: '16px'
                }
              })
              setTimeout(() => {
                window.location.href = v.ticketUrl
              }, 2000)
            } else {
              toast.error(`Payment verification failed: ${v.error || 'Unknown error'}`)
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
  }, [form])

  useEffect(() => {
    // Load Razorpay script if not present
    const id = 'razorpay-sdk'
    if (document.getElementById(id)) return
    const script = document.createElement('script')
    script.id = id
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const disabled = loading || !form.name || !form.email || !form.phone || !form.college

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <Head>
        <title>AKCOMSOC 2025</title>
      </Head>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-display font-bold text-white">AKCOMSOC 2025</h1>
        <p className="text-slate-300">
          Dive into the future of connectivity: a focused event on 5G networks and Communication IoT. Explore ultra-low latency systems, edge computing, massive device orchestration, and secure protocols powering next-gen applications—from smart campuses and industry automation to immersive media and real-time analytics.
        </p>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 h-40 sm:h-56 md:h-64 flex items-center justify-center">
            <div className="text-white text-2xl font-semibold">Communication • 5G • IoT</div>
          </div>
        </div>
      </motion.div>

      <Card className="p-6 space-y-4 bg-white/5 border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input placeholder="Full Name" value={form.name} onChange={e => update('name', e.target.value)} />
          <Input placeholder="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
          <Input placeholder="Phone Number" value={form.phone} onChange={e => update('phone', e.target.value)} />
          <Input placeholder="College" value={form.college} onChange={e => update('college', e.target.value)} />
          <Input placeholder="IEEE Number (optional)" value={form.ieee} onChange={e => update('ieee', e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-slate-400">Registration Fee: ₹{PRICE_RUPEES}</div>
          <Button onClick={startPayment} isLoading={loading} disabled={disabled} variant="primary" className="px-6">Register Now</Button>
        </div>
      </Card>
    </div>
  )
}
