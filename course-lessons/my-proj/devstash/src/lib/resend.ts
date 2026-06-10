import { Resend } from 'resend'

// Skip the guard during `next build` — .env.production may have placeholder values.
// At runtime, a missing key throws immediately instead of silently passing undefined.
if (process.env.NEXT_PHASE !== 'phase-production-build' && !process.env.RESEND_AI_KEY) {
  throw new Error('RESEND_AI_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_AI_KEY)
