import type { KeyboardEvent } from 'react'

export function useKeyboardClick(onClick?: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }
}
