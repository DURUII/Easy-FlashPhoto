'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type SAMStatus = 
  | 'idle' 
  | 'loading_model' 
  | 'model_ready' 
  | 'encoding' 
  | 'encoded' 
  | 'decoding' 
  | 'error'

export interface Point {
  x: number  // percentage 0-100
  y: number  // percentage 0-100
  label: 0 | 1  // 0 = negative, 1 = positive
}

export interface MaskResult {
  imageData: ImageData
  width: number
  height: number
  score: number
  dataUrl: string
}

interface LoadingProgress {
  status: string
  name?: string
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

export function useSAM(autoLoad: boolean = true) {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<SAMStatus>('idle')
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isEncoded, setIsEncoded] = useState(false)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  
  const pendingDecodeRef = useRef<{ points: Point[], resolve: (result: MaskResult) => void, reject: (error: Error) => void } | null>(null)
  const encodeResolveRef = useRef<(() => void) | null>(null)

  // Initialize worker immediately on mount
  useEffect(() => {
    const worker = new Worker('/sam-worker.js', { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (e) => {
      const { type, data } = e.data

      switch (type) {
        case 'status':
          if (data === 'loading_model') {
            setStatus('loading_model')
          } else if (data === 'encoding') {
            setStatus('encoding')
          } else if (data === 'decoding') {
            setStatus('decoding')
          }
          break

        case 'loading_progress':
          setLoadingProgress(data)
          break

        case 'ready':
          setStatus('model_ready')
          setLoadingProgress(null)
          break

        case 'encode_done':
          setStatus('encoded')
          setIsEncoded(true)
          setImageSize({ width: data.width, height: data.height })
          if (encodeResolveRef.current) {
            encodeResolveRef.current()
            encodeResolveRef.current = null
          }
          break

        case 'decode_done':
          setStatus('encoded')
          if (pendingDecodeRef.current) {
            const { mask, width, height, score } = data
            
            // Create ImageData from mask (this is the raw mask data)
            const imageData = new ImageData(new Uint8ClampedArray(mask), width, height)
            
            // Create data URL for preview
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')!
            ctx.putImageData(imageData, 0, 0)
            const dataUrl = canvas.toDataURL('image/png')
            
            pendingDecodeRef.current.resolve({ imageData, width, height, score, dataUrl })
            pendingDecodeRef.current = null
          }
          break

        case 'reset_done':
          setIsEncoded(false)
          setImageSize(null)
          setStatus('model_ready')
          break

        case 'error':
          setStatus('error')
          setError(data)
          if (pendingDecodeRef.current) {
            pendingDecodeRef.current.reject(new Error(data))
            pendingDecodeRef.current = null
          }
          break
      }
    }

    worker.onerror = (e) => {
      setStatus('error')
      setError(e.message)
    }

    // Start loading model immediately if autoLoad is true
    if (autoLoad) {
      worker.postMessage({ type: 'init' })
    }

    return () => {
      worker.terminate()
    }
  }, [autoLoad])

  // Encode image
  const encodeImage = useCallback((imageDataUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      setIsEncoded(false)
      encodeResolveRef.current = resolve
      workerRef.current.postMessage({ type: 'encode', data: imageDataUrl })
    })
  }, [])

  // Decode points to get mask
  const decode = useCallback((points: Point[]): Promise<MaskResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      if (!isEncoded) {
        reject(new Error('Image not encoded yet'))
        return
      }

      pendingDecodeRef.current = { points, resolve, reject }
      workerRef.current.postMessage({ type: 'decode', data: { points } })
    })
  }, [isEncoded])

  // Reset state
  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'reset' })
    }
    setIsEncoded(false)
    setError(null)
  }, [])

  return {
    status,
    loadingProgress,
    error,
    isEncoded,
    imageSize,
    encodeImage,
    decode,
    reset,
  }
}
