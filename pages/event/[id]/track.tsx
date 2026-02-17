import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, ChangeEvent } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import LoadingAnimation from '../../../components/LoadingAnimation'
import { toast } from 'react-hot-toast'
import { ChevronLeft, Calendar, MapPin, User, X } from 'lucide-react'
import { TrackComingSoon } from '../../../components/TrackComingSoon'

type SubEvent = {
  id: string
  title: string
  type: string
  description?: string
  start_time?: string
  end_time?: string
  location?: string
  image_url?: string
  max_capacity?: number
  current_registrations: number
  speaker_name?: string
  speaker_email?: string
  status: string
  is_published: boolean
}

type Event = {
  id: string
  title: string
  description?: string
  date?: string
  location?: string
  image_url?: string
  track_coming_soon?: boolean
}

export default function EventTrackPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [event, setEvent] = useState<Event | null>(null)
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadEventAndSubEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadEventAndSubEvents() {
    setLoading(true)
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/events?id=${encodeURIComponent(id as string)}`)
      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData.event || eventData.events?.[0])
      }

      // Fetch sub-events
      const subEventsRes = await fetch(`/api/event/${encodeURIComponent(id as string)}/subevents`)
      if (subEventsRes.ok) {
        const subEventsData = await subEventsRes.json()
        setSubEvents(subEventsData.subEvents || [])
      }
    } catch (err) {
      console.error('Error loading event track:', err)
      setError('Failed to load event track')
      toast.error('Failed to load event track')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubEvents = subEvents.filter(se => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (se.title && se.title.toLowerCase().includes(q)) ||
      (se.description && se.description.toLowerCase().includes(q)) ||
      (se.speaker_name && se.speaker_name.toLowerCase().includes(q)) ||
      (se.type && se.type.toLowerCase().includes(q)) ||
      (se.location && se.location.toLowerCase().includes(q))
    )
  })

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      talk: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      panel: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      breakout: 'bg-green-500/20 text-green-300 border-green-500/30',
      networking: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      other: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
    return colors[type] || colors.other
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return null
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <Head>
        <title>{event?.title ? `${event.title} - Track` : 'Event Track'}</title>
      </Head>

      {/* Back Button & Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/events" passHref>
          <Button variant="ghost" className="px-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{event?.title || 'Event Track'}</h1>
          <p className="text-xs sm:text-sm text-slate-400">Explore sessions and workshops</p>
        </div>
        <Link href={`/event/${id}`} passHref>
          <Button variant="primary" className="text-sm sm:text-base">Register</Button>
        </Link>
      </div>

      {/* Event Info Card */}
      {event && (
        <Card className="p-4 sm:p-6 bg-white/5 border-white/10 space-y-3">
          {event.description && (
            <p className="text-slate-300 text-sm sm:text-base">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-400">
            {event.date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString()}
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="py-12 sm:py-20">
          <LoadingAnimation message="Loading Event Track" size="lg" />
        </div>
      ) : event?.track_coming_soon ? (
        <TrackComingSoon eventTitle={event?.title} />
      ) : error ? (
        <Card className="p-6 sm:8 bg-red-500/10 border-red-500/30 text-center">
          <p className="text-red-300 text-sm sm:text-base">{error}</p>
          <Button variant="outline" onClick={loadEventAndSubEvents} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : subEvents.length === 0 ? (
        <Card className="p-6 sm:8 bg-white/5 border-white/10 text-center">
          <p className="text-slate-400 text-sm sm:text-base">No sessions scheduled yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search sessions, speakers, workshops..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Sub-Events List */}
          <div className="space-y-3">
            {filteredSubEvents.length === 0 ? (
              <Card className="p-6 text-center bg-white/5 border-white/10">
                <p className="text-slate-400 text-sm">No sessions match your search.</p>
              </Card>
            ) : (
              filteredSubEvents.map((subEvent) => (
                <Card
                  key={subEvent.id}
                  className="p-4 sm:5 bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 transition cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Cover Image Preview */}
                    {subEvent.image_url && (
                      <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden cursor-pointer group">
                        <img
                          src={subEvent.image_url}
                          alt={subEvent.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onClick={() => setSelectedImageUrl(subEvent.image_url)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg">
                            Click to Expand
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Header with Title and Type */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 justify-between">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2">
                          {subEvent.title}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getTypeColor(subEvent.type)}`}>
                        {subEvent.type}
                      </span>
                    </div>

                    {/* Description */}
                    {subEvent.description && (
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                        {subEvent.description}
                      </p>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-400">
                      {subEvent.start_time && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-violet-400" />
                          {formatDateTime(subEvent.start_time)}
                        </div>
                      )}
                      {subEvent.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          {subEvent.location}
                        </div>
                      )}
                      {subEvent.speaker_name && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <User className="w-4 h-4 text-green-400" />
                          {subEvent.speaker_name}
                          {subEvent.speaker_email && (
                            <span className="text-slate-500">({subEvent.speaker_email})</span>
                          )}
                        </div>
                      )}
                      {subEvent.max_capacity && (
                        <div className="text-slate-400 text-xs">
                          Capacity: {subEvent.current_registrations}/{subEvent.max_capacity}
                        </div>
                      )}
                    </div>

                    {/* Register Button */}
                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      <Link href={`/track/${subEvent.id}/register`} passHref>
                        <Button variant="primary" className="text-xs sm:text-sm px-3 sm:px-4">
                          Register for Session
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs sm:text-sm text-slate-400 text-center">
              Showing {filteredSubEvents.length} of {subEvents.length} sessions
            </p>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImageUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute -top-10 -right-10 sm:-top-8 sm:-right-8 text-white hover:text-slate-300 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImageUrl}
              alt="Expanded preview"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
