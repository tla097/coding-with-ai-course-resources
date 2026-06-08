import Link from 'next/link'
import { Crown, Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProGateProps {
  type: string
  color: string
}

export default function ProGate({ type, color }: ProGateProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}20` }}
        >
          <Lock className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-2">
            {type}
            <Badge variant="secondary" className="text-xs font-medium">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Available on the Pro plan</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 gap-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}
        >
          <Crown className="h-8 w-8" style={{ color }} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-lg font-semibold">Upgrade to unlock {type}</h2>
          <p className="text-sm text-muted-foreground">
            File and image storage is a Pro feature. Upgrade to upload, organise, and access your files directly in DevStash.
          </p>
        </div>
        <Link href="/upgrade" className={buttonVariants({ size: 'sm' })}>
          View upgrade options
        </Link>
      </div>
    </div>
  )
}
