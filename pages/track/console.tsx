import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from 'react-hot-toast'
import { TrackAdminConsole } from '../../components/TrackAdminConsole'

export default function TrackConsolePage() {
  const router = useRouter()
  const [organizerSecret, setOrganizerSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [togglingComingSoon, setTogglingComingSoon] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const queryEventId = useMemo(() => {
    const q = router.query.eventId
    return typeof q === 'string' ? q : ''
  }, [router.query.eventId])

  useEffect(() => {
    const storedSecret = typeof window !== 'undefined' ? localStorage.getItem('organizerSecret') || '' : ''
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('organizerAccessToken') || '' : ''
    if (storedSecret) setOrganizerSecret(storedSecret)
    if (storedToken) setAccessToken(storedToken)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (organizerSecret) localStorage.setItem('organizerSecret', organizerSecret)
    else localStorage.removeItem('organizerSecret')
  }, [organizerSecret])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (accessToken) localStorage.setItem('organizerAccessToken', accessToken)
    else localStorage.removeItem('organizerAccessToken')
  }, [accessToken])

  useEffect(() => {
    if (events.length && queryEventId) {
      const exists = events.find(e => e.id === queryEventId)
      if (exists) setSelectedEventId(queryEventId)
    }
  }, [events, queryEventId])

  useEffect(() => {
    if (!authReady) return
    if (!organizerSecret && !accessToken) {
      toast.error('No organizer credentials found. Open Organizer portal, then return.')
      return
    }
    void loadEvents()
  }, [authReady, organizerSecret, accessToken])

  async function loadEvents() {
    if (!organizerSecret && !accessToken) return
    setLoadingEvents(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch('/api/organizer/events', { headers })
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events || [])
        if (queryEventId && data.events?.find((e: any) => e.id === queryEventId)) {
          setSelectedEventId(queryEventId)
        } else if (data.events?.length) {
          setSelectedEventId(data.events[0].id)
        }
      } else {
        toast.error(data.error || `Failed to load events (${res.status})`)
      }
    } catch {
      toast.error('Network error while loading events')
    } finally {
      setLoadingEvents(false)
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  async function updateComingSoon(nextValue: boolean) {
    if (!selectedEventId) return
    setTogglingComingSoon(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const form = new FormData()
      form.append('id', selectedEventId)
      form.append('track_coming_soon', String(nextValue))
      console.log('Sending to API:', { id: selectedEventId, track_coming_soon: nextValue, stringValue: String(nextValue) })
      const res = await fetch('/api/organizer/events', { method: 'PUT', headers, body: form as any })
      const data = await res.json()
      console.log('Coming soon update response:', { status: res.status, ok: res.ok, data, returnedValue: data.event?.track_coming_soon, returnedType: typeof data.event?.track_coming_soon })
      if (res.ok && data.event) {
        // Use the actual value from API response
        const updatedEvent = { ...data.event }
        console.log('Updated event track_coming_soon:', updatedEvent.track_coming_soon, 'type:', typeof updatedEvent.track_coming_soon)
        // Update events list with the new data from API
        setEvents((prev) => prev.map((e) => (e.id === selectedEventId ? updatedEvent : e)))
        // Force re-render of selected event
        setTimeout(() => {
          setSelectedEventId('')
          setTimeout(() => setSelectedEventId(selectedEventId), 0)
        }, 0)
        toast.success(updatedEvent.track_coming_soon ? 'Track set to coming soon' : 'Track is live')
      } else {
        console.error('Update error:', { status: res.status, data })
        toast.error(data.error || `Failed to update coming soon (${res.status})`)
      }
    } catch (err) {
      console.error('Network error:', err)
      toast.error('Network error while updating coming soon')
    } finally {
      setTogglingComingSoon(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Head>
        <title>Track Registration Console</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Organizer</div>
            <h1 className="text-3xl font-bold">Track Registration Console</h1>
          </div>
          <Button variant="outline" onClick={() => router.push('/organizer')}>Back to Organizer</Button>
        </div>

        <Card className="p-4 bg-white/5 border-white/10 space-y-3">
          {!organizerSecret && !accessToken ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-300">Enter organizer secret (or bearer token) to load events.</div>
              <div className="grid md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <div className="text-xs text-slate-400 mb-1">Organizer Secret</div>
                  <Input
                    placeholder="ORG-..."
                    value={organizerSecret}
                    onChange={(e) => setOrganizerSecret(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1">
                  <div className="text-xs text-slate-400 mb-1">Access Token (optional)</div>
                  <Input
                    placeholder="Bearer token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadEvents} isLoading={loadingEvents} className="w-full">Load Events</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-300">Events load automatically using saved credentials.</div>
              {loadingEvents && <div className="text-slate-400 text-sm">Loading events...</div>}
              {events.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {events.map((evt) => (
                      <Button
                        key={evt.id}
                        variant={selectedEventId === evt.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedEventId(evt.id)}
                      >
                        {evt.title}
                      </Button>
                    ))}
                  </div>
                  {selectedEvent && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="text-sm text-slate-300">Coming Soon page</div>
                        <div className="text-xs text-slate-500">When enabled, the public track page shows a coming soon animation instead of sessions.</div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedEvent.track_coming_soon)}
                          onChange={(e) => updateComingSoon(e.target.checked)}
                          disabled={togglingComingSoon}
                          className="h-4 w-4 cursor-pointer"
                        />
                        {togglingComingSoon ? 'Updating...' : selectedEvent.track_coming_soon ? 'Enabled' : 'Disabled'}
                      </label>
                    </div>
                  )}
                </div>
              )}
              {!loadingEvents && events.length === 0 && (
                <div className="text-slate-400 text-sm">No events found. Double-check organizer credentials.</div>
              )}
            </>
          )}
        </Card>

        {selectedEventId ? (
          <TrackAdminConsole eventId={selectedEventId} organizerSecret={organizerSecret} accessToken={accessToken} />
        ) : (
          <Card className="p-6 bg-white/5 border-white/10 text-slate-300">Load events and pick one to view registrations.</Card>
        )}
      </div>
    </div>
  )
}
