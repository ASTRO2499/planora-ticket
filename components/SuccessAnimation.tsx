import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface SuccessAnimationProps {
  isVisible: boolean
  message?: string
  duration?: number
}

export default function SuccessAnimation({ isVisible, message = 'Success!', duration = 2000 }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none bg-gradient-to-br from-[#050d25]/95 via-[#081a3c]/90 to-[#020a17]/95 backdrop-blur-md"
        >
          <div className="absolute inset-0">
            <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="absolute right-6 bottom-10 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_18%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.03),transparent_20%)]" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Checkmark circle with pulse */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.1 }}
            >
              <CheckCircle2 className="w-24 h-24 text-green-400" strokeWidth={1.5} />
            </motion.div>

            {/* Success text with fade in */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-2">Success!</h2>
              <p className="text-slate-300 text-lg">{message}</p>
            </motion.div>

            {/* Background glow pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              transition={{ delay: 0.2 }}
              className="absolute w-40 h-40 bg-green-500 rounded-full blur-3xl -z-10"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
