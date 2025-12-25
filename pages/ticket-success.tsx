import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, Download, Eye, Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'
import LoadingAnimation from '../components/LoadingAnimation'

export default function TicketSuccess() {
  const router = useRouter()
  const { email, token } = router.query
  
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAnimation, setShowAnimation] = useState(true)

  useEffect(() => {
    if (!email || !token) {
      setLoading(false)
      return
    }
        setShowAnimation(true)

    async function fetchTickets() {
      try {
        const res = await fetch('/api/tickets-by-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-otp-token': String(token)
          },
          body: JSON.stringify({ email })
        })

        const data = await res.json()
        if (res.ok && data.tickets) {
          setTickets(data.tickets)
          // Hide animation after 1.5 seconds
          setTimeout(() => setShowAnimation(false), 1500)
        } else {
          toast.error(data.error || 'Failed to fetch tickets')
        }
      } catch (err) {
        console.error('Error fetching tickets:', err)
        toast.error('Failed to fetch tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [email, token])

  return (
    <>
      <Head>
        <title>Tickets Successfully Verified | Planora</title>
        <meta name="description" content="Your tickets have been successfully verified" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8">
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm pointer-events-auto px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex flex-col items-center gap-6 sm:gap-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 20,
                  duration: 0.5
                }}
              >
                {/* Checkmark */}
                <motion.div
                  className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center shadow-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0.7)',
                      '0 0 0 30px rgba(16, 185, 129, 0)',
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 120 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-white drop-shadow-lg" />
                  </motion.div>
                </motion.div>

                {/* Text animation */}
                <motion.div
                  className="text-center relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Verification Successful!
                  </h2>
                  <p className="text-lg text-emerald-200">
                    Your tickets are ready
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`max-w-6xl mx-auto transition-all duration-300 ${showAnimation ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Email Verified!
              </h1>
            </div>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Great! We&apos;ve verified your email. Your tickets are now available for viewing and download.
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="py-20">
              <LoadingAnimation message="Loading Your Tickets" size="lg" />
            </div>
          )}

          {/* Tickets Grid */}
          {!loading && tickets.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  className="group relative h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="relative h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 hover:border-green-500/50 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 flex flex-col">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ✓ Verified
                      </motion.div>
                      <span className="text-xs text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Ticket Info */}
                    <div className="flex-1 space-y-3 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Name
                        </p>
                        <p className="text-lg font-bold text-white truncate">
                          {ticket.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-slate-300 truncate">
                          {ticket.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Ticket ID
                        </p>
                        <p className="text-sm font-mono text-emerald-300 truncate">
                          {ticket.id.slice(0, 8)}...
                        </p>
                      </div>

                      {ticket.event_id && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                            Event
                          </p>
                          <p className="text-sm text-slate-300">
                            {ticket.event_id}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Code Preview */}
                    {ticket.qr && (
                      <div className="mb-6 flex justify-center p-3 bg-white/5 rounded-lg border border-slate-600/30">
                        <img
                          src={ticket.qr}
                          alt="QR Code"
                          className="w-24 h-24"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Link
                        href={`/ticket/${ticket.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        View Ticket
                      </Link>

                      <a
                        href={ticket.pdfUrl || `/api/ticket-pdf?id=${ticket.id}`}
                        download
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500 transform hover:scale-105 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && tickets.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-6 bg-slate-700/30 border border-slate-600/50 rounded-2xl max-w-md mx-auto">
                <Mail className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Tickets Found</h3>
                <p className="text-slate-400 mb-6">
                  No tickets were found for the email address {email}
                </p>
                <Link
                  href="/my-tickets"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all"
                >
                  Try Another Email
                </Link>
              </div>
            </motion.div>
          )}

          {/* Footer Actions */}
          {!loading && tickets.length > 0 && (
            <motion.div
              className="mt-12 text-center space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-slate-300 mb-4">
                  Need to find another ticket?
                </p>
                <Link
                  href="/my-tickets"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                >
                  Search by Email
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                Questions? Contact us at{' '}
                <a
                  href="mailto:support@planora.app"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  support@planora.app
                </a>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
