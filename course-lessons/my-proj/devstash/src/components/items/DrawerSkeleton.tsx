export default function DrawerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-border space-y-3">
        <div className="flex gap-2 pr-8">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
      </div>
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <div className="h-7 w-20 bg-muted rounded" />
        <div className="h-7 w-12 bg-muted rounded" />
        <div className="h-7 w-14 bg-muted rounded" />
      </div>
      <div className="px-5 py-5 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-4/5 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-28 w-full bg-muted rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="flex gap-1.5">
            <div className="h-5 w-14 bg-muted rounded-full" />
            <div className="h-5 w-10 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
