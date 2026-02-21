'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Footer from '@/components/Footer'
import { useSharedUpload } from '@/hooks/useSharedUpload'
import styles from './lidar.module.css'

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FAILED TO READ FILE'))
    reader.readAsDataURL(file)
  })

export default function LidarPage({ params }: { params: { locale: string } }) {
  const { sharedImage, setSharedUpload } = useSharedUpload()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const flashHref = `/${params.locale}/flash-photo`

  const handleReplace = async (file: File) => {
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      setSharedUpload(dataUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.main}>
      <TopBar showActions={false} homeHref={`/${params.locale}`} status="LIDAR" statusColor="#00FFFF" />

      <section className={styles.panel}>
        <div className={styles.header}>
          <h1>LIDAR EFFECT LAB</h1>
          <span>COMING SOON</span>
        </div>

        <p>
          THIS PAGE IS ISOLATED FROM FLASH-PHOTO WORKFLOW. YOU CAN STILL REUSE OR REPLACE THE SAME SHARED SOURCE
          IMAGE HERE BEFORE FUTURE LIDAR PIPELINE GOES LIVE.
        </p>

        {sharedImage ? (
          <div className={styles.previewWrap}>
            <img className={styles.preview} src={sharedImage} alt="Shared source" />
          </div>
        ) : (
          <div className={styles.placeholder}>NO SHARED IMAGE YET. UPLOAD HERE OR FROM HOMEPAGE.</div>
        )}

        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => inputRef.current?.click()} disabled={busy}>
            {sharedImage ? 'REPLACE SHARED IMAGE' : 'UPLOAD SHARED IMAGE'}
          </button>
          <button className={styles.secondary} onClick={() => router.push(flashHref)}>
            OPEN FLASH-PHOTO
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleReplace(file)
            }
            event.currentTarget.value = ''
          }}
        />
      </section>

      <Footer modelReady modelStatus="ready" modelProgress={1} />
    </main>
  )
}
