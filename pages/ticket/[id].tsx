import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '../../components/ui/Card'
import { Download, FileText } from 'lucide-react'
import LoadingAnimation from '../../components/LoadingAnimation'

export default function TicketPage() {
  const router = useRouter()
  const { id } = router.query
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/ticket/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch ticket')
        return r.json()
      })
      .then(data => {
        setTicket(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  },[id])

  if (loading) {
    return <LoadingAnimation message="Loading Your Ticket" fullScreen />
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-50">
        <Card className="p-4 sm:p-8 bg-white/5 border-white/10 max-w-md text-center mx-4">
          <p className="text-red-400 mb-4 text-sm sm:text-base">{error || 'Ticket not found'}</p>
          <Link href="/my-tickets" className="text-violet-400 hover:text-violet-300 text-xs sm:text-sm">Back to my tickets</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8 z-[100] overflow-auto">
      <div className="max-w-2xl mx-auto relative pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 sm:p-8 bg-white/5 border-white/10 pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs sm:text-sm font-bold">PASS</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white">Entry Pass</h1>
                <p className="text-slate-400 text-xs sm:text-sm break-all">Ticket ID: {ticket.id}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 items-start">
              <div className="rounded-xl border border-fuchsia-500/30 bg-black/60 p-3 sm:p-4 flex items-center justify-center h-48 sm:h-64">
                {ticket.qr && (
                  <img src={ticket.qr} alt="QR code" className="w-40 h-40 sm:w-48 sm:h-48 rounded-md object-contain" />
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Name</div>
                  <div className="text-white font-semibold text-base sm:text-lg break-words">{ticket.name}</div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm text-slate-400">Email</div>
                  <div className="text-slate-200 break-all text-xs sm:text-sm">{ticket.email}</div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm text-slate-500">Event</div>
                  <div className="text-violet-400 font-medium text-sm sm:text-base">{ticket.event_id || 'Event'}</div>
                </div>

                <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
                  <a 
                    href={ticket.pdfUrl || `/api/ticket-pdf?id=${ticket.id}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 text-center"
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Ticket PDF
                    </span>
                  </a>
                  
                  {ticket.used && ticket.certificate_issued && (
                    <a 
                      href={`/api/certificate-pdf?ticketId=${ticket.id}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-center"
                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Download Certificate
                      </span>
                    </a>
                  )}
                  
                  <Link 
                    href="/my-tickets"
                    className="block w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 font-semibold rounded-xl transition-all duration-200 text-center border border-slate-600/50"
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      Back to My Tickets
                    </span>
                  </Link>
                </div>

                <p className="text-xs text-slate-500 mt-4 text-center">Show the QR at entry. Do not share publicly.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
