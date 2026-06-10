import { Sparkles, Loader2, Crown } from 'lucide-react'

interface Props {
  isPro: boolean
  loading: boolean
  onClick: () => void
  label: string
  loadingLabel: string
  title: string
}

export function ProAiButton({ isPro, loading, onClick, label, loadingLabel, title }: Props) {
  if (isPro) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={title}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? loadingLabel : label}
      </button>
    )
  }
  return (
    <button
      type="button"
      disabled
      className="flex items-center gap-1 text-[11px] text-[#858585] opacity-50 cursor-not-allowed"
      title="AI features require Pro subscription"
    >
      <Crown className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
