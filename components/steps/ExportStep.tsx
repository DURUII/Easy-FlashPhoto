'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './ExportStep.module.css'
import Button from '@/components/Button'
import type { AppState, Subject } from '@/app/page'

const EXPORT_OPTIONS = [
  { id: 'livephoto', label: 'LIVE PHOTO', desc: 'iPhone Live Photo' },
  { id: 'mp4', label: 'MP4', desc: 'Universal video' },
  { id: 'gif', label: 'GIF', desc: 'Animated image' },
]

const MOCK_SUBJECTS: Subject[] = [
  { id: 1, name: 'SUBJECT_01', color: '#FFFFFF', points: [{ x: 30, y: 50, label: 1 }] },
  { id: 2, name: 'SUBJECT_02', color: '#00FF00', points: [{ x: 50, y: 50, label: 1 }] },
  { id: 3, name: 'SUBJECT_03', color: '#FF00FF', points: [{ x: 70, y: 50, label: 1 }] },
]

interface ExportStepProps {
  mockData: { image: string }
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onPrev: () => void
}

export default function ExportStep({ mockData, appState, onPrev }: ExportStepProps) {
  const [selectedFormat, setSelectedFormat] = useState('mp4')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const subjects = appState.selectedSubjects.length > 0 
    ? appState.selectedSubjects 
    : MOCK_SUBJECTS

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    setIsPlaying(true)
    setProgress(0)
    setCurrentIndex(0)

    const duration = 3000
    const interval = 50
    let elapsed = 0

    intervalRef.current = setInterval(() => {
      elapsed += interval
      const newProgress = (elapsed / duration) * 100

      if (newProgress >= 100) {
        setProgress(100)
        setIsPlaying(false)
        setCurrentIndex(-1)
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      setProgress(newProgress)
      const subjectInterval = 100 / subjects.length
      const newIndex = Math.floor(newProgress / subjectInterval)
      if (newIndex < subjects.length) {
        setCurrentIndex(newIndex)
      }
    }, interval)
  }

  const handleExport = () => {
    setIsExporting(true)
    setExportProgress(0)

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsExporting(false)
            alert('Export complete. File saved to downloads.')
          }, 300)
          return 100
        }
        return prev + 5
      })
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className="display-lg animate-in">EXPORT</h1>
          <p className={`${styles.description} text-sm muted animate-in animate-in-delay-1`}>
            PREVIEW AND EXPORT YOUR CREATION
          </p>
        </div>

        <div className={`${styles.workspace} animate-in animate-in-delay-2`}>
          <div className={styles.previewSection}>
            <div className={styles.player}>
              <div className={styles.playerInner}>
                <img
                  src={appState.uploadedImage || mockData.image}
                  alt="Preview"
                  className={styles.previewImage}
                  style={{
                    // filter: currentIndex >= 0 ? 'brightness(0.2)' : 'brightness(1)',
                    opacity: 0, // Debug: Hide image to check glitch layer visibility
                  }}
                />
                
                {/* Glitch effect simulation */}
                {subjects.map((subject, index) => {
                  const point = subject.points?.[0] || { x: 50, y: 50, label: 1 }
                  return (
                    <div
                      key={subject.id}
                      className={styles.glitchLayer}
                      style={{
                        left: `${point.x - 10}%`,
                        top: `${point.y - 15}%`,
                        width: '20%',
                        height: '30%',
                        opacity: index <= currentIndex ? 1 : 0,
                        backgroundColor: subject.color,
                        boxShadow: `0 0 20px ${subject.color}`,
                      }}
                    />
                  )
                })}
              </div>

              <div className={styles.playerControls}>
                <button className={styles.playBtn} onClick={handlePlay}>
                  {isPlaying ? (
                    <span className={styles.pauseIcon}>||</span>
                  ) : (
                    <span className={styles.playIcon} />
                  )}
                </button>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className={`${styles.timeDisplay} mono text-xs`}>
                  {(progress / 100 * 3).toFixed(1)}s / 3.0s
                </span>
              </div>
            </div>

            <div className={styles.timeline}>
              <span className="mono text-xs muted">SEQUENCE</span>
              <div className={styles.timelineTrack}>
                {subjects.map((subject, index) => (
                  <div
                    key={subject.id}
                    className={`${styles.timelineItem} ${index <= currentIndex ? styles.active : ''}`}
                    style={{ 
                      borderColor: index <= currentIndex ? subject.color : 'var(--gray-800)',
                      background: index <= currentIndex ? subject.color : 'transparent',
                    }}
                  >
                    <span style={{ color: index <= currentIndex ? 'var(--black)' : 'var(--gray-500)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>FORMAT</h3>
              <div className={styles.formatList}>
                {EXPORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`${styles.formatItem} ${selectedFormat === option.id ? styles.selected : ''}`}
                    onClick={() => setSelectedFormat(option.id)}
                  >
                    <span className="mono text-sm">{option.label}</span>
                    <span className="mono text-xs muted">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>DETAILS</h3>
              <div className={styles.detailList}>
                <div className={styles.detailItem}>
                  <span className="mono text-xs muted">RESOLUTION</span>
                  <span className="mono text-sm">1080 x 1920</span>
                </div>
                <div className={styles.detailItem}>
                  <span className="mono text-xs muted">DURATION</span>
                  <span className="mono text-sm">3.0s</span>
                </div>
                <div className={styles.detailItem}>
                  <span className="mono text-xs muted">AUDIO</span>
                  <span className="mono text-sm">{appState.selectedBgm?.name || 'None'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className="mono text-xs muted">SUBJECTS</span>
                  <span className="mono text-sm">{subjects.length}</span>
                </div>
              </div>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? `EXPORTING ${exportProgress}%` : 'EXPORT'}
            </Button>

            {isExporting && (
              <div className={styles.exportProgress}>
                <div 
                  className={styles.exportProgressFill}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button onClick={onPrev} variant="secondary">
          BACK
        </Button>
        <div className={styles.footerActions}>
          <Button variant="secondary">SHARE</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'EXPORTING...' : 'EXPORT'}
          </Button>
        </div>
      </div>
    </div>
  )
}
