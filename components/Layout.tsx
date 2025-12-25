import { memo } from 'react'
import Header from './Header'
import SpaceBackground from './SpaceBackground'
import Chatbot from './Chatbot'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">
      <SpaceBackground />
      <div className="relative z-10">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">{children}</main>
        <footer className="mt-12 text-center text-sm text-slate-200 relative z-10">© {new Date().getFullYear()} Planora Tickets — All Rights Reserved</footer>
        {/* Watermark */}
        <div aria-hidden className="pointer-events-none fixed inset-0 flex items-end justify-end p-8 opacity-10 select-none z-0">
          <div className="text-6xl font-extrabold text-white/20">PLANORA</div>
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

export default memo(Layout)
