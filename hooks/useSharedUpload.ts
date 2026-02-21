'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'imageglitch_shared_upload_v1'
const SESSION_KEY = 'imageglitch_shared_upload_session_v1'
const EVENT_NAME = 'imageglitch:shared-upload'

export interface SharedUpload {
  dataUrl: string
  updatedAt: number
}

let memoryCache: SharedUpload | null = null

const parseUpload = (raw: string | null): SharedUpload | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SharedUpload
    if (!parsed || typeof parsed.dataUrl !== 'string' || typeof parsed.updatedAt !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const readStorage = (): SharedUpload | null => {
  if (typeof window === 'undefined') return null

  const local = parseUpload(window.localStorage.getItem(STORAGE_KEY))
  if (local) {
    memoryCache = local
    return local
  }

  const session = parseUpload(window.sessionStorage.getItem(SESSION_KEY))
  if (session) {
    memoryCache = session
    return session
  }

  return memoryCache
}

export const readSharedUpload = (): SharedUpload | null => readStorage()

export const writeSharedUpload = (dataUrl: string | null): SharedUpload | null => {
  if (typeof window === 'undefined') return null

  if (!dataUrl) {
    memoryCache = null
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }))
    return null
  }

  const payload: SharedUpload = {
    dataUrl,
    updatedAt: Date.now(),
  }

  const serialized = JSON.stringify(payload)
  memoryCache = payload

  let wrote = false
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized)
    wrote = true
  } catch {
    wrote = false
  }

  if (!wrote) {
    try {
      window.sessionStorage.setItem(SESSION_KEY, serialized)
    } catch {
      // Keep memory cache as last fallback.
    }
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }))
  return payload
}

export const useSharedUpload = () => {
  const [sharedUpload, setSharedUploadState] = useState<SharedUpload | null>(null)

  useEffect(() => {
    setSharedUploadState(readStorage())

    const sync = () => {
      setSharedUploadState(readStorage())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === SESSION_KEY || event.key === null) {
        sync()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(EVENT_NAME, sync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(EVENT_NAME, sync)
    }
  }, [])

  const setSharedUpload = useCallback((dataUrl: string | null) => {
    const next = writeSharedUpload(dataUrl)
    setSharedUploadState(next)
  }, [])

  return {
    sharedUpload,
    sharedImage: sharedUpload?.dataUrl ?? null,
    setSharedUpload,
    clearSharedUpload: () => setSharedUpload(null),
  }
}
