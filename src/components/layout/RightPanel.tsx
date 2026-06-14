import React from 'react'
import { ElementFilter } from '@/components/panels/ElementFilter'

export const RightPanel: React.FC = () => {
  return (
    <aside className="relative z-10 flex h-full w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-800/80 bg-slate-950/60 backdrop-blur-xl p-4 custom-scrollbar">
      <section className="space-y-2 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-px flex-1 bg-gradient-to-r from-slate-700/60 via-slate-700/60 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            元素筛选高亮
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-slate-700/60 via-slate-700/60 to-transparent" />
        </div>
        <div className="flex-1 min-h-0">
          <ElementFilter />
        </div>
      </section>

      <section className="space-y-2 pt-1">
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-px flex-1 bg-gradient-to-r from-slate-700/60 via-slate-700/60 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            元素图例
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-slate-700/60 via-slate-700/60 to-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-sm border border-slate-800/60 bg-slate-900/30 p-2.5">
          {[
            { e: 'H', c: '#FFFFFF', n: '氢' },
            { e: 'C', c: '#404040', n: '碳' },
            { e: 'N', c: '#3050F8', n: '氮' },
            { e: 'O', c: '#FF0D0D', n: '氧' },
            { e: 'S', c: '#FFFF30', n: '硫' },
            { e: 'P', c: '#FF8000', n: '磷' },
          ].map((item) => (
            <div
              key={item.e}
              className="flex flex-col items-center gap-0.5 rounded-sm border border-slate-800/80 bg-slate-950/60 py-1.5"
            >
              <div
                className="h-5 w-5 rounded-full shadow-inner"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${item.c}, ${item.c}cc)`,
                  boxShadow: 'inset 0 0 6px rgba(255,255,255,0.2)',
                }}
              />
              <span className="text-[10px] font-mono text-slate-300">{item.e}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

export default RightPanel
