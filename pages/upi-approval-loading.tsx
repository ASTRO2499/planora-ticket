import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'

export default function UPIApprovalLoading() {
  const router = useRouter()
  const { paymentId, ticketId } = router.query
  const [step, setStep] = useState(0)

  useEffect(() => {
    const steps = [
      { duration: 2000, message: 'Verifying Payment...' },
      { duration: 2000, message: 'Generating QR Code...' },
      { duration: 2000, message: 'Creating PDF Ticket...' },
      { duration: 2000, message: 'Sending Confirmation Email...' },
      { duration: 1000, message: 'Finalizing...' }
    ]

    let currentStep = 0
    let elapsed = 0

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        elapsed += 100
        if (elapsed >= steps[currentStep].duration) {
          currentStep++
          setStep(currentStep)
          elapsed = 0
        }
      } else {
        clearInterval(interval)
        // Redirect to success page after all steps
        router.push(`/upi-verification-success?ticketId=${ticketId}`)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [ticketId, router])

  const steps = [
    { title: 'Verifying Payment', icon: '✓' },
    { title: 'Generating QR Code', icon: '📱' },
    { title: 'Creating PDF Ticket', icon: '📄' },
    { title: 'Sending Email', icon: '📧' },
    { title: 'Finalizing', icon: '⚡' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Processing Approval
          </h1>
          <p className="text-purple-200">
            Please wait while we process your payment approval
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                index < step
                  ? 'bg-green-500/20 border border-green-500/50'
                  : index === step
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-slate-700/20 border border-slate-600/50'
              }`}
            >
              {/* Icon */}
              <div className="text-3xl">
                {index < step ? '✅' : item.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p
                  className={`font-semibold transition-colors ${
                    index < step
                      ? 'text-green-300'
                      : index === step
                      ? 'text-purple-300'
                      : 'text-slate-400'
                  }`}
                >
                  {item.title}
                </p>
              </div>

              {/* Loading Animation */}
              {index === step && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        delay: dot * 0.1,
                        repeat: Infinity
                      }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-slate-700/50 h-2 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(step / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
          <p className="text-center text-slate-400 text-sm mt-3">
            {Math.round((step / steps.length) * 100)}% Complete
          </p>
        </motion.div>

        {/* Footer Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center text-purple-300 text-sm"
        >
          This may take a few moments...
        </motion.p>
      </div>
    </div>
  )
}
