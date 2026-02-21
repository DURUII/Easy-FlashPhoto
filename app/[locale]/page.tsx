'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Footer from '@/components/Footer'
import Dither from '@/components/ui/Dither'
import Marquee from '@/components/ui/Marquee'
import WordRotate from '@/components/ui/WordRotate'
import AnimatedShinyText from '@/components/ui/AnimatedShinyText'
import { useSharedUpload } from '@/hooks/useSharedUpload'
import styles from './home.module.css'

const TICKERS = [
  'FLASH-PHOTO',
  'VIRAL CONTENT',
  'AI MASKING',
  'GLITCH RHYTHM',
  'LIDAR LAB',
  'LOCAL PROCESSING',
  'ONE CLICK EXPORT',
]

export default function HomePage({ params }: { params: { locale: string } }) {
  const router = useRouter()
  const { sharedImage } = useSharedUpload()

  const flashHref = `/${params.locale}/flash-photo`
  const lidarHref = `/${params.locale}/lidar`

  const effects = useMemo(
    () => [
      {
        key: 'flash-photo',
        title: 'FLASH-PHOTO',
        subtitle: 'POWER-ON GLITCH PASS',
        status: 'LIVE',
        href: flashHref,
        cta: 'OPEN STUDIO',
        previews: ['/examples/input-sample.jpg'],
      },
      {
        key: 'lidar',
        title: 'LIDAR',
        subtitle: 'DEPTH LIGHT SWEEP',
        status: 'LAB',
        href: lidarHref,
        cta: 'OPEN LAB',
        previews: [] as string[],
      },
    ],
    [flashHref, lidarHref]
  )

  return (
    <main className={styles.main}>
      <TopBar showActions={false} homeHref={`/${params.locale}`} />

      <section className={styles.heroArea}>
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />

        <div className={styles.heroGlow} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.heroLead}>IMAGEGLITCH EFFECT LAB</div>

          <h1 className={styles.heroTitle}>
            MAKE VIRAL
            <WordRotate
              words={['FLASH PHOTO', 'LIDAR LOOKS', 'GLITCH CUTOUTS']}
              duration={2100}
              className={styles.heroRotateWord}
            />
          </h1>

          <AnimatedShinyText className={styles.heroShiny}>WITHIN SECONDS</AnimatedShinyText>

          <p className={styles.heroSub}>
            PICK AN EFFECT, DROP A PHOTO, SHIP SHORT-FORM VISUALS FAST.
          </p>

          <div className={styles.sourceState}>
            <span className={sharedImage ? styles.sourceOnline : styles.sourceOffline} />
            {sharedImage ? 'SOURCE READY ACROSS EFFECTS' : 'NO SOURCE LINKED YET'}
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {effects.map((effect) => (
            <article key={effect.key} className={styles.effectCard}>
              <div className={styles.cardTop}>
                <span className={effect.status === 'LIVE' ? styles.badgeLive : styles.badgeLab}>{effect.status}</span>
                <span className={styles.cardSub}>{effect.subtitle}</span>
              </div>

              <h2 className={styles.cardTitle}>{effect.title}</h2>

              <div className={styles.previewRow}>
                {Array.from({ length: 3 }).map((_, index) => {
                  const image = effect.previews[index]
                  if (image) {
                    return <img key={index} className={styles.previewItem} src={image} alt={`${effect.title} preview ${index + 1}`} />
                  }
                  return (
                    <div key={index} className={styles.previewSlot}>
                      1:1 PREVIEW {index + 1}
                    </div>
                  )
                })}
              </div>

              <button className={styles.cardButton} onClick={() => router.push(effect.href)}>
                {effect.cta}
              </button>
            </article>
          ))}
        </div>

        <div className={styles.tickerWrap}>
          <Marquee speed={30}>
            {TICKERS.map((item, index) => (
              <span key={`ticker-${index}`} className={styles.tickerItem}>
                {item}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      <Footer modelReady modelStatus="ready" modelProgress={1} />
    </main>
  )
}
