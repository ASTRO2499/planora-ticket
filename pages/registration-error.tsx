import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { XCircle } from 'lucide-react'

export default function RegistrationErrorPage() {
  const router = useRouter()
  const { eventId, message } = router.query

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      if (eventId) {
        router.push(`/event/${eventId}/track`)
      } else {
        router.push('/events')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [eventId, router])

  return (
    <>
      <Head>
        <title>Registration Error | Planora</title>
      </Head>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1a0d0d] via-[#2d1515] to-[#0a0404] text-white flex items-center justify-center px-4">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.03),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_22%)]" />
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6 text-center"
          >
            {/* Error Icon with pulse */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            >
              <XCircle className="w-24 h-24 text-red-400" strokeWidth={1.5} />
            </motion.div>

            {/* Error text with fade in */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold text-white">Already Registered</h2>
              <p className="text-slate-300 text-lg max-w-md">
                {message || 'You are already registered for this session.'}
              </p>
              <p className="text-slate-400 text-sm">
                Redirecting you back in 3 seconds...
              </p>
            </motion.div>

            {/* Background glow pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ delay: 0.15 }}
              className="absolute w-40 h-40 bg-red-500 rounded-full blur-3xl -z-10"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
