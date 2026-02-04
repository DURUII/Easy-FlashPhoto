import styles from './ExportModal.module.css'

type ExportFormat = 'mp4' | 'gif' | 'live' | 'cutout'
type CutoutMode = 'cropped' | 'fullsize'

interface ExportModalProps {
  isOpen: boolean
  formats: ExportFormat[]
  cutoutModes: CutoutMode[]
  onFormatToggle: (format: ExportFormat) => void
  onCutoutModeToggle: (mode: CutoutMode) => void
  onCancel: () => void
  onDownload: () => void
  isBusy?: boolean
  note?: string | null
  progress?: number
}

export default function ExportModal({
  isOpen,
  formats,
  cutoutModes,
  onFormatToggle,
  onCutoutModeToggle,
  onCancel,
  onDownload,
  isBusy = false,
  note,
  progress = 0
}: ExportModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>EXPORT</h2>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>FORMAT</div>
          <div className={styles.optionRow}>
            {(['mp4', 'gif', 'live', 'cutout'] as ExportFormat[]).map(opt => (
              <button
                key={opt}
                type="button"
                className={`${styles.optionButton} ${formats.includes(opt) ? styles.active : ''}`}
                onClick={() => onFormatToggle(opt)}
                disabled={isBusy}
              >
                {opt === 'mp4' && 'MP4'}
                {opt === 'gif' && 'GIF'}
                {opt === 'live' && 'LIVE PHOTO'}
                {opt === 'cutout' && 'CUTOUT'}
              </button>
            ))}
          </div>
        </div>

        {formats.includes('cutout') && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>CUTOUT</div>
            <div className={styles.optionRow}>
              {(['cropped', 'fullsize'] as CutoutMode[]).map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`${styles.optionButton} ${cutoutModes.includes(opt) ? styles.active : ''}`}
                  onClick={() => onCutoutModeToggle(opt)}
                  disabled={isBusy}
                >
                  {opt === 'cropped' ? 'CROPPED' : 'FULLSIZE'}
                </button>
              ))}
            </div>
          </div>
        )}

        {note && <div className={styles.note}>{note}</div>}
        {isBusy && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{progress}%</div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={onCancel} disabled={isBusy}>
            CANCEL
          </button>
          <button className={styles.primaryButton} onClick={onDownload} disabled={isBusy}>
            {isBusy ? 'EXPORTING...' : 'DOWNLOAD'}
          </button>
        </div>
      </div>
    </div>
  )
}
