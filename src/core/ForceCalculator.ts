import type { Atom, ForceVector, ForceVisualizationConfig } from '@/types'
import { getElementRadius } from '@/utils/MaterialConfig'

const LJ_EPSILON = 0.05
const CELL_SIZE = 5.0

interface SpatialHashCell {
  atoms: Atom[]
}

export class ForceCalculator {
  private spatialHash: Map<string, SpatialHashCell> = new Map()

  private getCellKey(cx: number, cy: number, cz: number): string {
    return `${cx},${cy},${cz}`
  }

  private buildSpatialHash(atoms: Atom[]): void {
    this.spatialHash.clear()
    for (const atom of atoms) {
      const cx = Math.floor(atom.x / CELL_SIZE)
      const cy = Math.floor(atom.y / CELL_SIZE)
      const cz = Math.floor(atom.z / CELL_SIZE)
      const key = this.getCellKey(cx, cy, cz)
      if (!this.spatialHash.has(key)) {
        this.spatialHash.set(key, { atoms: [] })
      }
      this.spatialHash.get(key)!.atoms.push(atom)
    }
  }

  private getNeighborAtoms(atom: Atom): Atom[] {
    const neighbors: Atom[] = []
    const cx = Math.floor(atom.x / CELL_SIZE)
    const cy = Math.floor(atom.y / CELL_SIZE)
    const cz = Math.floor(atom.z / CELL_SIZE)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = this.getCellKey(cx + dx, cy + dy, cz + dz)
          const cell = this.spatialHash.get(key)
          if (cell) {
            for (const a of cell.atoms) {
              if (a.id !== atom.id) {
                neighbors.push(a)
              }
            }
          }
        }
      }
    }
    return neighbors
  }

  calculateForces(atoms: Atom[], config: ForceVisualizationConfig): ForceVector[] {
    if (atoms.length < 2) return []

    this.buildSpatialHash(atoms)
    const forces: ForceVector[] = []
    const processed = new Set<string>()

    for (const atom1 of atoms) {
      const neighbors = this.getNeighborAtoms(atom1)
      const r1 = getElementRadius(atom1.element)

      for (const atom2 of neighbors) {
        const pairKey = atom1.id < atom2.id
          ? `${atom1.id}-${atom2.id}`
          : `${atom2.id}-${atom1.id}`

        if (processed.has(pairKey)) continue
        processed.add(pairKey)

        const dx = atom2.x - atom1.x
        const dy = atom2.y - atom1.y
        const dz = atom2.z - atom1.z
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (r < 0.1 || r > CELL_SIZE * 2) continue

        const r2 = getElementRadius(atom2.element)
        const sigma = r1 + r2

        const sOverR = sigma / r
        const sOverR6 = Math.pow(sOverR, 6)
        const sOverR12 = sOverR6 * sOverR6

        const magnitude = 24 * LJ_EPSILON / r * (2 * sOverR12 - sOverR6)
        const absMag = Math.abs(magnitude)

        if (absMag < config.minMagnitude || absMag > config.maxMagnitude) continue

        const isRepulsive = magnitude > 0
        const type = isRepulsive ? 'repulsive' : 'attractive'

        if (type === 'attractive' && !config.showAttractive) continue
        if (type === 'repulsive' && !config.showRepulsive) continue

        forces.push({
          atomId1: atom1.id,
          atomId2: atom2.id,
          x1: atom1.x,
          y1: atom1.y,
          z1: atom1.z,
          x2: atom2.x,
          y2: atom2.y,
          z2: atom2.z,
          magnitude: absMag,
          type,
        })
      }
    }

    return forces
  }

  dispose(): void {
    this.spatialHash.clear()
  }
}

export default ForceCalculator
