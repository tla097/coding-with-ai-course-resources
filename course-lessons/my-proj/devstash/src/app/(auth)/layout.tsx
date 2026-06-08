import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Link href="/" className="mb-6 flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
        <span>⚡</span>
        <span>DevStash</span>
      </Link>
      {children}
    </div>
  )
}