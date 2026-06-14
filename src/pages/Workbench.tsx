import React, { useCallback, useRef, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { CenterCanvas, CenterCanvasHandles } from '@/components/layout/CenterCanvas'
import { RightPanel } from '@/components/layout/RightPanel'
import type { CameraState } from '@/types'

export const Workbench: React.FC = () => {
  const handlesRef = useRef<CenterCanvasHandles>({
    playbackController: null,
    cameraController: null,
  })
  const [ready, setReady] = useState(false)

  const handleReady = useCallback((h: CenterCanvasHandles) => {
    handlesRef.current = h
    setReady(true)
  }, [])

  const playbackBridge = ready
    ? {
        toggle: () => handlesRef.current.playbackController?.toggle(),
        nextFrame: () => handlesRef.current.playbackController?.nextFrame(),
        prevFrame: () => handlesRef.current.playbackController?.prevFrame(),
        seekTo: (f: number) => handlesRef.current.playbackController?.seekTo(f),
        setSpeed: (s: number) => handlesRef.current.playbackController?.setSpeed(s),
        setDirection: (d: 1 | -1) => handlesRef.current.playbackController?.setDirection(d),
        getState: () =>
          handlesRef.current.playbackController?.getState() ?? {
            isPlaying: false,
            currentFrame: 0,
            playbackSpeed: 1,
            direction: 1 as const,
          },
      }
    : null

  const cameraBridge: {
    applyPreset: (id: string) => void
    applyCustom: (state: CameraState) => void
    captureCurrent: (name?: string) => CameraState
    resetToDefault: () => void
    toggleAutoRotate: () => void
    isAutoRotating: () => boolean
    zoom: (factor: number) => void
    getBuiltinPresets: () => CameraState[]
  } | null = ready
    ? {
        applyPreset: (id) => handlesRef.current.cameraController?.applyPreset(id),
        applyCustom: (s) => handlesRef.current.cameraController?.applyCustom(s),
        captureCurrent: (name) =>
          handlesRef.current.cameraController?.captureCurrent(name) ?? {
            position: [0, 0, 10] as [number, number, number],
            target: [0, 0, 0] as [number, number, number],
            fov: 50,
            id: 'empty',
          },
        resetToDefault: () => handlesRef.current.cameraController?.resetToDefault(),
        toggleAutoRotate: () => handlesRef.current.cameraController?.toggleAutoRotate(),
        isAutoRotating: () => handlesRef.current.cameraController?.isAutoRotating() ?? false,
        zoom: (f) => handlesRef.current.cameraController?.zoom(f),
        getBuiltinPresets: () => handlesRef.current.cameraController?.getBuiltinPresets() ?? [],
      }
    : null

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#05070f] text-slate-100">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel playbackController={playbackBridge} cameraController={cameraBridge} />
        <CenterCanvas onReady={handleReady} />
        <RightPanel />
      </div>
    </div>
  )
}

export default Workbench
