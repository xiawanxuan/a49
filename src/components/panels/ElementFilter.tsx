import React from 'react'
import { Atom, Eye, EyeOff, Highlighter, Palette, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getElementColor } from '@/utils/MaterialConfig'

export const ElementFilter: React.FC = () => {
  const trajectory = useAppStore((s) => s.trajectory)
  const filter = useAppStore((s) => s.filter)
  const toggleVisible = useAppStore((s) => s.toggleElementVisible)
  const toggleHighlight = useAppStore((s) => s.toggleElementHighlight)
  const setCustomColor = useAppStore((s) => s.setCustomColor)
  const resetFilter = useAppStore((s) => s.resetFilter)

  if (!trajectory) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-slate-700 bg-slate-800/60 text-slate-500">
          <Atom size={20} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[12px] text-slate-400">加载轨迹后</p>
          <p className="text-[12px] text-slate-400">可在此筛选与高亮元素</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
          <Atom size={11} strokeWidth={1.5} />
          元素筛选（共 {trajectory.uniqueElements.length} 种）
        </span>
        <button
          onClick={resetFilter}
          className="flex items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <RotateCcw size={10} strokeWidth={1.5} />
          重置
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 custom-scrollbar">
        {trajectory.uniqueElements.map((element) => {
          const count = trajectory.elementCounts[element] ?? 0
          const visible = filter.visibleElements.has(element)
          const highlighted = filter.highlightedElements.has(element)
          const baseColor = getElementColor(element, filter.customColors)
          const currentColor = filter.customColors[element] ?? baseColor

          return (
            <div
              key={element}
              className={
                'group relative rounded-sm border p-2.5 transition-all duration-150 ' +
                (highlighted
                  ? 'border-cyan-400/60 bg-cyan-500/5 shadow-[0_0_14px_rgba(0,229,255,0.08)]'
                  : visible
                    ? 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600/80'
                    : 'border-slate-800/80 bg-slate-950/60 opacity-60')
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold shadow-inner"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${currentColor}, ${currentColor}cc 60%, ${currentColor}99 100%)`,
                    boxShadow: highlighted
                      ? `0 0 14px ${currentColor}99, inset 0 0 10px rgba(255,255,255,0.25)`
                      : `inset 0 0 10px rgba(255,255,255,0.15)`,
                    color:
                      element === 'H' || element === 'He' || element === 'Ne' || element === 'Ar'
                        ? '#1e293b'
                        : '#f8fafc',
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}
                >
                  {element}
                  {highlighted && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-200">{element}</span>
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                      ×{count}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                    {currentColor.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVisible(element)}
                    title={visible ? '隐藏该元素' : '显示该元素'}
                    className={
                      'flex h-7 w-7 items-center justify-center rounded-sm border transition-all ' +
                      (visible
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-500 hover:text-slate-300')
                    }
                  >
                    {visible ? <Eye size={13} strokeWidth={1.75} /> : <EyeOff size={13} strokeWidth={1.75} />}
                  </button>
                  <button
                    onClick={() => toggleHighlight(element)}
                    title={highlighted ? '取消高亮' : '高亮显示'}
                    className={
                      'flex h-7 w-7 items-center justify-center rounded-sm border transition-all ' +
                      (highlighted
                        ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-500 hover:text-slate-300')
                    }
                  >
                    <Highlighter size={13} strokeWidth={1.75} />
                  </button>
                  <label
                    title="自定义颜色"
                    className="relative flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700/60 bg-slate-900/60 cursor-pointer hover:border-slate-500/80"
                  >
                    <Palette size={13} strokeWidth={1.75} className="text-slate-400" />
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => setCustomColor(element, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Eye size={11} strokeWidth={1.5} className="text-emerald-400/80" />
            可见：
            <span className="font-mono tabular-nums text-emerald-300">
              {filter.visibleElements.size}/{trajectory.uniqueElements.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Highlighter size={11} strokeWidth={1.5} className="text-cyan-400/80" />
            高亮：
            <span className="font-mono tabular-nums text-cyan-300">
              {filter.highlightedElements.size}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElementFilter
