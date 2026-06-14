import type { Atom, Bond, Frame, Trajectory } from '@/types'
import { getElementRadius } from '@/utils/MaterialConfig'

const BOND_THRESHOLD_MULTIPLIER = 1.6

function distance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x1 - x2
  const dy = y1 - y2
  const dz = z1 - z2
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function computeBonds(atoms: Atom[]): Bond[] {
  const bonds: Bond[] = []
  const n = atoms.length
  if (n < 2) return bonds

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const a of atoms) {
    if (a.x < minX) minX = a.x
    if (a.y < minY) minY = a.y
    if (a.z < minZ) minZ = a.z
    if (a.x > maxX) maxX = a.x
    if (a.y > maxY) maxY = a.y
    if (a.z > maxZ) maxZ = a.z
  }

  const maxBondDist = 4.0
  const cellSize = maxBondDist
  const cellsX = Math.max(1, Math.ceil((maxX - minX) / cellSize) + 1)
  const cellsY = Math.max(1, Math.ceil((maxY - minY) / cellSize) + 1)
  const cellsZ = Math.max(1, Math.ceil((maxZ - minZ) / cellSize) + 1)

  const grid: Map<string, Atom[]> = new Map()

  for (const a of atoms) {
    const cx = Math.floor((a.x - minX) / cellSize)
    const cy = Math.floor((a.y - minY) / cellSize)
    const cz = Math.floor((a.z - minZ) / cellSize)
    const key = `${cx},${cy},${cz}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key)!.push(a)
  }

  for (let i = 0; i < n; i++) {
    const a1 = atoms[i]
    const cx = Math.floor((a1.x - minX) / cellSize)
    const cy = Math.floor((a1.y - minY) / cellSize)
    const cz = Math.floor((a1.z - minZ) / cellSize)

    const r1 = getElementRadius(a1.element)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = cx + dx
          const ny = cy + dy
          const nz = cz + dz
          if (nx < 0 || ny < 0 || nz < 0 || nx >= cellsX || ny >= cellsY || nz >= cellsZ) continue
          const key = `${nx},${ny},${nz}`
          const cell = grid.get(key)
          if (!cell) continue
          for (const a2 of cell) {
            if (a2.id <= a1.id) continue
            const r2 = getElementRadius(a2.element)
            const threshold = (r1 + r2) * BOND_THRESHOLD_MULTIPLIER
            const dist = distance(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z)
            if (dist <= threshold && dist > 0.01) {
              bonds.push({ atomId1: a1.id, atomId2: a2.id, length: dist })
            }
          }
        }
      }
    }
  }

  return bonds
}

export function parseXYZ(content: string, fileName: string, fileSize: number): Trajectory {
  const lines = content.split(/\r?\n/)
  const frames: Frame[] = []
  const elementSet: Set<string> = new Set()
  const elementCounts: Record<string, number> = {}

  let idx = 0
  let frameIndex = 0
  let atomCount = 0
  let firstFrame = true

  let centerSumX = 0, centerSumY = 0, centerSumZ = 0
  let totalAtomCoordCount = 0
  let maxRadiusFromOrigin = 0

  while (idx < lines.length) {
    const trimmed = lines[idx].trim()
    if (trimmed === '') {
      idx++
      continue
    }

    const countMatch = trimmed.match(/^\d+$/)
    if (!countMatch) {
      idx++
      continue
    }

    const natoms = parseInt(countMatch[0], 10)
    if (isNaN(natoms) || natoms <= 0) {
      idx++
      continue
    }

    if (firstFrame) {
      atomCount = natoms
      firstFrame = false
    }

    idx++
    const commentLine = idx < lines.length ? lines[idx] : ''
    let timestamp = frameIndex
    const tsMatch = commentLine.match(/(?:time|t|timestamp)\s*[=:]\s*(-?\d+\.?\d*)/i)
    if (tsMatch) timestamp = parseFloat(tsMatch[1])
    idx++

    const atoms: Atom[] = []
    for (let i = 0; i < natoms && idx < lines.length; i++, idx++) {
      const line = lines[idx].trim()
      if (!line) {
        i--
        continue
      }
      const parts = line.split(/\s+/)
      if (parts.length < 4) continue
      const element = parts[0].trim()
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue

      const atom: Atom = { id: i, element, x, y, z }
      atoms.push(atom)
      elementSet.add(element)

      centerSumX += x
      centerSumY += y
      centerSumZ += z
      totalAtomCoordCount++
    }

    const bonds = computeBonds(atoms)
    frames.push({ frameIndex, timestamp, atoms, bonds })

    for (const a of atoms) {
      if (frameIndex === 0) {
        elementCounts[a.element] = (elementCounts[a.element] ?? 0) + 1
      }
    }

    frameIndex++
  }

  if (frames.length === 0) {
    throw new Error('无法解析 XYZ 文件：未找到有效帧数据')
  }

  const cx = centerSumX / Math.max(1, totalAtomCoordCount)
  const cy = centerSumY / Math.max(1, totalAtomCoordCount)
  const cz = centerSumZ / Math.max(1, totalAtomCoordCount)

  for (const frame of frames) {
    for (const a of frame.atoms) {
      const dx = a.x - cx
      const dy = a.y - cy
      const dz = a.z - cz
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + getElementRadius(a.element)
      if (d > maxRadiusFromOrigin) maxRadiusFromOrigin = d
    }
  }

  return {
    fileName,
    fileSize,
    totalFrames: frames.length,
    atomCount,
    uniqueElements: Array.from(elementSet).sort(),
    elementCounts,
    frames,
    boundingSphere: {
      centerX: cx,
      centerY: cy,
      centerZ: cz,
      radius: Math.max(1, maxRadiusFromOrigin),
    },
  }
}

export async function parseXYZFile(file: File): Promise<Trajectory> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const content = reader.result as string
        const result = parseXYZ(content, file.name, file.size)
        resolve(result)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('XYZ 解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
