const stats = [
  { value: '1,200+', label: 'Artisans on Waitlist' },
  { value: '50',     label: 'Spaces at Launch' },
  { value: '4.8★',  label: 'Average Rating' },
  { value: '₦0',    label: 'Lost to Fraud' },
  { value: '90s',   label: 'Booking Time' },
  { value: 'Lagos', label: 'First Market' },
]

const testimonials = [
  {
    initials: 'AO',
    name: 'Adaeze O.',
    handle: '@adaeze.creates',
    role: 'Fashion Designer · Surulere',
    color: '#C4472B',
    stars: 5,
    quote: '"I\'ve been renting spaces informally for 3 years. SpaceLY is the first time I knew exactly what I was getting — and my payment was protected from the start. The WhatsApp card was chef\'s kiss."',
  },
  {
    initials: 'KB',
    name: 'Kunle B.',
    handle: '@kunle.photography',
    role: 'Photographer · Lekki',
    color: '#2D5016',
    stars: 5,
    quote: '"Lekki photography studio. Godox strobes, verified ring light. Exactly as listed. My client was impressed with the space. I\'ll never book a studio any other way."',
  },
  {
    initials: 'TF',
    name: 'Titi F.',
    handle: '@titibakes.ng',
    role: 'Pastry Chef · Ikeja',
    color: '#8C7B6E',
    stars: 5,
    quote: '"Running a popup business from borrowed kitchens was stressful. SpaceLY gave me a legit commercial kitchen for 4 hours — commercial oven, cold storage, everything. Zero drama."',
  },
]

export default function SocialProof() {
  const doubled = [...stats, ...stats]

  return (
    <section className="py-0 bg-[#F5EDD6]">

      {/* Stats Ticker — terracotta band */}
      <div className="bg-[#C4472B] py-4 overflow-hidden">
        <div className="flex animate-marquee">
          {doubled.map((s, i) => (
            <div key={i} className="flex items-center gap-2 mx-8 flex-shrink-0">
              <span className="text-white font-bold text-lg">{s.value}</span>
              <span className="text-white/60 text-sm">{s.label}</span>
              <span className="text-white/30 mx-4">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-4">What They&apos;re Saying</p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#1A0F08]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              R
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>eal</em>
              {' '}artisans.{' '}
              R
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>eal</em>
              {' '}bookings.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#e8d5b5] flex flex-col hover:shadow-md transition-shadow">

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[#5a5250] text-sm leading-relaxed flex-1 italic">{t.quote}</p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#f0e8d5]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1A0F08] text-sm">{t.name}</p>
                    <p className="text-xs text-[#8C7B6E] truncate">{t.role}</p>
                  </div>
                  <span className="text-xs text-[#C4472B] font-medium ml-auto flex-shrink-0">{t.handle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
