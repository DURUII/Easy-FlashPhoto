import styles from './CommitDock.module.css'
import { Check, RotateCcw, X } from 'lucide-react'

interface CommitDockProps {
  onAdd: () => void
  onReset: () => void
  onExit: () => void
  canAdd: boolean
  canReset: boolean
  mode: 'editing' | 'arrange' | 'previewing'
}

export default function CommitDock({
  onAdd,
  onReset,
  onExit,
  canAdd,
  canReset,
  mode
}: CommitDockProps) {
  const isPreviewing = mode === 'previewing'
  const isEditing = mode === 'editing'

  return (
    <div className={styles.dock}>
      <button 
        className={`${styles.actionButton} ${styles.addButton}`}
        onClick={onAdd}
        disabled={!canAdd || isPreviewing || !isEditing}
        title="Add Subject (Enter)"
      >
        <Check size={18} strokeWidth={2} />
        <span>ADD</span>
      </button>

      <button 
        className={`${styles.actionButton} ${styles.resetButton}`}
        onClick={onReset}
        disabled={!canReset || isPreviewing || !isEditing}
        title="Reset Selection"
      >
        <RotateCcw size={16} strokeWidth={2} />
        <span>RST</span>
      </button>

      <button 
        className={`${styles.actionButton} ${styles.exitButton}`}
        onClick={onExit}
        disabled={isPreviewing}
        title="Exit Editing (Esc)"
      >
        <X size={18} strokeWidth={2} />
        <span>EXIT</span>
      </button>
    </div>
  )
}
