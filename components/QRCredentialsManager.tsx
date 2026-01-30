import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Trash2, Plus, Eye, EyeOff, Copy, Check, Lock, User } from 'lucide-react'

interface Credential {
  id: string
  username: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export function QRCredentialsManager({ eventId }: { eventId: string }) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState('')

  // Fetch credentials
  const loadCredentials = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizer-credentials?eventId=${encodeURIComponent(eventId)}`)
      if (res.ok) {
        const data = await res.json()
        setCredentials(data.credentials || [])
      } else if (res.status === 401) {
        toast.error('Unauthorized: Admin session required')
      } else {
        toast.error('Failed to load credentials')
      }
    } catch (err) {
      console.error('Error loading credentials:', err)
      toast.error('Network error while loading credentials')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadCredentials()
  }, [eventId, loadCredentials])

  // Generate random password
  const generatePassword = useCallback(() => {
    const length = 12
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setGeneratedPassword(password)
    setNewPassword(password)
  }, [])

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUsername.trim()) {
      toast.error('Username is required')
      return
    }

    if (!newPassword.trim()) {
      toast.error('Password is required')
      return
    }

    if (newUsername.length < 3 || newUsername.length > 50) {
      toast.error('Username must be 3-50 characters')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSubmitLoading(true)
    try {
      const res = await fetch(`/api/admin/organizer-credentials?eventId=${encodeURIComponent(eventId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Credential created successfully')
        setCredentials([data.credential, ...credentials])
        setNewUsername('')
        setNewPassword('')
        setGeneratedPassword('')
        setShowForm(false)
      } else {
        toast.error(data.error || 'Failed to create credential')
      }
    } catch (err) {
      console.error('Error creating credential:', err)
      toast.error('Network error while creating credential')
    } finally {
      setSubmitLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (credentialId: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return

    setDeletingId(credentialId)
    try {
      const res = await fetch(`/api/admin/organizer-credentials?eventId=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: credentialId })
      })

      if (res.ok) {
        toast.success('Credential deleted successfully')
        setCredentials(credentials.filter(c => c.id !== credentialId))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete credential')
      }
    } catch (err) {
      console.error('Error deleting credential:', err)
      toast.error('Network error while deleting credential')
    } finally {
      setDeletingId(null)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, credentialId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(credentialId)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            QR Check-in Credentials
          </h3>
          <p className="text-xs text-slate-400 mt-1">Create and manage username/password pairs for QR ticket verification</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="primary"
          className="h-10"
        >
          <Plus className="w-4 h-4 mr-2" /> New Credential
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="p-6 bg-white/5 border-white/10 space-y-4">
          <h4 className="text-white font-semibold">Create New Credential</h4>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Username"
                placeholder="e.g., checker_1"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={submitLoading}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={submitLoading}
                    className="flex w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={generatePassword}
              variant="ghost"
              className="text-sm"
            >
              Generate Strong Password
            </Button>

            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={submitLoading}
                variant="primary"
                className="flex-1 h-10"
              >
                Create Credential
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setNewUsername('')
                  setNewPassword('')
                  setGeneratedPassword('')
                }}
                variant="ghost"
                className="h-10"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Credentials List */}
      <div className="space-y-3">
        {loading && !credentials.length ? (
          <Card className="p-6 bg-white/5 border-white/10 text-center text-slate-400">
            Loading credentials...
          </Card>
        ) : credentials.length === 0 ? (
          <Card className="p-6 bg-white/5 border-white/10 text-center text-slate-400">
            <p>No credentials created yet</p>
            <p className="text-xs mt-2">Create one to enable QR check-in for this event</p>
          </Card>
        ) : (
          credentials.map((cred) => (
            <Card
              key={cred.id}
              className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{cred.username}</div>
                      <div className="text-xs text-slate-400">
                        Created {formatDate(cred.created_at)}
                      </div>
                    </div>
                    <span
                      className={`ml-auto px-2 py-1 text-xs font-semibold rounded-full ${
                        cred.is_active
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {cred.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 ml-12">
                    {cred.last_used_at ? (
                      <p>Last used: {formatDate(cred.last_used_at)}</p>
                    ) : (
                      <p>Never used</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => copyToClipboard(cred.username, cred.id)}
                    variant="ghost"
                    className="h-9 px-2"
                    title="Copy username"
                  >
                    {copiedId === cred.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDelete(cred.id)}
                    disabled={deletingId === cred.id}
                    variant="ghost"
                    className="h-9 px-2"
                    title="Delete credential"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20 space-y-2">
        <div className="flex gap-2 text-sm text-blue-300">
          <div className="text-xl">ℹ️</div>
          <div className="space-y-1">
            <p className="font-semibold">How to use</p>
            <p className="text-xs text-blue-200">
              Share these credentials with your check-in staff. They will use them to log in at{' '}
              <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300">/verify</code> page to scan QR codes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
