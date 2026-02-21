'use client'

import { useEffect, useMemo, useRef } from 'react'
import styles from './Dither.module.css'

interface DitherProps {
  waveColor?: [number, number, number]
  disableAnimation?: boolean
  enableMouseInteraction?: boolean
  mouseRadius?: number
  colorNum?: number
  waveAmplitude?: number
  waveFrequency?: number
  waveSpeed?: number
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]

export default function Dither({
  waveColor = [0.5, 0.5, 0.5],
  disableAnimation = false,
  enableMouseInteraction = false,
  mouseRadius = 0.3,
  colorNum = 4,
  waveAmplitude = 0.3,
  waveFrequency = 3,
  waveSpeed = 0.05,
  className,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  const rgb = useMemo(() => {
    return waveColor.map((value) => Math.round(clamp(value, 0, 1) * 255)) as [number, number, number]
  }, [waveColor])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return

    let frameId = 0
    let start = performance.now()

    const renderScale = 0.42

    const resize = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr * renderScale))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr * renderScale))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const draw = (now: number) => {
      const elapsed = now - start
      const t = elapsed * waveSpeed * 0.002
      const width = canvas.width
      const height = canvas.height
      const image = context.createImageData(width, height)

      const quantSteps = Math.max(2, Math.floor(colorNum)) - 1
      const radiusPx = mouseRadius * Math.min(width, height)

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const nx = x / width
          const ny = y / height

          let value = 0.5 + Math.sin((nx * waveFrequency + t) * Math.PI * 2) * waveAmplitude
          value += Math.cos((ny * (waveFrequency * 0.85) - t * 1.2) * Math.PI * 2) * (waveAmplitude * 0.65)
          value = value * 0.5 + 0.5

          if (enableMouseInteraction && mouseRef.current) {
            const dx = x - mouseRef.current.x
            const dy = y - mouseRef.current.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < radiusPx) {
              const boost = 1 - distance / radiusPx
              value += boost * 0.35
            }
          }

          const q = clamp(Math.round(clamp(value, 0, 1) * quantSteps) / quantSteps, 0, 1)
          const threshold = BAYER_4X4[(y % 4) * 4 + (x % 4)] / 16
          const lit = q > threshold

          const i = (y * width + x) * 4
          const alpha = lit ? Math.round((0.16 + q * 0.62) * 255) : Math.round((0.04 + q * 0.08) * 255)
          image.data[i] = rgb[0]
          image.data[i + 1] = rgb[1]
          image.data[i + 2] = rgb[2]
          image.data[i + 3] = alpha
        }
      }

      context.putImageData(image, 0, 0)

      if (!disableAnimation) {
        frameId = window.requestAnimationFrame(draw)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!enableMouseInteraction) return
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      mouseRef.current = {
        x: (event.clientX - rect.left) * dpr * renderScale,
        y: (event.clientY - rect.top) * dpr * renderScale,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = null
    }

    resize()
    draw(start)

    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.cancelAnimationFrame(frameId)
    }
  }, [colorNum, disableAnimation, enableMouseInteraction, mouseRadius, rgb, waveAmplitude, waveFrequency, waveSpeed])

  return (
    <div ref={wrapperRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
