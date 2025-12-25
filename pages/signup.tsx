import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabaseClient'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Shield, ArrowRight } from 'lucide-react'

export default function SignUpPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            })
            if (error) throw error
            toast.success('Account created! Please check your email to confirm.')
        } catch (e: any) {
            toast.error(e.message || 'Signup failed')
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
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-white">Create Account</h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">Join Planora Tickets to host or attend.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                    <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Elon Musk" className="text-sm sm:text-base" />
                    <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="text-sm sm:text-base" />
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="text-sm sm:text-base" />

                    <Button isLoading={loading} className="w-full text-sm sm:text-base" variant="cosmic">
                        Sign Up <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </form>

                <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-slate-400">
                    Already have an account? <Link href="/login" className="text-primary hover:text-primary/80 font-medium">Sign In</Link>
                </p>
            </Card>
        </div>
    )
}
