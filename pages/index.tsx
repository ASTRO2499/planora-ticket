import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Play, Calendar, Users, BarChart } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Hero Section */}
            <section className="relative pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 text-center overflow-hidden">
                <motion.div 
                    className="fixed top-0 left-0 -z-10 w-screen h-screen pointer-events-none"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary via-transparent to-secondary opacity-25 blur-3xl" />
                </motion.div>

                <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-xs sm:text-sm font-semibold tracking-wide text-primary uppercase"
                    >
                        Host Your Events With Planora Tickets
                    </motion.h2>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white leading-tight"
                    >
                        Plan. Publish. <motion.span 
                            className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"
                            animate={{
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{ backgroundSize: '200% 200%' }}
                        >
                            Engage.
                        </motion.span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
                    >
                        When planning gets effortless, great events happen. Planora Tickets has you covered with powerful tools to host, manage, and execute memorable experiences seamlessly.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-6 sm:pt-8"
                    >
                        <Link href="/host">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                            >
                                <Button variant="cosmic" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">Host Now <ArrowRight className="ml-2" /></Button>
                            </motion.div>
                        </Link>
                        <Link href="/events">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto"
                            >
                                <Button variant="outline" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto">Explore Events</Button>
                            </motion.div>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="py-8 sm:py-12 border-y border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
                    {[
                        { label: 'Commission', value: '100%' },
                        { label: 'Tickets Sold', value: '10k+' },
                        { label: 'Active Users', value: '15k+' },
                        { label: 'Events Hosted', value: '90+' },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <motion.div 
                                className="text-3xl font-display font-bold text-white"
                                whileHover={{ scale: 1.1, color: '#8B5CF6' }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {stat.value}
                            </motion.div>
                            <div className="text-sm text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 sm:py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div 
                    className="mb-12 sm:mb-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl sm:text-3xl font-display font-bold">Everything you need</h2>
                    <p className="text-slate-400 mt-2 text-sm sm:text-base">Powerful features for modern event organizers.</p>
                </motion.div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {[
                        { title: 'Easy Embeddable', desc: 'Registration Widget for your own site.', icon: Calendar },
                        { title: 'Smart Discovery', desc: 'Get your event in front of thousands.', icon: Users },
                        { title: 'Built-In Certificates', desc: 'Auto-generate certificates for attendees.', icon: Check },
                        { title: 'Customizable Page', desc: 'Stunning event pages that convert.', icon: ArrowRight },
                        { title: 'Automated Alerts', desc: 'WhatsApp & Email reminders included.', icon: Play },
                        { title: 'Real-time Analytics', desc: 'Track sales and check-ins live.', icon: BarChart },
                    ].map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ y: -8 }}
                        >
                            <Card className="p-8 bg-surface hover:bg-surface-hover glass-card h-full" hoverEffect>
                                <motion.div 
                                    className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6"
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <feat.icon className="w-6 h-6" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="py-16 sm:py-20 md:py-24 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <motion.h2 
                        className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-center mb-12 sm:mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Simple Pricing
                    </motion.h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
                        {/* Free */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ y: -10 }}
                        >
                            <Card className="p-8 border-white/10 bg-surface h-full">
                                <h3 className="text-xl font-bold text-white">Free Plan</h3>
                                <p className="text-sm text-slate-400 py-4">Perfect for small community events</p>
                                <div className="text-4xl font-bold text-white mb-6">₹0</div>
                                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                                    <motion.li 
                                        className="flex gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Check className="w-4 h-4 text-green-400" /> up to 300 attendees
                                    </motion.li>
                                    <motion.li 
                                        className="flex gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Check className="w-4 h-4 text-green-400" /> Basic event setup
                                    </motion.li>
                                    <motion.li 
                                        className="flex gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Check className="w-4 h-4 text-green-400" /> Email notifications
                                    </motion.li>
                                </ul>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="outline" className="w-full">Get Started</Button>
                                </motion.div>
                            </Card>
                        </motion.div>

                        {/* Standard - Featured */}
                        <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                        >
                            <motion.div 
                                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-secondary blur-lg opacity-40"
                                animate={{
                                    opacity: [0.4, 0.6, 0.4],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <Card className="relative p-8 border-primary/50 bg-black/40 h-full">
                                <motion.div 
                                    className="absolute top-0 right-0 bg-primary text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                >
                                    POPULAR
                                </motion.div>
                                <h3 className="text-xl font-bold text-white">Standard Plan</h3>
                                <p className="text-sm text-slate-400 py-4">Essential tools for growing events</p>
                                <div className="text-4xl font-bold text-white mb-6">4% <span className="text-lg font-normal text-slate-400">/ ticket</span></div>
                                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                                    {['Everything in Free', 'Paid ticket support', 'Custom ticket styles', 'Attendee profiles'].map((item, idx) => (
                                        <motion.li 
                                            key={idx}
                                            className="flex gap-2"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 + idx * 0.1 }}
                                        >
                                            <Check className="w-4 h-4 text-green-400" /> {item}
                                        </motion.li>
                                    ))}
                                </ul>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="cosmic" className="w-full">Start Hosting</Button>
                                </motion.div>
                            </Card>
                        </motion.div>

                        {/* Org */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            whileHover={{ y: -10 }}
                        >
                            <Card className="p-8 border-white/10 bg-surface h-full">
                                <h3 className="text-xl font-bold text-white">Organisation</h3>
                                <p className="text-sm text-slate-400 py-4">Centralized control for teams</p>
                                <div className="text-4xl font-bold text-white mb-6">₹25k <span className="text-lg font-normal text-slate-400">/ year</span></div>
                                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                                    {['Multiple events', 'Team management', 'Advanced analytics'].map((item, idx) => (
                                        <motion.li 
                                            key={idx}
                                            className="flex gap-2"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 + idx * 0.1 }}
                                        >
                                            <Check className="w-4 h-4 text-green-400" /> {item}
                                        </motion.li>
                                    ))}
                                </ul>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="outline" className="w-full">Contact Sales</Button>
                                </motion.div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            <motion.footer 
                className="py-12 border-t border-white/10 text-center text-slate-500 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <p>© 2025 Planora Tickets — All Rights Reserved</p>
            </motion.footer>
        </div>
    )
}
