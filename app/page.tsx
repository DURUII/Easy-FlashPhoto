'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './page.module.css'
import Header from '@/components/Header'
import StepNav from '@/components/StepNav'
import Footer from '@/components/Footer'
import { useSAM, type Point, type MaskResult } from '@/hooks/useSAM'

export interface Subject {
  id: number
  name: string
  color: string
  points: Point[]
  maskResult?: MaskResult
  coloredMaskUrl?: string
  previewUrl?: string
  maskScore?: number
  brightenedMaskUrl?: string // Original image with mask area brightened
}

export interface BGM {
  id: number
  name: string
  duration: string
  file: string | null
}

export type GlitchPreset = 'solid' | 'brightened'

export interface AppState {
  uploadedImage: string | null
  selectedSubjects: Subject[]
  selectedBgm: BGM | null
  exportFormat: 'mp4' | 'gif' | 'livephoto'
  glitchPreset: GlitchPreset
}

const STEPS = [
  { id: 1, title: 'UPLOAD', shortTitle: '01' },
  { id: 2, title: 'SELECT', shortTitle: '02' },
  { id: 3, title: 'EXPORT', shortTitle: '03' },
]

const MOCK_DATA = {
  image: '/examples/input-sample.jpg',
  bgmList: [
    { id: 1, name: 'ALL MY FELLAS', duration: '0:30', file: '/bgm/all-my-fellas.mp3' },
    { id: 2, name: 'ELECTRIC PULSE', duration: '0:25', file: null },
    { id: 3, name: 'NO AUDIO', duration: '--', file: null },
  ],
}

// Generate colors for subjects
const generateColor = (index: number) => {
  const colors = ['#FFFFFF', '#00FF00', '#FF00FF', '#00FFFF', '#FFFF00', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
  return colors[index % colors.length]
}

// Create colored mask data URL from original mask
const createColoredMaskUrl = (maskResult: MaskResult, color: string): string => {
  const { width, height, imageData } = maskResult
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  // Parse color
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  
  // Create new colored image data
  const coloredData = ctx.createImageData(width, height)
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Check if pixel has alpha (is part of mask)
    if (imageData.data[i + 3] > 0) {
      coloredData.data[i] = r
      coloredData.data[i + 1] = g
      coloredData.data[i + 2] = b
      coloredData.data[i + 3] = 180 // Semi-transparent
    }
  }
  
  ctx.putImageData(coloredData, 0, 0)
  return canvas.toDataURL('image/png')
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const getMaskBounds = (imageData: ImageData) => {
  const { width, height, data } = imageData
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx + 3] > 0) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

