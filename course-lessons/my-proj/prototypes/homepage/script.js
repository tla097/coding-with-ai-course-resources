/* ── Footer Year ────────────────────────────────────────────── */
document.getElementById('footerYear').textContent = new Date().getFullYear();

/* ── Navbar scroll opacity ──────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Scroll fade-in ─────────────────────────────────────────── */
const fadeEls = document.querySelectorAll('.fade-in-up');
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
fadeEls.forEach(el => observer.observe(el));

/* ── Pricing toggle ─────────────────────────────────────────── */
const billingToggle = document.getElementById('billingToggle');
const proPrice      = document.getElementById('proPrice');
const pricePeriod   = document.getElementById('pricePeriod');
const yearlyNote    = document.getElementById('yearlyNote');
const toggleMonthly = document.getElementById('toggleMonthly');
const toggleYearly  = document.getElementById('toggleYearly');

billingToggle.addEventListener('change', () => {
  const isYearly = billingToggle.checked;
  proPrice.textContent    = isYearly ? '$6' : '$8';
  pricePeriod.textContent = '/month';
  yearlyNote.style.display = isYearly ? 'block' : 'none';
  toggleMonthly.classList.toggle('active', !isYearly);
  toggleYearly.classList.toggle('active', isYearly);
});
toggleMonthly.classList.add('active');

/* ── Chaos Canvas ───────────────────────────────────────────── */
const canvas = document.getElementById('chaosCanvas');
const ctx    = canvas.getContext('2d');

const ICONS = [
  { label: 'Notion',    emoji: '📝', color: '#ffffff' },
  { label: 'GitHub',    emoji: '🐙', color: '#94a3b8' },
  { label: 'Slack',     emoji: '💬', color: '#e879f9' },
  { label: 'VS Code',   emoji: '💻', color: '#3b82f6' },
  { label: 'Browser',   emoji: '🌐', color: '#06b6d4' },
  { label: 'Terminal',  emoji: '⌨️', color: '#22c55e' },
  { label: 'Text file', emoji: '📄', color: '#94a3b8' },
  { label: 'Bookmark',  emoji: '🔖', color: '#f59e0b' },
];

let W, H;
let mouse = { x: -999, y: -999 };
const REPEL_RADIUS = 100;
const REPEL_FORCE  = 8;
const SPEED_MAX    = 3.5;
const BOUNCE_DAMP  = 0.85;
const ICON_SIZE    = 22;

const particles = ICONS.map((icon, i) => {
  const angle = (i / ICONS.length) * Math.PI * 2;
  return {
    ...icon,
    x:    0,
    y:    0,
    vx:   Math.cos(angle) * (0.3 + Math.random() * 0.5),
    vy:   Math.sin(angle) * (0.3 + Math.random() * 0.5),
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 0.6,
    scale: 1,
    scaleDir: Math.random() > 0.5 ? 1 : -1,
    scaleT: Math.random() * Math.PI * 2,
  };
});

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
  H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const cW = canvas.offsetWidth;
  const cH = canvas.offsetHeight;
  particles.forEach((p, i) => {
    if (p.x === 0 && p.y === 0) {
      p.x = 30 + Math.random() * (cW - 60);
      p.y = 30 + Math.random() * (cH - 60);
    }
  });
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function step() {
  const cW = canvas.offsetWidth;
  const cH = canvas.offsetHeight;

  ctx.clearRect(0, 0, cW, cH);

  const PAD = 16;

  particles.forEach(p => {
    // Mouse repel
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < REPEL_RADIUS && dist > 0) {
      const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE;
      p.vx += (dx / dist) * force * 0.3;
      p.vy += (dy / dist) * force * 0.3;
    }

    // Speed cap
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > SPEED_MAX) {
      p.vx = (p.vx / speed) * SPEED_MAX;
      p.vy = (p.vy / speed) * SPEED_MAX;
    }

    p.x += p.vx;
    p.y += p.vy;

    // Bounce off walls
    if (p.x < PAD)       { p.x = PAD;       p.vx = Math.abs(p.vx) * BOUNCE_DAMP; }
    if (p.x > cW - PAD)  { p.x = cW - PAD;  p.vx = -Math.abs(p.vx) * BOUNCE_DAMP; }
    if (p.y < PAD)       { p.y = PAD;       p.vy = Math.abs(p.vy) * BOUNCE_DAMP; }
    if (p.y > cH - PAD)  { p.y = cH - PAD;  p.vy = -Math.abs(p.vy) * BOUNCE_DAMP; }

    // Rotation
    p.rot += p.rotV;

    // Scale pulse
    p.scaleT += 0.025;
    p.scale = 1 + Math.sin(p.scaleT) * 0.12;

    // Draw
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.scale(p.scale, p.scale);

    // Glow
    ctx.shadowBlur  = 12;
    ctx.shadowColor = p.color;

    ctx.font = `${ICON_SIZE}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, 0, 0);

    ctx.restore();
  });

  requestAnimationFrame(step);
}

resize();
window.addEventListener('resize', resize);
requestAnimationFrame(step);
