import React, { useCallback, useRef } from 'react'
import { Upload, FileText, Database, Clock, Atom, Loader2, Sparkles, Beaker } from 'lucide-react'
import { useFileDrop } from '@/hooks/useFileDrop'
import { parseXYZFile, parseXYZ } from '@/core/XYZParser'
import { useAppStore } from '@/store/useAppStore'
import eventBus from '@/utils/EventBus'
import { generateSampleXYZ, generateProteinLikeSample } from '@/data/sampleTrajectory'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const FileUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const setTrajectory = useAppStore((s) => s.setTrajectory)
  const setLoading = useAppStore((s) => s.setLoading)
  const setError = useAppStore((s) => s.setError)
  const trajectory = useAppStore((s) => s.trajectory)
  const loading = useAppStore((s) => s.loading)

  const handleFile = useCallback(async (file: File) => {
    try {
      setLoading(true)
      setError(null)
      const result = await parseXYZFile(file)
      setTrajectory(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      setError(msg)
      eventBus.emit('ERROR', { message: msg })
    } finally {
      setLoading(false)
    }
  }, [setTrajectory, setLoading, setError])

  const { ref, isOver } = useFileDrop<HTMLDivElement>(handleFile, '.xyz')

  const loadSample = useCallback((mode: 'dense' | 'protein') => {
    try {
      setLoading(true)
      setError(null)
      const content = mode === 'dense' ? generateSampleXYZ(60, 512) : generateProteinLikeSample(30)
      const result = parseXYZ(content, `${mode === 'dense' ? 'dense_crystal' : 'helix_protein'}.xyz`, content.length)
      setTrajectory(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '示例加载失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [setTrajectory, setLoading, setError])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        onClick={() => inputRef.current?.click()}
        className={
          'relative cursor-pointer rounded-sm border-2 border-dashed p-5 transition-all duration-200 ' +
          (isOver
            ? 'border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
            : loading
              ? 'border-slate-600/60 bg-slate-900/50'
              : 'border-slate-700/70 bg-slate-900/40 hover:border-slate-500/70 hover:bg-slate-800/40')
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xyz"
          className="hidden"
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={
              'flex h-12 w-12 items-center justify-center rounded-sm border transition-colors ' +
              (isOver ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 bg-slate-800/60 text-slate-400')
            }
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} strokeWidth={1.5} />
            ) : (
              <Upload size={22} strokeWidth={1.5} />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-slate-200">
              {loading ? '解析轨迹数据中...' : '拖拽 XYZ 文件 或 点击上传'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              支持 .xyz 格式分子动力学轨迹
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 px-1">快速演示</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => loadSample('dense')}
            disabled={loading}
            className="group flex items-center gap-2 rounded-sm border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-left text-[12px] text-slate-300 transition-all hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
          >
            <Sparkles size={14} strokeWidth={1.5} className="text-orange-400/80" />
            <div>
              <div className="font-medium">密集晶体</div>
              <div className="text-[10px] text-slate-500 font-mono">512 原子 · 60 帧</div>
            </div>
          </button>
          <button
            onClick={() => loadSample('protein')}
            disabled={loading}
            className="group flex items-center gap-2 rounded-sm border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-left text-[12px] text-slate-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50"
          >
            <Beaker size={14} strokeWidth={1.5} className="text-emerald-400/80" />
            <div>
              <div className="font-medium">α-螺旋蛋白</div>
              <div className="text-[10px] text-slate-500 font-mono">螺旋结构 · 旋转</div>
            </div>
          </button>
        </div>
      </div>

      {trajectory && (
        <div className="rounded-sm border border-slate-700/60 bg-slate-900/40 p-3 space-y-2">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <FileText size={14} strokeWidth={1.5} className="text-cyan-400/80 flex-shrink-0" />
            <span className="text-[12px] font-medium text-slate-200 truncate">
              {trajectory.fileName}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Database size={11} strokeWidth={1.5} />
              大小
            </div>
            <div className="text-slate-200 text-right tabular-nums">{formatSize(trajectory.fileSize)}</div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={11} strokeWidth={1.5} />
              帧数
            </div>
            <div className="text-slate-200 text-right tabular-nums">{trajectory.totalFrames}</div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Atom size={11} strokeWidth={1.5} />
              原子数
            </div>
            <div className="text-slate-200 text-right tabular-nums">{trajectory.atomCount}</div>
            <div className="col-span-2 pt-1 flex flex-wrap gap-1">
              {trajectory.uniqueElements.map((e) => (
                <span
                  key={e}
                  className="rounded-sm border border-slate-700/80 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                >
                  {e}
                  <span className="ml-1 text-slate-500">×{trajectory.elementCounts[e]}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader
