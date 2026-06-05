'use client'

import { FolderOpen } from 'lucide-react'

interface Collection {
  id: string
  name: string
}

interface Props {
  collections: Collection[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function CollectionPicker({ collections, selected, onChange }: Props) {
  if (collections.length === 0) {
    return <p className="text-xs text-muted-foreground">No collections yet.</p>
  }

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto py-0.5">
      {collections.map(col => {
        const isSelected = selected.includes(col.id)
        return (
          <button
            key={col.id}
            type="button"
            onClick={() => toggle(col.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>{col.name}</span>
          </button>
        )
      })}
    </div>
  )
}
