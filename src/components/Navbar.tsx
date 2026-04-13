'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#F5EDD6]/95 backdrop-blur-sm shadow-[0_1px_0_0_#e8d5b5]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#C4472B] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="white" opacity="0.9"/>
                <path d="M9 21V13h6v8" stroke="#C4472B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-[#1A0F08] text-xl font-normal tracking-tight"
            >
              SpaceLY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'For Artisans', href: '#artisans' },
              { label: 'For Space Owners', href: '#space-owners' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Trust & Safety', href: '#trust' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-3.5 py-1.5 rounded-full text-sm font-medium text-[#5a5250] hover:text-white transition-colors duration-200 group/navlink"
              >
                {/* Gradient pill background — fades in on hover */}
                <span
                  className="absolute inset-0 rounded-full opacity-0 group-hover/navlink:opacity-100 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(135deg, #C4472B 0%, #b03f25 60%, #9E3521 100%)' }}
                  aria-hidden="true"
                />
                <span className="relative">{link.label}</span>
              </a>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#waitlist"
              className="hidden md:inline-flex items-center px-5 py-2 rounded-full bg-[#C4472B] text-white text-sm font-medium hover:bg-[#b03f25] active:bg-[#9E3521] transition-colors"
            >
              Join Waitlist
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-[#EDE0C0] transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-[#1A0F08] transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#1A0F08] transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#1A0F08] transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        } bg-[#F5EDD6] border-t border-[#e8d5b5]`}
      >
        <div className="px-5 py-5 flex flex-col gap-4">
          {[
            { label: 'For Artisans', href: '#artisans' },
            { label: 'For Space Owners', href: '#space-owners' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Trust & Safety', href: '#trust' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-[#5a5250] hover:text-[#1A0F08] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#waitlist"
            onClick={() => setMenuOpen(false)}
            className="btn-primary mt-2 text-center"
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </nav>
  )
}
