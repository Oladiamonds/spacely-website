const categories = [
  { emoji: '📸', name: 'Photography Studio', area: 'Lekki' },
  { emoji: '🪡', name: 'Fashion Studio', area: 'Ikeja' },
  { emoji: '🎵', name: 'Recording Studio', area: 'Surulere' },
  { emoji: '🍰', name: 'Commercial Kitchen', area: 'VI' },
  { emoji: '💄', name: 'Beauty Studio', area: 'Yaba' },
  { emoji: '🎨', name: 'Art Studio', area: 'Lekki' },
  { emoji: '🎬', name: 'Film Set', area: 'Ikoyi' },
  { emoji: '🏋️', name: 'Fitness Studio', area: 'Ikeja' },
  { emoji: '🎹', name: 'Practice Room', area: 'Surulere' },
  { emoji: '✂️', name: 'Tailoring Studio', area: 'Oshodi' },
]

const row2 = [
  { emoji: '🖼️', name: 'Gallery Space', area: 'VI' },
  { emoji: '🪞', name: 'Salon Suite', area: 'Lekki' },
  { emoji: '🎙️', name: 'Podcast Studio', area: 'Yaba' },
  { emoji: '🧁', name: 'Pastry Kitchen', area: 'GRA Ikeja' },
  { emoji: '💅', name: 'Nail Studio', area: 'Ajah' },
  { emoji: '🎭', name: 'Rehearsal Space', area: 'VI' },
  { emoji: '🖥️', name: 'Content Studio', area: 'Lekki' },
  { emoji: '🌿', name: 'Wellness Space', area: 'Ikoyi' },
  { emoji: '🎤', name: 'Vocal Booth', area: 'Maryland' },
  { emoji: '🪴', name: 'Event Atelier', area: 'Oniru' },
]

function TickerPill({ emoji, name, area }: { emoji: string; name: string; area: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-[#e8d5b5] shadow-sm mx-2 flex-shrink-0 hover:border-[#C4472B]/40 transition-colors">
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-medium text-[#1A0F08] whitespace-nowrap">{name}</span>
      <span className="text-xs text-[#6B5C52] bg-[#EDE0C0] px-2 py-0.5 rounded-full whitespace-nowrap">
        {area}
      </span>
    </div>
  )
}

export default function CategoryTicker() {
  const doubled = [...categories, ...categories]
  const doubled2 = [...row2, ...row2]

  return (
    <section className="py-12 bg-[#F5EDD6] overflow-hidden border-y border-[#e8d5b5]">
      <div className="mb-4 overflow-hidden">
        <div className="flex animate-marquee">
          {doubled.map((cat, i) => (
            <TickerPill key={i} {...cat} />
          ))}
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex animate-marquee-reverse">
          {doubled2.map((cat, i) => (
            <TickerPill key={i} {...cat} />
          ))}
        </div>
      </div>
    </section>
  )
}
