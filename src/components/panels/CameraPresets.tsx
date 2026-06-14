import React, { useCallback, useState } from 'react'
import { Camera, Eye, Plus, Trash2, RefreshCw, RotateCw, ChevronDown, ChevronUp, ZoomIn, ZoomOut } from 'lucide-react'
import type { CameraState } from '@/types'
import { useAppStore } from '@/store/useAppStore'

interface CameraPresetsProps {
  controller: {
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

export const CameraPresets: React.FC<CameraPresetsProps> = ({ controller }) => {
  const cameraPresets = useAppStore((s) => s.cameraPresets)
  const addCameraPreset = useAppStore((s) => s.addCameraPreset)
  const deleteCameraPreset = useAppStore((s) => s.deleteCameraPreset)
  const autoRotate = useAppStore((s) => s.autoRotate)
  const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate)
  const trajectory = useAppStore((s) => s.trajectory)
  const [expanded, setExpanded] = useState(true)

  const builtinPresets = controller?.getBuiltinPresets() ?? []

  const handleSave = useCallback(() => {
    if (!controller || !trajectory) return
    const name = `视角 ${cameraPresets.length + 1}`
    const preset = controller.captureCurrent(name)
    addCameraPreset(preset)
  }, [controller, trajectory, cameraPresets.length, addCameraPreset])

  const handleApplyPreset = useCallback((id: string) => {
    controller?.applyPreset(id)
  }, [controller])

  const handleApplyCustom = useCallback((state: CameraState) => {
    controller?.applyCustom(state)
  }, [controller])

  const handleReset = useCallback(() => {
    controller?.resetToDefault()
  }, [controller])

  const handleAutoRotate = useCallback(() => {
    if (controller) controller.toggleAutoRotate()
    else toggleAutoRotate()
  }, [controller, toggleAutoRotate])

  const disabled = !trajectory

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-1"
      >
        <span className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Camera size={11} strokeWidth={1.5} />
          视角控制
        </span>
        {expanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
      </button>

      {expanded && (
        <>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {builtinPresets.map((p) => (
                <button
                  key={p.id}
                  disabled={disabled}
                  onClick={() => handleApplyPreset(p.id!)}
                  className="flex flex-col items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/40 py-2 px-1 text-[10px] text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:opacity-50"
                >
                  <Eye size={14} strokeWidth={1.5} className="text-slate-400" />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                disabled={disabled}
                onClick={handleReset}
                className="flex flex-col items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/40 py-2 px-1 text-[10px] text-slate-300 transition-all hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
                title="重置视角"
              >
                <RefreshCw size={14} strokeWidth={1.5} className="text-slate-400" />
                重置
              </button>
              <button
                disabled={disabled}
                onClick={() => controller?.zoom(0.8)}
                className="flex flex-col items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/40 py-2 px-1 text-[10px] text-slate-300 transition-all hover:border-slate-500/80 hover:text-slate-200 disabled:opacity-50"
                title="放大"
              >
                <ZoomIn size={14} strokeWidth={1.5} className="text-slate-400" />
                放大
              </button>
              <button
                disabled={disabled}
                onClick={() => controller?.zoom(1.25)}
                className="flex flex-col items-center gap-1 rounded-sm border border-slate-700/60 bg-slate-900/40 py-2 px-1 text-[10px] text-slate-300 transition-all hover:border-slate-500/80 hover:text-slate-200 disabled:opacity-50"
                title="缩小"
              >
                <ZoomOut size={14} strokeWidth={1.5} className="text-slate-400" />
                缩小
              </button>
              <button
                disabled={disabled}
                onClick={handleAutoRotate}
                className={
                  'flex flex-col items-center gap-1 rounded-sm border py-2 px-1 text-[10px] transition-all disabled:opacity-50 ' +
                  (autoRotate
                    ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300')
                }
                title={autoRotate ? '停止自动旋转' : '自动旋转'}
              >
                <RotateCw size={14} strokeWidth={1.5} className={autoRotate ? 'text-cyan-400 animate-spin-slow' : 'text-slate-400'} />
                自转
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 px-1">自定义视角</span>
              <button
                onClick={handleSave}
                disabled={disabled}
                className="flex items-center gap-1 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Plus size={10} strokeWidth={1.75} />
                保存当前
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {cameraPresets.length === 0 ? (
                <div className="rounded-sm border border-dashed border-slate-800/80 py-2 text-center text-[10px] text-slate-600">
                  暂无保存的视角
                </div>
              ) : (
                cameraPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group flex items-center justify-between rounded-sm border border-slate-700/60 bg-slate-900/40 pl-2.5 pr-1 py-1.5"
                  >
                    <button
                      disabled={disabled}
                      onClick={() => handleApplyCustom(preset)}
                      className="flex-1 text-left text-[11px] text-slate-300 hover:text-cyan-300 truncate disabled:opacity-50"
                    >
                      {preset.name ?? preset.id}
                    </button>
                    <button
                      onClick={() => deleteCameraPreset(preset.id!)}
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除视角"
                    >
                      <Trash2 size={11} strokeWidth={1.75} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CameraPresets
