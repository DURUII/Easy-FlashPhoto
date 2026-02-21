import type { CSSProperties, ReactNode } from 'react'
import styles from './Marquee.module.css'

interface MarqueeProps {
  children: ReactNode
  reverse?: boolean
  speed?: number
  className?: string
  repeat?: number
}

export default function Marquee({
  children,
  reverse = false,
  speed = 36,
  className,
  repeat = 4,
}: MarqueeProps) {
  const rowClass = [
    styles.row,
    reverse ? styles.reverse : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.viewport} style={{ '--duration': `${speed}s` } as CSSProperties}>
      {Array.from({ length: repeat }).map((_, index) => (
        <div key={index} className={rowClass}>
          {children}
        </div>
      ))}
    </div>
  )
}
