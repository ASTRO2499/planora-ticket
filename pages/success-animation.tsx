import Head from 'next/head'
import { useEffect, useState } from 'react'
import SuccessAnimation from '../components/SuccessAnimation'
import { Button } from '../components/ui/Button'

export default function SuccessAnimationPage() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    setShow(true)
    const timer = setTimeout(() => setShow(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  function replay() {
    setShow(false)
    setTimeout(() => setShow(true), 10)
  }

  return (
    <>
      <Head>
        <title>Success | Planora</title>
      </Head>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#050d25] via-[#081a3c] to-[#020a17] text-white flex items-center justify-center px-6">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.03),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_22%)]" />
        </div>

        <div className="relative z-10 max-w-3xl w-full">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Status</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Form settings saved</h1>
            <p className="mt-3 text-slate-300 max-w-2xl mx-auto">Your custom registration form has been updated. Share this look with stakeholders using the dedicated success preview page.</p>
          </div>

          <div className="relative border border-white/10 bg-white/5 rounded-3xl p-10 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-3xl pointer-events-none" />
            <SuccessAnimation isVisible={show} message="Form settings saved successfully!" />

            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <p className="text-lg text-slate-200">Celebrate the save with a dedicated dark-blue success canvas.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => { window.location.href = '/organizer' }} variant="primary">Back to organizer</Button>
                <Button onClick={() => { window.location.href = '/' }} variant="outline">Go to homepage</Button>
                <Button onClick={replay} variant="cosmic">Replay animation</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
