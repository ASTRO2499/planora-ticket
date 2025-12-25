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
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [ieee, setIeee] = useState('')

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
  }, [id])

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
      // Create order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: event.price_inr,
          eventId: event.id,
          name,
          email,
          phone,
          college,
          ieee
        })
      })

      if (!orderRes.ok) {
        toast.error('Failed to create order')
        return
      }

      const orderData = await orderRes.json()

      // Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Rry2rwBqAIzSSw',
        amount: event.price_inr * 100,
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
                  ieee
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
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Full Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Email Address *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">College/Institution</label>
                <Input
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Your college name"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">IEEE Membership Number</label>
                <Input
                  value={ieee}
                  onChange={(e) => setIeee(e.target.value)}
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>

              <div className="pt-3 sm:pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-sm sm:text-base"
                  isLoading={submitting}
                >
                  Pay ₹{event.price_inr} & Register
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
