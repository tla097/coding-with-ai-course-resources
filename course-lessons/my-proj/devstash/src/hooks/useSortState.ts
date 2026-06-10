import { useState } from 'react'

type SortDir = 'asc' | 'desc'

export function useSortState<K extends string>(
  defaultKey: K,
  defaultDir: SortDir = 'asc'
) {
  const [key, setKey] = useState<K>(defaultKey)
  const [dir, setDir] = useState<SortDir>(defaultDir)

  function toggle(newKey: string) {
    const k = newKey as K
    if (k === key) {
      setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setKey(k)
      setDir(k === defaultKey ? defaultDir : 'asc')
    }
  }

  return { key, dir, toggle }
}
