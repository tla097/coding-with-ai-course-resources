'use client'

import { toast } from 'sonner'

export async function redirectToCheckout(priceId: string): Promise<void> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('Failed to start checkout')
    }
  } catch {
    toast.error('Something went wrong')
  }
}

export async function redirectToBillingPortal(): Promise<void> {
  try {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('Failed to open billing portal')
    }
  } catch {
    toast.error('Something went wrong')
  }
}
