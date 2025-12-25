import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function MyTickets() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading] = useState(false)
  const [emailLookup, setEmailLookup] = useState('')
  const [lookupResults, setLookupResults] = useState<any[]>([])
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(c => Math.max(0, c - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])


  async function requestOtp(e: React.FormEvent) {
    e.preventDefault()
    const email = emailLookup.trim()
    if (!email) return toast.error('Enter email first')
    if (countdown > 0) return toast.error(`Wait ${countdown} seconds before resending`)
    try {
      const res = await fetch('/api/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Failed to send OTP')
      setOtpSent(true)
      setCountdown(30)
      toast.success('OTP sent to your email')
    } catch { toast.error('Failed to send OTP') }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const email = emailLookup.trim()
    if (!email || !otpCode.trim()) return toast.error('Enter email and OTP')
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: otpCode.trim() }) })
      const data = await res.json()
      if (!res.ok) return toast.error(data?.error || 'Invalid OTP')
      setOtpToken(data.token)
      toast.success('Verified! Redirecting to your tickets...')
      
      // Redirect to ticket success page with email and token as query parameters
      setTimeout(() => {
        router.push(`/ticket-success?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.token)}`)
      }, 500)
    } catch { toast.error('Verification failed') }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center space-y-2 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Tickets</h1>
          <p className="text-sm sm:text-base text-slate-400">Verify your email to view and download your tickets</p>
        </div>

        <div className="card p-4 sm:p-6 md:p-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 backdrop-blur-xl">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-violet-500/20 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Email Verification</h2>
                <p className="text-xs sm:text-sm text-slate-400">Enter your email to receive a one-time password</p>
              </div>
            </div>

            <form onSubmit={otpSent ? verifyOtp : requestOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  placeholder="Enter the email used for ticket purchase"
                  value={emailLookup}
                  onChange={e => setEmailLookup(e.target.value)}
                  required
                />
              </div>

              {!otpSent ? (
                <button 
                  className="w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  type="submit" 
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wait {countdown}s to resend
                    </span>
                  ) : (
                    'Send OTP Code'
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      OTP sent to your email! Check your inbox.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Enter OTP Code</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" 
                      placeholder="000000" 
                      value={otpCode} 
                      onChange={e=>setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                    />
                  </div>
                  <button 
                    className="w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02]"
                    type="submit"
                  >
                    Verify & View Tickets
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setCountdown(0); }}
                    className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Use different email
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {lookupResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white px-4 sm:px-0">Your Tickets</h3>
            <div className="grid gap-4">
              {lookupResults.map(t => (
                <motion.div 
                  key={t.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4 sm:p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-bold text-base sm:text-lg break-words">{t.name}</div>
                          <div className="text-slate-300 text-xs sm:text-sm break-all">{t.email}</div>
                        </div>
                      </div>
                      {t.college && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm ml-8">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="break-words">{t.college}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Link 
                        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        href={`/ticket/${t.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </Link>
                      <a 
                        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                        href={t.pdfUrl || `/api/ticket-pdf?id=${t.id}`}
                        download
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden xs:inline">Download</span>
                        <span className="xs:hidden">PDF</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {tickets.length === 0 && <p className="text-blue-200">No tickets yet.</p>}
        {tickets.map(t=> (
          <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-4">
            <Image src={t.qr} alt="qr" width={120} height={120} className="rounded-lg h-auto w-auto" />
            <div className="flex-1">
              <p className="font-medium text-white">{t.name}</p>
              <p className="text-sm text-strong">{t.email}</p>
              <div className="flex gap-3 mt-3">
                <Link className="text-sm text-blue-200 hover:underline" href={`/ticket/${t.id}`}>Open ticket</Link>
                <a className="text-sm text-blue-200 hover:underline" href={t.pdfUrl || `/api/ticket-pdf?id=${t.id}`}>Download PDF</a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
