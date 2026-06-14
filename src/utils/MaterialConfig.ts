import type { ElementMaterialConfig } from '@/types'

export const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  He: '#D9FFFF',
  Li: '#CC80FF',
  Be: '#C2FF00',
  B: '#FFB5B5',
  C: '#404040',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Ne: '#B3E3F5',
  Na: '#AB5CF2',
  Mg: '#8AFF00',
  Al: '#BFA6A6',
  Si: '#F0C8A0',
  P: '#FF8000',
  S: '#FFFF30',
  Cl: '#1FF01F',
  Ar: '#80D1E3',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Fe: '#E06633',
  Cu: '#C88033',
  Zn: '#7D80B0',
  Br: '#A62929',
  I: '#940094',
  Au: '#FFD123',
  Ag: '#C0C0C0',
  Pt: '#7FD2E6',
}

export const ELEMENT_VDW_RADIUS: Record<string, number> = {
  H: 0.31,
  He: 0.28,
  Li: 1.28,
  Be: 0.96,
  B: 0.84,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  Ne: 0.58,
  Na: 1.66,
  Mg: 1.41,
  Al: 1.21,
  Si: 1.11,
  P: 1.07,
  S: 1.05,
  Cl: 1.02,
  Ar: 1.06,
  K: 2.03,
  Ca: 1.76,
  Fe: 1.32,
  Cu: 1.32,
  Zn: 1.22,
  Br: 1.20,
  I: 1.39,
  Au: 1.36,
  Ag: 1.45,
  Pt: 1.36,
}

export const DEFAULT_MATERIAL_CONFIG: ElementMaterialConfig = {
  color: '#808080',
  radius: 0.6,
  metalness: 0.3,
  roughness: 0.4,
}

export function getElementConfig(element: string): ElementMaterialConfig {
  const color = ELEMENT_COLORS[element] ?? DEFAULT_MATERIAL_CONFIG.color
  const radius = ELEMENT_VDW_RADIUS[element] ?? DEFAULT_MATERIAL_CONFIG.radius
  return {
    color,
    radius,
    metalness: DEFAULT_MATERIAL_CONFIG.metalness,
    roughness: DEFAULT_MATERIAL_CONFIG.roughness,
  }
}

export function getElementRadius(element: string): number {
  return ELEMENT_VDW_RADIUS[element] ?? DEFAULT_MATERIAL_CONFIG.radius
}

export function getElementColor(element: string, customColors: Record<string, string> = {}): string {
  return customColors[element] ?? ELEMENT_COLORS[element] ?? DEFAULT_MATERIAL_CONFIG.color
}

export const HIGHLIGHT_CONFIG: ElementMaterialConfig = {
  color: '#00E5FF',
  radius: 1.0,
  metalness: 0.1,
  roughness: 0.2,
  emissive: '#00E5FF',
  emissiveIntensity: 0.5,
}

export const BOND_MATERIAL = {
  color: '#666666',
  radius: 0.08,
  metalness: 0.4,
  roughness: 0.5,
}

export const HIGHLIGHTED_BOND_MATERIAL = {
  color: '#00E5FF',
  radius: 0.1,
  metalness: 0.2,
  roughness: 0.3,
  emissive: '#00E5FF',
  emissiveIntensity: 0.3,
}
