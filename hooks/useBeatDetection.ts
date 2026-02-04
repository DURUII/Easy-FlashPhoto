'use client'

import { useState, useCallback, useRef } from 'react'

export interface BeatDetectionResult {
  beats: number[]           // Beat times in seconds
  duration: number          // Total audio duration
  bpm: number | null        // Estimated BPM
  waveform: number[]        // Normalized waveform data for visualization
}

export interface BeatDetectionOptions {
  sensitivity: number       // 0-1, higher = more beats detected
  minInterval: number       // Minimum interval between beats (seconds)
}

const DEFAULT_OPTIONS: BeatDetectionOptions = {
  sensitivity: 0.5,
  minInterval: 0.1,
}

export function useBeatDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BeatDetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  /**
   * Analyze audio file and detect beats
   */
  const analyzeAudio = useCallback(async (
    audioSource: string | File,
    options: Partial<BeatDetectionOptions> = {}
  ): Promise<BeatDetectionResult> => {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    setIsAnalyzing(true)
    setError(null)

    try {
      const audioContext = getAudioContext()
      
      // Load audio file
      let arrayBuffer: ArrayBuffer
      if (typeof audioSource === 'string') {
        const response = await fetch(audioSource)
        arrayBuffer = await response.arrayBuffer()
      } else {
        arrayBuffer = await audioSource.arrayBuffer()
      }

      // Decode audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const duration = audioBuffer.duration
      const sampleRate = audioBuffer.sampleRate

      // Get mono channel data
      const channelData = audioBuffer.getChannelData(0)
      
      // Parameters for analysis
      const frameSize = Math.floor(sampleRate * 0.02) // 20ms frames
      const hopSize = Math.floor(frameSize / 2)        // 50% overlap
      const numFrames = Math.floor((channelData.length - frameSize) / hopSize)

      // Calculate energy for each frame
      const energies: number[] = []
      for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize
        let energy = 0
        for (let j = 0; j < frameSize; j++) {
          energy += channelData[start + j] ** 2
        }
        energies.push(energy)
      }

      // Normalize energies
      const maxEnergy = Math.max(...energies)
      const normalizedEnergies = energies.map(e => e / maxEnergy)

      // Detect onsets (beats) using adaptive threshold
      const beats: number[] = []
      const windowSize = 20 // frames for local average
      const threshold = 1.5 - opts.sensitivity // Lower sensitivity = higher threshold
      const minFrameInterval = Math.floor(opts.minInterval * sampleRate / hopSize)

      let lastBeatFrame = -minFrameInterval

      for (let i = windowSize; i < normalizedEnergies.length - windowSize; i++) {
        // Calculate local average
        let localSum = 0
        for (let j = i - windowSize; j < i + windowSize; j++) {
          localSum += normalizedEnergies[j]
        }
        const localAvg = localSum / (windowSize * 2)

        // Check if current frame is a peak
        const current = normalizedEnergies[i]
        const isPeak = current > normalizedEnergies[i - 1] && 
                       current > normalizedEnergies[i + 1]
        
        // Detect beat if energy exceeds threshold and is a local peak
        if (isPeak && current > localAvg * threshold && (i - lastBeatFrame) >= minFrameInterval) {
          const timeInSeconds = (i * hopSize) / sampleRate
          beats.push(timeInSeconds)
          lastBeatFrame = i
        }
      }

      // Calculate BPM from beat intervals
      let bpm: number | null = null
      if (beats.length > 2) {
        const intervals: number[] = []
        for (let i = 1; i < beats.length; i++) {
          intervals.push(beats[i] - beats[i - 1])
        }
        // Filter out outliers (keep intervals between 0.2s and 2s)
        const validIntervals = intervals.filter(i => i >= 0.2 && i <= 2)
        if (validIntervals.length > 0) {
          const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length
          bpm = Math.round(60 / avgInterval)
        }
      }

      // Generate waveform for visualization (downsampled)
      const waveformSize = 200
      const samplesPerPoint = Math.floor(channelData.length / waveformSize)
      const waveform: number[] = []
      for (let i = 0; i < waveformSize; i++) {
        const start = i * samplesPerPoint
        let sum = 0
        for (let j = 0; j < samplesPerPoint; j++) {
          sum += Math.abs(channelData[start + j])
        }
        waveform.push(sum / samplesPerPoint)
      }
      // Normalize waveform
      const maxWaveform = Math.max(...waveform)
      const normalizedWaveform = waveform.map(w => w / maxWaveform)

      const detectionResult: BeatDetectionResult = {
        beats,
        duration,
        bpm,
        waveform: normalizedWaveform,
      }

      setResult(detectionResult)
      setIsAnalyzing(false)
      return detectionResult

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze audio'
      setError(errorMessage)
      setIsAnalyzing(false)
      throw new Error(errorMessage)
    }
  }, [getAudioContext])

  /**
   * Re-detect beats with different options (without reloading audio)
   */
  const redetectBeats = useCallback(async (
    audioSource: string | File,
    options: Partial<BeatDetectionOptions> = {}
  ) => {
    return analyzeAudio(audioSource, options)
  }, [analyzeAudio])

  /**
   * Clear results
   */
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    isAnalyzing,
    result,
    error,
    analyzeAudio,
    redetectBeats,
    reset,
  }
}
