import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Atom, Bond, Frame, Trajectory, ElementFilter } from '@/types'
import { getElementConfig, getElementColor, HIGHLIGHT_CONFIG, BOND_MATERIAL, HIGHLIGHTED_BOND_MATERIAL } from '@/utils/MaterialConfig'
import eventBus from '@/utils/EventBus'

interface ElementGroup {
  element: string
  normalMesh: THREE.InstancedMesh
  highlightMesh: THREE.InstancedMesh
  dummy: THREE.Object3D
  normalCount: number
  highlightCount: number
}

export class RenderKernel {
  private container: HTMLElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls

  private trajectory: Trajectory | null = null
  private currentFrame: Frame | null = null
  private filter: ElementFilter = {
    visibleElements: new Set(),
    highlightedElements: new Set(),
    customColors: {},
  }

  private atomGroups: Map<string, ElementGroup> = new Map()
  private bondGroup: THREE.Group = new THREE.Group()
  private atomGroupParent: THREE.Group = new THREE.Group()

  private sphereGeometry: THREE.SphereGeometry
  private cylinderGeometry: THREE.CylinderGeometry
  private bondDummy: THREE.Object3D = new THREE.Object3D()
  private idMaps: WeakMap<THREE.InstancedMesh, Map<number, number>> = new WeakMap()

  private frameTimeSamples: number[] = []
  private lastFrameTime = 0
  private lastFPSTime = 0
  private fpsFrames = 0
  private resizeObserver: ResizeObserver | null = null
  private animationRaf = 0
  private autoRotate = false
  private autoRotateSpeed = 0.5
  private renderStateCallbacks: Array<() => void> = []
  private disposed = false

