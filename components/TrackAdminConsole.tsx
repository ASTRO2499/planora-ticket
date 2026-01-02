import { useCallback, useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { toast } from 'react-hot-toast'

export function TrackAdminConsole({ eventId, organizerSecret, accessToken }: { eventId: string; organizerSecret: string; accessToken: string }) {
  const [subEvents, setSubEvents] = useState<any[]>([])
  const [selectedSubEvent, setSelectedSubEvent] = useState<any | null>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [exportingCSV, setExportingCSV] = useState(false)

  const loadSubEvents = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

      const res = await fetch(`/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setSubEvents(data.subEvents || [])
        if (data.subEvents?.length > 0) setSelectedSubEvent(data.subEvents[0])
      } else {
        toast.error(data.error || `Failed to load sub-events (${res.status})`)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [eventId, organizerSecret, accessToken])

  const loadRegistrations = useCallback(async (subEventId: string) => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

      const res = await fetch(`/api/organizer/subevents/${subEventId}/registrations`, { headers })
      const data = await res.json()
      if (res.ok) {
        setRegistrations(data.registrations || [])
      } else {
        toast.error(data.error || `Failed to load registrations (${res.status})`)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [organizerSecret, accessToken])

  useEffect(() => {
    void loadSubEvents()
  }, [eventId, loadSubEvents])

  useEffect(() => {
    if (selectedSubEvent) {
      void loadRegistrations(selectedSubEvent.id)
    }
  }, [selectedSubEvent, loadRegistrations])

  async function exportCSV() {
    if (!selectedSubEvent) return
    setExportingCSV(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

      const res = await fetch(`/api/organizer/subevents/${selectedSubEvent.id}/export-csv`, { headers })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `registrations-${selectedSubEvent.title}-${new Date().toISOString()}.csv`
        link.click()
        toast.success('CSV exported')
      } else {
        toast.error('Export failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setExportingCSV(false)
    }
  }

  const filteredRegistrations = registrations.filter(r => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.college?.toLowerCase().includes(q) ||
      r.id?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {subEvents.length > 6 ? (
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            value={selectedSubEvent?.id || ''}
            onChange={(e) => {
              const next = subEvents.find(se => se.id === e.target.value)
              if (next) setSelectedSubEvent(next)
            }}
          >
            {subEvents.map(se => (
              <option key={se.id} value={se.id}>{se.title}</option>
            ))}
          </select>
        ) : (
          subEvents.map(se => (
            <Button
              key={se.id}
              variant={selectedSubEvent?.id === se.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedSubEvent(se)}
            >
              {se.title}
            </Button>
          ))
        )}
      </div>

      {selectedSubEvent && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="text-slate-400 text-sm">Total Registrations</div>
              <div className="text-2xl font-bold text-white">{registrations.length}</div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="text-slate-400 text-sm">Checked In</div>
              <div className="text-2xl font-bold text-green-400">{registrations.filter(r => r.checked_in).length}</div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="text-slate-400 text-sm">Payment Completed</div>
              <div className="text-2xl font-bold text-cyan-400">{registrations.filter(r => r.payment_status === 'completed').length}</div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="text-slate-400 text-sm">Capacity</div>
              <div className="text-2xl font-bold text-white">
                {registrations.length}/{selectedSubEvent.max_capacity || '∞'}
              </div>
            </Card>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={exportCSV} isLoading={exportingCSV}>Export CSV</Button>
          </div>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td>
                    </tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">No registrations found</td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{reg.name}</td>
                        <td className="py-3 px-4 text-slate-300">{reg.email}</td>
                        <td className="py-3 px-4 text-slate-300">{reg.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">{reg.college || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            reg.payment_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            reg.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {reg.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {reg.checked_in ? (
                            <span className="text-green-400">✓ Checked In</span>
                          ) : (
                            <span className="text-slate-500">Not yet</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(reg.registered_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
