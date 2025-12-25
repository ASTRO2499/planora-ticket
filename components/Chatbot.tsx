import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader, Zap, Ticket, Calendar, HelpCircle } from 'lucide-react'
import AstroMascot from './AstroMascot'

type Message = {
  id: string
  role: 'user' | 'bot'
  text: string
  timestamp: Date
  isTyping?: boolean
}

const MASCOT_GREETING = "Hi! I'm ASTRO, your event assistant! 🎉 Ask me anything about AKCOMSOC 2025, tickets, or registration!"

type Intent = { id: string; keywords: string[]; response: (msg: string) => string }

const INTENTS: Intent[] = [
  {
    id: 'akcomsoc',
    keywords: ['akcomsoc', 'akcom', 'soc25', '2025', 'event'],
    response: () => 'AKCOMSOC 2025 focuses on 5G networks and Communication IoT. Fee is ₹1000. Register at /akcomsoc-2025.'
  },
  {
    id: 'pricing',
    keywords: ['price', 'cost', 'fee', 'rupees', '₹', 'rs', 'charge'],
    response: () => 'Registration fee is ₹1000. Discounts may apply for IEEE members. Payment via Razorpay.'
  },
  {
    id: 'payment',
    keywords: ['payment', 'razorpay', 'pay', 'upi', 'card', 'refund'],
    response: () => 'Payments are processed via Razorpay securely. After payment, your ticket with QR code is emailed instantly.'
  },
  {
    id: 'ticket',
    keywords: ['ticket', 'download', 'pdf', 'qr', 'entry pass', 'pass'],
    response: () => 'Find tickets at /my-tickets using your email, or use the emailed link. PDF download & QR code included.'
  },
  {
    id: 'registration',
    keywords: ['register', 'registration', 'sign up', 'enroll', 'apply'],
    response: () => 'Visit /akcomsoc-2025 to register! Fill in your details, make payment, and receive your entry pass instantly.'
  },
  {
    id: 'support',
    keywords: ['contact', 'help', 'support', 'issue', 'problem', 'error'],
    response: () => 'We\'re here to help! Email support@planora.app or describe your issue here for guidance.'
  },
  {
    id: 'schedule',
    keywords: ['when', 'date', 'time', 'schedule', 'duration'],
    response: () => 'Event schedule details will be shared with registered attendees. Check your email for updates!'
  },
  {
    id: 'venue',
    keywords: ['location', 'venue', 'where', 'address', 'place'],
    response: () => 'Venue details will be shared with registrants via email. Register to receive location updates.'
  },
  {
    id: 'ieee',
    keywords: ['ieee', 'membership', 'ieee member'],
    response: () => 'IEEE members can provide their membership number during registration for verification and benefits.'
  },
  {
    id: 'verification',
    keywords: ['verify', 'verification', 'email verify', 'otp'],
    response: () => 'Use /my-tickets to verify your email with OTP. You\'ll get instant access to all your tickets!'
  }
]

const QUICK_ACTIONS = [
  { label: 'Register Now', icon: Zap, action: () => window.location.href = '/akcomsoc-2025' },
  { label: 'View Tickets', icon: Ticket, action: () => window.location.href = '/my-tickets' },
  { label: 'Event Details', icon: Calendar, action: () => 'Tell me more about AKCOMSOC 2025' },
  { label: 'Need Help?', icon: HelpCircle, action: () => 'I need support with my registration' }
]

const FOLLOW_UPS: Record<string, string[]> = {
  akcomsoc: ['What\'s the fee?', 'How do I register?', 'What\'s included?'],
  pricing: ['Any student discount?', 'Is GST included?', 'Payment methods?'],
  payment: ['Is UPI supported?', 'Can I pay later?', 'Are refunds available?'],
  ticket: ['Where to find my ticket?', 'Can I download PDF?', 'Need QR code?'],
  registration: ['Help with form?', 'Payment issues?', 'Edit details?'],
  support: ['Report a bug', 'Contact support email', 'Chat with team'],
  schedule: ['When does it start?', 'How long is it?', 'Include lunch?'],
  venue: ['Is parking available?', 'Public transport?', 'Exact address?'],
  ieee: ['How to add IEEE ID?', 'Member benefits?', 'Verification?'],
  verification: ['OTP not received?', 'Change email?', 'Resend OTP?']
}

function scoreIntent(msg: string, intent: Intent): number {
  const text = msg.toLowerCase()
  return intent.keywords.reduce((score, kw) => score + (text.includes(kw) ? 1 : 0), 0)
}

function getBotResponse(userMsg: string): { text: string; followUps?: string[] } {
  let best: { intent: Intent; score: number } | null = null
  for (const intent of INTENTS) {
    const s = scoreIntent(userMsg, intent)
    if (!best || s > best.score) best = { intent, score: s }
  }
  if (best && best.score > 0) {
    const id = best.intent.id
    return { text: best.intent.response(userMsg), followUps: FOLLOW_UPS[id] }
  }
  return {
    text: "I'm here to help! Ask about AKCOMSOC 2025, registration, tickets, pricing, payment, venue, or schedule. Or try quick actions below!",
    followUps: ['Event details', 'How to register', 'View my tickets']
  }
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'bot', text: MASCOT_GREETING, timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatbot_history')
    if (saved && isOpen) {
      try {
        const parsed = JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
        setMessages(parsed)
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [isOpen])

  // Save chat history
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatbot_history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    if (!textOverride) setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      if (res.ok) {
        const data = await res.json()
        setIsTyping(false)
        const botReply: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: data.text, timestamp: new Date() }
        setMessages(prev => [...prev, botReply])
        setIsLoading(false)
        return
      }
    } catch (err) {
      console.error('Chat API error:', err)
    }

    // Fallback to local intents
    const resp = getBotResponse(text)
    setIsTyping(false)
    const botReply: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: resp.text, timestamp: new Date() }
    setMessages(prev => [...prev, botReply])

    if (resp.followUps?.length) {
      const followUpMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'bot',
        text: 'Quick suggestions:',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, followUpMsg])
    }

    setIsLoading(false)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-full sm:w-96 max-w-[calc(100vw-2rem)] h-[500px] sm:h-[600px] bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <AstroMascot />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-xs sm:text-sm">ASTRO</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Event Assistant</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-white/10'
                    }`}
                  >
                    {msg.text}
                    <div className="text-[10px] opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3 bg-slate-800 rounded-xl w-fit">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-violet-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {!isLoading && messages.length === 1 && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-white/10 grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (typeof action.action === 'function' && action.action.toString().includes('window.location')) {
                          action.action()
                        } else if (typeof action.action === 'string') {
                          sendMessage(action.action)
                        } else {
                          action.action()
                        }
                      }}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg text-xs sm:text-sm text-violet-200 transition"
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{action.label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask ASTRO..."
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs sm:text-sm disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="p-2 sm:p-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition z-40"
        title="Chat with ASTRO"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  )
}
