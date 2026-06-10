import Stripe from 'stripe'

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY

// Skip the guard during `next build` — .env.production may have placeholder values.
// At runtime, a missing key throws immediately instead of silently producing a broken client.
if (process.env.NEXT_PHASE !== 'phase-production-build' && !STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(STRIPE_KEY || 'placeholder_not_reached', {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
})
