import { motion } from 'framer-motion'

export default function AstroMascot({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Helmet/Head */}
        <motion.circle
          cx="50"
          cy="45"
          r="25"
          fill="url(#astroGradient)"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Visor */}
        <motion.ellipse
          cx="50"
          cy="45"
          rx="20"
          ry="12"
          fill="#1e293b"
          opacity="0.8"
          animate={{
            scaleX: [1, 0.95, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Visor Reflection */}
        <motion.ellipse
          cx="45"
          cy="42"
          rx="8"
          ry="5"
          fill="#60a5fa"
          opacity="0.4"
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Body */}
        <motion.rect
          x="35"
          y="65"
          width="30"
          height="25"
          rx="8"
          fill="url(#astroGradient)"
          animate={{
            y: [65, 67, 65],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
        />
        
        {/* Arms */}
        <motion.circle
          cx="30"
          cy="75"
          r="6"
          fill="url(#astroGradient)"
          animate={{
            x: [0, -2, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="70"
          cy="75"
          r="6"
          fill="url(#astroGradient)"
          animate={{
            x: [0, 2, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Antenna */}
        <motion.line
          x1="50"
          y1="20"
          x2="50"
          y2="10"
          stroke="#f472b6"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.circle
          cx="50"
          cy="8"
          r="3"
          fill="#f472b6"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Stars around */}
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            cx={20 + i * 30}
            cy={15 + (i % 2) * 10}
            r="1.5"
            fill="#fbbf24"
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4
            }}
          />
        ))}
        
        <defs>
          <linearGradient id="astroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}
