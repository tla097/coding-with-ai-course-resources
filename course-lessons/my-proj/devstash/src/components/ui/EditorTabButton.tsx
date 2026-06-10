interface Props {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

export function EditorTabButton({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
        active ? 'bg-[#3c3c3c] text-[#cccccc]' : 'text-[#858585] hover:text-[#cccccc]'
      }`}
    >
      {children}
    </button>
  )
}
