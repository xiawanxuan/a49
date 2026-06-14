import React, { useEffect, useRef, useState } from 'react'
import type { Trajectory, ExportOptions, CameraState, ElementFilter } from '@/types'
import { RenderKernel } from '@/core/RenderKernel'
import { PlaybackController } from '@/core/PlaybackController'
import { CameraController } from '@/core/CameraController'
import { FilterHighlighter } from '@/core/FilterHighlighter'
import { Exporter } from '@/core/Exporter'
import eventBus from '@/utils/EventBus'
import { useAppStore } from '@/store/useAppStore'
import { HUD } from '@/components/common/HUD'
import { Atom, Loader2, AlertTriangle } from 'lucide-react'

export interface CenterCanvasHandles {
  playbackController: PlaybackController | null
  cameraController: CameraController | null
}

export const CenterCanvas: React.FC<{
  onReady: (h: CenterCanvasHandles) => void
}> = ({ onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const kernelRef = useRef<RenderKernel | null>(null)
  const playbackRef = useRef<PlaybackController | null>(null)
  const cameraCtrlRef = useRef<CameraController | null>(null)
  const filterRef = useRef<FilterHighlighter | null>(null)
  const exporterRef = useRef<Exporter | null>(null)
  const readyRef = useRef(false)

  const trajectory = useAppStore((s) => s.trajectory)
  const filter = useAppStore((s) => s.filter)
  const error = useAppStore((s) => s.error)
  const loading = useAppStore((s) => s.loading)
  const autoRotate = useAppStore((s) => s.autoRotate)
  const playback = useAppStore((s) => s.playback)

  const prevFrameRef = useRef(-1)
  const prevTrajRef = useRef<Trajectory | null>(null)

  useEffect(() => {
    if (!containerRef.current || kernelRef.current) return

    const kernel = new RenderKernel(containerRef.current)
    kernelRef.current = kernel

    const playback = new PlaybackController({
      addRenderCallback: (cb: (dt: number) => void) =>
        kernel.addRenderCallback(() => cb(0.0166)),
    })
    playbackRef.current = playback

    const cameraCtrl = new CameraController(kernel)
    cameraCtrlRef.current = cameraCtrl

    const filterHi = new FilterHighlighter(kernel)
    filterRef.current = filterHi

    const exporter = new Exporter(kernel)
    exporterRef.current = exporter

    readyRef.current = true
    onReady({
      playbackController: playback,
      cameraController: cameraCtrl,
    })

    return () => {
      exporterRef.current = null
      filterRef.current = null
      cameraCtrlRef.current = null
      playbackRef.current = null
      kernel.dispose()
      kernelRef.current = null
      readyRef.current = false
    }
  }, [onReady])

  useEffect(() => {
    if (!kernelRef.current) return
    const offFrame = eventBus.on('FRAME_CHANGED', (f) => {
      if (f !== prevFrameRef.current) {
        prevFrameRef.current = f
        kernelRef.current?.setFrame(f)
        exporterRef.current?.setCurrentFrame(f)
      }
    })
    return offFrame
  }, [])

  useEffect(() => {
    if (!kernelRef.current || !trajectory) return
    if (trajectory !== prevTrajRef.current) {
      prevTrajRef.current = trajectory
      kernelRef.current.setTrajectory(trajectory)
      playbackRef.current?.setTrajectory(trajectory)
      filterRef.current?.setTrajectory(trajectory)
      exporterRef.current?.setTrajectory(trajectory)
      exporterRef.current?.setCurrentFrame(0)
      prevFrameRef.current = 0
    }
  }, [trajectory])

  useEffect(() => {
    kernelRef.current?.setFilter(filter)
    exporterRef.current?.setFilter(filter)
  }, [filter])

  useEffect(() => {
    cameraCtrlRef.current?.setAutoRotate(autoRotate)
  }, [autoRotate])

  useEffect(() => {
    const offCamera = eventBus.on('CAMERA_STATE_CHANGED', (state: CameraState) => {
      exporterRef.current?.setCameraState(state)
    })
    return offCamera
  }, [])

  useEffect(() => {
    const offExport = eventBus.on('EXPORT_REQUESTED', (opts: ExportOptions) => {
      try {
        exporterRef.current?.export(opts)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '导出失败'
        eventBus.emit('ERROR', { message: msg })
      }
    })
    const offError = eventBus.on('ERROR', (e) => {
      useAppStore.getState().setError(e.message)
      setTimeout(() => useAppStore.getState().setError(null), 4000)
    })
    return () => {
      offExport()
      offError()
    }
  }, [])

  useEffect(() => {
    if (!kernelRef.current) return
    if (playback.currentFrame !== prevFrameRef.current) {
      prevFrameRef.current = playback.currentFrame
      kernelRef.current.setFrame(playback.currentFrame)
      exporterRef.current?.setCurrentFrame(playback.currentFrame)
    }
  }, [playback.currentFrame])

  return (
    <main className="relative flex-1 min-w-0 bg-[#050810] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050810] via-[#0a0f1e] to-[#111833]" />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(0,229,255,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,138,61,0.05) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(0,229,255,0.02) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div ref={containerRef} className="absolute inset-0" />

      {!trajectory && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-slate-700/40 bg-slate-900/40 backdrop-blur-md">
              <Atom
                size={44}
                strokeWidth={1.25}
                className="text-cyan-400/60 animate-[spin_16s_linear_infinite]"
              />
            </div>
            <div className="absolute inset-0 rounded-full border border-orange-400/20 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="absolute -inset-4 rounded-full border border-cyan-400/10 animate-[spin_22s_linear_infinite]" />
          </div>
          <div className="text-center space-y-2 max-w-sm px-6">
            <h2 className="text-[18px] font-semibold text-slate-200 tracking-wide">
              等待加载分子轨迹
            </h2>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              从左侧面板上传 <span className="font-mono text-cyan-400/70">.xyz</span> 格式文件，
              <br />
              或点击下方按钮加载示例数据以开始可视化
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-cyan-400" strokeWidth={1.5} />
            <p className="text-[13px] text-slate-300 font-mono tracking-wider">正在解析轨迹数据...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-sm border border-rose-400/40 bg-rose-500/10 backdrop-blur-xl px-4 py-2.5 shadow-[0_0_24px_rgba(244,63,94,0.15)] max-w-md">
          <AlertTriangle size={16} strokeWidth={1.75} className="text-rose-400 flex-shrink-0" />
          <p className="text-[12px] text-rose-200 leading-snug">{error}</p>
        </div>
      )}

      <HUD />

      <div className="pointer-events-none absolute top-4 left-4 z-10 select-none">
        <div className="flex items-center gap-2 rounded-sm border border-slate-700/50 bg-slate-950/50 backdrop-blur-md px-2.5 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
            Live Render · WebGL2
          </span>
        </div>
      </div>
    </main>
  )
}

export default CenterCanvas
