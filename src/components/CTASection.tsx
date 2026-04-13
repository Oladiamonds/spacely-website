const portraits = [
  { initials: 'TA', color: '#C4472B', role: '📸', pos: 'top-[8%] left-[5%]',   anim: 'animate-float-1', delay: '0s' },
  { initials: 'EO', color: '#2D5016', role: '🪡', pos: 'top-[12%] right-[8%]',  anim: 'animate-float-2', delay: '0.8s' },
  { initials: 'KB', color: '#8C7B6E', role: '🎵', pos: 'top-[40%] left-[2%]',  anim: 'animate-float-3', delay: '1.4s' },
  { initials: 'AF', color: '#b03f25', role: '🍰', pos: 'top-[38%] right-[3%]', anim: 'animate-float-4', delay: '0.4s' },
  { initials: 'MO', color: '#3D6B20', role: '💄', pos: 'bottom-[15%] left-[6%]',  anim: 'animate-float-5', delay: '1.8s' },
  { initials: 'TF', color: '#5a5250', role: '🎨', pos: 'bottom-[12%] right-[6%]', anim: 'animate-float-6', delay: '1s' },
]

export default function CTASection() {
  return (
    <section id="waitlist" className="relative py-32 bg-[#F5EDD6] overflow-hidden min-h-[600px]">

      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(ellipse at center, #C4472B18 0%, transparent 65%)' }}
      />

      {/* Floating portrait cards */}
      {portraits.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.pos} ${p.anim} hidden md:block`}
          style={{ animationDelay: p.delay }}
        >
          <div className="relative group cursor-default">
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl shadow-xl border-2 border-white flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: p.color }}
            >
              {p.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">
              {p.role}
            </div>
          </div>
        </div>
      ))}

      {/* Center Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 text-center">

        {/* Logo mark */}
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-8 border border-[#e8d5b5]">
          <div className="w-8 h-8 rounded-full bg-[#C4472B] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="white" opacity="0.9"/>
              <path d="M9 21V13h6v8" stroke="#C4472B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h2
          className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-[#1A0F08] mb-5"
          style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}
        >
          R
          <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>eady</em>
          {' '}to F
          <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
            ind
          </em>
          {' '}Your Sp
          <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
            ace
          </em>
          ?
        </h2>

        <p className="text-[#8C7B6E] text-lg leading-relaxed mb-10">
          Join 1,200+ Lagos creatives already on the waitlist.
          Be first to book when we launch.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a href="#" className="btn-primary text-base px-8 py-4">
            I&apos;m an Artisan — Reserve My Spot
          </a>
          <a href="#" className="btn-forest text-base px-8 py-4">
            I Have a Space to List →
          </a>
        </div>

        {/* Avatar row */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[
              { bg: '#C4472B', l: 'T' },
              { bg: '#2D5016', l: 'E' },
              { bg: '#8C7B6E', l: 'K' },
              { bg: '#b03f25', l: 'A' },
              { bg: '#3D6B20', l: 'M' },
            ].map((a, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#F5EDD6] flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: a.bg }}
              >
                {a.l}
              </div>
            ))}
          </div>
          <p className="text-sm text-[#8C7B6E]">
            <span className="font-semibold text-[#1A0F08]">1,200+ creatives</span> already signed up for early access
          </p>
        </div>
      </div>
    </section>
  )
}
