import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabaseClient'
export default function OrganizerDashboard() {
  const [authed, setAuthed] = useState(false)
  const [organizerSecret, setOrganizerSecret] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [mode, setMode] = useState<'login' | 'signup' | 'secret'>('login')
  const [resetting, setResetting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [templateText, setTemplateText] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketQuery, setTicketQuery] = useState('')
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const filteredTickets = tickets.filter(t => {
    if (!ticketQuery.trim()) return true
    const q = ticketQuery.toLowerCase()
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.id && String(t.id).toLowerCase().includes(q))
    )
  })

  async function login(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'secret') {
      if (!organizerSecret.trim()) return toast.error('Enter organizer secret')
      setAuthed(true)
      setAccessToken('')
      toast.success('Organizer access granted')
      fetchEvents()
      return
    }

    if (!supabase || !supabase.auth) {
      toast.error('Supabase not configured')
      return
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.session) throw error || new Error('No session')
      const role = data.session.user?.user_metadata?.role
      if (role !== 'organizer') {
        toast.error('Not an organizer account')
        return
      }
      setAccessToken(data.session.access_token)
      setAuthed(true)
      toast.success('Logged in')
      fetchEvents(data.session.access_token)
    } catch (err: any) {
      toast.error(err?.message || 'Login failed')
    }
  }

  async function requestReset() {
    if (!supabase || !supabase.auth) return toast.error('Supabase not configured')
    if (!email) return toast.error('Enter your email first')
    setResetting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/organizer` : undefined,
      })
      if (error) throw error
      toast.success('Reset link sent. Check your email.')
    } catch (err: any) {
      toast.error(err?.message || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  async function signup() {
    if (!supabase || !supabase.auth) {
      toast.error('Supabase not configured')
      return
    }
    if (!email || !password) return toast.error('Enter email and password')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { role: 'organizer' } } })
    if (error) return toast.error(error.message)
    toast.success('Signup successful. Check your email to confirm, then log in.')
    setMode('login')
  }

  async function fetchEvents(tokenOverride?: string) {
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (tokenOverride || accessToken) headers['Authorization'] = `Bearer ${tokenOverride || accessToken}`
      const res = await fetch('/api/organizer/events', { headers })
      const data = await res.json()
      if (res.ok) setEvents(data.events || [])
      else toast.error('Failed to load events')
    } catch { toast.error('Network error') }
  }

  async function fetchTickets(eventId?: string) {
    if (!eventId) return
    setTicketsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch(`/api/organizer/tickets?eventId=${encodeURIComponent(eventId)}`, { headers })
      const data = await res.json()
      if (res.ok) setTickets(data.tickets || [])
      else toast.error('Failed to load attendees')
    } catch {
      toast.error('Network error')
    } finally {
      setTicketsLoading(false)
    }
  }

  async function fetchAnalytics(eventId?: string) {
    if (!eventId) return
    setAnalyticsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch(`/api/organizer/analytics?eventId=${encodeURIComponent(eventId)}`, { headers })
      const data = await res.json()
      if (res.ok) setAnalytics(data)
      else toast.error('Failed to load analytics')
    } catch {
      toast.error('Network error')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function saveEvent() {
    if (!selected) return
    const form = new FormData()
    form.append('id', selected.id)
    ;['title','description','date','location','price_inr','is_published','is_featured'].forEach((f)=>{
      if (selected[f] !== undefined) form.append(f, String(selected[f]))
    })
    if (coverFile) form.append('coverImage', coverFile)
    setLoading(true)
    try {
      const headers: Record<string,string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch('/api/organizer/events', { method: 'PUT', headers, body: form })
      const data = await res.json()
      if (res.ok) { toast.success('Event updated'); fetchEvents() }
      else toast.error('Update failed')
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  async function uploadTemplate() {
    if (!selected) return
    const form = new FormData()
    form.append('eventId', selected.id)
    form.append('template', templateText)
    try {
      const headers: Record<string,string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch('/api/organizer/templates', { method: 'POST', headers, body: form })
      if (res.ok) toast.success('Template uploaded')
      else toast.error('Template upload failed')
    } catch { toast.error('Network error') }
  }

  useEffect(() => {
    // Session persistence: restore organizer session if available
    async function restore() {
      if (!supabase || !supabase.auth) return
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      if (session?.access_token) {
        const role = session.user?.user_metadata?.role
        if (role === 'organizer') {
          setAccessToken(session.access_token)
          setAuthed(true)
          fetchEvents(session.access_token)
        }
      }
    }
    restore()
  }, [])

  useEffect(() => {
    if (selected?.id) {
      fetchTickets(selected.id)
      fetchAnalytics(selected.id)
    } else {
      setTickets([])
      setAnalytics(null)
    }
  }, [selected?.id])

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Head><title>Organizer Login</title></Head>
        <Card className="p-8 bg-white/5 border-white/10 w-full max-w-md">
          <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs">
            <button onClick={()=>setMode('login')} className={mode==='login'?'text-white font-semibold':''}>Login</button>
            <span>•</span>
            <button onClick={()=>setMode('signup')} className={mode==='signup'?'text-white font-semibold':''}>Signup</button>
            <span>•</span>
            <button onClick={()=>setMode('secret')} className={mode==='secret'?'text-white font-semibold':''}>Secret</button>
          </div>
          {mode !== 'secret' ? (
            <form onSubmit={login} className="space-y-4">
              <h1 className="text-2xl font-bold text-white">Organizer Portal</h1>
              <p className="text-slate-400 text-sm">Use your organizer account.</p>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required />
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" required />
              <Button type="submit" variant="primary">{mode==='login' ? 'Login' : 'Continue'}</Button>
              {mode==='signup' && (
                <Button type="button" variant="ghost" onClick={signup}>Signup</Button>
              )}
              {mode==='login' && (
                <Button type="button" variant="ghost" onClick={requestReset} isLoading={resetting}>Forgot password?</Button>
              )}
            </form>
          ) : (
            <form onSubmit={login} className="space-y-4">
              <h1 className="text-2xl font-bold text-white">Organizer Portal</h1>
              <p className="text-slate-400 text-sm">Enter organizer secret for your event.</p>
              <Input value={organizerSecret} onChange={(e)=>setOrganizerSecret(e.target.value)} placeholder="Organizer Secret ID" />
              <Button type="submit" variant="primary">Login with Secret</Button>
            </form>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <Head><title>Organizer Dashboard</title></Head>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Manage Events</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Your Events</h2>
            <div className="space-y-2">
              {events.map(ev => (
                <button key={ev.id} onClick={()=>{setSelected(ev); setTemplateText('')}} className={`w-full text-left px-4 py-2 rounded-lg border ${selected?.id===ev.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}>
                  <div className="text-white font-medium">{ev.title}</div>
                  <div className="text-slate-400 text-xs">{ev.id}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => fetchEvents()}>Refresh</Button>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            {!selected ? (
              <div className="text-slate-400">Select an event to edit.</div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">Edit Event</h2>
                <Input value={selected.title || ''} onChange={(e)=>setSelected({...selected, title:e.target.value})} placeholder="Title" />
                <Input value={selected.description || ''} onChange={(e)=>setSelected({...selected, description:e.target.value})} placeholder="Description" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={selected.date || ''} onChange={(e)=>setSelected({...selected, date:e.target.value})} placeholder="Date" />
                  <Input value={selected.location || ''} onChange={(e)=>setSelected({...selected, location:e.target.value})} placeholder="Location" />
                </div>
                <Input value={selected.price_inr || ''} onChange={(e)=>setSelected({...selected, price_inr:e.target.value})} placeholder="Price (₹)" />
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Cover Image</label>
                  <input type="file" accept="image/*" onChange={(e)=>setCoverFile(e.target.files?.[0] || null)} />
                </div>

                <div className="mt-4">
                  <Button onClick={saveEvent} isLoading={loading}>Save Changes</Button>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white">Ticket Template (JSON)</h3>
                  <p className="text-slate-400 text-xs">Customize colors and header. Example: {`{"brandPrimary":"#1D4ED8","brandAccent":"#F59E0B","headerTitle":"AKCOMSOC Entry"}`}</p>
                  <textarea className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" rows={6} value={templateText} onChange={(e)=>setTemplateText(e.target.value)} />
                  <div className="mt-2">
                    <Button onClick={uploadTemplate}>Upload Template</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {selected && analytics && (
          <div className="space-y-6">
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Event Analytics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Total</div>
                  <div className="text-2xl font-bold text-white">{analytics.total}</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Issued</div>
                  <div className="text-2xl font-bold text-white">{analytics.issued}</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-white">{analytics.pending}</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Revenue</div>
                  <div className="text-xl font-bold text-white">₹{analytics.revenue?.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Check-in</div>
                  <div className="text-2xl font-bold text-white">{analytics.checkInRate}%</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Issue Rate</div>
                  <div className="text-2xl font-bold text-white">{analytics.issueRate}%</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {analytics.topColleges?.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-2 text-sm">Top Colleges</h3>
                    <div className="space-y-1">
                      {analytics.topColleges.map((c: any) => (
                        <div key={c.name} className="flex justify-between text-sm bg-white/5 rounded px-3 py-1.5">
                          <span className="text-slate-300">{c.name}</span>
                          <span className="text-slate-400 font-mono">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.dailyCounts?.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-2 text-sm">Daily Registrations</h3>
                    <div className="flex items-end gap-1 h-24">
                      {analytics.dailyCounts.map((d: any) => {
                        const max = Math.max(...analytics.dailyCounts.map((x: any) => x.count))
                        const pct = max > 0 ? (d.count / max) * 100 : 0
                        return (
                          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-[9px] text-slate-400 font-mono">{d.count}</div>
                            <div
                              className="w-full bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t"
                              style={{ height: `${pct}%`, minHeight: '2px' }}
                              title={`${d.day}: ${d.count}`}
                            />
                            <div className="text-[8px] text-slate-500">{d.day.slice(5)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {selected && (
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Attendees</h2>
                <p className="text-slate-400 text-sm">Event: {selected.title}</p>
              </div>
              <div className="flex gap-2">
                <Input value={ticketQuery} onChange={(e)=>setTicketQuery(e.target.value)} placeholder="Search name/email" />
                <Button variant="ghost" onClick={() => fetchTickets(selected.id)} isLoading={ticketsLoading}>Refresh</Button>
                <Button
                  variant="cosmic"
                  onClick={() => {
                    if (!tickets.length) return toast.error('No attendees to export')
                    const filtered = filteredTickets
                    const headers = ['Name','Email','Status','Used','Created']
                    const rows = filtered.map(t => [t.name, t.email, t.status || '', t.used ? 'Yes' : 'No', new Date(t.created_at).toISOString()])
                    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `attendees-${selected.id}.csv`
                    a.click()
                  }}
                >Export CSV</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Used</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ticketsLoading ? (
                    <tr><td className="py-4 text-slate-400" colSpan={5}>Loading attendees...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td className="py-4 text-slate-400" colSpan={5}>No attendees yet.</td></tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="py-2 pr-4 text-white">{t.name}</td>
                        <td className="py-2 pr-4 text-slate-300">{t.email}</td>
                        <td className="py-2 pr-4 text-slate-300">{t.status || '—'}</td>
                        <td className="py-2 pr-4 text-slate-300">{t.used ? 'Yes' : 'No'}</td>
                        <td className="py-2 pr-4 text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
