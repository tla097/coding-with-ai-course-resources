import { useState, useLayoutEffect, useCallback } from 'react'

export function usePersistentBoolean(
  key: string,
  initialValue: boolean
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [value, setValueInternal] = useState(initialValue)

  useLayoutEffect(() => {
    const saved = localStorage.getItem(key)
    if (saved !== null) setValueInternal(saved === 'true')
  }, [key])

  const setValue = useCallback(
    (newValue: boolean | ((prev: boolean) => boolean)) => {
      setValueInternal(prev => {
        const next = typeof newValue === 'function' ? newValue(prev) : newValue
        localStorage.setItem(key, String(next))
        return next
      })
    },
    [key]
  )

  return [value, setValue]
}
