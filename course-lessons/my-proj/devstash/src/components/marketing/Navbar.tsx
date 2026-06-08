'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-sm ${
        scrolled ? 'shadow-sm border-b border-border' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-bold text-lg">
          <span>⚡</span>
          <span>DevStash</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-accent flex flex-col justify-center gap-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-0.5 bg-foreground transition-all duration-200 ${
              menuOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-all duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-all duration-200 ${
              menuOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 flex flex-col gap-4">
          <a
            href="#features"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </a>
          <hr className="border-border" />
          <Link
            href="/sign-in"
            className="text-sm text-center px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}
