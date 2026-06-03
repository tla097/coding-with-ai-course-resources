import { cn } from '@/lib/utils'

interface Props {
  name?: string | null
  image?: string | null
  className?: string
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function UserAvatar({ name, image, className }: Props) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? 'User'}
        className={cn('h-8 w-8 shrink-0 rounded-full object-cover', className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground',
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}