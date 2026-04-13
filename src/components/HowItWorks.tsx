const steps = [
  {
    number: '01',
    icon: '🔍',
    title: 'Search Your Space',
    desc: 'Tell us your profession, your area in Lagos, and when you need it. Visual results — with photos, equipment lists, and real prices — appear instantly.',
    time: '~15 sec',
  },
  {
    number: '02',
    icon: '📅',
    title: 'Pick Your Slot',
    desc: 'See live availability. Choose your hours. No email threads, no "let me check and get back to you." Tap the slot, it\'s yours.',
    time: '~15 sec',
  },
  {
    number: '03',
    icon: '💳',
    title: 'Pay with Paystack',
    desc: 'One tap. Your payment is secured in Paystack escrow — released to the owner only when your session starts. Your money is always protected.',
    time: '~30 sec',
  },
  {
    number: '04',
    icon: '📲',
    title: 'Confirmed on WhatsApp',
    desc: 'Your booking confirmation arrives on WhatsApp instantly — complete with a beautiful card you can share to your status. Show up. Create.',
    time: '~30 sec',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#F5EDD6]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="mb-16">
          <p className="section-label mb-4">How It Works</p>
          <div className="grid lg:grid-cols-2 gap-6 items-end">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-[#1A0F08]"
              style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}
            >
              B
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>ook</em>
              {' '}in 90{' '}
              Sec
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                onds
              </em>
              .<br />
              That&apos;s the wh
              <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400 }}>
                ole
              </em>
              {' '}point.
            </h2>
            <p className="text-[#8C7B6E] text-lg leading-relaxed">
              From searching for the perfect Lagos studio to receiving your WhatsApp
              confirmation — the entire process takes under 90 seconds. We timed it.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connecting line between cards (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-5 h-px bg-[#C4472B]/30 z-10 -translate-x-2.5" />
              )}

              <div className="bg-white rounded-2xl p-6 border border-[#e8d5b5] h-full flex flex-col hover:shadow-md hover:border-[#C4472B]/30 transition-all">
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-5xl font-bold text-[#e8d5b5]"
                    style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                  >
                    {step.number}
                  </span>
                  <span className="text-2xl">{step.icon}</span>
                </div>

                <h3 className="font-semibold text-[#1A0F08] text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-[#8C7B6E] leading-relaxed flex-1">{step.desc}</p>

                <div className="mt-5 pt-4 border-t border-[#f0e8d5] flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#C4472B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-xs font-semibold text-[#C4472B]">{step.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total time badge */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#1A0F08] rounded-full text-white">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-medium">Total booking time: under <strong>90 seconds</strong></span>
            <span className="text-lg">⚡</span>
          </div>
        </div>
      </div>
    </section>
  )
}
