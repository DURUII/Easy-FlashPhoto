import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import styles from './PulsatingButton.module.css'

interface PulsatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  pulseColor?: string
  duration?: string
  className?: string
}

export default function PulsatingButton({
  children,
  pulseColor = 'rgba(255,255,255,0.55)',
  duration = '1.6s',
  className,
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      {...props}
      className={[styles.button, className ?? ''].filter(Boolean).join(' ')}
      style={{ '--pulse-color': pulseColor, '--pulse-duration': duration } as CSSProperties}
    >
      <span className={styles.content}>{children}</span>
      <span className={styles.pulse} aria-hidden="true" />
    </button>
  )
}
