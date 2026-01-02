import Head from 'next/head'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SuccessAnimation from '../components/SuccessAnimation'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Download, Share2, Home } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TrackSuccessPage() {
  const router = useRouter()
  const { registrationId } = router.query
  const [show, setShow] = useState(true)
  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    setShow(true)
    const timer = setTimeout(() => setShow(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  const loadRegistration = useCallback(async () => {
    try {
      const res = await fetch(`/api/subevents/registration/${registrationId}`)
      if (res.ok) {
        const data = await res.json()
        setRegistration(data.registration)
        
        // Generate QR code
        const qrRes = await fetch('/api/subevents/generate-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: data.registration.id,
            subEventId: data.registration.sub_event_id,
            email: data.registration.email
          })
        })
        
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          setQrCode(qrData.qrCodeUrl)
        }
      }
    } catch (error) {
      console.error('Error loading registration:', error)
    } finally {
      setLoading(false)
    }
  }, [registrationId])

  useEffect(() => {
    if (!registrationId) return
    void loadRegistration()
  }, [registrationId, loadRegistration])

  function downloadQR() {
    if (!qrCode) return
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `registration-${registrationId}.png`
    link.click()
    toast.success('QR code downloaded')
  }

  function downloadPDF() {
    if (!registrationId) return
    const link = document.createElement('a')
    link.href = `/api/subevents/registration-pdf?id=${registrationId}`
    link.download = `registration-${registrationId}.pdf`
    link.click()
    toast.success('PDF downloaded')
  }

  function shareRegistration() {
    const text = `I've registered for ${registration?.sub_events?.title}! Check-in ID: ${registrationId}`
    if (navigator.share) {
      navigator.share({
        title: 'Event Registration',
        text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Registration details copied')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Registration Confirmed | Planora</title>
      </Head>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#050d25] via-[#081a3c] to-[#020a17] text-white flex items-center justify-center px-4 sm:px-6 py-8">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.03),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_22%)]" />
        </div>

        <div className="relative z-10 max-w-3xl w-full">
          {/* Header */}
          <div className="mb-8 sm:mb-10 text-center">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-cyan-200/80">Registration Success</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">You&apos;re All Set!</h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">Your registration has been confirmed. Check your email for details and show the QR code at the event.</p>
          </div>

          {/* Main Card */}
          <div className="relative border border-white/10 bg-white/5 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-2xl sm:rounded-3xl pointer-events-none" />
            
            <SuccessAnimation isVisible={show} message="Registration confirmed successfully!" />

            {/* Registration Details */}
            {registration && (
              <div className="relative z-10 space-y-6">
                {/* Event Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{registration.sub_events?.title}</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Registration ID</p>
                      <p className="text-white font-mono text-xs sm:text-sm">{registrationId}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Name</p>
                      <p className="text-white">{registration.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="text-white text-xs sm:text-sm">{registration.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payment Status</p>
                      <p className="text-cyan-400 capitalize">{registration.payment_status}</p>
                    </div>
                    {registration.sub_events?.start_time && (
                      <div className="sm:col-span-2">
                        <p className="text-slate-400">Event Date & Time</p>
                        <p className="text-white">{new Date(registration.sub_events.start_time).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                {qrCode && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-slate-300 mb-4 text-sm">Use this QR code for check-in:</p>
                    <div className="flex justify-center mb-4">
                      <Image src={qrCode} alt="Check-in QR Code" width={256} height={256} className="w-48 h-48 sm:w-64 sm:h-64" />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={downloadQR} variant="outline" className="flex-1 sm:flex-initial">
                        <Download className="w-4 h-4 mr-2" />
                        Download QR
                      </Button>
                      <Button onClick={downloadPDF} variant="primary" className="flex-1 sm:flex-initial">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={shareRegistration} variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={() => window.location.href = '/'} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-3">What&apos;s Next?</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>✓ Check your email for confirmation and event details</li>
              <li>✓ Save the QR code to your phone for quick check-in</li>
              <li>✓ Arrive 15 minutes early for smooth entry</li>
              <li>✓ Questions? Contact the organizer through the event page</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
