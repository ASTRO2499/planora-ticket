import { forwardRef, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
    variant?: 'primary' | 'cosmic' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
    children?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5',
            cosmic: 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 text-sm uppercase tracking-wider font-bold',
            ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
            outline: 'bg-transparent border border-white/20 text-white hover:border-white/40 hover:bg-white/5'
        }

        const sizes = {
            sm: 'px-3 py-2 text-sm',
            md: 'px-6 py-3',
            lg: 'px-7 py-3.5 text-lg'
        }

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'relative inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 overflow-hidden',
                    sizes[size],
                    variants[variant],
                    className
                )}
                disabled={disabled || isLoading}
                {...props as any}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-inherit">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                )}
                <span className={cn(isLoading && 'invisible')}>{children}</span>
                {variant === 'cosmic' && (
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-secondary opacity-0 transition-opacity duration-300 hover:opacity-100 blur-xl" />
                )}
            </motion.button>
        )
    }
)
Button.displayName = 'Button'

export { Button }
