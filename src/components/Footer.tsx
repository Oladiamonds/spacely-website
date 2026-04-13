import Link from 'next/link'

const links = {
  product: [
    { label: 'For Artisans', href: '#artisans' },
    { label: 'For Space Owners', href: '#space-owners' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Trust & Safety', href: '#trust' },
    { label: 'Pricing', href: '#' },
  ],
  company: [
    { label: 'About SpaceLY', href: '#' },
    { label: 'Press Kit', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#1A0F08] text-white">

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">

          {/* Brand column */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C4472B] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="white" opacity="0.9"/>
                  <path d="M9 21V13h6v8" stroke="#C4472B" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-white text-xl font-normal tracking-tight"
              >
                SpaceLY
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Where Lagos creatives work. Nigeria&apos;s first hourly
              booking platform for photography studios, fashion ateliers,
              recording studios, and more.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <a
                href="https://wa.me/2340000000000"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Us
              </a>
              <a
                href="mailto:hello@spacely.ng"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                hello@spacely.ng
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-5">Product</p>
            <ul className="space-y-3">
              {links.product.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-5">Company</p>
            <ul className="space-y-3">
              {links.company.map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Social */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-5">Legal</p>
            <ul className="space-y-3">
              {links.legal.map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-8">
              {[
                {
                  label: 'Instagram',
                  href: '#',
                  icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>,
                },
                {
                  label: 'Twitter / X',
                  href: '#',
                  icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>,
                },
                {
                  label: 'TikTok',
                  href: '#',
                  icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.78 1.52V7.12a4.85 4.85 0 01-1.01-.43z"/>,
                },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/40 text-sm">© 2026 SpaceLY. Lagos, Nigeria.</p>
          <p className="text-white/30 text-xs">Built for Nigeria&apos;s 4.2M creative workers.</p>
        </div>
      </div>
    </footer>
  )
}
