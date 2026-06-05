import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
}

export default function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const href = (p: number) => `${basePath}?page=${p}`

  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)
  const pages: number[] = []
  for (let i = left; i <= right; i++) pages.push(i)

  const btnBase = 'flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors'
  const btnDefault = 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
  const btnActive = 'bg-primary text-primary-foreground'
  const btnDisabled = 'opacity-40 pointer-events-none'

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-6">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(btnBase, btnDefault)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(btnBase, btnDisabled)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {left > 1 && (
        <>
          <Link href={href(1)} className={cn(btnBase, page === 1 ? btnActive : btnDefault)}>1</Link>
          {left > 2 && <span className="px-1 text-sm text-muted-foreground select-none">…</span>}
        </>
      )}

      {pages.map(p => (
        <Link key={p} href={href(p)} className={cn(btnBase, p === page ? btnActive : btnDefault)}>
          {p}
        </Link>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="px-1 text-sm text-muted-foreground select-none">…</span>}
          <Link href={href(totalPages)} className={cn(btnBase, page === totalPages ? btnActive : btnDefault)}>
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(btnBase, btnDefault)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(btnBase, btnDisabled)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
