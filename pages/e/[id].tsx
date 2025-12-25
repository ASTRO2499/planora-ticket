import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import supabase from '../../lib/supabaseClient'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Rocket, ShieldCheck, Zap, Ticket as TicketIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

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

export default function EventPage() {
  const router = useRouter()
  const { id } = router.query
  const [event, setEvent] = useState<any>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('events').select('*').eq('id', id).single()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) console.error(error)
        else setEvent(data)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) return toast.error('Please enter your name')
    // The instruction removed the email validation check here, but it's good practice to keep it.
    // For faithful reproduction of the instruction, it's removed.
    // if (!validateEmail(email)) return toast.error('Please enter a valid email')

    setLoading(true)
    const toastId = toast.loading('Initializing payment...')

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          eventId: id,
          amount: event.price_inr
        })
      })
      const data = await res.json()

      if (data?.orderId && data?.razorpayKey) {
        toast.success('Order created', { id: toastId })
        const options = {
          key: data.razorpayKey,
          amount: data.amount,
          currency: 'INR',
          name: 'Cosmic Event',
          description: 'VIP Ticket Access',
          order_id: data.orderId,
          theme: { color: '#7000FF' },
          modal: { backdropclose: false },
          handler: async function (response: any) {
            toast.loading('Verifying payment...', { id: toastId })
            const verify = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, metadata: { name, email, eventId: id } })
            })
            const v = await verify.json()
            if (v?.ticketUrl) {
              toast.success('🎉 Registration Successful! Check your email for ticket details.', { 
                id: toastId,
                duration: 5000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '16px',
                  padding: '16px'
                }
              })
              setTimeout(() => window.location.href = v.ticketUrl, 2000)
            } else {
              toast.error(`Payment verification failed: ${v.error || 'Unknown error'}`, { id: toastId })
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error(data.error || 'Failed to create order')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <span className="relative px-4 py-1.5 rounded-full border border-primary/50 bg-primary/10 text-primary-foreground text-sm font-medium tracking-wide">
              UPCOMING EVENT 2025
            </span>
          </div>

          <h1 className="text-6xl lg:text-8xl font-display font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Beyond the <br />
            <span className="text-transparent bg-clip-text bg-cosmic-gradient">Horizon</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
            Experience the future of events with our blockchain-verified ticketing system.
            Secure, instant, and beautifully crafted for the space age.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button onClick={() => document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' })} variant="cosmic" className="h-14 px-8 text-base">
              Get Ticket <Rocket className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/verify">
              <Button variant="ghost" className="h-14 px-8 text-base">
                Staff Verify <ShieldCheck className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Ticket Preview / Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary to-secondary opacity-30 blur-2xl animate-pulse-glow" />
          <Card className="glass-card p-8 md:p-10 relative z-10" id="buy">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-display font-bold">VIP Access</h3>
                <p className="text-slate-400 text-sm">Limited availability</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <TicketIcon className="w-6 h-6 text-primary" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Ex. Elon Musk"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@starlink.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Ticket Price</span>
                  <span className="text-xl font-bold font-display">₹{event?.price_inr || '...'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                  <span>Processing Fee</span>
                  <span>₹0.00</span>
                </div>

                <Button
                  isLoading={loading}
                  type="submit"
                  variant="primary"
                  className="w-full h-14 text-base bg-white hover:bg-slate-200 text-black shadow-xl shadow-white/10"
                >
                  Confirm Purchase
                </Button>

                <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-2">
                  <ShieldCheck className="w-3 h-3" />
                  Secured by Razorpay & Supabase
                </p>
              </div>
            </form>
          </Card>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'Instant Delivery', icon: Zap, desc: 'Tickets delivered to your inbox instantly via specialized SMTP relay.' },
          { title: 'Secure Verification', icon: ShieldCheck, desc: 'QR codes cryptographically signed to prevent forgery and duplication.' },
          { title: 'Premium Experience', icon: Rocket, desc: 'A visually stunning booking experience that sets the tone for your event.' }
        ].map((feature, i) => (
          <Card key={i} hoverEffect className="space-y-4 p-8 bg-white/5 border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-bold font-display">{feature.title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
