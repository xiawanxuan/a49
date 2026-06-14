import { useCallback, useEffect, useRef, useState } from 'react'

export function useFileDrop<T extends HTMLElement>(
  onFile: (file: File) => void,
  accept = '.xyz',
) {
  const ref = useRef<T | null>(null)
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOver(false)
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      const file = files[0]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (accept.split(',').some((a) => a.trim().toLowerCase() === ext)) {
        onFile(file)
      }
    },
    [onFile, accept],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('dragover', handleDragOver)
    el.addEventListener('dragleave', handleDragLeave)
    el.addEventListener('drop', handleDrop)
    return () => {
      el.removeEventListener('dragover', handleDragOver)
      el.removeEventListener('dragleave', handleDragLeave)
      el.removeEventListener('drop', handleDrop)
    }
  }, [handleDragOver, handleDragLeave, handleDrop])

  return { ref, isOver }
}
