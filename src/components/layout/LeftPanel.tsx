import React from 'react'
import { FileUploader } from '@/components/panels/FileUploader'
import { PlaybackControls } from '@/components/panels/PlaybackControls'
import { CameraPresets } from '@/components/panels/CameraPresets'
import type { CameraState } from '@/types'

interface LeftPanelProps {
  playbackController: {
    toggle: () => void
    nextFrame: () => void
    prevFrame: () => void
    seekTo: (frame: number) => void
    setSpeed: (s: number) => void
    setDirection: (d: 1 | -1) => void
    getState: () => { isPlaying: boolean; currentFrame: number; playbackSpeed: number; direction: 1 | -1 }
  } | null
  cameraController: {
    applyPreset: (id: string) => void
    applyCustom: (state: CameraState) => void
    captureCurrent: (name?: string) => CameraState
    resetToDefault: () => void
    toggleAutoRotate: () => void
    isAutoRotating: () => boolean
    zoom: (factor: number) => void
    getBuiltinPresets: () => CameraState[]
  } | null
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ playbackController, cameraController }) => {
  return (
    <aside className="relative z-10 flex h-full w-[320px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl p-4 custom-scrollbar">
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/60 to-slate-700/60" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            轨迹数据源
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/60 to-slate-700/60" />
        </div>
        <FileUploader />
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/60 to-slate-700/60" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            帧播放控制
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/60 to-slate-700/60" />
        </div>
        <PlaybackControls controller={playbackController} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/60 to-slate-700/60" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            视角操作
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/60 to-slate-700/60" />
        </div>
        <CameraPresets controller={cameraController} />
      </section>

      <div className="mt-auto pt-2 border-t border-slate-800/60">
        <div className="rounded-sm border border-slate-800/60 bg-slate-900/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">操作提示</p>
          <ul className="space-y-1 text-[10px] text-slate-400 font-mono leading-relaxed">
            <li className="flex items-center gap-2">
              <span className="h-1 w-3 rounded bg-cyan-400/60" />
              左键拖拽 · 旋转视角
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-3 rounded bg-orange-400/60" />
              滚轮 · 缩放画面
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-3 rounded bg-emerald-400/60" />
              右键拖拽 · 平移画面
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}

export default LeftPanel