  constructor(container: HTMLElement) {
    this.container = container

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x050810, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x050810)
    this.scene.fog = new THREE.Fog(0x050810, 50, 200)

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      2000,
    )
    this.camera.position.set(0, 0, 10)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.8
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 200
    this.controls.autoRotate = false

    this.setupLights()

    this.sphereGeometry = new THREE.SphereGeometry(1, 24, 16)
    this.cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false)

    this.atomGroupParent.name = 'Atoms'
    this.bondGroup.name = 'Bonds'
    this.scene.add(this.atomGroupParent)
    this.scene.add(this.bondGroup)

    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(container)

    this.controls.addEventListener('change', () => this.onCameraChange())
    this.startRenderLoop()
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    this.scene.add(ambient)

    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(5, 8, 6)
    this.scene.add(dir)

    const fill = new THREE.DirectionalLight(0x88ccff, 0.4)
    fill.position.set(-6, -3, -4)
    this.scene.add(fill)

    const rim = new THREE.PointLight(0x00e5ff, 0.6, 50)
    rim.position.set(0, 5, -10)
    this.scene.add(rim)
  }

  private onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / Math.max(1, h)
    this.camera.updateProjectionMatrix()
  }

  private onCameraChange() {
    eventBus.emit('CAMERA_STATE_CHANGED', {
      position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      target: [this.controls.target.x, this.controls.target.y, this.controls.target.z],
      fov: this.camera.fov,
    })
  }

  setTrajectory(traj: Trajectory) {
    this.trajectory = traj
    this.clearAllMeshes()
    this.buildAtomMeshes(traj)
    this.resetCameraForTrajectory(traj)
    if (traj.frames.length > 0) {
      this.updateFrame(traj.frames[0])
    }
  }

  private clearAllMeshes() {
    for (const group of this.atomGroups.values()) {
      group.normalMesh.geometry.dispose()
      ;(group.normalMesh.material as THREE.Material).dispose()
      group.highlightMesh.geometry.dispose()
      ;(group.highlightMesh.material as THREE.Material).dispose()
      this.atomGroupParent.remove(group.normalMesh)
      this.atomGroupParent.remove(group.highlightMesh)
    }
    this.atomGroups.clear()
    this.clearBonds()
  }

  private clearBonds() {
    while (this.bondGroup.children.length > 0) {
      const child = this.bondGroup.children[0] as THREE.Mesh
      child.geometry?.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose())
      } else {
        child.material?.dispose()
      }
      this.bondGroup.remove(child)
    }
  }

  private buildAtomMeshes(traj: Trajectory) {
    const maxAtoms = traj.atomCount

    for (const element of traj.uniqueElements) {
      const config = getElementConfig(element)
      const normalColor = new THREE.Color(config.color)
      const highlightColor = new THREE.Color(HIGHLIGHT_CONFIG.color!)

      const normalMaterial = new THREE.MeshStandardMaterial({
        color: normalColor,
        metalness: config.metalness,
        roughness: config.roughness,
      })

      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: highlightColor,
        metalness: HIGHLIGHT_CONFIG.metalness,
        roughness: HIGHLIGHT_CONFIG.roughness,
        emissive: new THREE.Color(HIGHLIGHT_CONFIG.emissive!),
        emissiveIntensity: HIGHLIGHT_CONFIG.emissiveIntensity ?? 0,
      })

      const normalMesh = new THREE.InstancedMesh(this.sphereGeometry, normalMaterial, maxAtoms)
      const highlightMesh = new THREE.InstancedMesh(this.sphereGeometry, highlightMaterial, maxAtoms)
      normalMesh.count = 0
      highlightMesh.count = 0
      normalMesh.frustumCulled = false
      highlightMesh.frustumCulled = false

      this.idMaps.set(normalMesh, new Map())
      this.idMaps.set(highlightMesh, new Map())

      this.atomGroupParent.add(normalMesh)
      this.atomGroupParent.add(highlightMesh)

      this.atomGroups.set(element, {
        element,
        normalMesh,
        highlightMesh,
        dummy: new THREE.Object3D(),
        normalCount: 0,
        highlightCount: 0,
      })
    }
  }

  private resetCameraForTrajectory(traj: Trajectory) {
    const { centerX, centerY, centerZ, radius } = traj.boundingSphere
    this.controls.target.set(centerX, centerY, centerZ)
    const dist = radius * 2.5
    this.camera.position.set(centerX + dist * 0.7, centerY + dist * 0.5, centerZ + dist)
    this.camera.lookAt(centerX, centerY, centerZ)
    this.controls.update()
  }

  setFilter(filter: ElementFilter) {
    this.filter = filter
    if (this.currentFrame) {
      this.updateAtoms(this.currentFrame)
      this.updateBonds(this.currentFrame)
    }
  }

  setFrame(frameIndex: number) {
    if (!this.trajectory || frameIndex < 0 || frameIndex >= this.trajectory.frames.length) return
    this.updateFrame(this.trajectory.frames[frameIndex])
  }

  private updateFrame(frame: Frame) {
    this.currentFrame = frame
    this.updateAtoms(frame)
    this.updateBonds(frame)
  }

  private updateAtoms(frame: Frame) {
    for (const group of this.atomGroups.values()) {
      group.normalCount = 0
      group.highlightCount = 0
      this.idMaps.get(group.normalMesh)!.clear()
      this.idMaps.get(group.highlightMesh)!.clear()
    }

    for (const atom of frame.atoms) {
      const group = this.atomGroups.get(atom.element)
      if (!group) continue

      const elementColor = getElementColor(atom.element, this.filter.customColors)
      const baseConfig = getElementConfig(atom.element)
      const radius = baseConfig.radius
      const isHighlighted = this.filter.highlightedElements.has(atom.element)
      const isVisible = this.filter.visibleElements.has(atom.element)

      if (!isVisible) continue

      group.dummy.position.set(atom.x, atom.y, atom.z)
      group.dummy.scale.setScalar(radius)
      group.dummy.rotation.set(0, 0, 0)
      group.dummy.updateMatrix()

      const colorMatched = elementColor.toLowerCase() === baseConfig.color.toLowerCase()
      const normalIdMap = this.idMaps.get(group.normalMesh)!
      const highlightIdMap = this.idMaps.get(group.highlightMesh)!

      if (isHighlighted) {
        group.highlightMesh.setMatrixAt(group.highlightCount, group.dummy.matrix)
        highlightIdMap.set(group.highlightCount, atom.id)
        group.highlightCount++
        if (!colorMatched) {
          const c = new THREE.Color(elementColor)
          group.highlightMesh.setColorAt(group.highlightCount - 1, c)
        }
      } else {
        group.normalMesh.setMatrixAt(group.normalCount, group.dummy.matrix)
        normalIdMap.set(group.normalCount, atom.id)
        group.normalCount++
        if (!colorMatched) {
          const c = new THREE.Color(elementColor)
          group.normalMesh.setColorAt(group.normalCount - 1, c)
        }
      }
    }

    for (const group of this.atomGroups.values()) {
      group.normalMesh.count = group.normalCount
      group.highlightMesh.count = group.highlightCount
      group.normalMesh.instanceMatrix.needsUpdate = true
      group.highlightMesh.instanceMatrix.needsUpdate = true
      if (group.normalMesh.instanceColor) group.normalMesh.instanceColor.needsUpdate = true
      if (group.highlightMesh.instanceColor) group.highlightMesh.instanceColor.needsUpdate = true
    }
  }

  private updateBonds(frame: Frame) {
    this.clearBonds()
    const bonds = frame.bonds
    const atomIndex = new Map<number, Atom>()
    for (const a of frame.atoms) atomIndex.set(a.id, a)

    const bondMaterial = new THREE.MeshStandardMaterial({
      color: BOND_MATERIAL.color,
      metalness: BOND_MATERIAL.metalness,
      roughness: BOND_MATERIAL.roughness,
    })
    const hiMaterial = new THREE.MeshStandardMaterial({
      color: HIGHLIGHTED_BOND_MATERIAL.color,
      metalness: HIGHLIGHTED_BOND_MATERIAL.metalness,
      roughness: HIGHLIGHTED_BOND_MATERIAL.roughness,
      emissive: new THREE.Color(HIGHLIGHTED_BOND_MATERIAL.emissive!),
      emissiveIntensity: HIGHLIGHTED_BOND_MATERIAL.emissiveIntensity ?? 0,
    })

    const MAX_BONDS_PER_MESH = 500
    const normalBondMatrices: number[][] = []
    const highlightBondMatrices: number[][] = []

    for (const bond of bonds) {
      const a1 = atomIndex.get(bond.atomId1)
      const a2 = atomIndex.get(bond.atomId2)
      if (!a1 || !a2) continue
      const v1 = this.filter.visibleElements.has(a1.element)
      const v2 = this.filter.visibleElements.has(a2.element)
      if (!v1 || !v2) continue

      const hi =
        this.filter.highlightedElements.has(a1.element) ||
        this.filter.highlightedElements.has(a2.element)

      const matrix = this.computeBondMatrix(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z, bond.length)
      if (hi) highlightBondMatrices.push(matrix)
      else normalBondMatrices.push(matrix)
    }

    this.createBondInstancedMeshes(normalBondMatrices, bondMaterial, MAX_BONDS_PER_MESH)
    this.createBondInstancedMeshes(highlightBondMatrices, hiMaterial, MAX_BONDS_PER_MESH)

    bondMaterial.dispose()
    hiMaterial.dispose()
  }

  private computeBondMatrix(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    length: number,
  ): number[] {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const mz = (z1 + z2) / 2

    const dx = x2 - x1
    const dy = y2 - y1
    const dz = z2 - z1

    this.bondDummy.position.set(mx, my, mz)
    this.bondDummy.scale.set(BOND_MATERIAL.radius, length, BOND_MATERIAL.radius)

    const up = new THREE.Vector3(0, 1, 0)
    const dir = new THREE.Vector3(dx, dy, dz).normalize()
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
    this.bondDummy.quaternion.copy(quat)
    this.bondDummy.updateMatrix()

    const arr = this.bondDummy.matrix.elements
    return [arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7], arr[8], arr[9], arr[10], arr[11], arr[12], arr[13], arr[14], arr[15]]
  }

  private createBondInstancedMeshes(matrices: number[][], material: THREE.Material, maxPerMesh: number) {
    if (matrices.length === 0) return
    const total = matrices.length
    let offset = 0
    while (offset < total) {
      const count = Math.min(maxPerMesh, total - offset)
      const mat = material.clone()
      const mesh = new THREE.InstancedMesh(this.cylinderGeometry, mat, count)
      mesh.frustumCulled = false
      for (let i = 0; i < count; i++) {
        const m = new THREE.Matrix4().fromArray(matrices[offset + i])
        mesh.setMatrixAt(i, m)
      }
      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
      this.bondGroup.add(mesh)
      offset += count
    }
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled
    this.controls.autoRotate = enabled
    this.controls.autoRotateSpeed = this.autoRotateSpeed
  }

  setCameraState(position: [number, number, number], target: [number, number, number], fov?: number) {
    this.camera.position.set(position[0], position[1], position[2])
    this.controls.target.set(target[0], target[1], target[2])
    if (fov) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
    this.controls.update()
  }

  getCameraState() {
    return {
      position: [this.camera.position.x, this.camera.position.y, this.camera.position.z] as [number, number, number],
      target: [this.controls.target.x, this.controls.target.y, this.controls.target.z] as [number, number, number],
      fov: this.camera.fov,
    }
  }

  captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera)
    return this.renderer.domElement.toDataURL('image/png')
  }

  getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  private startRenderLoop() {
    const loop = () => {
      if (this.disposed) return
      const t = performance.now()
      const dt = this.lastFrameTime ? (t - this.lastFrameTime) / 1000 : 0
      this.lastFrameTime = t

      this.controls.update()
      for (const cb of this.renderStateCallbacks) cb()
      this.renderer.render(this.scene, this.camera)

      this.frameTimeSamples.push(dt * 1000)
      if (this.frameTimeSamples.length > 60) this.frameTimeSamples.shift()

      this.fpsFrames++
      if (t - this.lastFPSTime >= 1000) {
        const fps = (this.fpsFrames * 1000) / (t - this.lastFPSTime)
        const avgFrameTime =
          this.frameTimeSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimeSamples.length)
        eventBus.emit('RENDER_PERFORMANCE', {
          fps: Math.round(fps),
          frameTime: avgFrameTime,
          drawCalls: this.renderer.info.render.calls,
          atomCount: this.trajectory?.atomCount ?? 0,
          bondCount: this.currentFrame?.bonds.length ?? 0,
        })
        this.fpsFrames = 0
        this.lastFPSTime = t
      }

      this.animationRaf = requestAnimationFrame(loop)
    }
    this.animationRaf = requestAnimationFrame(loop)
  }

  addRenderCallback(cb: () => void) {
    this.renderStateCallbacks.push(cb)
    return () => {
      this.renderStateCallbacks = this.renderStateCallbacks.filter((c) => c !== cb)
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationRaf)
    this.resizeObserver?.disconnect()
    this.clearAllMeshes()
    this.controls.dispose()
    this.sphereGeometry.dispose()
    this.cylinderGeometry.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
