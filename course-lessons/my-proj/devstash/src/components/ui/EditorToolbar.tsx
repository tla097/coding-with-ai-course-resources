interface Props {
  leftSlot: React.ReactNode
  rightSlot: React.ReactNode
}

export function EditorToolbar({ leftSlot, rightSlot }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
      <div className="flex items-center gap-1.5">{leftSlot}</div>
      <div className="flex items-center gap-2.5">{rightSlot}</div>
    </div>
  )
}
