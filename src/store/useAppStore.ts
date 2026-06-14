import { create } from 'zustand'
import type { Trajectory, CameraState, PlaybackState, ElementFilter } from '@/types'
import eventBus from '@/utils/EventBus'

interface AppState {
  trajectory: Trajectory | null
  playback: PlaybackState
  filter: ElementFilter
  cameraPresets: CameraState[]
  autoRotate: boolean
  loading: boolean
  error: string | null

  setTrajectory: (traj: Trajectory | null) => void
  setPlayback: (partial: Partial<PlaybackState>) => void
  setFilter: (partial: Partial<ElementFilter>) => void
  toggleElementVisible: (element: string) => void
  toggleElementHighlight: (element: string) => void
  setCustomColor: (element: string, color: string) => void
  resetFilter: () => void
  addCameraPreset: (preset: CameraState) => void
  deleteCameraPreset: (id: string) => void
  toggleAutoRotate: () => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  trajectory: null,
  playback: {
    isPlaying: false,
    currentFrame: 0,
    playbackSpeed: 1.0,
    direction: 1,
  },
  filter: {
    visibleElements: new Set(),
    highlightedElements: new Set(),
    customColors: {},
  },
  cameraPresets: [],
  autoRotate: false,
  loading: false,
  error: null,

  setTrajectory: (traj) => {
    if (traj) {
      const all = new Set(traj.uniqueElements)
      set({
        trajectory: traj,
        filter: {
          visibleElements: all,
          highlightedElements: new Set(),
          customColors: {},
        },
        playback: {
          isPlaying: false,
          currentFrame: 0,
          playbackSpeed: get().playback.playbackSpeed,
          direction: 1,
        },
      })
      eventBus.emit('TRAJECTORY_LOADED', traj)
      eventBus.emit('ELEMENT_FILTER_CHANGED', {
        visibleElements: all,
        highlightedElements: new Set(),
        customColors: {},
      })
    } else {
      set({
        trajectory: null,
        filter: { visibleElements: new Set(), highlightedElements: new Set(), customColors: {} },
      })
    }
  },

  setPlayback: (partial) => {
    const newPlayback = { ...get().playback, ...partial }
    set({ playback: newPlayback })
    eventBus.emit('PLAYBACK_STATE_CHANGED', newPlayback)
    if (partial.currentFrame !== undefined) {
      eventBus.emit('FRAME_CHANGED', partial.currentFrame)
    }
  },

  setFilter: (partial) => {
    const newFilter = { ...get().filter, ...partial }
    set({ filter: newFilter })
    eventBus.emit('ELEMENT_FILTER_CHANGED', newFilter)
  },

  toggleElementVisible: (element) => {
    const vis = new Set(get().filter.visibleElements)
    if (vis.has(element)) vis.delete(element)
    else vis.add(element)
    get().setFilter({ visibleElements: vis })
  },

  toggleElementHighlight: (element) => {
    const hi = new Set(get().filter.highlightedElements)
    if (hi.has(element)) hi.delete(element)
    else hi.add(element)
    get().setFilter({ highlightedElements: hi })
  },

  setCustomColor: (element, color) => {
    const colors = { ...get().filter.customColors, [element]: color }
    get().setFilter({ customColors: colors })
  },

  resetFilter: () => {
    const traj = get().trajectory
    if (!traj) return
    const all = new Set(traj.uniqueElements)
    get().setFilter({
      visibleElements: all,
      highlightedElements: new Set(),
      customColors: {},
    })
  },

  addCameraPreset: (preset) => {
    const id = preset.id ?? `preset_${Date.now()}`
    const finalPreset = { ...preset, id }
    set({ cameraPresets: [...get().cameraPresets, finalPreset] })
    eventBus.emit('CAMERA_PRESET_SAVED', finalPreset)
  },

  deleteCameraPreset: (id) => {
    set({ cameraPresets: get().cameraPresets.filter((p) => p.id !== id) })
    eventBus.emit('CAMERA_PRESET_DELETED', id)
  },

  toggleAutoRotate: () => {
    const v = !get().autoRotate
    set({ autoRotate: v })
    eventBus.emit('AUTO_ROTATE_TOGGLED', v)
  },

  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}))
