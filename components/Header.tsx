import type { CSSProperties } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  children?: React.ReactNode
  modelProgress?: number
  modelReady?: boolean
}

export default function Header({ children, modelProgress, modelReady }: HeaderProps) {
  const progress = modelReady ? 100 : Math.max(0, Math.min(100, Math.round((modelProgress ?? 0) * 100)))

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span
            className={styles.logoText}
            style={{ '--progress': `${progress}%` } as CSSProperties}
            aria-label="Imageglitch model loading progress"
          >
            IMAGEGLITCH
          </span>
          <span className={styles.version}>v0.1</span>
        </div>
        <div className={styles.navArea}>
          {children}
        </div>
      </div>
    </header>
  )
}
