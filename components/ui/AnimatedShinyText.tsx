import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './AnimatedShinyText.module.css'

interface AnimatedShinyTextProps extends HTMLAttributes<HTMLSpanElement> {
  shimmerWidth?: number
}

export default function AnimatedShinyText({
  shimmerWidth = 120,
  className,
  children,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      {...props}
      className={[styles.text, className ?? ''].filter(Boolean).join(' ')}
      style={{ '--shiny-width': `${shimmerWidth}px` } as CSSProperties}
    >
      {children}
    </span>
  )
}
