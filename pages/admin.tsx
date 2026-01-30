import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ShieldCheck, LogOut, Search, CheckCircle, XCircle, Trash2, Mail, Download, TrendingUp, Users, DollarSign, Edit2, X, Radio, Home, LayoutDashboard, Lock } from 'lucide-react'
import Link from 'next/link'
import TicketGenerationAnimation from '../components/TicketGenerationAnimation'
import { QRCredentialsManager } from '../components/QRCredentialsManager'

type AuthState = 'unknown' | 'authenticated' | 'unauthenticated'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [q, setQ] = useState('')
  const [tickets, setTickets] = useState<any[]>([])
  const [authState, setAuthState] = useState<AuthState>('unknown')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [eventFilter, setEventFilter] = useState('ALL')
  const [events, setEvents] = useState<any[]>([])
  const [viewFilter, setViewFilter] = useState<'all'|'checked'|'remaining'>('all')
  const [certStats, setCertStats] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [driveLink, setDriveLink] = useState('')
  const [emailTpl, setEmailTpl] = useState('Dear #name,\n\nCongratulations on participating in #event. Your certificate is attached / available at the link.\n\nBest regards,\nEvent Team')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editLoading, setEditLoading] = useState(false)
  const [generatingTickets, setGeneratingTickets] = useState(false)
  const [generationStage, setGenerationStage] = useState<'preparing' | 'generating' | 'sending' | 'complete'>('preparing')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [adminTab, setAdminTab] = useState<'tickets' | 'credentials'>('tickets')
  const isAuthed = authState === 'authenticated'

  const search = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!isAuthed) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets?q=${encodeURIComponent(q)}&eventId=${encodeURIComponent(eventFilter)}&status=${encodeURIComponent(viewFilter)}`)
      if (!res.ok) {
        if (res.status === 403) setAuthState('unauthenticated')
        return
      }
      const j = await res.json()
      setTickets(j || [])
    } finally {
      setLoading(false)
    }
  }, [isAuthed, q, eventFilter, viewFilter])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?eventId=${encodeURIComponent(eventFilter)}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Stats error', err)
    }
  }, [eventFilter])

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session')
      const data = await res.json()
      setAuthState(data?.authenticated ? 'authenticated' : 'unauthenticated')
      if (data?.authenticated) {
        await search()
        await loadStats()
      } else {
        setTickets([])
      }
    } catch (err) {
      console.error(err)
      setAuthState('unauthenticated')
    }
  }, [search, loadStats])

  useEffect(() => { checkSession() }, [checkSession])
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        if (res.ok) setEvents(data.events || [])
      } catch {}
    }
    loadEvents()
  }, [])
  useEffect(() => { if (isAuthed) { search(); loadStats() } }, [eventFilter, viewFilter, isAuthed])

  // Certificates: fetch stats for selected event
  useEffect(() => {
    async function loadCertStats() {
      if (!isAuthed) return
      if (!eventFilter || eventFilter === 'ALL') { setCertStats(null); return }
      try {
        const res = await fetch(`/api/admin/certificates?eventId=${encodeURIComponent(eventFilter)}`)
        if (res.ok) {
          const data = await res.json()
          setCertStats(data)
        }
      } catch (err) {
        console.error('Cert stats error', err)
      }
    }
    loadCertStats()
  }, [isAuthed, eventFilter])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret }) })
      if (res.ok) {
        setSecret('')
        setAuthState('authenticated')
        toast.success('Authenticated')
        await search()
      } else {
        toast.error('Invalid secret')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthState('unauthenticated')
    setTickets([])
    toast.success('Logged out')
  }

  async function toggle(id: string) {
    if (!isAuthed) return
    const res = await fetch('/api/admin/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'toggle' }) })
    if (res.status === 403) {
      setAuthState('unauthenticated')
      return
    }
    await search()
    await loadStats()
    toast.success('Status updated')
  }

  async function deleteTicket(id: string) {
    if (!isAuthed) return
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    const res = await fetch('/api/admin/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'delete' }) })
    if (res.status === 403) {
      setAuthState('unauthenticated')
      return
    }
    if (res.ok) {
      await search()
      await loadStats()
      toast.success('Ticket deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  

  

  async function generateCertificates() {
    if (!isAuthed) return
    if (!eventFilter || eventFilter === 'ALL') return toast.error('Select an event first')
    if (!confirm('Generate certificates for checked-in attendees?')) return
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: eventFilter }) })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Certificates generated')
        setCertStats(null)
        await loadStats()
      } else {
        toast.error(data.error || 'Failed to generate')
      }
    } finally { setGenerating(false) }
  }

  async function sendBulkCertificates() {
    if (!isAuthed) return
    if (!eventFilter || eventFilter === 'ALL') return toast.error('Select an event first')
    if (!driveLink.trim()) return toast.error('Enter Google Drive folder link')
    if (!emailTpl.trim()) return toast.error('Enter email content')
    if (!confirm('Send certificate emails to all attendees with certificates?')) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/send-certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: eventFilter, driveFolderLink: driveLink, emailContent: emailTpl }) })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `Emails sent: ${data.sent || 0}`)
      } else {
        toast.error(data.error || 'Failed to send emails')
      }
    } finally { setSending(false) }
  }

  async function resendEmail(id: string) {
    if (!isAuthed) return
    const res = await fetch('/api/admin/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'resend' }) })
    if (res.ok) {
      toast.success('Email resend queued')
    } else {
      toast.error('Resend failed')
    }
  }

  async function startEdit(ticket: any) {
    setEditingId(ticket.id)
    setEditForm({
      name: ticket.name || '',
      email: ticket.email || '',
      phone: ticket.phone || '',
      college: ticket.college || '',
      ieee: ticket.ieee || ''
    })
  }

  async function saveEdit(id: string) {
    if (!isAuthed) return
    setEditLoading(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Delegate updated')
        setEditingId(null)
        setEditForm({})
        await search()
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setEditLoading(false)
    }
  }

  async function generateAndSendAllTickets() {
    if (!isAuthed) return
    if (!eventFilter || eventFilter === 'ALL') return toast.error('Select an event first')
    
    // If no tickets in state, try to fetch them
    let ticketsToSend = tickets
    if (ticketsToSend.length === 0) {
      try {
        console.log('[GENERATE] Event filter value:', eventFilter)
        console.log('[GENERATE] Event filter type:', typeof eventFilter)
        
        // Also fetch ALL tickets to see what event_ids exist
        const allRes = await fetch(`/api/admin/tickets?limit=1000`)
        const allTickets = await allRes.json()
        const uniqueEventIds = [...new Set(allTickets.map((t: any) => t.event_id))]
        console.log('[GENERATE] All unique event_ids in database:', uniqueEventIds)
        
        const res = await fetch(`/api/admin/tickets?eventId=${encodeURIComponent(eventFilter)}`)
        if (res.ok) {
          const data = await res.json()
          ticketsToSend = data || []
          console.log('[GENERATE] Fetched tickets for event:', ticketsToSend.length)
        } else {
          console.error('[GENERATE] Failed to fetch tickets:', res.status, res.statusText)
        }
      } catch (err) {
        console.error('[GENERATE] Error fetching tickets:', err)
      }
    }
    
    if (ticketsToSend.length === 0) {
      toast.error(`No tickets found for event "${eventFilter}". Please create tickets first or select a different event.`)
      return
    }

    const confirmed = window.confirm(
      `Generate and send ticket PDFs to ${ticketsToSend.length} attendee(s)? Continue?`
    )
    if (!confirmed) return

    setGeneratingTickets(true)
    setGenerationStage('preparing')
    setGenerationProgress(0)

    try {
      // Simulate preparing stage
      await new Promise(resolve => setTimeout(resolve, 1000))
      setGenerationStage('generating')
      
      // Simulate generating stage
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGenerationStage('sending')
      
      const body = JSON.stringify({
        eventId: eventFilter
      })
      console.log('[ADMIN GENERATE] Sending request to send-tickets-bulk:', body)
      
      const res = await fetch('/api/admin/send-tickets-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })

      const data = await res.json()

      if (res.ok) {
        // Animate progress as emails are sent
        for (let i = 0; i <= data.totalTickets; i++) {
          setGenerationProgress(i)
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Show completion stage
        setGenerationStage('complete')
        await new Promise(resolve => setTimeout(resolve, 1500))

        toast.success(`Sent ${data.successCount}/${data.totalTickets} tickets successfully!`)
        if (data.failureCount > 0) {
          toast.error(`Failed to send ${data.failureCount} tickets`)
        }
      } else {
        toast.error(data.error || 'Failed to send tickets')
      }
    } catch (error) {
      toast.error('Network error: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setGeneratingTickets(false)
      setGenerationProgress(0)
      setGenerationStage('preparing')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  function exportCSV() {
    if (tickets.length === 0) {
      toast.error('No tickets to export')
      return
    }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'College', 'IEEE', 'Extra 1', 'Extra 2', 'Extra 3', 'Extra 4', 'Extra 5', 'Price', 'Status', 'Used', 'Created']
    const rows = tickets.map(t => [
      t.id,
      t.name,
      t.email,
      t.phone || '',
      t.college || '',
      t.ieee || '',
      t.extra1 || '',
      t.extra2 || '',
      t.extra3 || '',
      t.extra4 || '',
      t.extra5 || '',
      t.amount_inr || t.tier_price || '',
      t.status || '',
      t.used ? 'Yes' : 'No',
      new Date(t.created_at).toLocaleString()
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets-${Date.now()}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <TicketGenerationAnimation 
        isVisible={generatingTickets}
        stage={generationStage}
        totalCount={tickets.length}
        currentCount={generationProgress}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <ShieldCheck className="text-primary" /> Admin Portal
        </h1>
        {isAuthed && (
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-sm h-10 px-4">
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
            <Link href="/track/console">
              <Button variant="cosmic" className="text-sm h-10 px-4">
                <Radio className="w-4 h-4 mr-2" /> Track Console
              </Button>
            </Link>
            <Link href="/organizer">
              <Button variant="ghost" className="text-sm h-10 px-4">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Organizer
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="text-sm h-10 px-4">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </Button>
          </div>
        )}
      </div>

      {authState !== 'authenticated' ? (
        <div className="flex justify-center pt-10">
          <Card className="p-8 space-y-6 max-w-md w-full glass-card">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Admin Access</h2>
              <p className="text-sm text-slate-400">Enter secure key to manage tickets.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Secret Key"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                disabled={loading}
              />
              <Button isLoading={loading} className="w-full" variant="cosmic">Authenticate</Button>
            </form>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-white/10">
            <button
              onClick={() => setAdminTab('tickets')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                adminTab === 'tickets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 mr-2 inline" /> Tickets
            </button>
            <button
              onClick={() => setAdminTab('credentials')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                adminTab === 'credentials'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 mr-2 inline" /> QR Check-in
            </button>
          </div>

          {/* Tickets Tab */}
          {adminTab === 'tickets' && (
            <>
          {/* Event Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Event</label>
            <select value={eventFilter} onChange={e=>setEventFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" style={{colorScheme: 'dark'}}>
              <option value="ALL" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>All</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id} style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>{ev.title}</option>
              ))}
            </select>
            <label className="text-sm text-slate-400 ml-4">View</label>
            <select value={viewFilter} onChange={e=>setViewFilter(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" style={{colorScheme: 'dark'}}>
              <option value="all" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>All Delegates</option>
              <option value="checked" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>Checked-in Delegates</option>
              <option value="remaining" style={{backgroundColor: '#1e293b', color: '#f1f5f9'}}>Remaining Delegates</option>
            </select>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-slate-400">Registrations</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.issued}</div>
                    <div className="text-xs text-slate-400">Tickets Issued</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.pending}</div>
                    <div className="text-xs text-slate-400">Pending</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.max(0, (stats.issued || 0) - (stats.used || 0))}</div>
                    <div className="text-xs text-slate-400">Absentees</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">₹{stats.revenue.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">Revenue</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.checkInRate}%</div>
                    <div className="text-xs text-slate-400">Check-in Rate</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.issueRate}%</div>
                    <div className="text-xs text-slate-400">Issue Rate</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {stats?.topColleges?.length > 0 && (
            <Card className="p-6 bg-white/5 border-white/5">
              <h3 className="text-white font-semibold mb-3">Top Colleges</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                {stats.topColleges.map((c: any) => (
                  <li key={c.name} className="flex justify-between"><span>{c.name}</span><span className="text-slate-400">{c.count}</span></li>
                ))}
              </ul>
            </Card>
          )}

          {stats?.dailyCounts?.length > 0 && (
            <Card className="p-6 bg-white/5 border-white/5">
              <h3 className="text-white font-semibold mb-3">Daily Registrations</h3>
              <div className="flex items-end gap-1 h-32">
                {stats.dailyCounts.map((d: any) => {
                  const max = Math.max(...stats.dailyCounts.map((x: any) => x.count))
                  const pct = max > 0 ? (d.count / max) * 100 : 0
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px] text-slate-400 font-mono">{d.count}</div>
                      <div
                        className="w-full bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t"
                        style={{ height: `${pct}%`, minHeight: '2px' }}
                        title={`${d.day}: ${d.count}`}
                      />
                      <div className="text-[9px] text-slate-500 rotate-45 origin-left mt-2">{d.day.slice(5)}</div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {eventFilter !== 'ALL' && (
            <Card className="p-6 bg-white/5 border-white/5">
              <h3 className="text-white font-semibold mb-3">Certificates</h3>
              {certStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{certStats.total_attended}</div>
                        <div className="text-xs text-slate-400">Attended</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{certStats.certificates_issued}</div>
                        <div className="text-xs text-slate-400">Certificates Issued</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{certStats.pending}</div>
                        <div className="text-xs text-slate-400">Pending</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <p className="text-slate-400 text-sm mb-4">Select an event to view certificate stats.</p>
              )}

              <div className="flex flex-wrap gap-3 mb-4">
                <Button onClick={generateCertificates} isLoading={generating} variant="primary" className="h-10">
                  Generate Certificates
                </Button>
              </div>

              <div className="space-y-3">
                <Input
                  label="Google Drive Folder Link"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveLink}
                  onChange={e => setDriveLink(e.target.value)}
                />
                <div className="w-full space-y-1.5">
                  <label className="text-sm font-medium text-white/80 ml-1">Email Content</label>
                  <textarea
                    className="flex w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-white h-32"
                    value={emailTpl}
                    onChange={e => setEmailTpl(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 ml-1">Placeholders: #name, #College, #event</p>
                </div>
                <Button onClick={sendBulkCertificates} isLoading={sending} variant="primary" className="h-10">
                  Send Bulk Emails
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-white/5 border-white/5">
            <form onSubmit={search} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by Ticket ID, Email or Name..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="bg-black/20"
                />
              </div>
              <Button isLoading={loading} variant="primary" className="w-32">
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
              <Button 
                onClick={generateAndSendAllTickets}
                isLoading={generatingTickets}
                variant="primary" 
                className="w-32"
              >
                Generate
              </Button>
              <Button onClick={exportCSV} variant="ghost" type="button" className="w-32">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </form>
          </Card>

          <div className="grid gap-4">
            {tickets.length === 0 && (
              <div className="text-center py-12 text-slate-500">No tickets found matching your query.</div>
            )}
            {tickets.map(t => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface hover:bg-surface-hover border border-white/5 rounded-xl p-4 flex items-start justify-between transition-colors"
              >
                {editingId === t.id ? (
                  <div className="w-full space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Name"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <Input
                        placeholder="Phone"
                        value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                      <Input
                        placeholder="College"
                        value={editForm.college}
                        onChange={e => setEditForm({ ...editForm, college: e.target.value })}
                      />
                      <Input
                        placeholder="IEEE ID"
                        value={editForm.ieee}
                        onChange={e => setEditForm({ ...editForm, ieee: e.target.value })}
                        className="col-span-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveEdit(t.id)} isLoading={editLoading} variant="primary" className="h-9 px-3 text-xs">
                        Save
                      </Button>
                      <Button onClick={cancelEdit} variant="ghost" className="h-9 px-3 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{t.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${t.used ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {t.used ? 'USED' : 'VALID'}
                        </span>
                      </div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-slate-400">{t.email}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        {t.phone && <span className="px-2 py-0.5 rounded bg-white/5">📞 {t.phone}</span>}
                        {t.college && <span className="px-2 py-0.5 rounded bg-white/5">🏫 {t.college}</span>}
                        {t.ieee && <span className="px-2 py-0.5 rounded bg-white/5">IEEE: {t.ieee}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => startEdit(t)} variant="ghost" className="h-9 px-2" title="Edit Delegate">
                        <Edit2 className="w-4 h-4 text-amber-400" />
                      </Button>
                      <Button onClick={() => toggle(t.id)} variant="ghost" className="h-9 text-xs px-3">
                        {t.used ? 'Mark Valid' : 'Mark Used'}
                      </Button>
                      <Button onClick={() => resendEmail(t.id)} variant="ghost" className="h-9 px-2" title="Resend Email">
                        <Mail className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button onClick={() => deleteTicket(t.id)} variant="ghost" className="h-9 px-2" title="Delete Ticket">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
            </>
          )}

          {/* QR Check-in Credentials Tab */}
          {adminTab === 'credentials' && (
            <>
              {eventFilter === 'ALL' ? (
                <Card className="p-6 bg-white/5 border-white/10 text-center text-slate-300">
                  <Lock className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                  <p className="font-semibold">Select an event</p>
                  <p className="text-sm text-slate-400 mt-1">Choose a specific event from the dropdown above to manage QR check-in credentials</p>
                </Card>
              ) : (
                <QRCredentialsManager eventId={eventFilter} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
