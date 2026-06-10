import { useEffect, useRef } from 'react'

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: { ctrlOrMeta?: boolean } = {}
) {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((!options.ctrlOrMeta || (e.ctrlKey || e.metaKey)) && e.key === key) {
        e.preventDefault()
        handlerRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, options.ctrlOrMeta])
}
