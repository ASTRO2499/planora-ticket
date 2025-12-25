import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { X } from 'lucide-react'

type HostFormData = {
  title: string
  description: string
  date: string
  location: string
  price: string
  organizerId: string
  coverImage: File | null
}

export default function HostEventPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<HostFormData>({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    organizerId: '',
    coverImage: null
  })

  function updateForm<K extends keyof HostFormData>(key: K, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!form.title.trim() || !form.description.trim() || !form.price.trim()) {
        toast.error('Please fill in all required fields')
        return
      }

      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('date', form.date)
      formData.append('location', form.location)
      formData.append('price', form.price)
      if (form.organizerId) formData.append('organizer_id', form.organizerId)
      if (form.coverImage) {
        formData.append('coverImage', form.coverImage)
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        toast.error('Failed to create event')
        return
      }

      const data = await res.json()
      toast.success('Event created successfully!')
      setForm({ title: '', description: '', date: '', location: '', price: '', organizerId: '', coverImage: null })
      setIsOpen(false)
      
      // Redirect to event with payment
      window.location.href = `/host/event/${data.event.id}`
    } catch (err) {
      toast.error('Error creating event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <Head>
        <title>Host an Event</title>
      </Head>

      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white">Host Your Event</h1>
        <p className="text-xs sm:text-base text-slate-300">Create and manage your own events with Planora</p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border-2 border-dashed border-violet-500/50 rounded-2xl p-6 sm:p-12 text-center cursor-pointer hover:border-violet-500 transition"
          onClick={() => setIsOpen(true)}
        >
          <div className="space-y-2 sm:space-y-3">
            <div className="text-4xl sm:text-5xl">🎪</div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Create New Event</h2>
            <p className="text-xs sm:text-base text-slate-300">Click to start hosting your event</p>
            <Button className="mt-3 sm:mt-4 w-full sm:w-auto text-sm sm:text-base">+ Create Event</Button>
          </div>
        </motion.div>
      </div>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Create Event</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm text-slate-300">Event Title *</label>
                <Input
                  placeholder="e.g., Web Summit 2025"
                  value={form.title}
                  onChange={e => updateForm('title', e.target.value)}
                  className="mt-1 text-sm sm:text-base"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-slate-300">Description *</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mt-1 resize-none text-sm sm:text-base"
                  placeholder="Describe your event..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm text-slate-300">Event Date</label>
                  <Input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => updateForm('date', e.target.value)}
                    className="mt-1 text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-slate-300">Location</label>
                  <Input
                    placeholder="City, Venue"
                    value={form.location}
                    onChange={e => updateForm('location', e.target.value)}
                    className="mt-1 text-sm sm:text-base"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm text-slate-300">Registration Fee (₹) *</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={form.price}
                    onChange={e => updateForm('price', e.target.value)}
                    className="mt-1 text-sm sm:text-base"
                    disabled={loading}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-slate-300">Organizer Secret ID *</label>
                  <Input
                    placeholder="e.g., AKC-ORG-25-SECRET"
                    value={form.organizerId}
                    onChange={e => updateForm('organizerId', e.target.value)}
                    className="mt-1 text-sm sm:text-base"
                    disabled={loading}
                  />
                  <p className="text-[10px] xs:text-xs text-slate-500 mt-1">Keep this secret. It grants organizer access to this event.</p>
                </div>
              <div>
                <label className="text-xs sm:text-sm text-slate-300">Cover Image (16:9 ratio recommended)</label>
                <div className="mt-1 border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-6 text-center hover:border-white/40 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => updateForm('coverImage', e.target.files?.[0] || null)}
                    disabled={loading}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    {form.coverImage ? (
                      <div className="text-sm text-green-400">✓ {form.coverImage.name}</div>
                    ) : (
                      <div className="text-sm text-slate-400">📸 Click to upload cover image (max 5MB)</div>
                    )}
                  </label>
                </div>
              </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={loading}
                >
                  Create Event
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
