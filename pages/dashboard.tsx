import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabaseClient'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Plus, Calendar, Home, LogOut } from 'lucide-react'
import LoadingAnimation from '../components/LoadingAnimation'

export default function Dashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState<any[]>([])
    const [showCreate, setShowCreate] = useState(false)

    // Create Event Form State
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [price, setPrice] = useState('0')

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Load user events with analytics
            // We join with tickets table to get count
            const { data: eventsData, error } = await supabase
                .from('events')
                .select(`
            *,
            tickets (count)
        `)
                .eq('organizer_id', user.id)
                .order('created_at', { ascending: false })

            if (eventsData) {
                // Transform data to include sales stats
                const eventsWithStats = eventsData.map((e: any) => ({
                    ...e,
                    sold: e.tickets?.[0]?.count || 0,
                    revenue: (e.tickets?.[0]?.count || 0) * (e.price_inr || 0)
                }))
                setEvents(eventsWithStats)
            }
            setLoading(false)
        }
        load()
    }, [router])

    async function createEvent(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const { data, error } = await supabase.from('events').insert({
                title,
                date: new Date(date).toISOString(),
                price_inr: Number(price),
                organizer_id: user.id
            }).select().single()

            if (error) throw error

            toast.success('Event Created!')
            setEvents([data, ...events])
            setShowCreate(false)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function signOut() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) return <LoadingAnimation message="Loading Dashboard" fullScreen />

    return (
        <div className="min-h-screen pb-20">
            {/* Dashboard Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="font-display font-bold text-xl text-white">Planora Tickets</Link>
                        <span className="bg-white/10 text-xs px-2 py-1 rounded text-slate-300">Host Portal</span>
                    </div>
                    <Button onClick={signOut} variant="ghost" className="text-sm h-9">Sign Out <LogOut className="ml-2 w-4 h-4" /></Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-display font-bold text-white">My Events</h1>
                    <Button onClick={() => setShowCreate(!showCreate)} variant="cosmic">
                        <Plus className="mr-2 h-5 w-5" /> Create Event
                    </Button>
                </div>

                {showCreate && (
                    <Card className="p-6 bg-white/5 border-primary/20 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Event</h2>
                        <form onSubmit={createEvent} className="space-y-4">
                            <Input label="Event Title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Summer Music Festival" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date & Time" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
                                <Input label="Ticket Price (₹)" type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Publish Event</Button>
                            </div>
                        </form>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length === 0 && !showCreate && (
                        <div className="col-span-full text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <Calendar className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                            <h3 className="text-xl font-medium text-white">No events yet</h3>
                            <p className="text-slate-400 mb-6">Create your first event to start selling tickets.</p>
                            <Button onClick={() => setShowCreate(true)} variant="outline">Create Event</Button>
                        </div>
                    )}

                    {events.map(event => (
                        <Card key={event.id} hoverEffect className="group cursor-pointer bg-surface">
                            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center">
                                <Calendar className="w-10 h-10 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{new Date(event.date).toLocaleDateString()}</p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-black/20 rounded p-2 text-center">
                                    <div className="text-xs text-slate-500 uppercase">Sold</div>
                                    <div className="text-lg font-bold text-white">{event.sold || 0}</div>
                                </div>
                                <div className="bg-black/20 rounded p-2 text-center">
                                    <div className="text-xs text-slate-500 uppercase">Revenue</div>
                                    <div className="text-lg font-bold text-green-400">₹{event.revenue || 0}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="font-mono text-white">₹{event.price_inr}</span>
                                <Link href={`/e/${event.id}`}>
                                    <Button variant="ghost" className="text-xs h-8">View Page</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}
