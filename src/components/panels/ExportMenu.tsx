import React, { useState, useRef, useEffect } from 'react'
import { Download, Image, FileJson, FileText, Link2, ChevronDown, Check } from 'lucide-react'
import type { ExportType, ExportOptions } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import eventBus from '@/utils/EventBus'

const EXPORT_ITEMS: Array<{
  type: ExportType
  label: string
  desc: string
  icon: React.ReactNode
  supportHighlighted: boolean
  accent: string
}> = [
  {
    type: 'currentFrameXYZ',
    label: '当前帧坐标',
    desc: '导出当前帧为 .xyz 文件',
    icon: <FileText size={14} strokeWidth={1.5} />,
    supportHighlighted: true,
    accent: 'border-blue-400/50 hover:bg-blue-500/10 hover:text-blue-300',
  },
  {
    type: 'selectedAtomsTrajectory',
    label: '可见原子轨迹',
    desc: '导出筛选后原子完整轨迹',
    icon: <Link2 size={14} strokeWidth={1.5} />,
    supportHighlighted: true,
    accent: 'border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300',
  },
  {
    type: 'screenshotPNG',
    label: '截图 PNG',
    desc: '渲染画面截图',
    icon: <Image size={14} strokeWidth={1.5} />,
    supportHighlighted: false,
    accent: 'border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-300',
  },
  {
    type: 'parametersJSON',
    label: '参数配置 JSON',
    desc: '导出所有设置与状态',
    icon: <FileJson size={14} strokeWidth={1.5} />,
    supportHighlighted: false,
    accent: 'border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300',
  },
]

export const ExportMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [highlightedOnly, setHighlightedOnly] = useState(false)
  const trajectory = useAppStore((s) => s.trajectory)
  const filter = useAppStore((s) => s.filter)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = (type: ExportType, useHighlighted: boolean) => {
    if (filter.highlightedElements.size === 0 && useHighlighted) {
      eventBus.emit('ERROR', { message: '请先高亮至少一种元素' })
      return
    }
    const options: ExportOptions = { type, highlightedOnly: useHighlighted }
    eventBus.emit('EXPORT_REQUESTED', options)
    setOpen(false)
  }

  const disabled = !trajectory

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={
          'group flex items-center gap-2 rounded-sm border px-3 py-2 text-[12px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ' +
          (open
            ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(0,229,255,0.18)]'
            : 'border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300')
        }
      >
        <Download size={15} strokeWidth={1.75} className="text-cyan-400/80" />
        导出
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          className={'transition-transform text-slate-400 ' + (open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] z-50 rounded-sm border border-slate-700/80 bg-slate-950/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="border-b border-slate-800/80 px-3 py-2.5 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">导出选项</span>
            <label
              className={
                'flex items-center gap-1.5 rounded-sm border px-2 py-1 cursor-pointer text-[10px] transition-all ' +
                (highlightedOnly
                  ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:text-slate-200')
              }
            >
              <Check size={10} className={highlightedOnly ? 'opacity-100' : 'opacity-0'} />
              仅高亮元素
              <input
                type="checkbox"
                className="hidden"
                checked={highlightedOnly}
                onChange={(e) => setHighlightedOnly(e.target.checked)}
              />
            </label>
          </div>
          <div className="p-2 space-y-1">
            {EXPORT_ITEMS.map((item) => {
              const showOption = item.supportHighlighted && highlightedOnly
              return (
                <button
                  key={item.type}
                  onClick={() => handleExport(item.type, item.supportHighlighted && highlightedOnly)}
                  className={
                    'group w-full flex items-center gap-3 rounded-sm border p-2.5 text-left transition-all ' +
                    `border-slate-800/60 bg-slate-900/40 hover:${item.accent}`
                  }
                >
                  <div
                    className={
                      'flex h-9 w-9 items-center justify-center rounded-sm border flex-shrink-0 transition-colors ' +
                      `border-slate-700/60 bg-slate-800/60 text-slate-300 group-hover:${item.accent.split(' ').slice(-1)[0]}`
                    }
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-slate-200 group-hover:text-inherit">
                        {item.label}
                      </span>
                      {showOption && (
                        <span className="rounded-sm border border-cyan-400/40 bg-cyan-500/10 px-1 py-0.5 text-[9px] text-cyan-300 font-mono">
                          HL
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportMenu
