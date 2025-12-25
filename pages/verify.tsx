import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from 'react-hot-toast'
import { Shield, QrCode, CheckCircle, XCircle, LogOut, User, Search, BarChart3, Clock, Volume2, VolumeX, History, Camera, PauseCircle } from 'lucide-react'

export default function Verify() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastScan, setLastScan] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scanCooldown, setScanCooldown] = useState(0)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    if (username === 'ASTRO' && password === 'ASTRO') {
      toast.success('Login successful!')
      setIsAuthenticated(true)
      localStorage.setItem('verify_auth', 'true')
    } else {
      toast.error('Invalid credentials')
    }
    setLoading(false)
  }

  async function loadHtml5QrLib() {
    if (typeof window === 'undefined') return
    if ((globalThis as any).Html5Qrcode) {
      setScriptLoaded(true)
      return
    }
    return new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('html5-qrcode-lib') as HTMLScriptElement | null
      if (existing) {
        existing.onload = () => { setScriptLoaded(true); resolve() }
        existing.onerror = () => reject(new Error('Failed to load html5-qrcode'))
        return
      }
      const script = document.createElement('script')
      script.id = 'html5-qrcode-lib'
      script.src = 'https://unpkg.com/html5-qrcode'
      script.async = true
      script.onload = () => { setScriptLoaded(true); resolve() }
      script.onerror = () => reject(new Error('Failed to load html5-qrcode'))
      document.body.appendChild(script)
    })
  }

  function handleLogout() {
    setIsAuthenticated(false)
    localStorage.removeItem('verify_auth')
    setScanHistory([])
    setStats({ total: 0, valid: 0, invalid: 0 })
    toast.success('Logged out')
  }

  const playSound = useCallback((success: boolean) => {
    if (!soundEnabled) return
    const beep = new Audio()
    beep.src = success 
      ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE='
      : 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAABAAgAZGF0YQoGAACAgYF9e3p9f4ODgoGAgH9/gIGCg4OCgYF/f3+AgYKDg4KBgX9/f4CBgoODgoGBf39/gIGCg4OCgYF/f3+AgYKDg4KBgX9/f4CBgoODgoGBf39/gIGCg4OCgYF/f3+AgYKDg4KBgX9/f4CBgoODgoGBf39/gA=='
    beep.play().catch(() => {})
  }, [soundEnabled])

  async function handleManualSearch() {
    if (!searchQuery.trim()) {
      toast.error('Please enter email or name')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/check-tickets`)
      if (res.ok) {
        const data = await res.json()
        const found = data.recent_tickets?.find((t: any) => 
          t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id === searchQuery
        )
        
        if (found) {
          setSearchResult(found)
          toast.success('Ticket found!')
        } else {
          setSearchResult(null)
          toast.error('No ticket found')
        }
      }
    } catch (err) {
      toast.error('Search error')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualCheckIn(ticketId: string) {
    try {
      const res = await fetch('/api/verify-ticket', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      })

      if (res.ok) {
        toast.success('Checked in successfully!')
        setSearchResult(null)
        setSearchQuery('')
        setStats(prev => ({ ...prev, valid: prev.valid + 1, total: prev.total + 1 }))
      } else {
        toast.error('Check-in failed')
      }
    } catch (err) {
      toast.error('Error during check-in')
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem('verify_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Scan cooldown timer effect
  useEffect(() => {
    if (scanCooldown > 0) {
      const timer = setInterval(() => {
        setScanCooldown(c => Math.max(0, c - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [scanCooldown])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!scanning) return

    const Html5Qrcode = (globalThis as any).Html5Qrcode
    if (!Html5Qrcode) {
      toast.error('Scanner library not loaded. Tap Start again.')
      return
    }

    let html5QrCode: any = null

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader")
        const cameras = await Html5Qrcode.getCameras()
        
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id
          await html5QrCode.start(
            cameraId, 
            { fps: 10, qrbox: { width: 250, height: 250 } }, 
            async (decodedText: string) => {
              // Skip scan if still on cooldown
              if (scanCooldown > 0) {
                return
              }

              const toastId = toast.loading('Verifying ticket...')
              try {
                const res = await fetch('/api/verify-ticket', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ data: decodedText })
                })
                const result = await res.json()
                
                if (result.valid) {
                  const scanData = {
                    valid: true,
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    event: result.event_id,
                    time: new Date().toLocaleTimeString(),
                    timestamp: Date.now()
                  }
                  
                  setLastScan(scanData)
                  setScanHistory(prev => [scanData, ...prev].slice(0, 20))
                  setStats(prev => ({ 
                    total: prev.total + 1, 
                    valid: prev.valid + 1, 
                    invalid: prev.invalid 
                  }))
                  
                  playSound(true)
                  
                  toast.success(`✓ Valid - ${result.name}`, { 
                    id: toastId, 
                    duration: 5000,
                    style: {
                      background: '#10b981',
                      color: '#fff'
                    }
                  })
                  
                  await fetch('/api/verify-ticket', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticketId: result.id })
                  })
                  
                  // Set cooldown after successful scan
                  setScanCooldown(3)
                } else {
                  const scanData = {
                    valid: false,
                    reason: result.reason || 'Unknown error',
                    time: new Date().toLocaleTimeString(),
                    timestamp: Date.now()
                  }
                  
                  setLastScan(scanData)
                  setScanHistory(prev => [scanData, ...prev].slice(0, 20))
                  setStats(prev => ({ 
                    total: prev.total + 1, 
                    valid: prev.valid, 
                    invalid: prev.invalid + 1 
                  }))
                  
                  playSound(false)
                  
                  toast.error(`✗ ${result.reason || 'Invalid'}`, { 
                    id: toastId, 
                    duration: 5000,
                    style: {
                      background: '#ef4444',
                      color: '#fff'
                    }
                  })
                  
                  // Set longer cooldown for invalid tickets (5 seconds)
                  setScanCooldown(5)
                }
              } catch (e) {
                toast.error('Verification failed', { id: toastId })
                // Set cooldown even on error
                setScanCooldown(3)
              }
            },
            (errorMessage: string) => {}
          )
        }
      } catch (err) {
        console.error('Scanner error:', err)
        toast.error('Failed to start camera')
      }
    }

    startScanner()

    return () => {
      if (html5QrCode) {
        try {
          html5QrCode.stop()
        } catch (e) {}
      }
    }
  }, [isAuthenticated, soundEnabled, scanning, playSound, scanCooldown])

  const handleStartScanning = async () => {
    try {
      await loadHtml5QrLib()
      setScanning(true)
      toast.success('Camera started. Ready to scan.')
    } catch (err) {
      toast.error('Camera library failed to load')
    }
  }

  const handleStopScanning = () => {
    setScanning(false)
    toast('Scanner stopped', { icon: '⏸️' })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Head>
          <title>Security Login - Verify</title>
        </Head>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-4"
        >
          <Card className="p-4 sm:p-8 bg-white/5 border-white/10">
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Security Access</h1>
                <p className="text-xs sm:text-base text-slate-400 mt-1 sm:mt-2">Enter credentials to verify tickets</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm text-slate-300 mb-1 block text-left">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    disabled={loading}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-slate-300 mb-1 block text-left">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    className="text-sm sm:text-base"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-sm sm:text-base"
                  isLoading={loading}
                >
                  Login
                </Button>
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Head>
        <title>Verify Tickets</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white break-words">Ticket Verification</h1>
              <p className="text-xs sm:text-sm text-slate-400">Scan QR codes to verify attendees</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              variant="ghost"
              className="px-2 sm:px-3 py-2 h-8 sm:h-auto"
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {scanning ? (
              <Button onClick={handleStopScanning} variant="outline" className="px-2 sm:px-3 py-2 h-8 sm:h-auto text-xs sm:text-base">
                <PauseCircle className="w-4 h-4 sm:mr-1" />
                <span className="hidden xs:inline">Stop Scan</span>
              </Button>
            ) : (
              <Button onClick={handleStartScanning} variant="primary" className="px-2 sm:px-3 py-2 h-8 sm:h-auto text-xs sm:text-base">
                <Camera className="w-4 h-4 sm:mr-1" />
                <span className="hidden xs:inline">Start Scan</span>
              </Button>
            )}
            <Button onClick={handleLogout} variant="ghost" className="px-2 sm:px-3 py-2 h-8 sm:h-auto text-xs sm:text-base">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden xs:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4 bg-white/5 border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] sm:text-sm">Total Scans</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</div>
              </div>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-violet-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-green-500/10 border-green-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-green-400 text-[10px] sm:text-sm">Valid</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-400">{stats.valid}</div>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-red-500/10 border-red-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-red-400 text-[10px] sm:text-sm">Invalid</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-400">{stats.invalid}</div>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 flex-shrink-0" />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Scanner */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">QR Scanner</h2>
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between mb-2 sm:mb-3 text-[10px] xs:text-xs sm:text-sm text-slate-400 gap-1 xs:gap-0">
                <span>Status: {scanning ? 'Camera active' : 'Tap Start to scan'}</span>
                <span className="text-slate-500">Hold steady for best results</span>
              </div>
              
              {/* Scan Cooldown Indicator */}
              {scanCooldown > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 p-2 sm:p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-amber-300">
                    Scanner paused for {scanCooldown} second{scanCooldown !== 1 ? 's' : ''} - Please wait
                  </span>
                </motion.div>
              )}
              
              <div className="rounded-xl overflow-hidden border-2 border-violet-500/30 bg-black">
                <div id="reader" style={{ width: '100%' }} />
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-3 sm:mt-4 text-center">
                Position QR code within the frame to scan
              </p>
              {!scanning && (
                <p className="text-amber-400 text-[10px] xs:text-xs text-center mt-1 sm:mt-2">Tap Start Scan to enable camera</p>
              )}
            </Card>

            {/* Manual Search */}
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Manual Ticket Search</h2>
              <div className="flex gap-2 sm:gap-3 flex-col xs:flex-row">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, name, or ID..."
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="text-sm sm:text-base"
                />
                <Button onClick={handleManualSearch} isLoading={loading} className="w-full xs:w-auto px-2 sm:px-4">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{searchResult.name}</div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        searchResult.used 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {searchResult.used ? 'Used' : 'Valid'}
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">{searchResult.email}</div>
                    <div className="text-slate-500 text-xs">Event: {searchResult.event_id || 'N/A'}</div>
                    {!searchResult.used && (
                      <Button 
                        onClick={() => handleManualCheckIn(searchResult.id)}
                        variant="primary"
                        className="w-full mt-2"
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Last Scan Result */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Last Scan</h2>
                <Button 
                  onClick={() => setShowHistory(!showHistory)}
                  variant="ghost"
                  className="px-2"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
              
              {!lastScan ? (
                <div className="text-center py-8 text-slate-400">
                  <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Waiting for scan...</p>
                </div>
              ) : lastScan.valid ? (
                <motion.div
                  key={lastScan.timestamp}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-green-400 font-bold text-sm">VALID</div>
                      <div className="text-slate-400 text-xs">{lastScan.time}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white font-medium break-words">{lastScan.name}</span>
                    </div>
                    <div className="text-slate-400 text-xs pl-6 break-all">{lastScan.email}</div>
                    <div className="text-slate-500 text-xs pl-6">Event: {lastScan.event || 'N/A'}</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={lastScan.timestamp}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-red-400 font-bold text-sm">INVALID</div>
                      <div className="text-slate-400 text-xs">{lastScan.time}</div>
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    <strong>Reason:</strong> {lastScan.reason}
                  </div>
                </motion.div>
              )}
            </Card>

            {/* Scan History */}
            {showHistory && scanHistory.length > 0 && (
              <Card className="p-6 bg-white/5 border-white/10 max-h-96 overflow-y-auto">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Scans
                </h2>
                <div className="space-y-2">
                  {scanHistory.map((scan, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded text-xs ${
                        scan.valid 
                          ? 'bg-green-500/10 border-l-2 border-green-500' 
                          : 'bg-red-500/10 border-l-2 border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={scan.valid ? 'text-green-400' : 'text-red-400'}>
                          {scan.valid ? scan.name : scan.reason}
                        </span>
                        <span className="text-slate-500">{scan.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
