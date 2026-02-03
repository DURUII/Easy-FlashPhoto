import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMAGEGLITCH',
  description: 'Transform static photos into rhythm-powered glitch art',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
