'use client'

import { useState } from 'react'
import styles from './UploadStep.module.css'
import Button from '@/components/Button'
import type { AppState } from '@/app/page'

interface UploadStepProps {
  mockData: { image: string }
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onNext: () => void
}

export default function UploadStep({ mockData, appState, updateAppState, onNext }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    updateAppState({ uploadedImage: mockData.image })
  }

  const handleClick = () => {
    updateAppState({ uploadedImage: mockData.image })
  }

  const handleClear = () => {
    updateAppState({ uploadedImage: null })
  }

  const hasImage = appState.uploadedImage

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className="display-lg animate-in">UPLOAD</h1>
          <p className={`${styles.description} text-sm muted animate-in animate-in-delay-1`}>
            DROP YOUR IMAGE OR CLICK TO SELECT
          </p>
        </div>

        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''} ${hasImage ? styles.hasImage : ''} animate-in animate-in-delay-2`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!hasImage ? handleClick : undefined}
        >
          {hasImage ? (
            <div className={styles.preview}>
              <img
                src={appState.uploadedImage!}
                alt="Uploaded"
                className={styles.previewImage}
              />
              <button className={styles.clearButton} onClick={handleClear}>
                REMOVE
              </button>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.crosshair}>
                <span className={styles.crosshairH} />
                <span className={styles.crosshairV} />
              </div>
              <span className={`${styles.placeholderText} mono`}>
                {isDragging ? 'DROP HERE' : 'CLICK OR DRAG'}
              </span>
              <span className={`${styles.formats} mono muted`}>
                JPG / PNG / WEBP
              </span>
            </div>
          )}
        </div>

        {!hasImage && (
          <div className={`${styles.examples} animate-in animate-in-delay-3`}>
            <span className={`${styles.examplesLabel} mono text-xs muted`}>OR TRY EXAMPLE</span>
            <div className={styles.exampleGrid}>
              <button
                className={styles.exampleItem}
                onClick={() => updateAppState({ uploadedImage: mockData.image })}
              >
                <img src={mockData.image} alt="Example" />
                <span className="mono text-xs">SAMPLE_01</span>
              </button>
              <div className={`${styles.exampleItem} ${styles.placeholder}`}>
                <span className="mono text-xs muted">COMING SOON</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div />
        <Button onClick={onNext} disabled={!hasImage} size="lg">
          CONTINUE
        </Button>
      </div>
    </div>
  )
}
