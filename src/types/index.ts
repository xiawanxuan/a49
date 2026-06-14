export interface Atom {
  id: number
  element: string
  x: number
  y: number
  z: number
}

export interface Bond {
  atomId1: number
  atomId2: number
  length: number
}

export interface Frame {
  frameIndex: number
  timestamp: number
  atoms: Atom[]
  bonds: Bond[]
}

export interface Trajectory {
  fileName: string
  fileSize: number
  totalFrames: number
  atomCount: number
  uniqueElements: string[]
  elementCounts: Record<string, number>
  frames: Frame[]
  boundingSphere: {
    centerX: number
    centerY: number
    centerZ: number
    radius: number
  }
}

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  name?: string
  id?: string
}

export interface PlaybackState {
  isPlaying: boolean
  currentFrame: number
  playbackSpeed: number
  direction: 1 | -1
}

export interface ElementFilter {
  visibleElements: Set<string>
  highlightedElements: Set<string>
  customColors: Record<string, string>
}

export type ExportType = 'currentFrameXYZ' | 'selectedAtomsTrajectory' | 'screenshotPNG' | 'parametersJSON'

export interface ExportOptions {
  type: ExportType
  highlightedOnly?: boolean
  fileName?: string
}

export interface RenderPerformance {
  fps: number
  frameTime: number
  drawCalls: number
  atomCount: number
  bondCount: number
}

export type EventName =
  | 'TRAJECTORY_LOADED'
  | 'FRAME_CHANGED'
  | 'PLAYBACK_STATE_CHANGED'
  | 'ELEMENT_FILTER_CHANGED'
  | 'CAMERA_STATE_CHANGED'
  | 'CAMERA_PRESET_SAVED'
  | 'CAMERA_PRESET_DELETED'
  | 'EXPORT_REQUESTED'
  | 'RENDER_PERFORMANCE'
  | 'AUTO_ROTATE_TOGGLED'
  | 'ERROR'

export interface EventPayloadMap {
  TRAJECTORY_LOADED: Trajectory
  FRAME_CHANGED: number
  PLAYBACK_STATE_CHANGED: PlaybackState
  ELEMENT_FILTER_CHANGED: ElementFilter
  CAMERA_STATE_CHANGED: CameraState
  CAMERA_PRESET_SAVED: CameraState
  CAMERA_PRESET_DELETED: string
  EXPORT_REQUESTED: ExportOptions
  RENDER_PERFORMANCE: RenderPerformance
  AUTO_ROTATE_TOGGLED: boolean
  ERROR: { message: string; code?: string }
}

export interface ElementMaterialConfig {
  color: string
  radius: number
  metalness: number
  roughness: number
  emissive?: string
  emissiveIntensity?: number
}
