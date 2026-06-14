import React, { useEffect, useState } from 'react'
import type { RenderPerformance } from '@/types'
import eventBus from '@/utils/EventBus'
import { useAppStore } from '@/store/useAppStore'

export const HUD: React.FC = () => {
  const [perf, setPerf] = useState<RenderPerformance | null>(null)
  const playback = useAppStore((s) => s.playback)
  const trajectory = useAppStore((s) => s.trajectory)

  useEffect(() => {
    return eventBus.on('RENDER_PERFORMANCE', setPerf)
  }, [])

  if (!trajectory) return null

  const fpsColor = !perf ? 'text-slate-500' : perf.fps >= 50 ? 'text-emerald-400' : perf.fps >= 30 ? 'text-amber-400' : 'text-rose-400'

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-10 select-none font-mono text-[11px] leading-relaxed">
      <div className="rounded-sm border border-slate-700/60 bg-slate-950/70 px-3 py-2 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-6 border-b border-slate-800/80 pb-1 mb-1">
          <span className="text-slate-500 uppercase tracking-wider text-[10px]">Perf</span>
          <span className={`tabular-nums ${fpsColor}`}>
            {perf ? `${perf.fps} FPS` : '-- FPS'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300 tabular-nums">
          <span className="text-slate-500">Frame</span>
          <span className="text-cyan-300">
            {playback.currentFrame + 1} <span className="text-slate-500">/</span>{' '}
            {trajectory.totalFrames}
          </span>
          <span className="text-slate-500">Atoms</span>
          <span>{perf?.atomCount ?? trajectory.atomCount}</span>
          <span className="text-slate-500">Bonds</span>
          <span>{perf?.bondCount ?? '--'}</span>
          <span className="text-slate-500">DrawCalls</span>
          <span>{perf?.drawCalls ?? '--'}</span>
          <span className="text-slate-500">FrameTime</span>
          <span>{perf ? `${perf.frameTime.toFixed(1)} ms` : '--'}</span>
        </div>
      </div>
    </div>
  )
}

export default HUD
