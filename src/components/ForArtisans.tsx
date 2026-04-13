'use client'

import { useState, useEffect } from 'react'

const RATES: Record<string, number> = {
  photography: 28000,
  fashion: 15000,
  recording: 35000,
  kitchen: 18000,
}

const SPACE_TYPES = [
  { key: 'photography', emoji: '📸', label: 'Photography' },
  { key: 'fashion',     emoji: '🪡', label: 'Fashion'     },
  { key: 'recording',  emoji: '🎵', label: 'Recording'   },
  { key: 'kitchen',    emoji: '🍰', label: 'Kitchen'      },
]

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG')
}

function EarningsCalculator() {
  const [spaceType, setSpaceType] = useState('photography')
  const [idleHours, setIdleHours] = useState(6)
  const [customRate, setCustomRate] = useState('')

  const suggestedRate = RATES[spaceType]
  const rate = customRate ? parseInt(customRate.replace(/[^0-9]/g, '')) || suggestedRate : suggestedRate
  const monthlyGross = Math.round(rate * idleHours * 22 * 0.5)
  const afterComm = Math.round(monthlyGross * 0.85)
  const annual = afterComm * 12

  return (
    <div className="gradient-border rounded-3xl p-7 bg-white space-y-7">
      <div>
        <p className="section-label mb-3">Earnings Calculator</p>
        <h3 className="text-2xl font-bold text-[#1A0F08]">How much can you make?</h3>
        <p className="text-sm text-[#8C7B6E] mt-1">Based on Lagos market rates · 50% occupancy estimate</p>
      </div>

      {/* Space Type */}
      <div>
        <label className="text-sm font-medium text-[#1A0F08] mb-3 block">What type of space do you have?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPACE_TYPES.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => { setSpaceType(key); setCustomRate('') }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                spaceType === key
                  ? 'bg-[#C4472B] text-white border-[#C4472B] shadow-sm'
                  : 'bg-[#FAFAF8] text-[#5a5250] border-[#e8d5b5] hover:border-[#C4472B]/40'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Idle Hours Slider */}
      <div>
        <label className="text-sm font-medium text-[#1A0F08] mb-2 flex justify-between">
          <span>How many idle hours per day?</span>
          <span className="text-[#C4472B] font-bold">{idleHours} hrs</span>
        </label>
        <input
          type="range" min={1} max={12} value={idleHours}
          onChange={e => setIdleHours(+e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #C4472B ${((idleHours - 1) / 11) * 100}%, #e8d5b5 ${((idleHours - 1) / 11) * 100}%)`
          }}
        />
        <div className="flex justify-between text-xs text-[#8C7B6E] mt-1">
          <span>1 hr</span><span>6 hrs</span><span>12 hrs</span>
        </div>
      </div>

      {/* Rate Input */}
      <div>
        <label className="text-sm font-medium text-[#1A0F08] mb-2 block">
          Your hourly rate{' '}
          <span className="text-[#8C7B6E] font-normal">(market avg: {formatNaira(suggestedRate)}/hr)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7B6E] font-medium">₦</span>
          <input
            type="text"
            value={customRate}
            onChange={e => setCustomRate(e.target.value)}
            placeholder={suggestedRate.toLocaleString()}
            className="w-full pl-8 pr-4 py-3 bg-[#FAFAF8] border border-[#e8d5b5] rounded-xl text-[#1A0F08] text-sm focus:outline-none focus:border-[#C4472B] transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-[#1A0F08] rounded-2xl p-6 space-y-3 text-white">
        <p className="text-xs uppercase tracking-widest text-[#8C7B6E] font-medium">Your Estimated Earnings</p>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-white/70">At 50% utilisation</span>
            <span className="text-xl font-bold text-white">{formatNaira(monthlyGross)}<span className="text-sm font-normal text-white/50">/mo</span></span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-white/70">After SpaceLY 15%</span>
            <span className="text-2xl font-bold text-[#C4472B]">{formatNaira(afterComm)}<span className="text-sm font-normal text-white/50">/mo</span></span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
            <span className="text-sm text-white/70">Annual idle income</span>
            <span className="text-lg font-semibold text-white/90">{formatNaira(annual)}/yr</span>
          </div>
        </div>
        <p className="text-xs text-white/40 pt-1">Top 20% of owners earn ₦750K+/month.</p>
      </div>

      <a href="#waitlist" className="btn-primary w-full justify-center text-base py-4">
        List My Space — It&apos;s Free →
      </a>
    </div>
  )
}

