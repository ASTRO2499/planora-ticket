import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Zap, FileText, CheckCircle2 } from 'lucide-react'

interface TicketGenerationAnimationProps {
  isVisible: boolean
  stage?: 'preparing' | 'generating' | 'sending' | 'complete'
  totalCount?: number
  currentCount?: number
}

export default function TicketGenerationAnimation({ 
  isVisible, 
  stage = 'preparing',
  totalCount = 0,
  currentCount = 0
}: TicketGenerationAnimationProps) {
  const stages = [
    { key: 'preparing', label: 'Preparing Tickets', icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { key: 'generating', label: 'Generating PDFs', icon: Zap, color: 'from-purple-500 to-pink-500' },
    { key: 'sending', label: 'Sending Emails', icon: Mail, color: 'from-indigo-500 to-violet-500' },
    { key: 'complete', label: 'Complete!', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' }
  ]

  const currentStageIndex = stages.findIndex(s => s.key === stage)
  const progress = currentStageIndex === -1 ? 0 : ((currentStageIndex + 1) / stages.length) * 100

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none bg-gradient-to-br from-[#050d25]/95 via-[#081a3c]/90 to-[#020a17]/95 backdrop-blur-md"
        >
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="absolute right-6 bottom-10 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_18%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.03),transparent_20%)]" />
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-8 max-w-md mx-auto px-6"
          >
            {/* Progress Bar */}
            <div className="w-full">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                />
              </div>
            </div>

            {/* Stage indicator */}
            <div className="text-center">
              <motion.h2
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {stages[currentStageIndex]?.label || 'Processing...'}
              </motion.h2>
              {totalCount > 0 && stage !== 'complete' && (
                <p className="text-slate-400">
                  {currentCount} / {totalCount} participants
                </p>
              )}
            </div>

            {/* Stage animation icons */}
            <div className="flex gap-3 justify-center">
              {stages.map((s, idx) => {
                const Icon = s.icon
                const isActive = idx === currentStageIndex
                const isComplete = idx < currentStageIndex
                
                return (
                  <motion.div
                    key={s.key}
                    className={`relative`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={isActive ? { duration: 1, repeat: Infinity } : {}}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20'
                          : isActive
                          ? `bg-gradient-to-br ${s.color}`
                          : 'bg-white/5 border border-white/10'
                      }`}
                      animate={isActive ? { 
                        boxShadow: [
                          '0 0 0 0 rgba(124, 58, 237, 0.7)',
                          '0 0 0 16px rgba(124, 58, 237, 0)',
                        ]
                      } : {}}
                      transition={isActive ? {
                        boxShadow: {
                          duration: 2,
                          repeat: Infinity,
                        }
                      } : {}}
                    >
                      <Icon className={`w-5 h-5 ${
                        isComplete ? 'text-green-400' : isActive ? 'text-white' : 'text-slate-500'
                      }`} />
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>

            {/* Animated dots */}
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>

            {/* Counter for sending stage */}
            {stage === 'sending' && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  {currentCount}
                </div>
                <p className="text-slate-400 text-sm">of {totalCount} emails sent</p>
              </motion.div>
            )}

            {/* Completion message */}
            {stage === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-slate-300">All tickets generated and sent successfully!</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
