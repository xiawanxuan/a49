export function generateSampleXYZ(numFrames = 60, atomCount = 216): string {
  const elements = ['C', 'H', 'O', 'N', 'S']
  const atoms: Array<{ element: string; baseX: number; baseY: number; baseZ: number; amp: number; freq: number; phase: number }> = []

  const gridSize = Math.ceil(Math.cbrt(atomCount))
  const spacing = 2.5
  let generated = 0
  for (let x = 0; x < gridSize && generated < atomCount; x++) {
    for (let y = 0; y < gridSize && generated < atomCount; y++) {
      for (let z = 0; z < gridSize && generated < atomCount; z++) {
        const idx = generated
        const elem = elements[idx % elements.length]
        atoms.push({
          element: elem,
          baseX: (x - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5,
          baseY: (y - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5,
          baseZ: (z - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5,
          amp: 0.3 + Math.random() * 0.8,
          freq: 0.5 + Math.random() * 2.0,
          phase: Math.random() * Math.PI * 2,
        })
        generated++
      }
    }
  }

  const lines: string[] = []
  const totalTime = numFrames / 30

  for (let f = 0; f < numFrames; f++) {
    const t = (f / numFrames) * totalTime
    lines.push(String(atoms.length))
    lines.push(`Frame ${f} / time=${t.toFixed(4)} sample trajectory`)
    for (const a of atoms) {
      const dx = Math.sin(t * a.freq * Math.PI * 2 + a.phase) * a.amp
      const dy = Math.cos(t * a.freq * Math.PI * 2 * 0.7 + a.phase * 1.3) * a.amp
      const dz = Math.sin(t * a.freq * Math.PI * 2 * 1.2 + a.phase * 0.6) * a.amp
      const x = (a.baseX + dx).toFixed(6)
      const y = (a.baseY + dy).toFixed(6)
      const z = (a.baseZ + dz).toFixed(6)
      lines.push(`${a.element.padStart(3)} ${x.padStart(12)} ${y.padStart(12)} ${z.padStart(12)}`)
    }
  }
  return lines.join('\n')
}

export const SAMPLE_XYZ_BENZENE = `12
Benzene molecule - static frame
  C       -1.397000        0.000000        0.000000
  C       -0.698500        1.210000        0.000000
  C        0.698500        1.210000        0.000000
  C        1.397000        0.000000        0.000000
  C        0.698500       -1.210000        0.000000
  C       -0.698500       -1.210000        0.000000
  H       -2.479000        0.000000        0.000000
  H       -1.239500        2.147700        0.000000
  H        1.239500        2.147700        0.000000
  H        2.479000        0.000000        0.000000
  H        1.239500       -2.147700        0.000000
  H       -1.239500       -2.147700        0.000000
`

export function generateProteinLikeSample(numFrames = 30): string {
  const residues = [
    ['N', 'C', 'C', 'O', 'C', 'H', 'H', 'H', 'H', 'H'],
  ]
  const atoms: Array<{ element: string; baseX: number; baseY: number; baseZ: number; amp: number; freq: number; phase: number }> = []

  let atomIndex = 0
  const helixTurns = 8
  const residuesPerTurn = 3.6
  const totalResidues = Math.floor(helixTurns * residuesPerTurn)
  const risePerResidue = 1.5
  const radius = 5.0

  for (let r = 0; r < totalResidues; r++) {
    const angle = (r / residuesPerTurn) * Math.PI * 2
    const z = r * risePerResidue - (totalResidues * risePerResidue) / 2
    const cx = Math.cos(angle) * radius
    const cy = Math.sin(angle) * radius

    const residue = residues[0]
    for (let ai = 0; ai < residue.length; ai++) {
      const elem = residue[ai]
      const localAngle = angle + ai * 0.3
      const localRadius = elem === 'H' ? radius + 1.2 + Math.random() * 0.3 : radius + (ai % 2) * 0.8
      atoms.push({
        element: elem,
        baseX: cx + Math.cos(localAngle) * (localRadius - radius),
        baseY: cy + Math.sin(localAngle) * (localRadius - radius),
        baseZ: z + (ai - residue.length / 2) * 0.4,
        amp: elem === 'H' ? 0.4 : 0.15,
        freq: 1 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      })
      atomIndex++
    }
  }

  const lines: string[] = []
  const totalTime = numFrames / 24
  for (let f = 0; f < numFrames; f++) {
    const t = (f / numFrames) * totalTime
    const globalRot = t * 0.6
    const cos = Math.cos(globalRot)
    const sin = Math.sin(globalRot)
    lines.push(String(atoms.length))
    lines.push(`Frame ${f} / time=${t.toFixed(4)} protein-like helix`)
    for (const a of atoms) {
      const rx = a.baseX * cos - a.baseY * sin
      const ry = a.baseX * sin + a.baseY * cos
      const rz = a.baseZ
      const dx = Math.sin(t * a.freq * Math.PI * 2 + a.phase) * a.amp
      const dy = Math.cos(t * a.freq * Math.PI * 2 * 0.8 + a.phase) * a.amp
      const dz = Math.sin(t * a.freq * Math.PI * 2 * 1.1 + a.phase * 0.7) * a.amp
      lines.push(`${a.element.padStart(3)} ${(rx + dx).toFixed(6).padStart(12)} ${(ry + dy).toFixed(6).padStart(12)} ${(rz + dz).toFixed(6).padStart(12)}`)
    }
  }
  return lines.join('\n')
}
