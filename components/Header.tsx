import styles from './Header.module.css'

interface HeaderProps {
  children?: React.ReactNode
}

export default function Header({ children }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoText}>IMAGEGLITCH</span>
        </div>
        <div className={styles.version}>
          <div className={styles.versionInner}>
            <span>v0.1</span>
            <span>v0.1</span>
          </div>
        </div>
        <div className={styles.navArea}>
          {children}
        </div>
      </div>
    </header>
  )
}
