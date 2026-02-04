'use client'

import React from 'react'
import styles from './Canvas.module.css'
import type { Subject } from '@/types'

interface CanvasProps {
  image: string | null
  subjects: Subject[]
  activeSubjectId: number | null
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  onUpload?: (file: File) => void // Simplified for now
}

export default function Canvas({ 
  image, 
  subjects, 
  activeSubjectId, 
  onCanvasClick,
  onUpload 
}: CanvasProps) {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // For wireframe, just ignore file processing or mock it
    // if (onUpload && e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0])
    console.log("Dropped")
  }

  if (!image) {
    return (
      <div 
        className={styles.canvas}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={styles.uploadPlaceholder}>
          <div className={styles.uploadIcon}>+</div>
          <p className="font-mono">DRAG & DROP IMAGE</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={styles.canvas}
      onClick={onCanvasClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img src={image} alt="Workspace" className={styles.canvasImage} />
      
      {subjects.map((subject, index) => {
        const point = subject.points?.[0]
        if (!point) return null
        return (
          <div
            key={subject.id}
            className={`${styles.marker} ${activeSubjectId === subject.id ? styles.active : ''}`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              '--marker-color': subject.color,
            } as React.CSSProperties}
          >
            {index + 1}
          </div>
        )
      })}
    </div>
  )
}
