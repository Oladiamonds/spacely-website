const pillars = [
  {
    tag: 'Payment Protection',
    title: 'Your ₦ Never Disappears.',
    body: [
      'We use Paystack escrow — Nigeria\'s most trusted payment infrastructure, processing over ₦1 trillion monthly. Your money is held securely from the moment you pay.',
      'Cancel 12+ hours before your session: 100% full refund. Session ends: funds transferred same-day. No waiting. No excuses.',
    ],
    points: [
      { icon: '🏦', text: 'Paystack escrow — ₦1T processed monthly' },
      { icon: '↩️', text: '100% refund if cancelled 12+ hours before' },
      { icon: '⚡', text: 'Space owners paid same-day (1–2 hours)' },
      { icon: '🔒', text: 'No one disappears with your money' },
    ],
    visual: (
      <div className="bg-[#1A0F08] rounded-2xl p-6 space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#8C7B6E] font-medium">How escrow works</p>
        {[
          { step: '1', label: 'You pay', sub: 'Paystack holds funds securely' },
          { step: '2', label: 'Session starts', sub: 'Funds released to space owner' },
          { step: '3', label: 'Session ends', sub: 'Transfer to owner\'s bank · same-day' },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#C4472B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {s.step}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{s.label}</p>
              <p className="text-white/50 text-xs">{s.sub}</p>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">Powered by Paystack · Bank-grade security</span>
        </div>
      </div>
    ),
  },
  {
    tag: 'Identity Verification',
    title: 'Everyone Is Who They Say They Are.',
    body: [
      'Every artisan is NIN-verified before their first booking. Every space owner is verified before listing. Real names. Real accountability.',
      'No anonymous bad actors. No "I don\'t know who damaged my equipment." You both know exactly who you\'re dealing with — and that changes everything.',
    ],
    points: [
      { icon: '🪪', text: 'NIN-verified artisans (via Prembly)' },
      { icon: '🏢', text: 'NIN or CAC-verified space owners' },
      { icon: '📱', text: 'Phone OTP — additional verification layer' },
      { icon: '🔐', text: 'Data encrypted · never shared with 3rd parties' },
    ],
    visual: (
      <div className="space-y-3">
        {[
          { initials: 'TA', name: 'Tola Adeyemi', role: 'Fashion Designer', badge: 'Artisan Verified', color: '#C4472B' },
          { initials: 'EO', name: 'Emeka Okafor', role: 'Studio Owner · Lekki', badge: 'Owner Verified', color: '#2D5016' },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#e8d5b5]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: p.color }}
            >
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A0F08] text-sm">{p.name}</p>
              <p className="text-xs text-[#8C7B6E]">{p.role}</p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: p.color }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {p.badge}
            </div>
          </div>
        ))}
        <p className="text-xs text-[#8C7B6E] text-center pt-1">
          Mutual verification. Both sides accountable.
        </p>
      </div>
    ),
  },
  {
    tag: 'Equipment Protection',
    title: 'What You See Is What You Get.',
    body: [
      'Space owners submit verified photo proof of every listed piece of equipment before going live. You see exactly what you\'re booking — no surprises.',
      'Artisans: if equipment is missing or broken on arrival, cancel and get a full refund. Space owners: damage deposits protect your investment throughout every booking.',
    ],
    points: [
      { icon: '📸', text: 'Photo-verified equipment lists' },
      { icon: '💰', text: 'Damage deposit held in escrow' },
      { icon: '⏱️', text: 'Dispute resolution within 48 hours' },
      { icon: '🚫', text: 'Missing equipment = instant full refund' },
    ],
    visual: (
      <div className="bg-[#FFFDF7] rounded-2xl p-5 border border-[#e8d5b5] space-y-3">
        <p className="text-xs font-semibold text-[#5a5250] uppercase tracking-wide">Equipment checklist</p>
        {[
          { item: 'Sony A7 III + 50mm f/1.8 lens', verified: true },
          { item: 'Godox AD400 Pro strobe × 2', verified: true },
          { item: 'Savage Pure White 9×20ft seamless', verified: true },
          { item: 'Manfrotto stands × 4', verified: true },
          { item: 'Reflector 5-in-1 kit', verified: true },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-[#f0e8d5] last:border-0">
            <div className="w-5 h-5 rounded-full bg-[#e8f1e7] flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-[#2D5016]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-[#1A0F08]">{e.item}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-2 h-2 rounded-full bg-[#2D5016]" />
          <span className="text-xs text-[#2D5016] font-semibold">SpaceLY Equipment Verified</span>
        </div>
      </div>
    ),
  },
]

export default function TrustSection() {
  return (
    <section id="trust" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="section-label mb-4">Trust & Safety</p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-[#1A0F08]"
            style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}
          >
            Ev
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>ery</em>
            one&apos;s V
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>er</em>
            ified.<br />
            That&apos;s Why It W
            <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
              orks
            </em>
            .
          </h2>
          <p className="text-[#8C7B6E] text-lg mt-4 max-w-xl mx-auto">
            Trust isn&apos;t a feature — it&apos;s the foundation. Every layer of SpaceLY
            is built to answer the question: &ldquo;But how do I know I can trust them?&rdquo;
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="space-y-20">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className={`grid lg:grid-cols-2 gap-10 items-center ${
                i % 2 === 1 ? 'lg:[direction:rtl]' : ''
              }`}
            >
              <div className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                <p className="section-label mb-4">{pillar.tag}</p>
                <h3
                  className="text-3xl sm:text-4xl font-bold text-[#1A0F08] mb-5 leading-snug"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {pillar.title}
                </h3>
                <div className="space-y-3 mb-7">
                  {pillar.body.map((p, j) => (
                    <p key={j} className="text-[#8C7B6E] leading-relaxed">{p}</p>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {pillar.points.map((pt, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-[#1A0F08]">
                      <span>{pt.icon}</span>
                      <span>{pt.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                {pillar.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
