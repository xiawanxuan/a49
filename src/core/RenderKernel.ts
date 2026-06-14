import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Atom, Bond, Frame, Trajectory, ElementFilter, ForceVector, ForceVisualizationConfig } from '@/types'
import { getElementConfig, getElementColor, getElementRadius, HIGHLIGHT_CONFIG, BOND_MATERIAL, HIGHLIGHTED_BOND_MATERIAL } from '@/utils/MaterialConfig'
import { ForceCalculator } from './ForceCalculator'
import eventBus from '@/utils/EventBus'

interface ElementGroup {
  element: string
  normalMesh: THREE.InstancedMesh
  highlightMesh: THREE.InstancedMesh
  dummy: THREE.Object3D
  normalCount: number
  highlightCount: number
  normalColorDirty: boolean
  highlightColorDirty: boolean
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

  private normalBondMeshes: THREE.InstancedMesh[] = []
  private highlightBondMeshes: THREE.InstancedMesh[] = []
  private hideDummy: THREE.Object3D = new THREE.Object3D()

  private forceCalculator: ForceCalculator = new ForceCalculator()
  private forceGroup: THREE.Group = new THREE.Group()
  private forceShaftGeometry: THREE.CylinderGeometry
  private forceHeadGeometry: THREE.ConeGeometry
  private attractiveShaftMeshes: THREE.InstancedMesh[] = []
  private attractiveHeadMeshes: THREE.InstancedMesh[] = []
  private repulsiveShaftMeshes: THREE.InstancedMesh[] = []
  private repulsiveHeadMeshes: THREE.InstancedMesh[] = []
  private forceConfig: ForceVisualizationConfig = {
    enabled: false,
    showAttractive: true,
    showRepulsive: true,
    minMagnitude: 0.01,
    maxMagnitude: 10.0,
    arrowScale: 1.0,
    showLabels: false,
    labelThreshold: 1.0,
  }
  private currentForces: ForceVector[] = []
  private forceDummy: THREE.Object3D = new THREE.Object3D()

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
    this.forceGroup.name = 'Forces'
    this.scene.add(this.atomGroupParent)
    this.scene.add(this.bondGroup)
    this.scene.add(this.forceGroup)

    this.hideDummy.scale.setScalar(0)
    this.hideDummy.updateMatrix()

