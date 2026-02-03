'use client'

import { useState } from 'react'
import styles from './SegmentStep.module.css'
import Button from '@/components/Button'
import type { AppState, Subject } from '@/app/page'

const SUBJECT_COLORS = ['#FFFFFF', '#00FF00', '#FF00FF', '#00FFFF', '#FFFF00']

interface SegmentStepProps {
  mockData: { image: string }
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onNext: () => void
  onPrev: () => void
}

export default function SegmentStep({ mockData, appState, updateAppState, onNext, onPrev }: SegmentStepProps) {
  const [subjects, setSubjects] = useState<Subject[]>(appState.selectedSubjects)
  const [activeSubject, setActiveSubject] = useState<number | null>(null)

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2) return // Right click handled separately
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (subjects.length < 5) {
      const newSubject: Subject = {
        id: Date.now(),
        name: `SUBJECT_${String(subjects.length + 1).padStart(2, '0')}`,
        color: SUBJECT_COLORS[subjects.length],
        point: { x, y }
      }
      const newSubjects = [...subjects, newSubject]
      setSubjects(newSubjects)
      updateAppState({ selectedSubjects: newSubjects })
      setActiveSubject(newSubject.id)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleRemoveSubject = (id: number) => {
    const newSubjects = subjects.filter(s => s.id !== id)
    setSubjects(newSubjects)
    updateAppState({ selectedSubjects: newSubjects })
    if (activeSubject === id) setActiveSubject(null)
  }

  const handleClearAll = () => {
    setSubjects([])
    updateAppState({ selectedSubjects: [] })
    setActiveSubject(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className="display-lg animate-in">SELECT</h1>
            <p className={`${styles.description} text-sm muted animate-in animate-in-delay-1`}>
              CLICK TO ADD SUBJECTS / RIGHT CLICK TO EXCLUDE
            </p>
          </div>
          {subjects.length > 0 && (
            <button className={`${styles.clearBtn} mono text-xs`} onClick={handleClearAll}>
              CLEAR ALL
            </button>
          )}
        </div>

        <div className={`${styles.workspace} animate-in animate-in-delay-2`}>
          <div className={styles.canvasSection}>
            <div
              className={styles.canvas}
              onClick={handleCanvasClick}
              onContextMenu={handleContextMenu}
            >
              <img
                src={appState.uploadedImage || mockData.image}
                alt="Edit"
                className={styles.canvasImage}
              />
              
              {/* Subject markers */}
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className={`${styles.marker} ${activeSubject === subject.id ? styles.active : ''}`}
                  style={{
                    left: `${subject.point.x}%`,
                    top: `${subject.point.y}%`,
                    '--marker-color': subject.color,
                  } as React.CSSProperties}
                >
                  <span className={styles.markerNumber}>{index + 1}</span>
                </div>
              ))}

              {/* Mock mask overlay */}
              {subjects.map((subject) => (
                <div
                  key={`mask-${subject.id}`}
                  className={styles.maskOverlay}
                  style={{
                    left: `${subject.point.x - 10}%`,
                    top: `${subject.point.y - 15}%`,
                    width: '20%',
                    height: '30%',
                    background: `${subject.color}15`,
                    border: `1px solid ${subject.color}40`,
                  }}
                />
              ))}

              {subjects.length === 0 && (
                <div className={styles.hint}>
                  <span className="mono text-xs">CLICK TO SELECT SUBJECT</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>SUBJECTS</h3>
              <div className={styles.subjectList}>
                {subjects.length === 0 ? (
                  <p className="text-sm muted">No subjects selected</p>
                ) : (
                  subjects.map((subject, index) => (
                    <div
                      key={subject.id}
                      className={`${styles.subjectItem} ${activeSubject === subject.id ? styles.active : ''}`}
                      onClick={() => setActiveSubject(subject.id)}
                    >
                      <div
                        className={styles.subjectColor}
                        style={{ background: subject.color }}
                      />
                      <div className={styles.subjectInfo}>
                        <span className="mono text-sm">{subject.name}</span>
                        <span className="mono text-xs muted">{(index * 0.5).toFixed(1)}s</span>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveSubject(subject.id)
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>CONTROLS</h3>
              <div className={styles.controls}>
                <div className={styles.controlItem}>
                  <span className="mono text-xs muted">LEFT CLICK</span>
                  <span className="mono text-sm">Add subject</span>
                </div>
                <div className={styles.controlItem}>
                  <span className="mono text-xs muted">RIGHT CLICK</span>
                  <span className="mono text-sm">Exclude area</span>
                </div>
                <div className={styles.controlItem}>
                  <span className="mono text-xs muted">DRAG</span>
                  <span className="mono text-sm">Reorder</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject bar */}
        {subjects.length > 0 && (
          <div className={`${styles.subjectBar} animate-in`}>
            <span className="mono text-xs muted">SEQUENCE:</span>
            <div className={styles.sequence}>
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className={`${styles.sequenceItem} ${activeSubject === subject.id ? styles.active : ''}`}
                  style={{ '--item-color': subject.color } as React.CSSProperties}
                >
                  <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button onClick={onPrev} variant="secondary">
          BACK
        </Button>
        <Button onClick={onNext} disabled={subjects.length === 0} size="lg">
          CONTINUE
        </Button>
      </div>
    </div>
  )
}
