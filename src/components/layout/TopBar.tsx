import React from 'react'
import { Atom, FlaskConical, Github, Info } from 'lucide-react'
import { ExportMenu } from '@/components/panels/ExportMenu'

export const TopBar: React.FC = () => {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-cyan-500/20 via-slate-800/60 to-orange-500/15 border border-cyan-400/30 shadow-[0_0_18px_rgba(0,229,255,0.12)]">
            <Atom size={18} strokeWidth={1.75} className="text-cyan-300" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
            MolDyn
            <span className="text-[10px] font-normal uppercase tracking-[0.2em] text-cyan-400/80 border border-cyan-400/30 bg-cyan-500/10 px-1.5 rounded-sm">
              Viz Lab
            </span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
            <FlaskConical size={9} strokeWidth={1.5} />
            Molecular Dynamics Trajectory Visualizer
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-sm border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          WebGL2 · Three.js · 60 FPS Target
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-700/60 bg-slate-900/40 text-slate-400 transition-all hover:border-slate-500/70 hover:text-slate-200"
          title="关于"
        >
          <Info size={15} strokeWidth={1.75} />
        </button>
        <ExportMenu />
      </div>
    </header>
  )
}

export default TopBar
