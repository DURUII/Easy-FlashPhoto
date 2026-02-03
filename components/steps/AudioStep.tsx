'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './AudioStep.module.css'
import Button from '@/components/Button'
import type { AppState, BGM } from '@/app/page'

interface AudioStepProps {
  mockData: { bgmList: BGM[] }
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onNext: () => void
  onPrev: () => void
}

export default function AudioStep({ mockData, appState, updateAppState, onNext, onPrev }: AudioStepProps) {
  const [selectedBgm, setSelectedBgm] = useState<BGM | null>(appState.selectedBgm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleSelectBgm = (bgm: BGM) => {
    setSelectedBgm(bgm)
    updateAppState({ selectedBgm: bgm })
  }

  const handlePlayToggle = (bgm: BGM) => {
    if (playingId === bgm.id && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setPlayingId(null)
    } else {
      if (bgm.file && audioRef.current) {
        audioRef.current.src = bgm.file
        audioRef.current.play().catch(() => {})
      }
      setIsPlaying(true)
      setPlayingId(bgm.id)
      setTimeout(() => {
        setIsPlaying(false)
        setPlayingId(null)
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const curves = ['linear', 'smooth', 'step'] as const

  return (
    <div className={styles.container}>
      <audio ref={audioRef} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className="display-lg animate-in">AUDIO</h1>
          <p className={`${styles.description} text-sm muted animate-in animate-in-delay-1`}>
            SELECT BACKGROUND MUSIC
          </p>
        </div>

        <div className={`${styles.workspace} animate-in animate-in-delay-2`}>
          <div className={styles.mainSection}>
            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>TRACKS</h3>
              <div className={styles.trackList}>
                {mockData.bgmList.map((bgm) => (
                  <div
                    key={bgm.id}
                    className={`${styles.trackItem} ${selectedBgm?.id === bgm.id ? styles.selected : ''}`}
                    onClick={() => handleSelectBgm(bgm)}
                  >
                    <button
                      className={styles.playBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayToggle(bgm)
                      }}
                    >
                      {playingId === bgm.id && isPlaying ? (
                        <span className={styles.pauseIcon}>||</span>
                      ) : (
                        <span className={styles.playIcon} />
                      )}
                    </button>
                    <div className={styles.trackInfo}>
                      <span className="mono text-sm">{bgm.name}</span>
                      <span className="mono text-xs muted">{bgm.duration}</span>
                    </div>
                    <div className={styles.waveform}>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <span
                          key={i}
                          className={styles.waveBar}
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.05}s`,
                            animationPlayState: playingId === bgm.id && isPlaying ? 'running' : 'paused',
                          }}
                        />
                      ))}
                    </div>
                    {selectedBgm?.id === bgm.id && (
                      <span className={`${styles.selectedBadge} mono text-xs`}>SELECTED</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>SETTINGS</h3>
              
              <div className={styles.settingGroup}>
                <label className="mono text-xs muted">CURVE</label>
                <div className={styles.curveOptions}>
                  {curves.map((curve) => (
                    <button
                      key={curve}
                      className={`${styles.curveBtn} ${appState.animationSettings.curve === curve ? styles.active : ''} mono text-xs`}
                      onClick={() => updateAppState({
                        animationSettings: { ...appState.animationSettings, curve }
                      })}
                    >
                      {curve.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.settingGroup}>
                <label className="mono text-xs muted">INTENSITY</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    className={styles.slider}
                    min="0"
                    max="100"
                    value={appState.animationSettings.intensity}
                    onChange={(e) => updateAppState({
                      animationSettings: {
                        ...appState.animationSettings,
                        intensity: parseInt(e.target.value)
                      }
                    })}
                  />
                  <span className="mono text-sm">{appState.animationSettings.intensity}%</span>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={`${styles.panelTitle} mono text-xs`}>INFO</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className="mono text-xs muted">BPM</span>
                  <span className="mono text-sm">{selectedBgm ? '120' : '--'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className="mono text-xs muted">DURATION</span>
                  <span className="mono text-sm">{selectedBgm?.duration || '--'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className="mono text-xs muted">BEATS</span>
                  <span className="mono text-sm">{selectedBgm ? '8' : '--'}</span>
                </div>
              </div>
            </div>

            {selectedBgm && (
              <div className={`${styles.panel} ${styles.selectedPanel}`}>
                <div className={styles.selectedInfo}>
                  <span className="mono text-xs muted">SELECTED TRACK</span>
                  <span className="mono text-md">{selectedBgm.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button onClick={onPrev} variant="secondary">
          BACK
        </Button>
        <Button onClick={onNext} disabled={!selectedBgm} size="lg">
          CONTINUE
        </Button>
      </div>
    </div>
  )
}