    this.forceShaftGeometry = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false)
    this.forceHeadGeometry = new THREE.ConeGeometry(1, 1, 8, 1, false)
    this.forceGroup.visible = false

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

    for (const m of this.normalBondMeshes) {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
      this.bondGroup.remove(m)
    }
    for (const m of this.highlightBondMeshes) {
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
      this.bondGroup.remove(m)
    }
    this.normalBondMeshes = []
    this.highlightBondMeshes = []

    this.disposeForceMeshes()
  }

  private disposeForceMeshes() {
    const disposePool = (pool: THREE.InstancedMesh[]) => {
      for (const m of pool) {
        m.geometry.dispose()
        ;(m.material as THREE.Material).dispose()
        this.forceGroup.remove(m)
      }
    }
    disposePool(this.attractiveShaftMeshes)
    disposePool(this.attractiveHeadMeshes)
    disposePool(this.repulsiveShaftMeshes)
    disposePool(this.repulsiveHeadMeshes)
    this.attractiveShaftMeshes = []
    this.attractiveHeadMeshes = []
    this.repulsiveShaftMeshes = []
    this.repulsiveHeadMeshes = []
    this.currentForces = []
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
        normalColorDirty: false,
        highlightColorDirty: false,
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
      if (this.forceConfig.enabled) {
        this.updateForceArrows(this.currentFrame)
      }
    }
  }

  setForceConfig(config: ForceVisualizationConfig) {
    this.forceConfig = config
    if (config.enabled && this.currentFrame) {
      this.updateForceArrows(this.currentFrame)
      this.forceGroup.visible = true
    } else {
      this.forceGroup.visible = false
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
    if (this.forceConfig.enabled) {
      this.updateForceArrows(frame)
    }
  }

  private updateAtoms(frame: Frame) {
    const groupIndices = new Map<ElementGroup, { normalIdx: number; highlightIdx: number }>()

    for (const group of this.atomGroups.values()) {
      group.normalColorDirty = false
      group.highlightColorDirty = false
      this.idMaps.get(group.normalMesh)!.clear()
      this.idMaps.get(group.highlightMesh)!.clear()
      groupIndices.set(group, { normalIdx: 0, highlightIdx: 0 })
    }

    for (const atom of frame.atoms) {
      const group = this.atomGroups.get(atom.element)
      if (!group) continue

      const isVisible = this.filter.visibleElements.has(atom.element)
      if (!isVisible) continue

      const elementColor = getElementColor(atom.element, this.filter.customColors)
      const baseConfig = getElementConfig(atom.element)
      const radius = baseConfig.radius
      const isHighlighted = this.filter.highlightedElements.has(atom.element)

      group.dummy.position.set(atom.x, atom.y, atom.z)
      group.dummy.scale.setScalar(radius)
      group.dummy.rotation.set(0, 0, 0)
      group.dummy.updateMatrix()

      const idx = groupIndices.get(group)!
      const colorMatched = elementColor.toLowerCase() === baseConfig.color.toLowerCase()
      const normalIdMap = this.idMaps.get(group.normalMesh)!
      const highlightIdMap = this.idMaps.get(group.highlightMesh)!

      if (isHighlighted) {
        group.highlightMesh.setMatrixAt(idx.highlightIdx, group.dummy.matrix)
        highlightIdMap.set(idx.highlightIdx, atom.id)
        if (!colorMatched) {
          const c = new THREE.Color(elementColor)
          group.highlightMesh.setColorAt(idx.highlightIdx, c)
          group.highlightColorDirty = true
        }
        idx.highlightIdx++
      } else {
        group.normalMesh.setMatrixAt(idx.normalIdx, group.dummy.matrix)
        normalIdMap.set(idx.normalIdx, atom.id)
        if (!colorMatched) {
          const c = new THREE.Color(elementColor)
          group.normalMesh.setColorAt(idx.normalIdx, c)
          group.normalColorDirty = true
        }
        idx.normalIdx++
      }
    }

    for (const group of this.atomGroups.values()) {
      const idx = groupIndices.get(group)!
      const newNormalCount = idx.normalIdx
      const newHighlightCount = idx.highlightIdx
      const prevNormalCount = group.normalCount
      const prevHighlightCount = group.highlightCount

      for (let i = newNormalCount; i < prevNormalCount; i++) {
        group.normalMesh.setMatrixAt(i, this.hideDummy.matrix)
      }
      for (let i = newHighlightCount; i < prevHighlightCount; i++) {
        group.highlightMesh.setMatrixAt(i, this.hideDummy.matrix)
      }

      group.normalCount = newNormalCount
      group.highlightCount = newHighlightCount
      group.normalMesh.count = newNormalCount
      group.highlightMesh.count = newHighlightCount

      const normalMatrixChanged = newNormalCount > 0 || prevNormalCount > 0
      const highlightMatrixChanged = newHighlightCount > 0 || prevHighlightCount > 0
      if (normalMatrixChanged) {
        group.normalMesh.instanceMatrix.needsUpdate = true
      }
      if (highlightMatrixChanged) {
        group.highlightMesh.instanceMatrix.needsUpdate = true
      }
      if (group.normalColorDirty && group.normalMesh.instanceColor) {
        group.normalMesh.instanceColor.needsUpdate = true
      }
      if (group.highlightColorDirty && group.highlightMesh.instanceColor) {
        group.highlightMesh.instanceColor.needsUpdate = true
      }
    }
  }

  private updateBonds(frame: Frame) {
    const bonds = frame.bonds
    const atomIndex = new Map<number, Atom>()
    for (const a of frame.atoms) atomIndex.set(a.id, a)

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

    this.updateBondMeshPool(this.normalBondMeshes, normalBondMatrices, BOND_MATERIAL, MAX_BONDS_PER_MESH)
    this.updateBondMeshPool(this.highlightBondMeshes, highlightBondMatrices, HIGHLIGHTED_BOND_MATERIAL, MAX_BONDS_PER_MESH)
  }

  private updateBondMeshPool(
    pool: THREE.InstancedMesh[],
    matrices: number[][],
    materialConfig: typeof BOND_MATERIAL,
    maxPerMesh: number,
  ) {
    const total = matrices.length
    const requiredMeshes = total > 0 ? Math.ceil(total / maxPerMesh) : 0

    while (pool.length < requiredMeshes) {
      const isHighlight = materialConfig === HIGHLIGHTED_BOND_MATERIAL
      const matProps: THREE.MeshStandardMaterialParameters = {
        color: materialConfig.color,
        metalness: materialConfig.metalness,
        roughness: materialConfig.roughness,
      }
      if (isHighlight) {
        matProps.emissive = new THREE.Color(HIGHLIGHTED_BOND_MATERIAL.emissive!)
        matProps.emissiveIntensity = HIGHLIGHTED_BOND_MATERIAL.emissiveIntensity ?? 0
      }
      const mat = new THREE.MeshStandardMaterial(matProps)
      const mesh = new THREE.InstancedMesh(this.cylinderGeometry, mat, maxPerMesh)
      mesh.frustumCulled = false
      mesh.count = 0
      this.bondGroup.add(mesh)
      pool.push(mesh)
    }

    let matrixOffset = 0
    for (let meshIndex = 0; meshIndex < pool.length; meshIndex++) {
      const mesh = pool[meshIndex]
      const remaining = total - matrixOffset
      const prevCount = mesh.count

      if (remaining <= 0) {
        if (prevCount > 0) {
          for (let i = 0; i < prevCount; i++) {
            mesh.setMatrixAt(i, this.hideDummy.matrix)
          }
          mesh.instanceMatrix.needsUpdate = true
        }
        mesh.count = 0
        continue
      }

      const count = Math.min(maxPerMesh, remaining)
      for (let i = 0; i < count; i++) {
        const m = new THREE.Matrix4().fromArray(matrices[matrixOffset + i])
        mesh.setMatrixAt(i, m)
      }
      if (count < prevCount) {
        for (let i = count; i < prevCount; i++) {
          mesh.setMatrixAt(i, this.hideDummy.matrix)
        }
      }
      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
      matrixOffset += count
    }
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

  private updateForceArrows(frame: Frame) {
    const visibleAtoms = frame.atoms.filter((a) => this.filter.visibleElements.has(a.element))
    const forces = this.forceCalculator.calculateForces(visibleAtoms, this.forceConfig)
    this.currentForces = forces

    const attractiveForces = forces.filter((f) => f.type === 'attractive')
    const repulsiveForces = forces.filter((f) => f.type === 'repulsive')

    const MAX_FORCES_PER_MESH = 1000
    const scale = this.forceConfig.arrowScale
    const shaftRadius = 0.04 * scale
    const headRadius = 0.12 * scale
    const headLength = 0.35 * scale

    const attractiveShaftMatrices: number[][] = []
    const attractiveHeadMatrices: number[][] = []
    const repulsiveShaftMatrices: number[][] = []
    const repulsiveHeadMatrices: number[][] = []

    for (const force of attractiveForces) {
      const shaftMat = this.computeForceShaftMatrix(force, shaftRadius)
      const headMat = this.computeForceHeadMatrix(force, headRadius, headLength)
      attractiveShaftMatrices.push(shaftMat)
      attractiveHeadMatrices.push(headMat)
    }

    for (const force of repulsiveForces) {
      const shaftMat = this.computeForceShaftMatrix(force, shaftRadius)
      const headMat = this.computeForceHeadMatrix(force, headRadius, headLength)
      repulsiveShaftMatrices.push(shaftMat)
      repulsiveHeadMatrices.push(headMat)
    }

    const attractiveColor = 0x00e5ff
    const repulsiveColor = 0xff6b35

    this.updateForceMeshPool(
      this.attractiveShaftMeshes,
      this.forceShaftGeometry,
      attractiveShaftMatrices,
      attractiveColor,
      MAX_FORCES_PER_MESH,
    )
    this.updateForceMeshPool(
      this.attractiveHeadMeshes,
      this.forceHeadGeometry,
      attractiveHeadMatrices,
      attractiveColor,
      MAX_FORCES_PER_MESH,
    )
    this.updateForceMeshPool(
      this.repulsiveShaftMeshes,
      this.forceShaftGeometry,
      repulsiveShaftMatrices,
      repulsiveColor,
      MAX_FORCES_PER_MESH,
    )
    this.updateForceMeshPool(
      this.repulsiveHeadMeshes,
      this.forceHeadGeometry,
      repulsiveHeadMatrices,
      repulsiveColor,
      MAX_FORCES_PER_MESH,
    )
  }

  private computeForceShaftMatrix(force: ForceVector, radius: number): number[] {
    const midX = (force.x1 + force.x2) / 2
    const midY = (force.y1 + force.y2) / 2
    const midZ = (force.z1 + force.z2) / 2

    const dx = force.x2 - force.x1
    const dy = force.y2 - force.y1
    const dz = force.z2 - force.z1
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz)

    this.forceDummy.position.set(midX, midY, midZ)
    this.forceDummy.scale.set(radius, length * 0.7, radius)

    const up = new THREE.Vector3(0, 1, 0)
    const dir = new THREE.Vector3(dx, dy, dz).normalize()
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
    this.forceDummy.quaternion.copy(quat)
    this.forceDummy.updateMatrix()

    const arr = this.forceDummy.matrix.elements
    return [arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7], arr[8], arr[9], arr[10], arr[11], arr[12], arr[13], arr[14], arr[15]]
  }

  private computeForceHeadMatrix(force: ForceVector, radius: number, headLength: number): number[] {
    const dx = force.x2 - force.x1
    const dy = force.y2 - force.y1
    const dz = force.z2 - force.z1
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const dirX = dx / length
    const dirY = dy / length
    const dirZ = dz / length

    const headPosX = force.x1 + dirX * length * 0.85
    const headPosY = force.y1 + dirY * length * 0.85
    const headPosZ = force.z1 + dirZ * length * 0.85

    this.forceDummy.position.set(headPosX, headPosY, headPosZ)
    this.forceDummy.scale.set(radius, headLength, radius)

    const up = new THREE.Vector3(0, 1, 0)
    const dir = new THREE.Vector3(dirX, dirY, dirZ)
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
    this.forceDummy.quaternion.copy(quat)
    this.forceDummy.updateMatrix()

    const arr = this.forceDummy.matrix.elements
    return [arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7], arr[8], arr[9], arr[10], arr[11], arr[12], arr[13], arr[14], arr[15]]
  }

  private updateForceMeshPool(
    pool: THREE.InstancedMesh[],
    geometry: THREE.BufferGeometry,
    matrices: number[][],
    color: number,
    maxPerMesh: number,
  ) {
    const total = matrices.length
    const requiredMeshes = total > 0 ? Math.ceil(total / maxPerMesh) : 0

    while (pool.length < requiredMeshes) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      })
      const mesh = new THREE.InstancedMesh(geometry, mat, maxPerMesh)
      mesh.frustumCulled = false
      mesh.count = 0
      this.forceGroup.add(mesh)
      pool.push(mesh)
    }

    let matrixOffset = 0
    for (let meshIndex = 0; meshIndex < pool.length; meshIndex++) {
      const mesh = pool[meshIndex]
      const remaining = total - matrixOffset
      const prevCount = mesh.count

      if (remaining <= 0) {
        if (prevCount > 0) {
          for (let i = 0; i < prevCount; i++) {
            mesh.setMatrixAt(i, this.hideDummy.matrix)
          }
          mesh.instanceMatrix.needsUpdate = true
        }
        mesh.count = 0
        continue
      }

      const count = Math.min(maxPerMesh, remaining)
      for (let i = 0; i < count; i++) {
        const m = new THREE.Matrix4().fromArray(matrices[matrixOffset + i])
        mesh.setMatrixAt(i, m)
      }
      if (count < prevCount) {
        for (let i = count; i < prevCount; i++) {
          mesh.setMatrixAt(i, this.hideDummy.matrix)
        }
      }
      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
      matrixOffset += count
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

  getCurrentForceCount(): number {
    return this.currentForces.length
  }

  getAttractiveForceCount(): number {
    return this.currentForces.filter((f) => f.type === 'attractive').length
  }

  getRepulsiveForceCount(): number {
    return this.currentForces.filter((f) => f.type === 'repulsive').length
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationRaf)
    this.resizeObserver?.disconnect()
    this.clearAllMeshes()
    this.controls.dispose()
    this.sphereGeometry.dispose()
    this.cylinderGeometry.dispose()
    this.forceShaftGeometry.dispose()
    this.forceHeadGeometry.dispose()
    this.forceCalculator.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
