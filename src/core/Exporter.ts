import type { Trajectory, ExportOptions, ExportType, CameraState, ElementFilter } from '@/types'
import type { ElementFilter as StoreFilter } from '@/types'

type RenderKernelLike = {
  captureScreenshot: () => string
}

export class Exporter {
  private trajectory: Trajectory | null = null
  private kernel: RenderKernelLike
  private cameraState: CameraState | null = null
  private filter: StoreFilter | null = null
  private currentFrame = 0

  constructor(kernel: RenderKernelLike) {
    this.kernel = kernel
  }

  setTrajectory(traj: Trajectory | null) {
    this.trajectory = traj
  }

  setCameraState(state: CameraState) {
    this.cameraState = state
  }

  setFilter(filter: StoreFilter) {
    this.filter = filter
  }

  setCurrentFrame(frame: number) {
    this.currentFrame = frame
  }

  export(options: ExportOptions) {
    switch (options.type) {
      case 'currentFrameXYZ':
        return this.exportCurrentFrameXYZ(options)
      case 'selectedAtomsTrajectory':
        return this.exportSelectedTrajectory(options)
      case 'screenshotPNG':
        return this.exportScreenshot(options)
      case 'parametersJSON':
        return this.exportParametersJSON(options)
      default:
        throw new Error(`不支持的导出类型: ${options.type}`)
    }
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  private exportCurrentFrameXYZ(options: ExportOptions) {
    if (!this.trajectory) throw new Error('没有可导出的轨迹数据')
    const frame = this.trajectory.frames[this.currentFrame]
    if (!frame) throw new Error('帧索引无效')

    const highlightOnly = options.highlightedOnly ?? false
    const elements = highlightOnly && this.filter
      ? this.filter.highlightedElements
      : this.filter?.visibleElements ?? new Set(this.trajectory.uniqueElements)

    const atoms = frame.atoms.filter((a) => elements.has(a.element))
    const lines: string[] = []
    lines.push(String(atoms.length))
    lines.push(`Frame ${this.currentFrame} / time=${frame.timestamp.toFixed(4)} exported from MolDynViz`)
    for (const a of atoms) {
      lines.push(`${a.element.padStart(3)} ${a.x.toFixed(6).padStart(12)} ${a.y.toFixed(6).padStart(12)} ${a.z.toFixed(6).padStart(12)}`)
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const baseName = options.fileName ?? this.trajectory.fileName.replace(/\.xyz$/i, '')
    this.downloadBlob(blob, `${baseName}_frame_${this.currentFrame}.xyz`)
  }

  private exportSelectedTrajectory(options: ExportOptions) {
    if (!this.trajectory) throw new Error('没有可导出的轨迹数据')
    const elements = options.highlightedOnly && this.filter
      ? this.filter.highlightedElements
      : this.filter?.visibleElements ?? new Set(this.trajectory.uniqueElements)

    if (elements.size === 0) throw new Error('没有选中任何元素')

    const firstFrame = this.trajectory.frames[0]
    const atomIds = firstFrame.atoms
      .filter((a) => elements.has(a.element))
      .map((a) => a.id)

    const lines: string[] = []
    for (const frame of this.trajectory.frames) {
      const atoms = frame.atoms.filter((a) => atomIds.includes(a.id))
      lines.push(String(atoms.length))
      lines.push(`Frame ${frame.frameIndex} / time=${frame.timestamp.toFixed(4)}`)
      for (const a of atoms) {
        lines.push(`${a.element.padStart(3)} ${a.x.toFixed(6).padStart(12)} ${a.y.toFixed(6).padStart(12)} ${a.z.toFixed(6).padStart(12)}`)
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const baseName = options.fileName ?? this.trajectory.fileName.replace(/\.xyz$/i, '')
    const suffix = options.highlightedOnly ? '_highlighted' : '_visible'
    this.downloadBlob(blob, `${baseName}${suffix}_trajectory.xyz`)
  }

  private exportScreenshot(options: ExportOptions) {
    const dataUrl = this.kernel.captureScreenshot()
    const parts = dataUrl.split(',')
    const binary = atob(parts[1])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'image/png' })
    const baseName = options.fileName ?? (this.trajectory?.fileName.replace(/\.xyz$/i, '') ?? 'molecule')
    this.downloadBlob(blob, `${baseName}_frame_${this.currentFrame}.png`)
  }

  private exportParametersJSON(options: ExportOptions) {
    if (!this.trajectory) throw new Error('没有可导出的参数数据')
    const params = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trajectory: {
        fileName: this.trajectory.fileName,
        fileSizeBytes: this.trajectory.fileSize,
        totalFrames: this.trajectory.totalFrames,
        atomCount: this.trajectory.atomCount,
        uniqueElements: this.trajectory.uniqueElements,
        elementCounts: this.trajectory.elementCounts,
        boundingSphere: this.trajectory.boundingSphere,
      },
      currentState: {
        frameIndex: this.currentFrame,
        frameTime: this.trajectory.frames[this.currentFrame]?.timestamp ?? null,
      },
      filter: this.filter ? {
        visibleElements: Array.from(this.filter.visibleElements),
        highlightedElements: Array.from(this.filter.highlightedElements),
        customColors: this.filter.customColors,
      } : null,
      camera: this.cameraState,
    }
    const json = JSON.stringify(params, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const baseName = options.fileName ?? this.trajectory.fileName.replace(/\.xyz$/i, '')
    this.downloadBlob(blob, `${baseName}_parameters.json`)
  }
}
