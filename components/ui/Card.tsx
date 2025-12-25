import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    hoverEffect?: boolean
    children?: ReactNode
}

export function Card({ className, hoverEffect = false, children, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={hoverEffect ? { y: -5, boxShadow: '0 20px 40px -15px rgba(112,0,255,0.2)' } : undefined}
            className={cn(
                'relative overflow-hidden rounded-2xl bg-surface border border-white/10 backdrop-blur-xl p-6 transition-all duration-300',
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 pointer-events-none transition-opacity duration-500 hover:opacity-100" />
            {children}
        </motion.div>
    )
}
