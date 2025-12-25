import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'

interface LoadingAnimationProps {
  message?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingAnimation({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'md' 
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }

  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    : 'flex items-center justify-center p-10'

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-6"
      >
        {/* Animated Logo/Spinner */}
        <div className="relative">
          <motion.div
            className={`${sizeClasses[size]} mx-auto rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl`}
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(124, 58, 237, 0.7)',
                '0 0 0 20px rgba(124, 58, 237, 0)',
              ],
              rotate: 360
            }}
            transition={{
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
              },
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          >
            <Loader2 className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-10 h-10' : 'w-16 h-16'} text-white`} />
          </motion.div>

          {/* Orbiting sparkles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.33
              }}
              style={{
                transformOrigin: size === 'sm' ? '40px 0' : size === 'md' ? '60px 0' : '90px 0'
              }}
            >
              <Sparkles className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-400`} />
            </motion.div>
          ))}
        </div>

        {/* Loading text */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="space-y-2"
        >
          <h3 className={`${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
            {message}
          </h3>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} bg-violet-500 rounded-full`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Subtitle for full screen */}
        {fullScreen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 text-sm"
          >
            Please wait while we prepare everything for you
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
