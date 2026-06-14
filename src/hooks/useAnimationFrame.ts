import { useEffect, useRef } from 'react'

export function useAnimationFrame(
  callback: (deltaTime: number, elapsedTime: number) => void,
  enabled = true,
) {
  const rafRef = useRef<number>(0)
  const prevTimeRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return
    prevTimeRef.current = performance.now()
    startTimeRef.current = prevTimeRef.current

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - prevTimeRef.current) / 1000)
      const elapsed = (now - startTimeRef.current) / 1000
      prevTimeRef.current = now
      cbRef.current(dt, elapsed)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled])
}
