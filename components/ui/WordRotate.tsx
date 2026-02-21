'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface WordRotateProps {
  words: string[]
  duration?: number
  className?: string
}

export default function WordRotate({ words, duration = 2200, className }: WordRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return
    const interval = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, duration)
    return () => window.clearInterval(interval)
  }, [words, duration])

  return (
    <div style={{ overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={className}
          initial={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
