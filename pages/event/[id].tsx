import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Script from 'next/script'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Calendar, MapPin, Ticket as TicketIcon, IndianRupee } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import LoadingAnimation from '../../components/LoadingAnimation'
import UPIPayment from '../../components/UPIPayment'

declare global {
  interface Window {
    Razorpay: new (options: any) => {
      open(): void
      on(event: string, handler: Function): void
      close(): void
    }
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

export default function EventRegistrationPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generatingTicket, setGeneratingTicket] = useState(false)
  const [showUpiForm, setShowUpiForm] = useState(false)
  const [upiSettings, setUpiSettings] = useState({ upi_enabled: false, upi_id: '' })
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [ieee, setIeee] = useState('')
  const [formSettings, setFormSettings] = useState<any>(null)
  const [extras, setExtras] = useState<string[]>(['', '', '', '', ''])
  const [selectedTier, setSelectedTier] = useState('tier_1')
  const [selectedTicketId, setSelectedTicketId] = useState('')
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponData, setCouponData] = useState<any>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  function computeTierAmount(): number {
    if (!event) return 0
    let amount = event.price_inr
    if (event.tier_1_enabled && selectedTier === 'tier_1') {
      amount = event.tier_1_price || event.price_inr
    } else if (event.tier_2_enabled && selectedTier === 'tier_2') {
      amount = event.tier_2_price || event.price_inr
    } else if (event.tier_3_enabled && selectedTier === 'tier_3') {
      amount = event.tier_3_price || event.price_inr
    }
    return Number(amount) || 0
  }

  function computeFinalAmount(): number {
    const base = computeTierAmount()
    if (!couponData) return base
    if (couponData.discountType === 'free') return 0
    if (couponData.discountType === 'percentage') {
      const discounted = base * (1 - Number(couponData.discountValue || 0) / 100)
      return Math.max(0, Math.round(discounted))
    }
    if (couponData.discountType === 'fixed_amount') {
      return Math.max(0, base - Number(couponData.discountValue || 0))
    }
    return base
  }

  useEffect(() => {
    if (!id) return
    
    async function fetchEvent() {
      try {
        const res = await fetch('/api/events')
        if (res.ok) {
          const data = await res.json()
          const foundEvent = data.events?.find((e: any) => e.id === id)
          if (foundEvent) {
            setEvent(foundEvent)
            // Fetch UPI settings
            fetchUpiSettings(foundEvent.id)
          } else {
            toast.error('Event not found')
          }
        }
      } catch (err) {
        console.error('Error loading event:', err)
        toast.error('Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvent()
    async function fetchSettings() {
      try {
        const res = await fetch(`/api/event/form-settings?eventId=${encodeURIComponent(String(id))}`)
        if (res.ok) {
          const data = await res.json()
          setFormSettings(data.settings?.field_config || {})
          // Initialize extras length up to 5
          const defs: any[] = (data.settings?.field_config?.extras || []).slice(0, 5)
          setExtras((prev) => defs.map(() => '') as string[])
        }
      } catch {}
    }
    fetchSettings()
  }, [id])

  async function fetchUpiSettings(eventId: string) {
    try {
      const res = await fetch(`/api/organizer/upi-settings?eventId=${encodeURIComponent(eventId)}`)
      if (res.ok) {
        const data = await res.json()
        console.log('[UPI] Settings fetched for event:', eventId, data)
        setUpiSettings({
          upi_enabled: data.upi_enabled || false,
          upi_id: data.upi_id || ''
        })
      } else {
        console.warn('[UPI] Failed to fetch settings. Status:', res.status)
      }
    } catch (err) {
      console.error('[UPI] Error fetching UPI settings:', err)
    }
  }

  async function validateCoupon() {
    if (!couponCode.trim()) {
      setCouponData(null)
      return
    }

    setValidatingCoupon(true)
    try {
      const res = await fetch('/api/organizer/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.toUpperCase().trim(),
          eventId: event.id
        })
      })

      if (res.ok) {
        const data = await res.json()
        setCouponData(data)
        toast.success('Coupon code applied!')
      } else {
        const error = await res.json()
        setCouponData(null)
        toast.error(error.error || 'Invalid coupon code')
      }
    } catch (err) {
      setCouponData(null)
      toast.error('Error validating coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email')
      return
    }
    
    if (phone && !validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setSubmitting(true)

    try {
      // Calculate base and final amounts with coupon applied
      const baseAmount = computeTierAmount()
      const amount = computeFinalAmount()
      const discountAmount = Math.max(0, baseAmount - amount)

      // Prepare extras array based on settings order
      const extraValues: string[] = []
      const defs: any[] = (formSettings?.extras || []).slice(0, 5)
      for (let i = 0; i < defs.length; i++) {
        extraValues.push(extras[i] || '')
      }

      // If free after coupon, bypass Razorpay and issue directly
      if (amount <= 0) {
        setGeneratingTicket(true)
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metadata: {
                freeFlow: true,
                eventId: event.id,
                name,
                email,
                phone,
                college,
                ieee,
                extras: extraValues,
                selectedTier: selectedTier,
                baseAmount,
                discountAmount,
                tierPrice: amount,
                amount: 0,
                couponCode: couponCode.toUpperCase().trim() || null,
                couponData: couponData || null
              }
            })
          })

          if (verifyRes.ok) {
            const data = await verifyRes.json()
            toast.success('🎉 Registration successful! Generating your ticket...', {
              duration: 2000,
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '16px',
                padding: '16px'
              }
            })

            const ticketId = data.ticketUrl?.split('/ticket/')[1] || data.ticketId
            setTimeout(() => {
              if (ticketId) {
                router.push(`/payment-success?ticketId=${encodeURIComponent(ticketId)}&eventId=${encodeURIComponent(event.id)}`)
              } else {
                router.push('/my-tickets')
              }
            }, 1200)
          } else {
            setGeneratingTicket(false)
            router.push(`/payment-failed?reason=verification_failed&eventId=${encodeURIComponent(event.id)}`)
          }
        } catch (err) {
          console.error('Free issuance error:', err)
          setGeneratingTicket(false)
          router.push(`/payment-failed?reason=payment_failed&eventId=${encodeURIComponent(event.id)}`)
        } finally {
          setSubmitting(false)
        }
        return
      }

      // If UPI enabled, show UPI form instead of Razorpay
      if (upiSettings.upi_enabled && upiSettings.upi_id) {
        console.log('[UPI] UPI enabled for this event. Showing UPI form...')
        const ticketId = crypto.randomUUID()
        setSelectedTicketId(ticketId)
        setShowUpiForm(true)
        setSubmitting(false)
        return
      }

      console.log('[UPI] UPI not enabled or no UPI ID. Using Razorpay...')
      console.log('[UPI] UPI Status:', { enabled: upiSettings.upi_enabled, id: upiSettings.upi_id })

      // Paid flow: create order then open Razorpay
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.max(0, Math.round(Number(amount) * 100)),
          eventId: event.id,
          name,
          email,
          phone,
          college,
          ieee,
          selectedTier,
          tierPrice: amount
        })
      })

      if (!orderRes.ok) {
        toast.error('Failed to create order')
        return
      }

      const orderData = await orderRes.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Rry2rwBqAIzSSw',
        amount: Math.max(0, Math.round(Number(amount) * 100)),
        currency: 'INR',
        name: event.title,
        description: `Registration for ${event.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Show generating ticket animation immediately
          setGeneratingTicket(true)
          
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                metadata: {
                  eventId: event.id,
                  name,
                  email,
                  phone,
                  college,
                  ieee,
                  extras: extraValues,
                  selectedTier: selectedTier,
                    baseAmount,
                    discountAmount,
                    tierPrice: amount,
                    amount: Math.round(Number(amount) * 100),
                  couponCode: couponCode.toUpperCase().trim() || null,
                  couponData: couponData || null
                }
              })
            })

            if (verifyRes.ok) {
              const data = await verifyRes.json()
              
              // Show success toast
              toast.success('🎉 Payment Successful! Generating your ticket...', {
                duration: 2000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '16px',
                  padding: '16px'
                }
              })
              
              // Extract ticket ID from URL
              const ticketId = data.ticketUrl?.split('/ticket/')[1] || data.ticketId
              
              // Faster redirect after animation
              setTimeout(() => {
                if (ticketId) {
                  router.push(`/payment-success?ticketId=${encodeURIComponent(ticketId)}&eventId=${encodeURIComponent(event.id)}`)
                } else {
                  router.push('/my-tickets')
                }
              }, 1500)
            } else {
              const errorData = await verifyRes.json()
              setGeneratingTicket(false)
              // Redirect to payment failed page
              router.push(`/payment-failed?reason=verification_failed&eventId=${encodeURIComponent(event.id)}`)
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            setGeneratingTicket(false)
            // Redirect to payment failed page
            router.push(`/payment-failed?reason=payment_failed&eventId=${encodeURIComponent(event.id)}`)
          }
        },
        modal: {
          ondismiss: function() {
            // User closed the payment modal
            setSubmitting(false)
            setGeneratingTicket(false)
            toast.error('Payment cancelled')
            router.push(`/payment-failed?reason=cancelled&eventId=${encodeURIComponent(event.id)}`)
          }
        },
        prefill: {
          name,
          email,
          contact: phone
        },
        theme: {
          color: '#8B5CF6'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Error processing payment')
      router.push(`/payment-failed?reason=invalid&eventId=${encodeURIComponent(event.id)}`)
    } finally {
      setSubmitting(false)
    }
  }

  const baseConfig = formSettings?.base || {}
  const showPhone = baseConfig?.phone?.enabled !== false
  const showCollege = baseConfig?.college?.enabled !== false
  const showIeee = baseConfig?.ieee?.enabled !== false

  if (loading) {
    return <LoadingAnimation message="Loading Event Details" fullScreen />
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Event Not Found</h1>
          <p className="text-sm sm:text-base text-slate-400">The event you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/events')}>Browse Events</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Head>
        <title>{event.title} - Registration</title>
      </Head>
      {/* Load Razorpay script after interactive to avoid sync script warning */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* Generating Ticket Animation Overlay */}
      {generatingTicket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none"
        >
          <motion.div
            className="text-center space-y-6 sm:space-y-8 px-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Ticket Icon */}
            <motion.div
              className="relative mx-auto"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.div
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(124, 58, 237, 0.7)',
                    '0 0 0 20px rgba(124, 58, 237, 0)',
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <TicketIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </motion.div>

              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI) / 3) * 80,
                    y: Math.sin((i * Math.PI) / 3) * 80,
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>

            {/* Text */}
            <div className="space-y-3">
              <motion.h2
                className="text-xl sm:text-3xl font-bold text-white"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Generating Your Ticket...
              </motion.h2>
              <p className="text-xs sm:text-base text-slate-400">Please wait while we create your entry pass</p>
              
              {/* Progress Dots */}
              <div className="flex justify-center gap-2 pt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-violet-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Event Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {event.image_url && (
            <div 
              className="h-40 sm:h-64 rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${event.image_url})` }}
            />
          )}
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-white break-words">{event.title}</h1>
            <p className="text-sm sm:text-lg text-slate-300">{event.description}</p>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            {event.date && (
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-violet-400 font-semibold">
              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>₹{event.price_inr}</span>
            </div>
          </div>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 sm:p-8 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Register Now</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Tier Selection */}
              {(event.tier_1_enabled || event.tier_2_enabled) && (
                <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base font-semibold text-white">Select Registration Type</h3>
                  <div className="space-y-2">
                    {event.tier_1_enabled && (
                      <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedTier === 'tier_1' ? '#667eea' : '#374151',
                          backgroundColor: selectedTier === 'tier_1' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="tier"
                          value="tier_1"
                          checked={selectedTier === 'tier_1'}
                          onChange={(e) => setSelectedTier(e.target.value)}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-white">{event.tier_1_name || 'Option 1'}</div>
                          <div className="text-xs sm:text-sm text-slate-400">₹{event.tier_1_price || 0}</div>
                        </div>
                      </label>
                    )}
                    {event.tier_2_enabled && (
                      <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedTier === 'tier_2' ? '#667eea' : '#374151',
                          backgroundColor: selectedTier === 'tier_2' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="tier"
                          value="tier_2"
                          checked={selectedTier === 'tier_2'}
                          onChange={(e) => setSelectedTier(e.target.value)}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-white">{event.tier_2_name || 'Option 2'}</div>
                          <div className="text-xs sm:text-sm text-slate-400">₹{event.tier_2_price || 0}</div>
                        </div>
                      </label>
                    )}
                    {event.tier_3_enabled && (
                      <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedTier === 'tier_3' ? '#667eea' : '#374151',
                          backgroundColor: selectedTier === 'tier_3' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="tier"
                          value="tier_3"
                          checked={selectedTier === 'tier_3'}
                          onChange={(e) => setSelectedTier(e.target.value)}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-white">{event.tier_3_name || 'Option 3'}</div>
                          <div className="text-xs sm:text-sm text-slate-400">₹{event.tier_3_price || 0}</div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-300 mb-1 block">{baseConfig?.name?.label || 'Full Name'} *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">{baseConfig?.email?.label || 'Email Address'} *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={submitting}
                />
              </div>

              {showPhone && (
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">{baseConfig?.phone?.label || 'Phone Number'}</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    disabled={submitting}
                    required={!!baseConfig?.phone?.required}
                  />
                </div>
              )}

              {showCollege && (
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">{baseConfig?.college?.label || 'College/Institution'}</label>
                  <Input
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Your college name"
                    disabled={submitting}
                    required={!!baseConfig?.college?.required}
                  />
                </div>
              )}

              {showIeee && (
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">{baseConfig?.ieee?.label || 'IEEE Membership Number'}</label>
                  <Input
                    value={ieee}
                    onChange={(e) => setIeee(e.target.value)}
                    placeholder="Optional"
                    disabled={submitting}
                    required={!!baseConfig?.ieee?.required}
                  />
                </div>
              )}

              {/* Extra fields (up to 5) */}
              {(formSettings?.extras || []).slice(0,5).map((f: any, idx: number) => (
                <div key={idx}>
                  <label className="text-sm text-slate-300 mb-1 block">{f?.label || `Extra Field ${idx+1}`}{f?.required ? ' *' : ''}</label>
                  {f?.type === 'select' ? (
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                      value={extras[idx] || ''}
                      onChange={(e) => {
                        const arr = [...extras]; arr[idx] = e.target.value; setExtras(arr)
                      }}
                      disabled={submitting}
                      required={!!f?.required}
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>Select</option>
                      {(f?.options || []).map((opt: string, i: number) => (
                        <option key={i} value={opt} style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>{opt}</option>
                      ))}
                    </select>
                  ) : f?.type === 'yes_no' ? (
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                      value={extras[idx] || ''}
                      onChange={(e) => { const arr = [...extras]; arr[idx] = e.target.value; setExtras(arr) }}
                      disabled={submitting}
                      required={!!f?.required}
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>Select</option>
                      <option value="Yes" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>Yes</option>
                      <option value="No" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>No</option>
                    </select>
                  ) : (
                    <Input
                      value={extras[idx] || ''}
                      onChange={(e) => { const arr = [...extras]; arr[idx] = e.target.value; setExtras(arr) }}
                      placeholder={f?.placeholder || ''}
                      disabled={submitting}
                      required={!!f?.required}
                    />
                  )}
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-3">
                <h3 className="text-sm sm:text-base font-semibold text-white">Have a Coupon Code?</h3>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (optional)"
                    disabled={submitting || validatingCoupon}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="cosmic"
                    onClick={validateCoupon}
                    disabled={submitting || validatingCoupon || !couponCode.trim()}
                    size="sm"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </Button>
                </div>
                {couponData && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-300">
                      ✓ Coupon applied: {couponData.discountType === 'percentage' ? `${couponData.discountValue}% off` : `₹${couponData.discountValue} off`}
                      {couponData.description && ` - ${couponData.description}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-sm sm:text-base"
                  isLoading={submitting}
                >
                  {(() => {
                    const base = computeTierAmount()
                    const final = computeFinalAmount()
                    const showDiscount = couponData && final < base
                    if (final <= 0) return 'Complete Registration (Free)'
                    return showDiscount
                      ? `Pay ₹${final} (was ₹${base})`
                      : `Pay ₹${base} & Register`
                  })()}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* UPI Payment Form */}
        {showUpiForm && selectedTicketId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 sm:p-8 bg-white/5 border-white/10">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <span className="text-2xl">💳</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">UPI Payment</h2>
              </div>

              <UPIPayment
                eventId={event.id}
                ticketId={selectedTicketId}
                amount={computeFinalAmount()}
                name={name}
                email={email}
                phone={phone}
                college={college}
                ieee={ieee}
                upiId={upiSettings.upi_id}
                onSuccess={(paymentId) => {
                  setShowUpiForm(false)
                  toast.success('Payment submitted successfully!', {
                    duration: 3000,
                    style: {
                      background: '#10b981',
                      color: '#fff',
                      fontSize: '16px',
                      padding: '16px'
                    }
                  })
                  // Redirect to waiting page
                  setTimeout(() => {
                    router.push(
                      `/payment-success?ticketId=${encodeURIComponent(selectedTicketId)}&eventId=${encodeURIComponent(event.id)}&upiPending=true`
                    )
                  }, 1500)
                }}
                onError={(error) => {
                  toast.error(error)
                }}
              />

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-300">
                  <span className="font-semibold">ℹ️ How it works:</span>
                </p>
                <ul className="text-xs sm:text-sm text-slate-400 mt-2 space-y-1 list-disc list-inside">
                  <li>Transfer the amount shown above to the UPI ID</li>
                  <li>Upload a screenshot of the payment confirmation</li>
                  <li>Your payment will be verified by the organizer</li>
                  <li>You'll receive your ticket once approved</li>
                </ul>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    setShowUpiForm(false)
                    setSelectedTicketId('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Registration
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
