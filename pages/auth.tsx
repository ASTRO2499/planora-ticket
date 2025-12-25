import { useState } from 'react'
import supabase from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { toast } from 'react-hot-toast'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail(e: any) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) toast.error(error.message)
    else toast.success('Check your email for the magic link!')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="p-4 sm:p-8 w-full max-w-md space-y-4 sm:space-y-6 glass-card">
        <div className="text-center space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Sign In</h1>
          <p className="text-xs sm:text-sm text-slate-400">Access your tickets via magic link.</p>
        </div>

        <form onSubmit={signInWithEmail} className="space-y-3 sm:space-y-4">
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            label="Email Address"
            className="text-sm sm:text-base"
          />
          <Button isLoading={loading} className="w-full text-sm sm:text-base" variant="cosmic">
            Send Login Link
          </Button>
        </form>
      </Card>
    </div>
  )
}
