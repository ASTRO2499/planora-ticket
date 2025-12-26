import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import LoadingAnimation from '../components/LoadingAnimation'

type Event = {
  id: string
  title: string
  description: string
  price_inr: number
  image_url?: string | null
  created_at?: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
        } else {
          setEvents([])
          setError('Could not load all events')
        }
      } catch (err) {
        console.error('Error loading events', err)
        setEvents([])
        setError('Error loading events')
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])
  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <Head>
        <title>Events</title>
      </Head>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Upcoming Events</h1>
          <p className="text-sm sm:text-base text-slate-400">Discover and register for our latest events.</p>
        </div>
        <Link href="/host">
          <Button variant="primary" className="w-full sm:w-auto">+ Host an Event</Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 sm:py-20">
          <LoadingAnimation message="Loading Events" size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-sm sm:text-base text-slate-400">
          <p>No events available.</p>
        </div>
      ) : (
        <>
          {error && <div className="text-center text-amber-400 text-xs sm:text-sm">{error}</div>}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {events.map((event: any) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-0 overflow-hidden bg-white/5 border-white/10 hover:border-white/20 transition cursor-pointer h-full">
                {event.image_url ? (
                  <div className="h-32 sm:h-36 bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
                ) : (
                  <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 h-32 sm:h-36 flex items-center justify-center">
                    <div className="text-white text-base sm:text-xl font-semibold text-center px-4 break-words">{event.title}</div>
                  </div>
                )}
                <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
                  <h2 className="text-white font-bold text-base sm:text-lg line-clamp-1">{event.title}</h2>
                  <p className="text-slate-300 text-xs sm:text-sm line-clamp-2">{event.description}</p>
                  <div className="flex justify-between items-center pt-1 sm:pt-2">
                    <div className="text-slate-400 text-xs sm:text-sm">Fee: ₹{event.price_inr}</div>
                    <Link 
                      href={`/event/${event.id}`} 
                      passHref
                    >
                      <Button variant="primary" className="px-4">Register</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          </div>
        </>
      )}
    </div>
  )
}
