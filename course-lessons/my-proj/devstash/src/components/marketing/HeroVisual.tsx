'use client'

import { useEffect, useRef } from 'react'

const BUBBLES = [
  { label: 'Snippets', color: '#3b82f6' },
  { label: 'Prompts',  color: '#f59e0b' },
  { label: 'Commands', color: '#06b6d4' },
  { label: 'Notes',    color: '#22c55e' },
  { label: 'Links',    color: '#6366f1' },
  { label: 'Files',    color: '#64748b' },
]

const REPEL_RADIUS = 100
const REPEL_FORCE  = 8
const SPEED_MAX    = 2.5
const BOUNCE_DAMP  = 0.85

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({ x: -999, y: -999 })
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles = BUBBLES.map((b, i) => {
      const angle = (i / BUBBLES.length) * Math.PI * 2
      return {
        ...b,
        x:  0,
        y:  0,
        vx: Math.cos(angle) * (0.4 + Math.random() * 0.4),
        vy: Math.sin(angle) * (0.4 + Math.random() * 0.4),
        scaleT: Math.random() * Math.PI * 2,
      }
    })

    function resize() {
      if (!canvas) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width  = w * dpr
      canvas.height = h * dpr
      ctx!.scale(dpr, dpr)
      particles.forEach(p => {
        if (p.x === 0 && p.y === 0) {
          p.x = 40 + Math.random() * (w - 80)
          p.y = 40 + Math.random() * (h - 80)
        }
      })
    }

    function step() {
      if (!canvas || !ctx) return
      const cW = canvas.offsetWidth
      const cH = canvas.offsetHeight
      const PAD = 20
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      ctx.clearRect(0, 0, cW, cH)

      for (const p of particles) {
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE
          p.vx += (dx / dist) * force * 0.3
          p.vy += (dy / dist) * force * 0.3
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > SPEED_MAX) {
          p.vx = (p.vx / speed) * SPEED_MAX
          p.vy = (p.vy / speed) * SPEED_MAX
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < PAD)      { p.x = PAD;      p.vx =  Math.abs(p.vx) * BOUNCE_DAMP }
        if (p.x > cW - PAD) { p.x = cW - PAD; p.vx = -Math.abs(p.vx) * BOUNCE_DAMP }
        if (p.y < PAD)      { p.y = PAD;      p.vy =  Math.abs(p.vy) * BOUNCE_DAMP }
        if (p.y > cH - PAD) { p.y = cH - PAD; p.vy = -Math.abs(p.vy) * BOUNCE_DAMP }

        p.scaleT += 0.02
        const scale = 1 + Math.sin(p.scaleT) * 0.08

        // pill background
        const fontSize = 12
        ctx.font = `500 ${fontSize}px Inter, sans-serif`
        const tw = ctx.measureText(p.label).width
        const pw = (tw + 20) * scale
        const ph = 26 * scale
        const rx = pw / 2

        ctx.save()
        ctx.translate(p.x, p.y)

        ctx.shadowBlur  = 14
        ctx.shadowColor = p.color + '88'

        ctx.beginPath()
        ctx.roundRect(-rx, -ph / 2, pw, ph, ph / 2)
        ctx.fillStyle = p.color + '22'
        ctx.fill()
        ctx.strokeStyle = p.color + 'aa'
        ctx.lineWidth   = 1
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.fillStyle  = p.color
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.scale(scale, scale)
        ctx.fillText(p.label, 0, 0)

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(step)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => { mouseRef.current = { x: -999, y: -999 } }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', resize)

    resize()
    rafRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4">

        {/* Chaos box — hidden on mobile */}
        <div className="hidden md:flex flex-col flex-1 min-w-0">
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
