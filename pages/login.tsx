import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabaseClient'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Mail, Key, Shield, ArrowRight, Chrome } from 'lucide-react'

type LoginMethod = 'password' | 'passwordless'
type PasswordlessType = 'magic_link' | 'otp'

export default function LoginPage() {
    const [method, setMethod] = useState<LoginMethod>('password')
    const [passwordlessType, setPasswordlessType] = useState<PasswordlessType | null>(null)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        let error: any

        try {
            if (method === 'password') {
                const res = await supabase.auth.signInWithPassword({ email, password })
                error = res.error
            } else if (passwordlessType === 'magic_link') {
                const res = await supabase.auth.signInWithOtp({ email })
                error = res.error
                if (!error) toast.success('Check your email for the magic link!')
            } else if (passwordlessType === 'otp') {
                // OTP flow usually requires a second step to enter the code, 
                // for simplicity we'll trigger the OTP send here
                const res = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
                error = res.error
                if (!error) toast.success('Verification code sent!')
            }

            if (error) throw error
            if (method === 'password' && !error) {
                toast.success('Signed in successfully!')
                window.location.href = '/dashboard' // Redirect to dashboard
            }
        } catch (e: any) {
            toast.error(e.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-4 sm:p-8 glass-card">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-xl bg-primary/20 text-primary mb-3 sm:mb-4">
                        <Shield className="h-5 sm:h-6 w-5 sm:w-6" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-white">Welcome to Planora Tickets!</h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">Sign in to manage or attend events</p>
                </div>

                {/* Method Toggle */}
                <div className="flex p-1 bg-white/5 rounded-xl mb-4 sm:mb-6">
                    <button
                        onClick={() => { setMethod('password'); setPasswordlessType(null) }}
                        className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${method === 'password' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Password
                    </button>
                    <button
                        onClick={() => setMethod('passwordless')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${method === 'passwordless' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Passwordless
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {method === 'password' && (
                        <motion.form
                            key="password-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleLogin}
                            className="space-y-3 sm:space-y-4"
                        >
                            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="text-sm sm:text-base" />
                            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="text-sm sm:text-base" />
                            <Button isLoading={loading} className="w-full text-sm sm:text-base" variant="cosmic">Sign In <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        </motion.form>
                    )}

                    {method === 'passwordless' && !passwordlessType && (
                        <motion.div
                            key="passwordless-options"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-3"
                        >
                            <button onClick={() => setPasswordlessType('magic_link')} className="w-full group relative flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-primary/50 text-left">
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Magic Link</div>
                                    <div className="text-xs text-slate-400">Get a secure link sent to your email</div>
                                </div>
                            </button>
                            <button onClick={() => setPasswordlessType('otp')} className="w-full group relative flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-primary/50 text-left">
                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Verification Code</div>
                                    <div className="text-xs text-slate-400">Get a 6-digit code sent to your email</div>
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {method === 'passwordless' && passwordlessType && (
                        <motion.form
                            key="passwordless-input"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleLogin}
                            className="space-y-4"
                        >
                            <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                                <button type="button" onClick={() => setPasswordlessType(null)} className="hover:text-primary transition-colors">← Back</button>
                                <span>Logging in via {passwordlessType === 'magic_link' ? 'Magic Link' : 'OTP'}</span>
                            </div>
                            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                            <Button isLoading={loading} className="w-full" variant="cosmic">Send {passwordlessType === 'magic_link' ? 'Link' : 'Code'}</Button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-slate-500 uppercase font-medium">Or</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <Button variant="outline" className="w-full relative bg-white text-black hover:bg-slate-200 border-none">
                    <Chrome className="mr-2 w-4 h-4" /> Continue with Google
                </Button>

                <p className="mt-8 text-center text-sm text-slate-400">
                    New here? <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">Sign Up</Link>
                </p>
            </Card>
        </div>
    )
}
