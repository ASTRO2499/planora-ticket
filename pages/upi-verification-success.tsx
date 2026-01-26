import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import SuccessAnimation from '../components/SuccessAnimation'

export default function UPIVerificationSuccess() {
  const router = useRouter()
  const { ticketId } = router.query
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <SuccessAnimation isVisible={true} message="Payment Verified!" />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            ✅ Payment Verified!
          </h1>
          <p className="text-lg text-purple-200 mb-2">
            Your ticket has been confirmed
          </p>
          <p className="text-sm text-purple-300">
            Check your email for the entry pass and details
          </p>
        </motion.div>

        {/* Details Card */}
        {showDetails && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Ticket ID</span>
                <span className="font-mono text-white text-sm">{ticketId?.toString().slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Status</span>
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                  Issued
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Delivery</span>
                <span className="text-purple-100">Email sent</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            onClick={() => router.push(`/ticket/${ticketId}`)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            View Ticket
          </button>
          <button
            onClick={() => router.push('/organizer')}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg border border-white/20 transition duration-300"
          >
            Back to Dashboard
          </button>
        </motion.div>

        {/* Footer Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center text-purple-300 text-sm mt-6"
        >
          Thank you for processing this payment! 🎉
        </motion.p>
      </div>
    </div>
  )
}
