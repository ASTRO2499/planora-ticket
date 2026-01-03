import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader } from 'lucide-react'

export default function TrackGeneratingPage() {
  const router = useRouter()
  const { registrationId } = router.query
  const [step, setStep] = useState(0)

  const steps = [
    { label: 'Creating Registration', icon: '📝', delay: 0 },
    { label: 'Generating QR Code', icon: '🔲', delay: 1200 },
    { label: 'Processing Ticket', icon: '🎫', delay: 2400 },
    { label: 'Finalizing...', icon: '✓', delay: 3600 }
  ]

  useEffect(() => {
    if (!registrationId) return

    // Progress through steps
    const intervals = steps.map((_, idx) => 
      setTimeout(() => setStep(idx + 1), steps[idx].delay)
    )

    // Redirect after all steps complete (4500ms)
    const redirectTimer = setTimeout(() => {
      router.push(`/track-success?registrationId=${registrationId}`)
    }, 4500)

    return () => {
      intervals.forEach(clearTimeout)
      clearTimeout(redirectTimer)
    }
  }, [registrationId, router])

  return (
    <>
      <Head>
        <title>Generating Ticket | Planora</title>
      </Head>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#050d25] via-[#081a3c] to-[#020a17] text-white flex items-center justify-center px-4">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_25%)]" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-md w-full text-center space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="relative w-16 h-16"
              >
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-300 border-b-indigo-400" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-300 opacity-50" />
              </motion.div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Generating Your Ticket</h1>
            <p className="text-slate-300 text-sm">Processing your registration details...</p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            {steps.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0.3, x: -20 }}
                animate={{
                  opacity: step > idx ? 1 : 0.4,
                  x: 0,
                  backgroundColor: step > idx ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)'
                }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex items-center gap-4 p-4 rounded-lg border border-white/10"
              >
                {/* Icon/Status */}
                <div className="text-2xl min-w-fit">
                  {step > idx ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      ✓
                    </motion.span>
                  ) : step === idx ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      {s.icon}
                    </motion.span>
                  ) : (
                    <span className="opacity-50">{s.icon}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`text-left text-sm font-medium ${
                  step > idx ? 'text-green-400' : step === idx ? 'text-cyan-400' : 'text-slate-500'
                }`}>
                  {s.label}
                </span>

                {/* Check or loading */}
                {step > idx && <span className="ml-auto text-green-400">Done</span>}
                {step === idx && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-slate-300"
          >
            <p>Your ticket is being prepared. You'll be redirected shortly...</p>
          </motion.div>

          {/* Loading Bar */}
          <motion.div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: step < 4 ? `${(step / 4) * 100}%` : '100%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-400"
            />
          </motion.div>
        </div>
      </div>
    </>
  )
}
