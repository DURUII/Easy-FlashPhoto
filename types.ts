import type { Point, MaskResult } from '@/hooks/useSAM'

export interface Subject {
  id: number
  name: string
  color: string
  points: Point[]
  maskResult?: MaskResult
  coloredMaskUrl?: string
  previewUrl?: string
  maskScore?: number
  brightenedMaskUrl?: string
  duration?: number // Duration in seconds
}

export interface BGM {
  id: number
  name: string
  duration: string
  file: string | null
}

export type AppMode = 'editing' | 'arrange' | 'previewing'
