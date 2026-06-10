import { useState, useLayoutEffect, useCallback } from 'react'

export function usePersistentBoolean(
  key: string,
  initialValue: boolean,
  options?: { closeOnMobileBreakpoint?: number }
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [value, setValueInternal] = useState(initialValue)

  useLayoutEffect(() => {
    if (options?.closeOnMobileBreakpoint && window.innerWidth < options.closeOnMobileBreakpoint) {
      setValueInternal(false)
      return
    }
    const saved = localStorage.getItem(key)
    if (saved !== null) setValueInternal(saved === 'true')
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