const artisanFeatures = [
  {
    emoji: '🔍',
    title: 'Search Like Instagram, Not Like Google',
    desc: 'Visual-first results. Filter by equipment, price, and availability. What you see is exactly what you book.',
  },
  {
    emoji: '📲',
    title: 'Your Booking Card is Already on WhatsApp',
    desc: 'Every confirmed booking auto-generates a beautiful WhatsApp card. Share to your status, show your clients where you work.',
  },
  {
    emoji: '🛡️',
    title: '₦Payment Protected. Always.',
    desc: 'Paystack escrow holds your money until your session starts. Cancel 12+ hours before: 100% refund. No drama.',
  },
  {
    emoji: '✅',
    title: 'Equipment Verified Before You Book',
    desc: 'Space owners submit photo proof of every listed tool. Arrive confident. If anything is missing — instant refund.',
  },
]

const stats = [
  { value: '1,200+', label: 'Artisans on Waitlist' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '₦25K', label: 'Avg. Booking Value' },
  { value: '90s', label: 'Booking Time' },
]

export default function ForArtisans() {
  const [tab, setTab] = useState<'artisans' | 'owners'>('artisans')

  useEffect(() => {
    const switchOnHash = () => {
      if (window.location.hash === '#space-owners') {
        setTab('owners')
      }
    }
    switchOnHash()
    window.addEventListener('hashchange', switchOnHash)
    return () => window.removeEventListener('hashchange', switchOnHash)
  }, [])

  return (
    <section id="artisans" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-[#1A0F08] mb-6"
            style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}
          >
            F
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>or</em>
            {' '}every
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>one</em>
            {' '}who c
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>reat</em>
            es
          </h2>

          {/* Tab Toggle */}
          <div className="inline-flex bg-[#F5EDD6] rounded-full p-1 border border-[#e8d5b5]">
            <button
              onClick={() => setTab('artisans')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'artisans'
                  ? 'bg-[#C4472B] text-white shadow-sm'
                  : 'text-[#5a5250] hover:text-[#1A0F08]'
              }`}
            >
              Artisans
            </button>
            <button
              onClick={() => setTab('owners')}
              id="space-owners"
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                tab === 'owners'
                  ? 'bg-[#2D5016] text-white shadow-sm'
                  : 'text-[#5a5250] hover:text-[#1A0F08]'
              }`}
            >
              Space Owners
            </button>
          </div>
        </div>

        {/* Artisans Tab */}
        {tab === 'artisans' && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* 4 Feature Tiles */}
            {artisanFeatures.map((feat, i) => (
              <div key={i} className="flex gap-4 p-6 bg-[#FFFDF7] rounded-2xl border border-[#e8d5b5] hover:border-[#C4472B]/30 transition-colors">
                <span className="text-3xl flex-shrink-0">{feat.emoji}</span>
                <div>
                  <h3 className="font-semibold text-[#1A0F08] mb-1.5">{feat.title}</h3>
                  <p className="text-sm text-[#8C7B6E] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}

            {/* Stats Strip — spans full width */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              {stats.map((s, i) => (
                <div key={i} className="text-center py-6 bg-[#F5EDD6] rounded-2xl border border-[#e8d5b5]">
                  <p className="text-3xl font-bold text-[#C4472B]">{s.value}</p>
                  <p className="text-xs text-[#8C7B6E] mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="md:col-span-2 text-center">
              <a href="#waitlist" className="btn-primary text-base px-10 py-4 inline-flex">
                Join as an Artisan →
              </a>
            </div>
          </div>
        )}

        {/* Space Owners Tab */}
        {tab === 'owners' && (
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <div>
                <p className="section-label mb-3">For Space Owners</p>
                <h3 className="text-3xl sm:text-4xl font-bold text-[#1A0F08] leading-snug">
                  Turn your idle space into{' '}
                  <span className="text-[#2D5016]">₦500K/month.</span>
                </h3>
                <p className="text-[#8C7B6E] mt-4 leading-relaxed">
                  Your studio sits empty for hours every day. Lagos&apos;s 4.2M creative workers
                  need exactly what you have. SpaceLY connects you — and you keep 85% of every booking.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: '⚡', text: 'List your space in under 20 minutes' },
                  { icon: '🛡️', text: 'All artisans are NIN-verified before booking' },
                  { icon: '💰', text: 'Get paid same-day via Paystack — no delays' },
                  { icon: '📅', text: 'You control your availability, always' },
                  { icon: '🎯', text: '0% commission for your first 6 months' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[#1A0F08]">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <EarningsCalculator />
          </div>
        )}
      </div>
    </section>
  )
}
