'use client'

import { useRef } from 'react'
import { useParticleAnimation } from '@/hooks/useParticleAnimation'

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({ x: -999, y: -999 })

  useParticleAnimation(canvasRef, mouseRef)

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4">

        {/* Chaos box */}
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-xs text-muted-foreground text-center mb-2">Your knowledge today...</p>
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden" style={{ height: 320 }}>
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-muted-foreground hidden md:flex flex-col items-center justify-center px-2">
          <div className="animate-pulse">
            <svg width="48" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 12 H48 M36 2 L48 12 L36 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="flex flex-col flex-1 min-w-0 w-full md:w-auto">
          <p className="text-xs text-muted-foreground text-center mb-2">...with DevStash</p>
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: 320 }}>
            <div className="flex h-full">
              {/* Mock sidebar */}
              <div className="w-36 border-r border-border bg-muted/30 p-3 flex flex-col gap-1 shrink-0">
                <div className="text-xs font-bold mb-2">⚡ DevStash</div>
                {[
                  { label: 'Snippets', color: '#3b82f6' },
                  { label: 'Prompts',  color: '#f59e0b' },
                  { label: 'Commands', color: '#06b6d4' },
                  { label: 'Notes',    color: '#22c55e' },
                  { label: 'Links',    color: '#6366f1' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
                <div className="border-t border-border my-1" />
                <div className="text-xs text-muted-foreground px-1.5 py-0.5">React Patterns</div>
                <div className="text-xs text-muted-foreground px-1.5 py-0.5">Interview Prep</div>
              </div>

              {/* Mock main */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <div className="flex-1 text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">🔍 Search...</div>
                  <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0" />
                </div>
                <div className="flex-1 p-2 grid grid-cols-2 gap-2 content-start overflow-hidden">
                  {[
                    { type: 'snippet', title: 'useDebounce hook',   tags: ['react', 'hooks'],   color: '#3b82f6' },
                    { type: 'prompt',  title: 'Code review prompt', tags: ['ai', 'review'],     color: '#f59e0b' },
                    { type: 'command', title: 'Docker cleanup',     tags: ['docker'],           color: '#06b6d4' },
                    { type: 'note',    title: 'Auth flow notes',    tags: ['auth'],             color: '#22c55e' },
                    { type: 'link',    title: 'MDN Web Docs',       tags: ['reference'],        color: '#6366f1' },
                    { type: 'prompt',  title: 'Explain this code',  tags: ['ai'],               color: '#f59e0b' },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="rounded border bg-background p-1.5 text-xs"
                      style={{ borderLeftWidth: 2, borderLeftColor: card.color }}
                    >
                      <div className="font-medium text-[10px] mb-0.5" style={{ color: card.color }}>
                        {card.type}
                      </div>
                      <div className="font-medium text-foreground truncate text-[11px]">{card.title}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {card.tags.map(t => (
                          <span key={t} className="px-1 rounded-sm bg-muted text-muted-foreground text-[9px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