// Recover mask data from colored mask URL (for restored sessions)
const recoverMaskData = async (url: string, width: number, height: number): Promise<ImageData> => {
  const img = await loadImage(url)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

// Create brightened mask overlay (original image with mask area brightness +100)
const createBrightenedMaskUrl = async (maskResult: MaskResult, imageUrl: string): Promise<string | null> => {
  const image = await loadImage(imageUrl)
  const { width, height, imageData: maskData } = maskResult

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Draw original image
  ctx.drawImage(image, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height)

  // Brighten only the masked area
  for (let i = 0; i < maskData.data.length; i += 4) {
    if (maskData.data[i + 3] > 0) {
      // Brighten by adding 100 to each channel (clamped to 255)
      imgData.data[i] = Math.min(255, imgData.data[i] + 100)
      imgData.data[i + 1] = Math.min(255, imgData.data[i + 1] + 100)
      imgData.data[i + 2] = Math.min(255, imgData.data[i + 2] + 100)
    } else {
      // Make non-masked area transparent
      imgData.data[i + 3] = 0
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}

const createCroppedPreviewUrl = async (maskResult: MaskResult, imageUrl: string): Promise<string | null> => {
  const bounds = getMaskBounds(maskResult.imageData)
  if (!bounds) return null

  const image = await loadImage(imageUrl)
  const { width, height } = maskResult

  const imageCanvas = document.createElement('canvas')
  imageCanvas.width = width
  imageCanvas.height = height
  const imageCtx = imageCanvas.getContext('2d')!
  imageCtx.drawImage(image, 0, 0, width, height)

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height
  const maskCtx = maskCanvas.getContext('2d')!
  maskCtx.putImageData(maskResult.imageData, 0, 0)

  imageCtx.globalCompositeOperation = 'destination-in'
  imageCtx.drawImage(maskCanvas, 0, 0)

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = bounds.width
  cropCanvas.height = bounds.height
  const cropCtx = cropCanvas.getContext('2d')!
  cropCtx.drawImage(
    imageCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return cropCanvas.toDataURL('image/png')
}

const PERSIST_ENABLED = process.env.NEXT_PUBLIC_PERSIST_SAMPLE === '1'
const DEV_CACHE_URL = '/dev-cache.json'
const DEV_CACHE_API = '/api/dev-cache'

const buildCachePayload = (uploadedImage: string | null, subjects: Subject[]) => {
  if (!uploadedImage) return null
  return {
    uploadedImage,
    subjects: subjects.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      points: s.points,
      coloredMaskUrl: s.coloredMaskUrl,
      previewUrl: s.previewUrl,
      brightenedMaskUrl: s.brightenedMaskUrl,
      maskScore: s.maskScore,
    })),
  }
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [appState, setAppState] = useState<AppState>({
    uploadedImage: null,
    selectedSubjects: [],
    selectedBgm: null,
    exportFormat: 'mp4',
    glitchPreset: 'brightened',
  })
  
  // Current subject being edited (adding points to refine mask)
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [sequenceOrder, setSequenceOrder] = useState<number[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [undoStack, setUndoStack] = useState<Subject[][]>([])
  const [redoStack, setRedoStack] = useState<Subject[][]>([])
  const [fakeProgress, setFakeProgress] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const sourceContainerRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true)
  }, [])
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [displayBox, setDisplayBox] = useState<{ width: number; height: number; offsetX: number; offsetY: number } | null>(null)

  // SAM hook - autoLoad=true means model starts loading on page load
  const { 
    status: samStatus, 
    loadingProgress, 
    isEncoded, 
    encodeImage, 
    decode
  } = useSAM(true) // Start loading model immediately

  // Fake progress for analysis (approx 12s)
  useEffect(() => {
    if (samStatus === 'loading_model' || samStatus === 'encoding') {
      const interval = setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 99) return 99
          return prev + 1
        })
      }, 120) // 12s to reach ~100%
      return () => clearInterval(interval)
    } else {
      setFakeProgress(0)
    }
  }, [samStatus])

  useEffect(() => {
    if (!PERSIST_ENABLED || !hasMounted) return
    const restore = async () => {
      try {
        setIsRestoring(true)
        const res = await fetch(DEV_CACHE_URL, { cache: 'no-store' })
        if (!res.ok) return
        const parsed = await res.json()
        if (!parsed?.uploadedImage || !Array.isArray(parsed?.subjects)) return
        updateAppState({
          uploadedImage: parsed.uploadedImage,
          selectedSubjects: parsed.subjects,
        })
        setCurrentStep(2)
      } catch {
        // ignore missing or invalid cache
      } finally {
        setIsRestoring(false)
      }
    }
    restore()
  }, [hasMounted])

  useEffect(() => {
    // Sync sequence order with subjects (default: order of creation)
    setSequenceOrder(appState.selectedSubjects.map(s => s.id))
  }, [appState.selectedSubjects.length])

  // Compute displayed image box based on container + image size
  useEffect(() => {
    if (currentStep !== 2) return
    if (!sourceContainerRef.current || !imageMeta) return

    const updateDisplayBox = () => {
      if (!sourceContainerRef.current) return
      const rect = sourceContainerRef.current.getBoundingClientRect()
      const scale = Math.min(rect.width / imageMeta.width, rect.height / imageMeta.height)
      const width = imageMeta.width * scale
      const height = imageMeta.height * scale
      const offsetX = (rect.width - width) / 2
      const offsetY = (rect.height - height) / 2
      setDisplayBox({ width, height, offsetX, offsetY })
    }

    updateDisplayBox()
    const observer = new ResizeObserver(updateDisplayBox)
    observer.observe(sourceContainerRef.current)

    return () => observer.disconnect()
  }, [imageMeta, currentStep])

  // Encode image when uploaded and entering step 2
  useEffect(() => {
    if (currentStep === 2 && appState.uploadedImage && !isEncoded && samStatus === 'model_ready') {
      encodeImage(appState.uploadedImage)
    }
  }, [currentStep, appState.uploadedImage, isEncoded, samStatus, encodeImage])

  // Generate missing brightened masks when switching to 'brightened' preset
  useEffect(() => {
    if (currentStep !== 3 || appState.glitchPreset !== 'brightened' || !appState.uploadedImage) return

    const subjectsMissingUrl = appState.selectedSubjects.filter(s => !s.brightenedMaskUrl)
    
    if (subjectsMissingUrl.length === 0) return

    const generateMissingUrls = async () => {
      const newSubjects = [...appState.selectedSubjects]
      let hasUpdates = false
      
      try {
        // Load image once to get dimensions
        const image = await loadImage(appState.uploadedImage!)
        const width = image.naturalWidth
        const height = image.naturalHeight

        for (let i = 0; i < newSubjects.length; i++) {
          const s = newSubjects[i]
          if (!s.brightenedMaskUrl) {
            let maskResult = s.maskResult
            
            // If maskResult is missing (restored from cache), try to recover from coloredMaskUrl
            if (!maskResult && s.coloredMaskUrl) {
               const recoveredData = await recoverMaskData(s.coloredMaskUrl, width, height)
               maskResult = {
                 imageData: recoveredData,
                 width,
                 height,
                 score: s.maskScore || 0,
                 dataUrl: ''
               }
            }

            if (maskResult) {
              const url = await createBrightenedMaskUrl(maskResult, appState.uploadedImage!)
              if (url) {
                newSubjects[i] = { ...s, brightenedMaskUrl: url }
                hasUpdates = true
              }
            }
          }
        }

        if (hasUpdates) {
          updateAppState({ selectedSubjects: newSubjects })
        }
      } catch (err) {
        console.error('Error generating brightened masks:', err)
      }
    }

    generateMissingUrls()
  }, [currentStep, appState.glitchPreset, appState.selectedSubjects, appState.uploadedImage])

  const handleStepClick = (stepId: number) => {
    if (stepId <= currentStep || (stepId === 2 && appState.uploadedImage)) {
      setCurrentStep(stepId)
    }
  }

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }))
  }

  // Handle click on source image
  const handleSourceClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentStep !== 2 || !appState.uploadedImage || !isEncoded) return
    if (samStatus === 'decoding' || samStatus === 'encoding') return

    if (!displayBox || !sourceContainerRef.current) return
    const rect = sourceContainerRef.current.getBoundingClientRect()
    const localX = e.clientX - rect.left - displayBox.offsetX
    const localY = e.clientY - rect.top - displayBox.offsetY
    if (localX < 0 || localY < 0 || localX > displayBox.width || localY > displayBox.height) {
      return
    }
    const x = (localX / displayBox.width) * 100
    const y = (localY / displayBox.height) * 100
    const label: 0 | 1 = e.button === 2 ? 0 : 1 // Right click = negative

    if (editingSubjectId !== null) {
      // Add point to existing subject being edited
      const subject = appState.selectedSubjects.find(s => s.id === editingSubjectId)
      if (!subject) return

      const newPoints: Point[] = [...subject.points, { x, y, label }]
      
      try {
        // Save current state for undo
        setUndoStack(prev => [...prev, appState.selectedSubjects])
        setRedoStack([]) // Clear redo stack on new action

        const maskResult = await decode(newPoints)
        const coloredMaskUrl = createColoredMaskUrl(maskResult, subject.color)
        const [previewUrl, brightenedMaskUrl] = await Promise.all([
          appState.uploadedImage ? createCroppedPreviewUrl(maskResult, appState.uploadedImage) : Promise.resolve(undefined),
          appState.uploadedImage ? createBrightenedMaskUrl(maskResult, appState.uploadedImage) : Promise.resolve(undefined),
        ])
        const newSubjects = appState.selectedSubjects.map(s => {
          if (s.id === editingSubjectId) {
            return { 
              ...s, 
              points: newPoints, 
              maskResult, 
              coloredMaskUrl, 
              previewUrl: previewUrl ?? s.previewUrl,
              brightenedMaskUrl: brightenedMaskUrl ?? s.brightenedMaskUrl,
              maskScore: maskResult.score,
            }
          }
          return s
        })
        updateAppState({ selectedSubjects: newSubjects })
        if (PERSIST_ENABLED) {
          const payload = buildCachePayload(appState.uploadedImage, newSubjects)
          if (payload) {
            fetch(DEV_CACHE_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          }
        }
      } catch (err) {
        console.error('Decode error:', err)
      }
    } else {
      // Create new subject with first point
      const newPoint: Point = { x, y, label: 1 }
      
      try {
        // Save current state for undo
        setUndoStack(prev => [...prev, appState.selectedSubjects])
        setRedoStack([]) // Clear redo stack on new action

        const maskResult = await decode([newPoint])
        const color = generateColor(appState.selectedSubjects.length)
        const coloredMaskUrl = createColoredMaskUrl(maskResult, color)
        const [previewUrl, brightenedMaskUrl] = await Promise.all([
          appState.uploadedImage ? createCroppedPreviewUrl(maskResult, appState.uploadedImage) : Promise.resolve(undefined),
          appState.uploadedImage ? createBrightenedMaskUrl(maskResult, appState.uploadedImage) : Promise.resolve(undefined),
        ])
        const newSubject: Subject = {
          id: Date.now(),
          name: `SUB_${String(appState.selectedSubjects.length + 1).padStart(2, '0')}`,
          color,
          points: [newPoint],
          maskResult,
          coloredMaskUrl,
          previewUrl: previewUrl ?? undefined,
          brightenedMaskUrl: brightenedMaskUrl ?? undefined,
          maskScore: maskResult.score,
        }
        const newSubjects = [...appState.selectedSubjects, newSubject]
        updateAppState({ selectedSubjects: newSubjects })
        if (PERSIST_ENABLED) {
          const payload = buildCachePayload(appState.uploadedImage, newSubjects)
          if (payload) {
            fetch(DEV_CACHE_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          }
        }
        setEditingSubjectId(newSubject.id) // Enter editing mode for this subject
      } catch (err) {
        console.error('Decode error:', err)
      }
    }
  }, [currentStep, appState, isEncoded, editingSubjectId, samStatus, decode, displayBox])

  // Finish editing current subject
  const handleFinishEditing = useCallback(() => {
    setEditingSubjectId(null)
  }, [])

  // Clear points and restart current subject
  const handleClearPoints = () => {
    if (editingSubjectId !== null) {
      // Remove the subject being edited
      const newSubjects = appState.selectedSubjects.filter(s => s.id !== editingSubjectId)
      updateAppState({ selectedSubjects: newSubjects })
      setEditingSubjectId(null)
    }
  }

  // Undo last point (Command+Z)
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1]
      const currentState = appState.selectedSubjects
      setRedoStack(prev => [...prev, currentState])
      setUndoStack(prev => prev.slice(0, -1))
      updateAppState({ selectedSubjects: previousState })
    }
  }, [undoStack, appState.selectedSubjects])

  // Redo last point (Command+Shift+Z)
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]
      const currentState = appState.selectedSubjects
      setUndoStack(prev => [...prev, currentState])
      setRedoStack(prev => prev.slice(0, -1))
      updateAppState({ selectedSubjects: nextState })
    }
  }, [redoStack, appState.selectedSubjects])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep !== 2) return

      // Enter = DONE
      if (e.key === 'Enter' && editingSubjectId !== null) {
        e.preventDefault()
        handleFinishEditing()
      }

      // Command+Shift+Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleRedo()
      }
      // Command+Z = Undo
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, editingSubjectId, handleFinishEditing, handleUndo, handleRedo])

  // Upload handler
  const handleUpload = (file?: File) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageMeta(null)
        setDisplayBox(null)
        updateAppState({ uploadedImage: dataUrl })
        setCurrentStep(2)
        if (samStatus === 'model_ready') {
          encodeImage(dataUrl)
        }
        if (PERSIST_ENABLED) {
          const payload = buildCachePayload(dataUrl, appState.selectedSubjects)
          if (payload) {
            fetch(DEV_CACHE_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          }
        }
      }
      reader.readAsDataURL(file)
    } else {
      setImageMeta(null)
      setDisplayBox(null)
      updateAppState({ uploadedImage: MOCK_DATA.image })
      setCurrentStep(2)
      if (samStatus === 'model_ready') {
        encodeImage(MOCK_DATA.image)
      }
      if (PERSIST_ENABLED) {
        const payload = buildCachePayload(MOCK_DATA.image, appState.selectedSubjects)
        if (payload) {
          fetch(DEV_CACHE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  // Drag and drop for subject reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
    const newSubjects = [...appState.selectedSubjects]
    const [dragged] = newSubjects.splice(draggedIndex, 1)
    newSubjects.splice(index, 0, dragged)
    updateAppState({ selectedSubjects: newSubjects })
    setDraggedIndex(index)
    setSequenceOrder(newSubjects.map(s => s.id))
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const removeSubject = (id: number) => {
    const newSubjects = appState.selectedSubjects.filter(s => s.id !== id)
    updateAppState({ selectedSubjects: newSubjects })
    if (editingSubjectId === id) {
      setEditingSubjectId(null)
    }
  }

  // Select a subject to edit
  const selectSubjectToEdit = (id: number) => {
    if (editingSubjectId === id) {
      // Already editing, finish
      setEditingSubjectId(null)
    } else {
      setEditingSubjectId(id)
    }
  }

  const rawProgress = loadingProgress?.progress
  const progressPercent = typeof rawProgress === 'number'
    ? Math.round(rawProgress > 1 ? rawProgress : rawProgress * 100)
    : null
  const modelProgress = typeof rawProgress === 'number'
    ? rawProgress > 1 ? rawProgress / 100 : rawProgress
    : 0

  // Get status text
  const getStatusText = () => {
    switch (samStatus) {
      case 'loading_model':
        if (progressPercent !== null) {
          return `LOADING MODEL ${progressPercent}%`
        }
        return 'LOADING MODEL...'
      case 'encoding':
        return `ANALYZING IMAGE... ${fakeProgress}%`
      case 'decoding':
        return 'GENERATING MASK...'
      default:
        return null
    }
  }

  const statusText = getStatusText()
  const isProcessing = samStatus === 'loading_model' || samStatus === 'encoding' || samStatus === 'decoding'
  const editingSubject = appState.selectedSubjects.find(s => s.id === editingSubjectId)

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 1: // UPLOAD
        return (
          <div className={styles.uploadStep}>
            <div 
              className={`${styles.uploadZone} ${isDragging ? styles.dragActive : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => { 
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleUpload(file)
              }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <div className={styles.uploadContent}>
                <div className={styles.uploadIcon}>+</div>
                <p className={styles.uploadText}>DRAG & DROP IMAGE</p>
                <p className={styles.uploadHint}>OR CLICK TO BROWSE</p>
                <div className={styles.uploadFormats}>JPG / PNG / WEBP</div>
              </div>
            </div>
            
            <button 
              className={styles.sampleButton}
              onClick={() => handleUpload()}
            >
              USE SAMPLE IMAGE
            </button>
            {PERSIST_ENABLED && (
              <button
                className={styles.clearCacheButton}
                onClick={() => {
                  fetch(DEV_CACHE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadedImage: null, subjects: [] }) })
                  updateAppState({ uploadedImage: null, selectedSubjects: [] })
                  setCurrentStep(1)
                }}
              >
                CLEAR CACHED SAMPLE
              </button>
            )}
          </div>
        )

      case 2: // SELECT (SAM workflow) - Two columns only
        return (
          <div className={styles.selectStep}>
            {/* Left: Source Image with Mask Overlay */}
            <div className={styles.sourcePanel}>
              <div className={styles.panelHeader}>
                <div className={styles.headerTitleArea}>
                  <span>SOURCE</span>
                  <span className={styles.headerHint}>
                    {!isEncoded 
                      ? (samStatus === 'loading_model' ? 'LOADING MODEL...' : 'ANALYZING IMAGE...')
                      : editingSubjectId !== null 
                        ? 'LEFT + / RIGHT - / CLICK DONE WHEN FINISHED' 
                        : 'CLICK TO SELECT A SUBJECT'}
                  </span>
                </div>
                <div className={styles.headerActions}>
                  {editingSubjectId !== null && (
                    <>
                      <button 
                        className={styles.clearButton}
                        onClick={handleClearPoints}
                      >
                        CLEAR
                      </button>
                      <button 
                        className={styles.finishButton}
                        onClick={handleFinishEditing}
                      >
                        DONE
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div 
                className={`${styles.sourceImage} ${isProcessing ? styles.processing : ''}`}
                onClick={handleSourceClick}
                onContextMenu={(e) => e.preventDefault()}
                ref={sourceContainerRef}
              >
                <div
                  className={styles.imageFrame}
                  style={
                    displayBox
                      ? {
                          width: `${displayBox.width}px`,
                          height: `${displayBox.height}px`,
                          left: `${displayBox.offsetX}px`,
                          top: `${displayBox.offsetY}px`,
                        }
                      : undefined
                  }
                >
                  <img
                    src={appState.uploadedImage || ''}
                    alt="Source"
                    className={styles.sourceImg}
                    onLoad={(e) => {
                      const target = e.currentTarget
                      setImageMeta({ width: target.naturalWidth, height: target.naturalHeight })
                    }}
                  />
                  
                  {/* Show mask of current editing subject */}
                  {editingSubject?.coloredMaskUrl && (
                    <img 
                      src={editingSubject.coloredMaskUrl}
                      alt="Mask"
                      className={styles.maskOverlayImg}
                    />
                  )}

                  {/* Render points for current editing subject */}
                  {editingSubject?.points.map((point, pIdx) => (
                    <div
                      key={`editing-${pIdx}`}
                      className={`${styles.marker} ${point.label === 0 ? styles.negativeMarker : ''}`}
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        borderColor: editingSubject.color,
                        background: point.label === 1 ? editingSubject.color : 'transparent',
                      }}
                    />
                  ))}
                </div>

                {/* Loading overlay */}
                {isProcessing && (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.loadingContent}>
                      <div className={styles.statusSpinner} />
                      <span>{statusText}</span>
                      <div className={styles.loadingBar}>
                        <div className={styles.loadingBarFill} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Subject List */}
            <div className={styles.subjectsPanel}>
              <div className={styles.panelHeader}>
                <span>SUBJECTS</span>
                <span className={styles.countBadge}>{appState.selectedSubjects.length}</span>
              </div>
              <div className={styles.subjectList}>
                {appState.selectedSubjects.map((subject, index) => (
                  <div
                    key={subject.id}
                    className={`${styles.subjectCard} ${editingSubjectId === subject.id ? styles.activeCard : ''} ${draggedIndex === index ? styles.draggingCard : ''} ${dragOverIndex === index ? styles.dragOverCard : ''}`}
                    draggable={editingSubjectId === null}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => selectSubjectToEdit(subject.id)}
                    style={{ borderColor: editingSubjectId === subject.id ? subject.color : 'transparent' }}
                  >
                    <div className={styles.subjectPreview}>
                      {subject.previewUrl ? (
                        <img 
                          src={subject.previewUrl}
                          alt={subject.name}
                          className={styles.maskThumbnail}
                        />
                      ) : subject.coloredMaskUrl ? (
                        <img 
                          src={subject.coloredMaskUrl}
                          alt={subject.name}
                          className={styles.maskThumbnail}
                        />
                      ) : (
                        <span className={styles.maskPlaceholder}>MASK</span>
                      )}
                    </div>
                    <div className={styles.subjectInfo}>
                      <div className={styles.subjectColor} style={{ background: subject.color }} />
                      <span className={styles.subjectName}>{subject.name}</span>
                      <span className={styles.pointCount}>{subject.points.length}pt</span>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={(e) => { e.stopPropagation(); removeSubject(subject.id) }}
                    >
                      x
                    </button>
                    {subject.maskResult && (
                      <div className={styles.scoreTag}>
                        {(subject.maskResult.score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
                
                {appState.selectedSubjects.length === 0 && (
                  <div className={styles.emptyState}>
                    <p>NO SUBJECTS YET</p>
                    <p className={styles.emptyHint}>CLICK ON THE IMAGE TO SELECT</p>
                  </div>
                )}
              </div>
              
              {appState.selectedSubjects.length > 1 && editingSubjectId === null && (
                <p className={styles.dragHint}>DRAG TO REORDER SEQUENCE</p>
              )}
              
              {appState.selectedSubjects.length > 0 && editingSubjectId === null && (
                <button 
                  className={styles.continueButton}
                  onClick={() => setCurrentStep(3)}
                >
                  CONTINUE TO EXPORT
                </button>
              )}
            </div>
          </div>
        )

      case 3: // EXPORT (with audio)
        const totalDuration = appState.selectedSubjects.length * 0.1 // Each subject shows for 0.1s
        const cycleDuration = totalDuration > 0 ? totalDuration : 1

        return (
            <div className={styles.exportStep}>
            {/* Left: Preview (same layout as step 2) */}
            <div className={styles.sourcePanel}>
              <div className={styles.panelHeader}>
                <span>FINAL PREVIEW</span>
              </div>
              <div className={styles.sourceImage}>
                <div className={styles.imageFrame}>
                    <img 
                    src={appState.uploadedImage || ''} 
                    alt="Final Preview" 
                    className={styles.sourceImg} 
                  />

                    {/* Brightened mask overlays - each subject flashes in sequence */}
                    {appState.selectedSubjects.map((s, i) => (
                      <img
                        key={s.id}
                        src={appState.glitchPreset === 'solid' ? (s.coloredMaskUrl || '') : (s.brightenedMaskUrl || s.coloredMaskUrl)}
                        alt={s.name}
                        className={styles.flashMask}
                        style={{ 
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${cycleDuration}s`,
                          zIndex: 10,
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Right: Settings */}
            <div className={styles.exportSettings}>
              <div className={styles.settingSection}>
                <div className={styles.panelHeader}>
                  <span>GLITCH PRESET</span>
                </div>
                <div className={styles.formatGrid}>
                  <button
                    className={`${styles.formatOption} ${appState.glitchPreset === 'solid' ? styles.formatSelected : ''}`}
                    onClick={() => updateAppState({ glitchPreset: 'solid' })}
                  >
                    SOLID COLOR
                  </button>
                  <button
                    className={`${styles.formatOption} ${appState.glitchPreset === 'brightened' ? styles.formatSelected : ''}`}
                    onClick={() => updateAppState({ glitchPreset: 'brightened' })}
                  >
                    BRIGHTENED
                  </button>
                </div>
              </div>

              <div className={styles.settingSection}>
                <div className={styles.panelHeader}>
                  <span>AUDIO TRACK</span>
                </div>
                <div className={styles.audioList}>
                  {MOCK_DATA.bgmList.map(bgm => (
                    <button
                      key={bgm.id}
                      className={`${styles.audioOption} ${appState.selectedBgm?.id === bgm.id ? styles.audioSelected : ''}`}
                      onClick={() => {
                        updateAppState({ selectedBgm: bgm })
                        // Play audio preview
                        if (bgm.file) {
                          if (audioRef.current) {
                            audioRef.current.pause()
                          }
                          const audio = new Audio(bgm.file)
                          audio.loop = true
                          audio.play()
                          audioRef.current = audio
                        } else {
                          if (audioRef.current) {
                            audioRef.current.pause()
                            audioRef.current = null
                          }
                        }
                      }}
                    >
                      <span>{bgm.name}</span>
                      <span className={styles.audioDuration}>{bgm.duration}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.settingSection}>
                <div className={styles.panelHeader}>
                  <span>FORMAT</span>
                </div>
                <div className={styles.formatGrid}>
                  {(['mp4', 'gif', 'livephoto'] as const).map(format => (
                    <button
                      key={format}
                      className={`${styles.formatOption} ${appState.exportFormat === format ? styles.formatSelected : ''}`}
                      onClick={() => updateAppState({ exportFormat: format })}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.downloadButton}>
                DOWNLOAD {appState.exportFormat.toUpperCase()}
              </button>
              
              <button 
                className={styles.backButton}
                onClick={() => {
                  // Stop audio when going back
                  if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current = null
                  }
                  setCurrentStep(2)
                }}
              >
                BACK TO EDIT
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <main className={styles.main}>
      <Header>
        <StepNav 
          steps={STEPS} 
          currentStep={currentStep} 
          onStepClick={handleStepClick} 
        />
      </Header>
      
      <div className={styles.content}>
        {renderContent()}
      </div>

      <Footer 
        modelProgress={modelProgress} 
        modelReady={samStatus === 'model_ready' || samStatus === 'encoded'} 
      />
    </main>
  )
}
