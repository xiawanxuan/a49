import React, { useCallback, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, FastForward, Rewind } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { IconButton } from '@/components/common/IconButton'

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4]

interface PlaybackControlsProps {
  controller: {
    toggle: () => void
    nextFrame: () => void
    prevFrame: () => void
    seekTo: (frame: number) => void
    setSpeed: (s: number) => void
    setDirection: (d: 1 | -1) => void
    getState: () => { isPlaying: boolean; currentFrame: number; playbackSpeed: number; direction: 1 | -1 }
  } | null
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ controller }) => {
  const trajectory = useAppStore((s) => s.trajectory)
  const playback = useAppStore((s) => s.playback)
  const setPlayback = useAppStore((s) => s.setPlayback)
  const sliderRef = useRef<HTMLInputElement>(null)
  const draggingRef = useRef(false)

  const onSeek = useCallback((frame: number) => {
    if (controller) controller.seekTo(frame)
    else setPlayback({ currentFrame: frame })
  }, [controller, setPlayback])

  const onTogglePlay = useCallback(() => {
    if (controller) controller.toggle()
    else setPlayback({ isPlaying: !playback.isPlaying })
  }, [controller, playback.isPlaying, setPlayback])

  const onPrevFrame = useCallback(() => {
    if (controller) controller.prevFrame()
    else if (trajectory) {
      const prev = (playback.currentFrame - 1 + trajectory.totalFrames) % trajectory.totalFrames
      setPlayback({ currentFrame: prev })
    }
  }, [controller, trajectory, playback.currentFrame, setPlayback])

  const onNextFrame = useCallback(() => {
    if (controller) controller.nextFrame()
    else if (trajectory) {
      const next = (playback.currentFrame + 1) % trajectory.totalFrames
      setPlayback({ currentFrame: next })
    }
  }, [controller, trajectory, playback.currentFrame, setPlayback])

  const onReset = useCallback(() => {
    onSeek(0)
  }, [onSeek])

  const onSpeedChange = useCallback((s: number) => {
    if (controller) controller.setSpeed(s)
    else setPlayback({ playbackSpeed: s })
  }, [controller, setPlayback])

  const onDirectionToggle = useCallback(() => {
    const newDir: 1 | -1 = playback.direction === 1 ? -1 : 1
    if (controller) controller.setDirection(newDir)
    else setPlayback({ direction: newDir })
  }, [playback.direction, controller, setPlayback])

  const onSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    draggingRef.current = true
    onSeek(parseInt(e.target.value, 10))
  }

  const onSliderChange = () => {
    draggingRef.current = false
  }

  useEffect(() => {
    if (draggingRef.current || !sliderRef.current) return
    sliderRef.current.value = String(playback.currentFrame)
  }, [playback.currentFrame])

  const disabled = !trajectory

  const progressPct = trajectory
    ? (playback.currentFrame / Math.max(1, trajectory.totalFrames - 1)) * 100
    : 0

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 px-1">
            帧进度
          </span>
          <span className="font-mono text-[12px] tabular-nums text-slate-300">
            <span className="text-cyan-300">{trajectory ? playback.currentFrame + 1 : '--'}</span>
            <span className="text-slate-600"> / </span>
            <span>{trajectory ? trajectory.totalFrames : '--'}</span>
          </span>
        </div>

        <div className="relative px-1">
          <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500/80 to-cyan-300 transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={Math.max(0, (trajectory?.totalFrames ?? 1) - 1)}
            step={1}
            defaultValue={0}
            disabled={disabled}
            onInput={onSliderInput}
            onChange={onSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="帧跳转滑块"
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500 tabular-nums px-1">
          <span>Frame 1</span>
          <span>Frame {trajectory?.totalFrames ?? '--'}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 px-1">
            播放控制
          </span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <IconButton
            icon={<RotateCcw />}
            label="回到第0帧"
            size="sm"
            variant="default"
            disabled={disabled}
            onClick={onReset}
          />
          <IconButton
            icon={<Rewind />}
            label="反向播放"
            size="sm"
            variant={playback.direction === -1 ? 'primary' : 'default'}
            active={playback.direction === -1}
            disabled={disabled}
            onClick={onDirectionToggle}
          />
          <IconButton
            icon={<SkipBack />}
            label="上一帧"
            size="md"
            variant="default"
            disabled={disabled}
            onClick={onPrevFrame}
          />
          <IconButton
            icon={playback.isPlaying ? <Pause /> : <Play />}
            label={playback.isPlaying ? '暂停' : '播放'}
            size="lg"
            variant={playback.isPlaying ? 'primary' : 'primary'}
            active={playback.isPlaying}
            disabled={disabled}
            onClick={onTogglePlay}
            className="!w-14"
          />
          <IconButton
            icon={<SkipForward />}
            label="下一帧"
            size="md"
            variant="default"
            disabled={disabled}
            onClick={onNextFrame}
          />
          <IconButton
            icon={<FastForward />}
            label="正向播放"
            size="sm"
            variant={playback.direction === 1 ? 'primary' : 'default'}
            active={playback.direction === 1}
            disabled={disabled}
            onClick={() => {
              if (playback.direction !== 1) onDirectionToggle()
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 px-1 flex items-center gap-1.5">
            <Gauge size={11} strokeWidth={1.5} />
            播放倍速
          </span>
          <span className="font-mono text-[12px] tabular-nums text-orange-300">
            {playback.playbackSpeed.toFixed(2)}x
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              disabled={disabled}
              onClick={() => onSpeedChange(s)}
              className={
                'rounded-sm border px-1 py-1.5 text-[11px] font-mono tabular-nums transition-all duration-150 ' +
                (playback.playbackSpeed === s
                  ? 'border-orange-400/70 bg-orange-500/15 text-orange-300 shadow-[0_0_10px_rgba(255,138,61,0.2)]'
                  : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-500/70 hover:text-slate-200') +
                ' disabled:opacity-40 disabled:cursor-not-allowed'
              }
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlaybackControls
