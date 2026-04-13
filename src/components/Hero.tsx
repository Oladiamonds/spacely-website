export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#F5EDD6] flex items-center overflow-hidden pt-16">

      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #C4472B18 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #2D501618 0%, transparent 40%)`
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-8 items-center">

          {/* Left Column */}
          <div className="space-y-8 animate-slide-in-left">

            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-[#e8d5b5] text-sm text-[#5a5250] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#C4472B] animate-pulse flex-shrink-0" />
              App Launching Soon · Join the Waitlist
            </div>

            {/* Headline — ISO Meet mixed typography */}
            <div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-[#1A0F08]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Find.{' '}
                <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                  Book
                </em>
                .<br />
                Cr
                <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                  eat
                </em>
                e.<br />
                <span className="text-[#C4472B]">
                  In 90{' '}
                  <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                    Sec
                  </em>
                  onds.
                </span>
              </h1>
            </div>

            {/* Sub-copy */}
            <p className="text-lg text-[#8C7B6E] leading-relaxed max-w-md">
              Verified studios. Real equipment. Instant Paystack payment.
              <br className="hidden sm:block" />
              Lagos&apos;s first hourly creative workspace marketplace.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#waitlist" className="btn-primary text-base px-7 py-3.5">
                Book My Space →
              </a>
              <a href="#space-owners" className="btn-forest text-base px-7 py-3.5">
                List My Space →
              </a>
            </div>

            {/* Social proof avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  { bg: '#C4472B', label: 'T' },
                  { bg: '#2D5016', label: 'E' },
                  { bg: '#8C7B6E', label: 'A' },
                  { bg: '#b03f25', label: 'K' },
                ].map((a, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#F5EDD6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: a.bg }}
                  >
                    {a.label}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#8C7B6E]">
                <span className="font-semibold text-[#1A0F08]">1,200+</span> artisans already on the waitlist
              </p>
            </div>
          </div>

          {/* Right Column — Studio Visual + Floating Cards */}
          <div className="relative animate-slide-in-right delay-200 lg:h-[600px] flex items-center justify-center">

            {/* Main studio image block */}
            <div className="relative w-full max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '4/5' }}
            >
              {/* Studio hero photo — Lagos creative aesthetic */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-studio.jpg"
                alt="Nigerian creative professional in a studio space"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* Vignette overlay */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(26,15,8,0.4) 100%)' }}
              />
            </div>

            {/* Floating booking confirmation card — bottom left */}
            <div className="absolute bottom-8 -left-4 sm:-left-8 lg:-left-12 animate-slide-in-left delay-600
                            bg-white rounded-2xl shadow-xl p-4 max-w-[240px] border border-[#e8d5b5]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e8f1e7] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#2D5016]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#2D5016]">Booking Confirmed ✓</p>
                  <p className="text-xs text-[#1A0F08] font-medium mt-0.5">Photography Studio, Lekki</p>
                  <p className="text-xs text-[#6B5C52] mt-0.5">Tola A. · 2 hrs · ₦50,000</p>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#f0e8d5]">
                    <svg className="w-4 h-4" style={{ color: '#25D366' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-xs text-[#1A0F08] font-medium">WhatsApp Card Sent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating rating card — top right */}
            <div className="absolute top-8 -right-2 sm:-right-6 lg:-right-10 animate-slide-in-right delay-800
                            bg-white rounded-2xl shadow-xl p-4 max-w-[210px] border border-[#e8d5b5]">
              <div className="flex items-center gap-1 mb-1.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
                <span className="text-xs font-bold text-[#1A0F08] ml-1">4.9</span>
              </div>
              <p className="text-xs text-[#5a5250] italic leading-snug">
                &ldquo;Equipment exactly as listed. Loved every minute.&rdquo;
              </p>
              <p className="text-xs font-semibold text-[#1A0F08] mt-1.5">— Emeka O.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
