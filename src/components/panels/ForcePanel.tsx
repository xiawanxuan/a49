import React from 'react'
import { Activity, ArrowDown, ArrowUp, Maximize2, Target } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export const ForcePanel: React.FC = () => {
  const trajectory = useAppStore((s) => s.trajectory)
  const forceConfig = useAppStore((s) => s.forceConfig)
  const setForceConfig = useAppStore((s) => s.setForceConfig)

  if (!trajectory) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-slate-700 bg-slate-800/60 text-slate-500">
          <Activity size={20} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[12px] text-slate-400">加载轨迹后</p>
          <p className="text-[12px] text-slate-400">可显示分子间作用力</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
          <Activity size={11} strokeWidth={1.5} />
          作用力矢量
        </span>
        <button
          onClick={() => setForceConfig({ enabled: !forceConfig.enabled })}
          className={
            'flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[10px] transition-all ' +
            (forceConfig.enabled
              ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
              : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600/80 hover:text-slate-300')
          }
        >
          <div
            className={
              'h-1.5 w-1.5 rounded-full transition-colors ' +
              (forceConfig.enabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500')
            }
          />
          {forceConfig.enabled ? '已启用' : '已关闭'}
        </button>
      </div>

      {forceConfig.enabled && (
        <>
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 px-1 flex items-center gap-1">
              <Target size={10} strokeWidth={1.5} />
              显示类型
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setForceConfig({ showAttractive: !forceConfig.showAttractive })}
                className={
                  'flex items-center justify-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] transition-all ' +
                  (forceConfig.showAttractive
                    ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:border-slate-600/80')
                }
              >
                <ArrowDown size={10} strokeWidth={2} />
                引力
              </button>
              <button
                onClick={() => setForceConfig({ showRepulsive: !forceConfig.showRepulsive })}
                className={
                  'flex items-center justify-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] transition-all ' +
                  (forceConfig.showRepulsive
                    ? 'border-orange-400/40 bg-orange-500/10 text-orange-300'
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:border-slate-600/80')
                }
              >
                <ArrowUp size={10} strokeWidth={2} />
                斥力
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Maximize2 size={10} strokeWidth={1.5} />
                箭头缩放
              </span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                {forceConfig.arrowScale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={forceConfig.arrowScale}
              onChange={(e) => setForceConfig({ arrowScale: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500">最小力阈值</span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                {forceConfig.minMagnitude.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={forceConfig.minMagnitude}
              onChange={(e) => setForceConfig({ minMagnitude: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500">最大力阈值</span>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                {forceConfig.maxMagnitude.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={forceConfig.maxMagnitude}
              onChange={(e) => setForceConfig({ maxMagnitude: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-cyan-400"
            />
          </div>

          <div className="rounded-sm border border-slate-800/60 bg-slate-900/30 p-2 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <div className="h-0.5 w-4 bg-cyan-400/70 rounded-full" />
              <span>引力（青色）：原子间相互吸引</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <div className="h-0.5 w-4 bg-orange-400/70 rounded-full" />
              <span>斥力（橙色）：原子间相互排斥</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ForcePanel
