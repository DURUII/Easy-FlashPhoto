import { useRef } from 'react'
import styles from './Canvas.module.css'
import type { Point } from '@/hooks/useSAM'

interface CanvasProps {
  imageSrc: string | null
  maskImageSrc: string | null
  points: Point[]
  color: string
  mode: 'editing' | 'arrange' | 'previewing'
  encodingProgress?: number // 0-1, null if not encoding
  imageWidthPx?: number
  previewMaskSrc?: string | null
  onPointAdd?: (x: number, y: number, type: 0 | 1) => void
  onUpload?: (file: File) => void
  onUseSample?: () => void
}

const EncodingOverlay = ({ progress }: { progress: number }) => {
  const percent = Math.round(progress * 100)
  
  // Phase logic based on progress
  let phase = 'INITIALIZING'
  if (percent > 8) phase = 'LOADING WEIGHTS'
  if (percent > 28) phase = 'ENCODING IMAGE'
  if (percent > 62) phase = 'EXTRACTING FEATURES'
  if (percent > 84) phase = 'BUILDING EMBEDDINGS'

  return (
    <div className={styles.encodingOverlay}>
      <div className={styles.scanlines} />
      <div className={styles.scanBand} />
      <div className={styles.vignette} />
      
      <div className={styles.statusArea}>
        <div className={styles.statusText}>
          <span className={styles.phase}>{phase}</span>
          <span className={styles.percent}>{percent}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Canvas({
  imageSrc,
  maskImageSrc,
  points,
  color,
  mode,
  encodingProgress,
  imageWidthPx,
  previewMaskSrc,
  onPointAdd,
  onUpload,
  onUseSample
}: CanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const overlaySrc = mode === 'previewing' ? previewMaskSrc : maskImageSrc

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'editing' || !onPointAdd) return
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()

    // Calculate click relative to the actual image rect
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) return

    // Calculate percentage coordinates
    const xPct = (clickX / rect.width) * 100
    const yPct = (clickY / rect.height) * 100

    // Right click (negative) or Left click (positive)
    const isRightClick = e.button === 2
    onPointAdd(xPct, yPct, isRightClick ? 0 : 1)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (onUpload && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0])
    }
  }

  if (!imageSrc) {
    return (
      <div 
        className={styles.container}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className={styles.placeholder}>
          <button 
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            UPLOAD IMAGE
            <span className={styles.dropHint}>OR DRAG & DROP</span>
          </button>
          
          <button 
            className={styles.sampleButton}
            onClick={onUseSample}
          >
            USE SAMPLE IMAGE
          </button>

          <input 
            ref={fileInputRef}
            type="file" 
            hidden 
            accept="image/*"
            onChange={e => e.target.files?.[0] && onUpload?.(e.target.files[0])}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`${styles.container} ${styles.withImage}`}
      onPointerDown={handlePointerDown}
      onContextMenu={e => e.preventDefault()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div 
        className={styles.imageFrame}
        style={{
          width: imageWidthPx ? `${imageWidthPx}px` : undefined
        }}
      >
        <img 
          src={imageSrc} 
          alt="Source" 
          className={styles.sourceImg}
          ref={imageRef}
          style={{ cursor: mode === 'editing' ? 'crosshair' : 'default' }}
        />
        
        {/* Hint Text */}
        {!encodingProgress && mode === 'editing' && (
          <div className={styles.hintText}>
            Click to add points · Space to preview
          </div>
        )}

        {encodingProgress !== undefined && (
          <EncodingOverlay progress={encodingProgress} />
        )}

        {overlaySrc && !encodingProgress && (
          <img 
            src={overlaySrc} 
            alt="Mask" 
            className={styles.maskOverlay}
          />
        )}

        {points.map((p, i) => (
          <div
            key={i}
            className={`${styles.point} ${p.label === 1 ? styles.positive : styles.negative}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              color: color,
              borderColor: color,
              display: encodingProgress ? 'none' : 'flex'
            }}
          >
            +
          </div>
        ))}
      </div>
    </div>
  )
}
