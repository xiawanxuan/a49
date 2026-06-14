import type { CameraState } from '@/types'
import eventBus from '@/utils/EventBus'

type RenderKernelLike = {
  setCameraState: (p: [number, number, number], t: [number, number, number], fov?: number) => void
  getCameraState: () => CameraState
  setAutoRotate: (v: boolean) => void
}

export class CameraController {
  private kernel: RenderKernelLike
  private presets: CameraState[] = []
  private autoRotate = false

  constructor(kernel: RenderKernelLike) {
    this.kernel = kernel
    this.setupPresets()
  }

  private setupPresets() {
    this.presets = [
      { id: 'front', name: '正视图', position: [0, 0, 10], target: [0, 0, 0], fov: 50 },
      { id: 'top', name: '俯视图', position: [0, 10, 0.001], target: [0, 0, 0], fov: 50 },
      { id: 'side', name: '侧视图', position: [10, 0, 0], target: [0, 0, 0], fov: 50 },
      { id: 'iso', name: '等轴测', position: [7, 7, 7], target: [0, 0, 0], fov: 50 },
    ]
  }

  resetToDefault() {
    this.applyPreset('iso')
  }

  getBuiltinPresets(): CameraState[] {
    return [...this.presets]
  }

  applyPreset(id: string) {
    const preset = this.presets.find((p) => p.id === id)
    if (preset) {
      this.kernel.setCameraState(preset.position, preset.target, preset.fov)
    }
  }

  applyCustom(state: CameraState) {
    this.kernel.setCameraState(state.position, state.target, state.fov)
  }

  captureCurrent(name?: string): CameraState {
    const current = this.kernel.getCameraState()
    return { ...current, name, id: `preset_${Date.now()}` }
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled
    this.kernel.setAutoRotate(enabled)
    eventBus.emit('AUTO_ROTATE_TOGGLED', enabled)
  }

  toggleAutoRotate() {
    this.setAutoRotate(!this.autoRotate)
  }

  isAutoRotating(): boolean {
    return this.autoRotate
  }

  zoom(factor: number) {
    const state = this.kernel.getCameraState()
    const dx = state.position[0] - state.target[0]
    const dy = state.position[1] - state.target[1]
    const dz = state.position[2] - state.target[2]
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const newLen = Math.max(0.5, len * factor)
    const scale = newLen / Math.max(0.001, len)
    const newPos: [number, number, number] = [
      state.target[0] + dx * scale,
      state.target[1] + dy * scale,
      state.target[2] + dz * scale,
    ]
    this.kernel.setCameraState(newPos, state.target, state.fov)
  }
}
