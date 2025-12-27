import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabaseClient'
import { Award, Edit2 } from 'lucide-react'
import SuccessAnimation from '../components/SuccessAnimation'

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
  const [templateError, setTemplateError] = useState<string>('')
  const [templatePreview, setTemplatePreview] = useState<{ brandPrimary?: string; brandAccent?: string; brandDark?: string; headerTitle?: string } | null>(null)
  const [certificateStats, setCertificateStats] = useState<any>(null)
  const [generatingCertificates, setGeneratingCertificates] = useState(false)
  const [driveFolderLink, setDriveFolderLink] = useState('')
  const [emailContent, setEmailContent] = useState('Dear #name,\n\nCongratulations on successfully completing the event!\n\nWe are pleased to present your certificate of participation for representing #College.\n\nYour certificate is attached with this email.\n\nBest regards,\nEvent Team')
  const [sendingEmails, setSendingEmails] = useState(false)
  const [tab, setTab] = useState<'details' | 'certificates'>('details')
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editLoading, setEditLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  function applySampleTemplate(kind: 'cosmic' | 'ocean') {
    const samples: Record<string, any> = {
      cosmic: {
        brandPrimary: '#7C3AED',
        brandAccent: '#EC4899',
        brandDark: '#0F172A',
        headerTitle: 'ENTRY PASS'
      },
      ocean: {
        brandPrimary: '#0EA5E9',
        brandAccent: '#10B981',
        brandDark: '#0B1220',
        headerTitle: 'EVENT ADMIT'
      }
    }
    const t = samples[kind]
    setTemplateText(JSON.stringify(t, null, 2))
    setTemplatePreview(t)
    setTemplateError('')
    toast.success('Sample template applied')
  }
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketQuery, setTicketQuery] = useState('')
  const [viewFilter, setViewFilter] = useState<'all'|'checked'|'remaining'>('all')
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
      const res = await fetch(`/api/organizer/tickets?eventId=${encodeURIComponent(eventId)}&status=${encodeURIComponent(viewFilter)}`, { headers })
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

  async function loadExistingTemplate() {
    if (!selected) return
    try {
      const headers: Record<string,string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch(`/api/organizer/templates?eventId=${encodeURIComponent(selected.id)}`, { headers })
      if (!res.ok) {
        toast.error('No template found for this event')
        return
      }
      const data = await res.json()
      setTemplateText(JSON.stringify(data.template || {}, null, 2))
      setTemplateError('')
      setTemplatePreview(data.template || null)
      toast.success('Loaded current template')
    } catch {
      toast.error('Failed to load template')
    }
  }

  function validateAndPreviewTemplate() {
    try {
      const parsed = JSON.parse(templateText || '{}')
      const allowedKeys = ['brandPrimary', 'brandAccent', 'brandDark', 'headerTitle']
      const invalid = Object.keys(parsed).filter(k => !allowedKeys.includes(k))
      if (invalid.length) {
        setTemplateError(`Unknown keys: ${invalid.join(', ')}`)
      } else {
        setTemplateError('')
      }
      setTemplatePreview(parsed)
      toast.success('Preview updated')
    } catch (e: any) {
      setTemplateError(e?.message || 'Invalid JSON')
      setTemplatePreview(null)
      toast.error('Invalid JSON')
    }
  }

  function previewPdfForLatestAttendee() {
    if (!selected) {
      toast.error('Select an event first')
      return
    }
    if (!tickets || tickets.length === 0) {
      toast.error('No attendees yet to preview a ticket')
      return
    }
    const latest = tickets[0]
    const url = `/api/ticket-pdf?id=${encodeURIComponent(latest.id)}`
    window.open(url, '_blank')
  }

  async function fetchCertificateStats() {
    if (!selected) return
    try {
      const headers: Record<string,string> = {}
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      const res = await fetch(`/api/organizer/certificates?eventId=${encodeURIComponent(selected.id)}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setCertificateStats(data)
      } else {
        const errorData = await res.json().catch(() => ({ error: 'unknown' }))
        console.error('Failed to fetch certificate stats:', res.status, errorData)
        toast.error('Failed to load certificate stats')
      }
    } catch (error) {
      console.error('Certificate stats error:', error)
    }
  }

  async function generateCertificates() {
    if (!selected) return
    if (!confirm('Generate certificates for all attendees who checked in? This will create certificates for ' + (certificateStats?.pending || 0) + ' attendees.')) return
    
    setGeneratingCertificates(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      const res = await fetch('/api/organizer/certificates', {
        method: 'POST',
        headers,
        body: JSON.stringify({ eventId: selected.id })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Certificates generated successfully')
        fetchCertificateStats()
      } else {
        console.error('Certificate generation failed:', data)
        toast.error(data.details || data.error || 'Failed to generate certificates')
      }
    } catch (error) {
      console.error('Certificate generation error:', error)
      toast.error('Network error generating certificates')
    } finally {
      setGeneratingCertificates(false)
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
    if (!selected) return
    setEditLoading(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      const res = await fetch(`/api/organizer/tickets?eventId=${encodeURIComponent(selected.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...editForm })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success('Delegate updated')
        setEditingId(null)
        setEditForm({})
        await fetchTickets(selected.id)
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setEditLoading(false)
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function sendBulkCertificateEmails() {
    if (!selected) return
    if (!driveFolderLink.trim()) {
      toast.error('Please enter the Google Drive folder link')
      return
    }
    if (!emailContent.trim()) {
      toast.error('Please enter email content')
      return
    }
    if (!confirm('Send certificate emails to all attendees? This will send ' + (certificateStats?.certificates_issued || 0) + ' emails.')) return
    
    setSendingEmails(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
      
      const res = await fetch('/api/organizer/send-certificates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventId: selected.id,
          driveFolderLink,
          emailContent
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Emails sent successfully')
      } else {
        console.error('Email sending failed:', data)
        toast.error(data.error || 'Failed to send emails')
      }
    } catch (error) {
      console.error('Email sending error:', error)
      toast.error('Network error sending emails')
    } finally {
      setSendingEmails(false)
    }
  }

  useEffect(() => {
    if (selected && tab === 'certificates') {
      fetchCertificateStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tab])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selected?.id) {
      fetchTickets(selected.id)
      fetchAnalytics(selected.id)
    } else {
      setTickets([])
      setAnalytics(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, viewFilter])

  // Try to preload existing template for selected event
  useEffect(() => {
    let abort = false
    async function preloadTemplate() {
      if (!selected?.id) { setTemplateText(''); setTemplatePreview(null); setTemplateError(''); return }
      try {
        const headers: Record<string,string> = {}
        if (organizerSecret) headers['x-organizer-secret'] = organizerSecret
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        const res = await fetch(`/api/organizer/templates?eventId=${encodeURIComponent(selected.id)}`, { headers })
        if (!res.ok) return
        const data = await res.json()
        if (!abort) {
          setTemplateText(JSON.stringify(data.template || {}, null, 2))
          setTemplatePreview(data.template || null)
          setTemplateError('')
        }
      } catch {}
    }
    preloadTemplate()
    return () => { abort = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <SuccessAnimation isVisible={showSuccessAnimation} message="Form settings saved successfully!" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Manage Events</h1>
          {selected && (
            <Button
              variant={showFormBuilder ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFormBuilder(!showFormBuilder)}
              title="Registration Form Builder"
            >
              {showFormBuilder ? 'Close Form Builder' : 'Edit Form'}
            </Button>
          )}
        </div>
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
                {tab === 'details' && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-white">Edit Event</h2>
                <Input value={selected.title || ''} onChange={(e)=>setSelected({...selected, title:e.target.value})} placeholder="Title" />
                <Input value={selected.description || ''} onChange={(e)=>setSelected({...selected, description:e.target.value})} placeholder="Description" />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="datetime-local"
                    value={selected?.date ? (selected.date.includes('T') ? selected.date.slice(0,16) : `${selected.date}T00:00`) : ''}
                    onChange={(e)=>setSelected({...selected, date:e.target.value})}
                    placeholder="Date & Time"
                  />
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
                  <p className="text-slate-400 text-xs">Customize ticket branding and header using JSON. Keys supported:
                    <span className="block mt-1 text-[11px] text-slate-500">brandPrimary, brandAccent, brandDark, headerTitle</span>
                  </p>
                  <pre className="text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-lg p-3 mt-2 overflow-x-auto">
{`Example:\n{
  "brandPrimary": "#1D4ED8",
  "brandAccent": "#F59E0B",
  "brandDark": "#0F172A",
  "headerTitle": "Event Entry"
}`}
                  </pre>
                  <textarea className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm" rows={8} value={templateText} onChange={(e)=>setTemplateText(e.target.value)} />
                  {templateError && <div className="text-xs text-amber-400 mt-1">{templateError}</div>}
                  <div className="mt-3 flex gap-2 flex-wrap items-center">
                    <Button onClick={validateAndPreviewTemplate} variant="outline">Preview</Button>
                    <Button onClick={loadExistingTemplate} variant="ghost">Load Current</Button>
                    <Button onClick={uploadTemplate}>Save Template</Button>
                    <Button onClick={previewPdfForLatestAttendee} variant="cosmic" title="Opens latest attendee's ticket using the saved template">Preview PDF</Button>
                    <div className="ml-auto flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => applySampleTemplate('cosmic')}>Sample: Cosmic</Button>
                      <Button type="button" variant="ghost" onClick={() => applySampleTemplate('ocean')}>Sample: Ocean</Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Note: PDF preview uses the last saved template. Click &quot;Save Template&quot; to apply changes.</p>

                  {templatePreview && (
                    <div className="mt-4 border border-white/10 rounded-xl overflow-hidden">
                      <div className="p-4" style={{ background: templatePreview.brandPrimary || '#7C3AED' }}>
                        <div className="text-white font-bold">{templatePreview.headerTitle || 'ENTRY PASS'}</div>
                        <div className="text-white/70 text-xs">Preview</div>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-slate-400">Primary</div>
                          <div className="h-6 rounded" style={{ background: templatePreview.brandPrimary || '#7C3AED' }} />
                        </div>
                        <div>
                          <div className="text-slate-400">Accent</div>
                          <div className="h-6 rounded" style={{ background: templatePreview.brandAccent || '#EC4899' }} />
                        </div>
                        <div>
                          <div className="text-slate-400">Dark</div>
                          <div className="h-6 rounded" style={{ background: templatePreview.brandDark || '#1F2937' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  </div>
                )}

                {tab === 'certificates' && (
                  <div className="space-y-6">
                    {certificateStats && (
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-3">Event Certificates</h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{certificateStats.total_attended}</div>
                            <div className="text-xs text-slate-400">Attended</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{certificateStats.certificates_issued}</div>
                            <div className="text-xs text-slate-400">Issued</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-400">{certificateStats.pending}</div>
                            <div className="text-xs text-slate-400">Pending</div>
                          </div>
                        </div>
                        <Button 
                          onClick={generateCertificates} 
                          isLoading={generatingCertificates}
                          disabled={certificateStats.pending === 0}
                          className="w-full"
                          variant="cosmic"
                        >
                          {certificateStats.pending > 0 ? `Generate ${certificateStats.pending} Certificates` : 'All Certificates Generated'}
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">Certificates are only generated for attendees who checked in at the event.</p>
                      </div>
                    )}

                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
                      <h3 className="text-lg font-semibold text-white mb-2">Send Certificates via Email</h3>
                      <p className="text-slate-400 text-xs mb-3">
                        Send certificates to all attendees. Upload certificates to Google Drive and provide the folder link. Certificates will be matched by attendee name.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-300 mb-1 block">Google Drive Folder Link</label>
                          <Input
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={driveFolderLink}
                            onChange={(e) => setDriveFolderLink(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-slate-500 mt-1">Make sure the folder is publicly accessible</p>
                        </div>

                        <div>
                          <label className="text-sm text-slate-300 mb-1 block">Email Content Template</label>
                          <p className="text-xs text-slate-400 mb-1">Use variables: #name, #College, #event</p>
                          <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm min-h-[120px]"
                            value={emailContent}
                            onChange={(e) => setEmailContent(e.target.value)}
                            placeholder="Dear #name, Congratulations!"
                          />
                        </div>

                        <Button
                          onClick={sendBulkCertificateEmails}
                          isLoading={sendingEmails}
                          disabled={sendingEmails || !certificateStats?.certificates_issued}
                          className="w-full"
                          variant="primary"
                        >
                          {sendingEmails ? 'Sending Emails...' : `Send to ${certificateStats?.certificates_issued || 0} Recipients`}
                        </Button>
                        
                        <p className="text-xs text-slate-500">
                          Emails will be sent to attendees who have certificates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
              <div className="flex gap-2 items-center">
                <Input value={ticketQuery} onChange={(e)=>setTicketQuery(e.target.value)} placeholder="Search name/email" />
                <Button variant="ghost" onClick={() => fetchTickets(selected.id)} isLoading={ticketsLoading}>Refresh</Button>
                <label className="text-xs text-slate-400">View</label>
                <select value={viewFilter} onChange={e=>setViewFilter(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs">
                  <option value="all">All</option>
                  <option value="checked">Checked-in</option>
                  <option value="remaining">Remaining</option>
                </select>
                <Button
                  variant="cosmic"
                  onClick={() => {
                    const eventId = selected?.id
                    if (!eventId) return
                    let url = `/api/admin/export-csv?eventId=${encodeURIComponent(eventId)}`
                    // Add auth headers via fetch
                    const headers: Record<string, string> = {}
                    if (organizerSecret?.trim()) {
                      headers['x-organizer-secret'] = organizerSecret.trim()
                    }
                    if (accessToken?.trim()) {
                      headers['Authorization'] = `Bearer ${accessToken.trim()}`
                    }
                    
                    console.log('Export CSV - organizerSecret:', !!organizerSecret?.trim(), 'accessToken:', !!accessToken?.trim(), 'headers:', headers)
                    
                    if (!organizerSecret?.trim() && !accessToken?.trim()) {
                      toast.error('Not authenticated. Please login again.')
                      return
                    }
                    
                    fetch(url, { 
                      method: 'GET',
                      headers,
                      credentials: 'include' 
                    })
                      .then(async res => {
                        console.log('CSV response status:', res.status, res.ok)
                        if (!res.ok) {
                          const text = await res.text()
                          console.error('CSV error response:', text)
                          let errMsg = `HTTP ${res.status}`
                          try {
                            const errData = JSON.parse(text)
                            errMsg = errData.error || errMsg
                          } catch {}
                          throw new Error(errMsg)
                        }
                        return res.blob()
                      })
                      .then(blob => {
                        const downloadUrl = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = downloadUrl
                        a.download = `event-${eventId}-tickets.csv`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(downloadUrl)
                        document.body.removeChild(a)
                        toast.success('CSV exported successfully')
                      })
                      .catch(err => {
                        console.error('Export error:', err)
                        toast.error('Export failed: ' + err.message)
                      })
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
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ticketsLoading ? (
                    <tr><td className="py-4 text-slate-400" colSpan={6}>Loading attendees...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td className="py-4 text-slate-400" colSpan={6}>No attendees yet.</td></tr>
                  ) : (
                    filteredTickets.map((t) => (
                      editingId === t.id ? (
                        <tr key={t.id} className="bg-white/5">
                          <td colSpan={6} className="py-3 px-4">
                            <div className="space-y-2">
                              <div className="grid grid-cols-5 gap-2">
                                <Input
                                  placeholder="Name"
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="Email"
                                  type="email"
                                  value={editForm.email}
                                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="Phone"
                                  value={editForm.phone}
                                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="College"
                                  value={editForm.college}
                                  onChange={e => setEditForm({ ...editForm, college: e.target.value })}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  placeholder="IEEE ID"
                                  value={editForm.ieee}
                                  onChange={e => setEditForm({ ...editForm, ieee: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => saveEdit(t.id)} isLoading={editLoading} variant="primary" className="h-7 px-2 text-xs">
                                  Save
                                </Button>
                                <Button onClick={cancelEdit} variant="ghost" className="h-7 px-2 text-xs">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={t.id} className="hover:bg-white/5">
                          <td className="py-2 pr-4 text-white">{t.name}</td>
                          <td className="py-2 pr-4 text-slate-300">{t.email}</td>
                          <td className="py-2 pr-4 text-slate-300">{t.status || '—'}</td>
                          <td className="py-2 pr-4 text-slate-300">{t.used ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-4 text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            <Button onClick={() => startEdit(t)} variant="ghost" className="h-7 px-2" title="Edit Delegate">
                              <Edit2 className="w-3 h-3 text-amber-400" />
                            </Button>
                          </td>
                        </tr>
                      )
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Floating Certificates Button */}
        <div className="fixed left-3 bottom-6 z-50">
          <Button
            variant={tab === 'certificates' ? 'primary' : 'cosmic'}
            size="sm"
            className="rounded-full w-10 h-10 p-0 shadow-lg shadow-black/20"
            title={tab === 'certificates' ? 'Back to Details' : 'Open Certificates'}
            aria-label={tab === 'certificates' ? 'Back to Details' : 'Open Certificates'}
            onClick={() => setTab(tab === 'certificates' ? 'details' : 'certificates')}
          >
            <Award className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Builder Modal */}
        {showFormBuilder && selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-white/20">
              <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Registration Form Builder</h2>
                <Button variant="ghost" onClick={() => setShowFormBuilder(false)}>✕</Button>
              </div>
              <div className="p-6">
                <SimpleFormBuilder eventId={selected.id} organizerSecret={organizerSecret} accessToken={accessToken} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function SimpleFormBuilder({ eventId, organizerSecret, accessToken }: { eventId: string; organizerSecret: string; accessToken: string }) {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [config, setConfig] = useState<any>({ base: { phone: { label: 'Phone Number' }, college: { label: 'College/Institution' }, ieee: { label: 'IEEE Membership Number' } }, extras: [] })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/organizer/form-settings?eventId=${encodeURIComponent(eventId)}`, {
          headers: {
            ...(organizerSecret ? { 'x-organizer-secret': organizerSecret } : {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          }
        })
        const data = await res.json()
        const cfg = data?.settings?.field_config || {}
        if (!cfg.extras) cfg.extras = []
        setConfig(cfg)
      } catch {}
      setLoading(false)
    }
    load()
  }, [eventId, accessToken, organizerSecret])

  function updateBase(key: string, patch: any) {
    setConfig((prev: any) => ({ ...prev, base: { ...(prev.base || {}), [key]: { ...(prev.base?.[key] || {}), ...patch } } }))
  }
  function updateExtra(idx: number, patch: any) {
    setConfig((prev: any) => {
      const arr = [...(prev.extras || [])]
      arr[idx] = { ...(arr[idx] || {}), ...patch }
      return { ...prev, extras: arr }
    })
  }
  function addExtra() {
    setConfig((prev: any) => ({ ...prev, extras: ([...(prev.extras || [])].concat({ label: `Extra Field ${((prev.extras||[]).length+1)}`, type: 'text', required: false, options: [] })).slice(0,5) }))
  }

  async function save() {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizer/form-settings?eventId=${encodeURIComponent(eventId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(organizerSecret ? { 'x-organizer-secret': organizerSecret } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ field_config: config })
      })
      if (res.ok) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        toast.success('Form settings saved')
      }
      else toast.error('Failed to save form settings')
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <SuccessAnimation isVisible={showSuccess} message="Form settings saved successfully!" />
      <div className="grid sm:grid-cols-3 gap-3">
        {['phone','college','ieee'].map((key) => (
          <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-1">{key.toUpperCase()} Label</div>
            <Input value={config?.base?.[key]?.label || ''} onChange={(e)=>updateBase(key, { label: e.target.value })} />
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-slate-400">Required</label>
              <input type="checkbox" checked={!!config?.base?.[key]?.required} onChange={(e)=>updateBase(key, { required: e.target.checked })} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Extra Fields</h3>
        <Button variant="outline" onClick={addExtra} disabled={(config?.extras?.length || 0) >= 5}>Add Extra</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {(config.extras || []).slice(0,5).map((f: any, idx: number) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-slate-400 mb-1">Label</div>
                <Input value={f?.label || ''} onChange={(e)=>updateExtra(idx, { label: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Type</div>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm" value={f?.type || 'text'} onChange={(e)=>updateExtra(idx, { type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="select">Dropdown</option>
                  <option value="yes_no">Yes/No</option>
                </select>
              </div>
            </div>
            {f?.type === 'select' && (
              <div className="mt-2 space-y-2">
                <div className="text-xs text-slate-400">Options</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input 
                      placeholder="Option 1" 
                      value={(f?.options || [])[0] || ''} 
                      onChange={(e) => {
                        const opts = [...(f?.options || [])]
                        opts[0] = e.target.value
                        updateExtra(idx, { options: opts.filter(Boolean) })
                      }} 
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Option 2" 
                      value={(f?.options || [])[1] || ''} 
                      onChange={(e) => {
                        const opts = [...(f?.options || [])]
                        opts[1] = e.target.value
                        updateExtra(idx, { options: opts.filter(Boolean) })
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-slate-400">Required</label>
              <input type="checkbox" checked={!!f?.required} onChange={(e)=>updateExtra(idx, { required: e.target.checked })} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} isLoading={loading}>Save Form Settings</Button>
      </div>
    </div>
  )
}
