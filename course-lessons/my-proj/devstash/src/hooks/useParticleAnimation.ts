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

type Particle = {
  label: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  scaleT: number
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const fontSize = 12
  ctx.font = `500 ${fontSize}px Inter, sans-serif`
  const tw = ctx.measureText(p.label).width
  const scale = 1 + Math.sin(p.scaleT) * 0.08
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

  ctx.shadowBlur   = 0
  ctx.fillStyle    = p.color
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.scale(scale, scale)
  ctx.fillText(p.label, 0, 0)

  ctx.restore()
}

export function useParticleAnimation(
  canvasRef: { readonly current: HTMLCanvasElement | null },
  mouseRef: { current: { x: number; y: number } }
) {
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particles: Particle[] = BUBBLES.map((b, i) => {
      const angle = (i / BUBBLES.length) * Math.PI * 2
      return {
        ...b,
        x: 0,
        y: 0,
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
        drawParticle(ctx, p)
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
  }, [canvasRef, mouseRef])
}
