import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
// Logo removed per request

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/my-tickets', label: 'My Tickets' },
    { href: '/verify', label: 'Verify' },
    { href: '/organizer', label: 'Organizer' },
  ]

  return (
    <header className="glass soft-border sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <div className="text-lg sm:text-2xl md:text-3xl font-black leading-none text-white tracking-widest" style={{ fontFamily: 'Sora, sans-serif' }}>PLANORA</div>
            <div className="text-xs text-strong-accent flex items-center gap-2"> 
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/6 text-strong">TICKETS</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4 lg:space-x-6 text-sm">
          {navLinks.map(link => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-strong hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur-xl"
          >
            <nav className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-strong hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
