import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  Download,
  Eye,
  Share2,
  Home
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import LoadingAnimation from '../components/LoadingAnimation'

export default function PaymentSuccess() {
  const router = useRouter()
  const { ticketId, eventId } = router.query

  const [ticket, setTicket] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAnimation, setShowAnimation] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!ticketId) {
      setLoading(false)
      setShowAnimation(false)
      return
    }

    async function fetchTicketAndEvent() {
      try {
        // Fetch ticket details
        const ticketRes = await fetch(`/api/ticket/${ticketId}`)
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json()
          setTicket(ticketData)

          // Fetch event details if available
          if (ticketData.event_id || eventId) {
            const eventsRes = await fetch('/api/events')
            if (eventsRes.ok) {
              const eventsData = await eventsRes.json()
              const foundEvent = eventsData.events?.find(
                (e: any) => e.id === (ticketData.event_id || eventId)
              )
              if (foundEvent) {
                setEvent(foundEvent)
              }
            }
          }
        }
        setLoading(false)
        // Hide animation after data is loaded (faster)
        setTimeout(() => setShowAnimation(false), 800)
      } catch (err) {
        console.error('Error fetching data:', err)
        setLoading(false)
        setShowAnimation(false)
      }
    }

    fetchTicketAndEvent()
  }, [ticketId, eventId])

  const handleCopyTicketId = () => {
    if (ticket?.id) {
      navigator.clipboard.writeText(ticket.id)
      setCopied(true)
      toast.success('Ticket ID copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    const shareText = `I just registered for ${event?.title || 'an event'} with Planora! Check it out.`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Planora Event Registration',
          text: shareText,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  return (
    <>
      <Head>
        <title>Registration Successful | Planora</title>
        <meta name="description" content="Your event registration is complete!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8">
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/50 backdrop-blur-lg pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
            {/* Animated fireworks background */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: `hsl(${i * 45}, 100%, 50%)`,
                    left: '50%',
                    top: '50%'
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI) / 4) * 200,
                    y: Math.sin((i * Math.PI) / 4) * 200,
                    opacity: [1, 0],
                    scale: [1, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: 0.3,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </motion.div>

            {/* Main success indicator */}
            <motion.div
              className="relative z-10 mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 15,
                duration: 0.8
              }}
            >
              {/* Animated circles background */}
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{
                    scale: [1, 1.3],
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity
                  }}
                />
              ))}

              <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center shadow-2xl">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.5,
                    type: 'spring',
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <CheckCircle2 className="w-20 h-20 sm:w-32 sm:h-32 text-white drop-shadow-lg" />
                </motion.div>
              </div>
            </motion.div>

            {/* Text animation */}
            <motion.div
              className="text-center relative z-10 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
                Registration Successful!
              </h2>
              <p className="text-xl text-emerald-200 max-w-md mx-auto">
                {event?.title
                  ? `You're registered for ${event.title}`
                  : 'Your ticket has been issued'}
              </p>
              <p className="text-sm text-slate-400 mt-3">
                Check your email for ticket details
              </p>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto transition-all duration-300 pointer-events-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                All Set!
              </h1>
            </div>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Your registration is complete. Your ticket has been sent to your email address.
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="py-20">
              <LoadingAnimation message="Preparing Your Ticket Details" size="lg" />
            </div>
          )}

          {/* Content Cards */}
          {!loading && (
            <div className="space-y-6">
              {/* Ticket Summary Card */}
              {ticket && (
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

                  <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 hover:border-green-500/50 rounded-2xl p-8 backdrop-blur-sm transition-all duration-300">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-wider text-slate-400 mb-2">
                          Ticket Information
                        </p>
                        <h2 className="text-2xl font-bold text-white">
                          {ticket.name}
                        </h2>
                      </div>
                      <motion.div
                        className="px-4 py-2 bg-green-500/20 text-green-300 text-sm font-semibold rounded-full border border-green-500/30"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ✓ Verified
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                          Email
                        </p>
                        <p className="text-slate-300">{ticket.email}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                          Ticket ID
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-300 font-mono text-sm">
                            {ticket.id.slice(0, 12)}...
                          </p>
                          <motion.button
                            onClick={handleCopyTicketId}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-lg transition-all ${
                              copied
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-400'
                            }`}
                            title="Copy Ticket ID"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {ticket.college && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                        <p className="text-xs uppercase tracking-wider text-blue-400 mb-1">
                          Institution
                        </p>
                        <p className="text-blue-200">{ticket.college}</p>
                      </div>
                    )}

                    {/* QR Code Display */}
                    {ticket.qr && (
                      <div className="flex justify-center p-6 bg-white/5 rounded-xl border border-slate-600/30 mb-6">
                        <div className="bg-white p-4 rounded-lg">
                          <img
                            src={ticket.qr}
                            alt="Ticket QR Code"
                            className="w-40 h-40"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 pointer-events-auto">
                      <Link
                        href={`/ticket/${ticket.id}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Eye className="w-4 h-4" />
                        View Full Ticket
                      </Link>

                      <a
                        href={
                          ticket.pdfUrl || `/api/ticket-pdf?id=${ticket.id}`
                        }
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500 transform hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Event Details Card */}
              {event && (
                <motion.div
                  className="group relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

                  <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 hover:border-blue-500/50 rounded-2xl p-8 backdrop-blur-sm transition-all duration-300">
                    <div className="mb-6">
                      <p className="text-sm uppercase tracking-wider text-slate-400 mb-2">
                        Event Details
                      </p>
                      <h3 className="text-3xl font-bold text-white">
                        {event.title}
                      </h3>
                    </div>

                    {event.description && (
                      <p className="text-slate-300 mb-6 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Event Info Grid */}
                    <div className="space-y-4">
                      {event.event_date && (
                        <div className="flex items-start gap-4 p-4 bg-slate-600/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                              Event Date & Time
                            </p>
                            <p className="text-slate-300">
                              {new Date(event.event_date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }
                              )}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(event.event_date).toLocaleTimeString(
                                'en-US',
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-start gap-4 p-4 bg-slate-600/20 rounded-lg">
                          <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                              Location
                            </p>
                            <p className="text-slate-300">{event.location}</p>
                          </div>
                        </div>
                      )}

                      {event.capacity && (
                        <div className="flex items-start gap-4 p-4 bg-slate-600/20 rounded-lg">
                          <Users className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                              Event Capacity
                            </p>
                            <p className="text-slate-300">
                              Up to {event.capacity} attendees
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reminder Card */}
              <motion.div
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Important Reminders
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>
                          Save or print your ticket - you&apos;ll need it for entry
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>
                          Arrive 15 minutes early for check-in and QR scanning
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>
                          Bring a valid ID for verification purposes
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Actions */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.button
                  onClick={handleShare}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold rounded-lg transition-all border border-slate-600/50 hover:border-slate-500 cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Home className="w-4 h-4" />
                  Back to Home
                </Link>
              </motion.div>
            </div>
          )}

          {/* Support Section */}
          <motion.div
            className="mt-12 text-center p-6 bg-slate-700/20 border border-slate-600/30 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-slate-300 mb-4">
              Have questions about your registration?
            </p>
            <a
              href="mailto:support@planora.app"
              className="inline-block text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Contact Support →
            </a>
          </motion.div>
        </div>
      </div>
    </>
  )
}
