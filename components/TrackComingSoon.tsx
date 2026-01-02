import { Button } from './ui/Button'
import Link from 'next/link'

export function TrackComingSoon({ eventTitle }: { eventTitle?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900/40 to-slate-950 rounded-2xl border border-white/10 p-10">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#6366f1_0,transparent_35%),radial-gradient(circle_at_80%_0%,#22d3ee_0,transparent_30%),radial-gradient(circle_at_50%_80%,#a855f7_0,transparent_30%)]" />
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(99,102,241,0.35)]">
          <div className="w-16 h-16 border-4 border-indigo-300/50 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Coming Soon</p>
        <h2 className="text-3xl font-bold text-white">{eventTitle || 'Track'} is getting ready</h2>
        <p className="text-slate-300 max-w-xl text-sm">
          We are polishing the sessions for this track. Check back soon to explore the full lineup.
        </p>
      </div>
      <div className="relative flex gap-3">
        <Link href="/events" passHref>
          <Button variant="outline">Browse other events</Button>
        </Link>
        <Link href="/" passHref>
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
