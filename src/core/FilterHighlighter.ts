import type { ElementFilter, Trajectory } from '@/types'
import eventBus from '@/utils/EventBus'

type RenderKernelLike = {
  setFilter: (f: ElementFilter) => void
}

export class FilterHighlighter {
  private kernel: RenderKernelLike
  private state: ElementFilter = {
    visibleElements: new Set(),
    highlightedElements: new Set(),
    customColors: {},
  }
  private trajectory: Trajectory | null = null

  constructor(kernel: RenderKernelLike) {
    this.kernel = kernel
  }

  setTrajectory(traj: Trajectory | null) {
    this.trajectory = traj
    if (traj) {
      this.state = {
        visibleElements: new Set(traj.uniqueElements),
        highlightedElements: new Set(),
        customColors: {},
      }
    } else {
      this.state = {
        visibleElements: new Set(),
        highlightedElements: new Set(),
        customColors: {},
      }
    }
    this.sync()
  }

  private sync() {
    this.kernel.setFilter({ ...this.state })
    eventBus.emit('ELEMENT_FILTER_CHANGED', {
      visibleElements: new Set(this.state.visibleElements),
      highlightedElements: new Set(this.state.highlightedElements),
      customColors: { ...this.state.customColors },
    })
  }

  getState(): ElementFilter {
    return {
      visibleElements: new Set(this.state.visibleElements),
      highlightedElements: new Set(this.state.highlightedElements),
      customColors: { ...this.state.customColors },
    }
  }

  setVisible(elements: string[]) {
    this.state.visibleElements = new Set(elements)
    this.sync()
  }

  toggleVisible(element: string) {
    if (this.state.visibleElements.has(element)) {
      this.state.visibleElements.delete(element)
    } else {
      this.state.visibleElements.add(element)
    }
    this.sync()
  }

  showAll() {
    if (!this.trajectory) return
    this.state.visibleElements = new Set(this.trajectory.uniqueElements)
    this.sync()
  }

  hideAll() {
    this.state.visibleElements = new Set()
    this.sync()
  }

  setHighlighted(elements: string[]) {
    this.state.highlightedElements = new Set(elements)
    this.sync()
  }

  toggleHighlight(element: string) {
    if (this.state.highlightedElements.has(element)) {
      this.state.highlightedElements.delete(element)
    } else {
      this.state.highlightedElements.add(element)
    }
    this.sync()
  }

  clearHighlight() {
    this.state.highlightedElements = new Set()
    this.sync()
  }

  setCustomColor(element: string, color: string) {
    this.state.customColors[element] = color
    this.sync()
  }

  resetCustomColor(element: string) {
    delete this.state.customColors[element]
    this.sync()
  }

  resetAll() {
    if (!this.trajectory) return
    this.state = {
      visibleElements: new Set(this.trajectory.uniqueElements),
      highlightedElements: new Set(),
      customColors: {},
    }
    this.sync()
  }
}
