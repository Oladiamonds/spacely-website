const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: 'One Platform for Every Studio',
    body: 'No more DMs, no more "send me your location." Browse real spaces with real photos and real prices — all in one place.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Verified. Every Time.',
    body: 'Every artisan is NIN-verified. Every space is equipment-verified. Both sides are accountable — and that\'s what makes it work.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Book in 90 Seconds Flat',
    body: 'Search → Select → Pay → Confirmed. All via Paystack. Your WhatsApp booking card arrives instantly. No waiting, no back-and-forth.',
  },
]

export default function WhySpaceLY() {
  return (
    <section className="py-24 bg-[#F5EDD6]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Header — ISO Meet "Because creative work..." style */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-[#1A0F08]"
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}
            >
              Because creative work<br />
              shouldn&apos;t be th
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                is
              </em>{' '}
              complic
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                at
              </em>
              ed
            </h2>
          </div>
          <div className="flex items-end lg:pb-2">
            <p className="text-[#8C7B6E] text-lg leading-relaxed">
              We&apos;ve lived the creative chaos ourselves — scattered DMs,
              unreliable spaces, and money going nowhere. So we built the
              simpler way to book.
            </p>
          </div>
        </div>

        {/* 3 Feature Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 border border-[#e8d5b5] hover:shadow-md transition-shadow group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#fdf4f0] flex items-center justify-center text-[#C4472B] mb-5 group-hover:bg-[#C4472B] group-hover:text-white transition-colors">
                {feat.icon}
              </div>
              <h3 className="font-semibold text-[#1A0F08] text-lg mb-3 leading-snug">
                {feat.title}
              </h3>
              <p className="text-[#8C7B6E] text-sm leading-relaxed">
                {feat.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
