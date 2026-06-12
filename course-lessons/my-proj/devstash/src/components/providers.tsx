'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/devstash/api/auth">
      {children}
    </SessionProvider>
  )
}
