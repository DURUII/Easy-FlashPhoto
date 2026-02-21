'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './FlickeringGrid.module.css'

interface FlickeringGridProps {
  className?: string
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  maxOpacity?: number
}

export default function FlickeringGrid({
  className,
  squareSize = 4,
  gridGap = 8,
  flickerChance = 0.35,
  color = '#FFFFFF',
  maxOpacity = 0.22,
}: FlickeringGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const rgbaPrefix = useMemo(() => {
    if (typeof window === 'undefined') return 'rgba(255, 255, 255,'
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'rgba(255, 255, 255,'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return `rgba(${data[0]}, ${data[1]}, ${data[2]},`
  }, [color])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width === 0 || size.height === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(size.width * dpr)
    canvas.height = Math.floor(size.height * dpr)
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`

    const cols = Math.ceil(size.width / (squareSize + gridGap))
    const rows = Math.ceil(size.height / (squareSize + gridGap))
    const values = new Float32Array(cols * rows)

    for (let i = 0; i < values.length; i += 1) {
      values[i] = Math.random() * maxOpacity
    }

    let frameId = 0
    let lastTime = 0

    const render = (time: number) => {
      const delta = lastTime === 0 ? 0.016 : (time - lastTime) / 1000
      lastTime = time

      for (let i = 0; i < values.length; i += 1) {
        if (Math.random() < flickerChance * delta * 60) {
          values[i] = Math.random() * maxOpacity
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let x = 0; x < cols; x += 1) {
        for (let y = 0; y < rows; y += 1) {
          const opacity = values[x * rows + y]
          ctx.fillStyle = `${rgbaPrefix}${opacity})`
          ctx.fillRect(
            x * (squareSize + gridGap) * dpr,
            y * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr
          )
        }
      }

      frameId = window.requestAnimationFrame(render)
    }

    frameId = window.requestAnimationFrame(render)
    return () => window.cancelAnimationFrame(frameId)
  }, [flickerChance, gridGap, maxOpacity, rgbaPrefix, size.height, size.width, squareSize])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const cleanup = draw()
    return () => {
      if (cleanup) cleanup()
    }
  }, [draw])

  return (
    <div ref={containerRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
