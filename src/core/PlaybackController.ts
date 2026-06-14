import type { PlaybackState, Trajectory } from '@/types'
import eventBus from '@/utils/EventBus'
import { useAppStore } from '@/store/useAppStore'

export class PlaybackController {
  private trajectory: Trajectory | null = null
  private state: PlaybackState = {
    isPlaying: false,
    currentFrame: 0,
    playbackSpeed: 1.0,
    direction: 1,
  }
  private frameInterval = 1 / 30
  private accumulator = 0
  private rafId: number | null = null
  private lastTime = 0
  private lastFrameIndex = 0
  private removeRenderCallback: (() => void) | null = null
  private targetFps = 30

  constructor(private readonly options: {
    addRenderCallback: (cb: (dt: number) => void) => () => void
  }) {}

  setTrajectory(traj: Trajectory | null) {
    this.trajectory = traj
    this.stop()
    this.accumulator = 0
    this.setFrame(0)
    this.lastFrameIndex = 0
  }

  play() {
    if (!this.trajectory || this.trajectory.totalFrames <= 1) return
    if (this.state.isPlaying) return
    this.state.isPlaying = true
    this.lastTime = performance.now()
    this.emitState()
    if (!this.removeRenderCallback) {
      this.removeRenderCallback = this.options.addRenderCallback((dt) => this.tick(dt))
    }
  }

  pause() {
    if (!this.state.isPlaying) return
    this.state.isPlaying = false
    this.emitState()
    if (this.removeRenderCallback) {
      this.removeRenderCallback()
      this.removeRenderCallback = null
    }
  }

  toggle() {
    if (this.state.isPlaying) this.pause()
    else this.play()
  }

  stop() {
    this.pause()
    this.accumulator = 0
  }

  nextFrame() {
    if (!this.trajectory) return
    const next = (this.state.currentFrame + 1) % this.trajectory.totalFrames
    this.setFrame(next)
  }

  prevFrame() {
    if (!this.trajectory) return
    const prev = (this.state.currentFrame - 1 + this.trajectory.totalFrames) % this.trajectory.totalFrames
    this.setFrame(prev)
  }

  seekTo(frame: number) {
    if (!this.trajectory) return
    const clamped = Math.max(0, Math.min(this.trajectory.totalFrames - 1, Math.round(frame)))
    this.setFrame(clamped)
  }

  setSpeed(speed: number) {
    this.state.playbackSpeed = Math.max(0.1, Math.min(16, speed))
    this.emitState()
  }

  setDirection(direction: 1 | -1) {
    this.state.direction = direction
    this.emitState()
  }

  setTargetFps(fps: number) {
    this.targetFps = Math.max(1, Math.min(120, fps))
    this.frameInterval = 1 / this.targetFps
  }

  getState(): PlaybackState {
    return { ...this.state }
  }

  private tick(dt: number) {
    if (!this.trajectory || !this.state.isPlaying) return
    this.accumulator += dt * this.state.playbackSpeed

    while (this.accumulator >= this.frameInterval) {
      this.accumulator -= this.frameInterval
      let next = this.state.currentFrame + this.state.direction
      if (next >= this.trajectory.totalFrames) next = 0
      if (next < 0) next = this.trajectory.totalFrames - 1
      this.setFrame(next)
    }
  }

  private setFrame(frameIndex: number) {
    if (frameIndex === this.state.currentFrame && this.lastFrameIndex === frameIndex) return
    this.state.currentFrame = frameIndex
    this.lastFrameIndex = frameIndex
    useAppStore.getState().setPlayback({ currentFrame: frameIndex })
  }

  private emitState() {
    useAppStore.getState().setPlayback({
      isPlaying: this.state.isPlaying,
      playbackSpeed: this.state.playbackSpeed,
      direction: this.state.direction,
    })
  }
}
