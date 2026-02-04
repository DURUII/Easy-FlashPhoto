import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent, type DragOverEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import styles from './AssetsTimeline.module.css'
import type { Subject } from '@/types'

interface AssetsTimelineProps {
  subjects: Subject[]
  mode: 'editing' | 'arrange' | 'previewing'
  onReorder?: (fromIndex: number, toIndex: number) => void
  onDurationChange?: (id: number, delta: number) => void
  onDelete?: (id: number) => void
  onDuplicate?: (id: number) => void
  currentPlayingIndex?: number | null
  previewStyle?: 'highlight' | 'solid'
  onPreviewStyleChange?: (style: 'highlight' | 'solid') => void
  bgm?: 'none' | 'all-my-fellas.mp3' | 'whats-wrong-with-u.mp3'
  onBgmChange?: (bgm: 'none' | 'all-my-fellas.mp3' | 'whats-wrong-with-u.mp3') => void
}

function SortableRow({
  subject,
  index,
  isLocked,
  isActive,
  onDurationChange,
  onDelete,
  onDuplicate
}: {
  subject: Subject
  index: number
  isLocked: boolean
  isActive: boolean
  onDurationChange?: (id: number, delta: number) => void
  onDelete?: (id: number) => void
  onDuplicate?: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: subject.id, disabled: isLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.subjectRow,
        isActive ? styles.active : '',
        !isLocked ? styles.draggable : '',
        isDragging ? styles.placeholder : ''
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      <div className={styles.index}>{String(index + 1).padStart(2, '0')}</div>
      
      <img 
        src={subject.previewUrl || subject.coloredMaskUrl} 
        className={styles.thumbnail}
        alt={subject.name}
        draggable={false}
      />
      
      <div className={styles.info}>
        <span className={styles.name} style={{ color: subject.color }}>{subject.name}</span>
        <div className={styles.durationControl}>
          <span>{(subject.duration ?? 0.1).toFixed(2)}s</span>
          {!isLocked && (
            <>
              <button className={styles.durationBtn} onPointerDown={e => e.stopPropagation()} onClick={() => onDurationChange?.(subject.id, -0.05)}>-</button>
              <button className={styles.durationBtn} onPointerDown={e => e.stopPropagation()} onClick={() => onDurationChange?.(subject.id, 0.05)}>+</button>
            </>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className={styles.actions}>
          <button
            className={styles.actionIcon}
            onClick={() => onDuplicate?.(subject.id)}
            title="Duplicate"
            type="button"
            onPointerDown={e => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            className={styles.actionIcon}
            onClick={() => onDelete?.(subject.id)}
            title="Delete"
            type="button"
            onPointerDown={e => e.stopPropagation()}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default function AssetsTimeline({
  subjects,
  mode,
  onReorder,
  onDurationChange,
  onDelete,
  onDuplicate,
  currentPlayingIndex,
  previewStyle = 'highlight',
  onPreviewStyleChange,
  bgm = 'none',
  onBgmChange
}: AssetsTimelineProps) {
  const isLocked = mode === 'editing' || mode === 'previewing'
  const isPreviewing = mode === 'previewing'
  const [activeId, setActiveId] = useState<number | null>(null)
  const ids = useMemo(() => subjects.map(subject => subject.id), [subjects])

  const handleDragStart = (event: DragStartEvent) => {
    if (isLocked) return
    const id = event.active.id as number
    setActiveId(id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (isLocked) return
    const { active, over } = event
    if (!over) return
    const activeIndex = subjects.findIndex(s => s.id === active.id)
    const overIndex = subjects.findIndex(s => s.id === over.id)
    if (activeIndex === -1 || overIndex === -1) return
    if (activeIndex !== overIndex) {
      onReorder?.(activeIndex, overIndex)
    }
  }

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeSubject = activeId ? subjects.find(s => s.id === activeId) : null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <span className={styles.title}>TIMELINE</span>
          <span className={`${styles.lockStatus} ${isLocked ? styles.active : ''}`}>
            {isLocked ? 'LOCKED' : 'REORDER'}
          </span>
        </div>
        
        <div className={styles.controls}>
          <label className={styles.control}>
            <span className={styles.controlLabel}>STYLE</span>
            <select
              className={styles.select}
              value={previewStyle}
              onChange={(e) => onPreviewStyleChange?.(e.target.value as 'highlight' | 'solid')}
              disabled={isPreviewing}
            >
              <option value="highlight">HIGHLIGHT</option>
              <option value="solid">SOLID COLOR</option>
            </select>
          </label>
          <label className={styles.control}>
            <span className={styles.controlLabel}>BGM</span>
            <select
              className={styles.select}
              value={bgm}
              onChange={(e) => onBgmChange?.(e.target.value as 'none' | 'all-my-fellas.mp3' | 'whats-wrong-with-u.mp3')}
              disabled={isPreviewing}
            >
              <option value="none">NONE</option>
              <option value="all-my-fellas.mp3">ALL MY FELLAS</option>
              <option value="whats-wrong-with-u.mp3">WHATS WRONG WITH U</option>
            </select>
          </label>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className={styles.list}>
            {subjects.length === 0 ? (
              <div className={styles.emptyState}>
                <p>NO SUBJECTS</p>
                <p>Select & Add from Canvas</p>
              </div>
            ) : (
              subjects.map((subject, index) => (
                <SortableRow
                  key={subject.id}
                  subject={subject}
                  index={index}
                  isLocked={isLocked}
                  isActive={currentPlayingIndex === index}
                  onDurationChange={onDurationChange}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              ))
            )}
          </div>
        </SortableContext>

        {typeof document !== 'undefined' && createPortal(
          <DragOverlay adjustScale={false}>
            {activeSubject ? (
              <div className={`${styles.subjectRow} ${styles.dragOverlay}`}>
                <div className={styles.index}>--</div>
                <img 
                  src={activeSubject.previewUrl || activeSubject.coloredMaskUrl} 
                  className={styles.thumbnail}
                  alt={activeSubject.name}
                  draggable={false}
                />
                <div className={styles.info}>
                  <span className={styles.name} style={{ color: activeSubject.color }}>{activeSubject.name}</span>
                  <div className={styles.durationControl}>
                    <span>{(activeSubject.duration ?? 0.1).toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  )
}
