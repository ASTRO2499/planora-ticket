import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { XCircle, Home, RefreshCw, HelpCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function PaymentFailed() {
  const router = useRouter()
  const { reason, eventId } = router.query

  const errorMessages: Record<string, string> = {
    'payment_failed': 'Your payment could not be processed.',
    'verification_failed': 'Payment verification failed.',
    'cancelled': 'You cancelled the payment.',
    'timeout': 'Payment session timed out.',
    'invalid': 'Invalid payment details.',
    'default': 'Something went wrong with your payment.'
  }

  const getMessage = () => {
    return errorMessages[reason as string] || errorMessages.default
  }

  return (
    <>
      <Head>
        <title>Payment Failed | Planora</title>
        <meta name="description" content="Payment unsuccessful" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Animated Error Indicator */}
          <motion.div
            className="flex flex-col items-center justify-center mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pulsing circles */}
            <div className="relative">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-red-400"
                  animate={{
                    scale: [1, 1.4],
                    opacity: [0.8, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity
                  }}
                />
              ))}

              <motion.div
                className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-2xl"
                animate={{
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: 3
                }}
              >
                <XCircle className="w-20 h-20 sm:w-32 sm:h-32 text-white drop-shadow-lg" />
              </motion.div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            className="text-center mb-8 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Payment Failed
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-2">
              {getMessage()}
            </p>
            <p className="text-sm sm:text-base text-slate-400">
              No charges were made to your account.
            </p>
          </motion.div>

          {/* Error Details Card */}
          <motion.div
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              What happened?
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>Your payment was not completed successfully</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>Please check your payment details and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>If the problem persists, contact your bank or try a different payment method</span>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {eventId ? (
              <Link href={`/event/${eventId}`} className="flex-1">
                <Button variant="primary" className="w-full h-12 sm:h-14 text-base sm:text-lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
              </Link>
            ) : (
              <Link href="/events" className="flex-1">
                <Button variant="primary" className="w-full h-12 sm:h-14 text-base sm:text-lg">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Browse Events
                </Button>
              </Link>
            )}
            
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full h-12 sm:h-14 text-base sm:text-lg border border-white/20 hover:bg-white/10">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
          </motion.div>

          {/* Support Link */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <p className="text-sm text-slate-400">
              Need help?{' '}
              <a href="mailto:support@planora.app" className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
