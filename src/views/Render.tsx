import { useEffect, useMemo, useRef, useState } from 'react'
import { useUiAspectRatio, useUiScaleToSetRem } from '@telemetryos/sdk/react'
import {
  useBackgroundColorStoreState,
  useBackgroundOpacityPercentStoreState,
  useBackgroundTypeStoreState,
  useGoogleSlidesUrlStoreState,
  useRefreshIntervalMinutesStoreState,
  useSlideDurationSecondsStoreState,
  useUiScaleStoreState,
} from '../hooks/store'
import { extractPublishedPresentationId } from '../utils/googleSlides'
import './Render.css'

function normalizeRefreshMinutes(value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 60
  return Math.min(1440, Math.max(5, Math.round(parsed)))
}

function normalizeSlideDurationSeconds(value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 10
  return Math.round(parsed)
}

function normalizeOpacityPercent(value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 100
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

function isValidHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

function hexToRgba(hexColor: string, opacityPercent: number): string {
  if (!isValidHexColor(hexColor)) {
    return `rgba(0, 0, 0, ${opacityPercent / 100})`
  }

  const normalized = hexColor.length === 4
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
    : hexColor

  const red = Number.parseInt(normalized.slice(1, 3), 16)
  const green = Number.parseInt(normalized.slice(3, 5), 16)
  const blue = Number.parseInt(normalized.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, ${opacityPercent / 100})`
}

export function Render() {
  const [isLoadingScale, uiScale] = useUiScaleStoreState()
  const [isLoadingUrl, googleSlidesUrl] = useGoogleSlidesUrlStoreState()
  const [isLoadingRefresh, refreshIntervalMinutes] = useRefreshIntervalMinutesStoreState()
  const [isLoadingDuration, slideDurationSeconds] = useSlideDurationSecondsStoreState()
  const [isLoadingBackgroundType, backgroundType] = useBackgroundTypeStoreState()
  const [isLoadingBackgroundColor, backgroundColor] = useBackgroundColorStoreState()
  const [isLoadingBackgroundOpacity, backgroundOpacityPercent] = useBackgroundOpacityPercentStoreState()
  const uiAspectRatio = useUiAspectRatio()
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const letterboxRef = useRef<HTMLDivElement | null>(null)
  const [letterboxSize, setLetterboxSize] = useState({ width: 0, height: 0 })

  useUiScaleToSetRem(uiScale)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isStoreLoading =
    isLoadingScale ||
    isLoadingUrl ||
    isLoadingRefresh ||
    isLoadingDuration ||
    isLoadingBackgroundType ||
    isLoadingBackgroundColor ||
    isLoadingBackgroundOpacity

  const publishedPresentationId = useMemo(() => extractPublishedPresentationId(googleSlidesUrl), [googleSlidesUrl])

  const refreshMs = normalizeRefreshMinutes(refreshIntervalMinutes) * 60_000
  const delayMs = normalizeSlideDurationSeconds(slideDurationSeconds) * 1000
  const opacityPercent = normalizeOpacityPercent(backgroundOpacityPercent)
  const slideAspectRatioValue = uiAspectRatio > 0 ? uiAspectRatio : 16 / 9

  const letterboxBackgroundColor = backgroundType === 'transparent'
    ? 'transparent'
    : hexToRgba(backgroundType === 'solid' ? backgroundColor : '#000000', opacityPercent)

  const embedUrl = useMemo(() => {
    if (!publishedPresentationId) {
      return null
    }

    const params = new URLSearchParams({
      start: 'true',
      loop: 'true',
      delayms: String(delayMs),
      rm: 'minimal',
    })

    return `https://docs.google.com/presentation/d/e/${publishedPresentationId}/embed?${params.toString()}`
  }, [delayMs, publishedPresentationId])

  useEffect(() => {
    if (!embedUrl) {
      return
    }

    setRefreshNonce((current) => current + 1)
  }, [embedUrl])

  useEffect(() => {
    if (isStoreLoading || !embedUrl || !isOnline) {
      return
    }

    const worker = new Worker(new URL('../workers/iframeRefreshWorker.ts', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event: MessageEvent<{ type: 'tick' }>) => {
      if (event.data?.type === 'tick') {
        setRefreshNonce((current) => current + 1)
      }
    })

    worker.addEventListener('error', () => {
      console.error('Google Slides refresh worker error. Keeping current iframe without scheduled refresh.')
    })

    worker.postMessage({ type: 'start', intervalMs: refreshMs })

    return () => {
      worker.postMessage({ type: 'stop' })
      worker.terminate()
    }
  }, [embedUrl, isOnline, isStoreLoading, refreshMs])

  useEffect(() => {
    if (!letterboxRef.current) {
      return
    }

    const element = letterboxRef.current
    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const nextWidth = rect.width
      const nextHeight = rect.height
      setLetterboxSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current
        }

        return { width: nextWidth, height: nextHeight }
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  const { width: letterboxWidth, height: letterboxHeight } = letterboxSize
  let stageWidth = 0
  let stageHeight = 0
  if (letterboxWidth > 0 && letterboxHeight > 0) {
    const viewportAspectRatio = letterboxWidth / letterboxHeight
    if (slideAspectRatioValue > viewportAspectRatio) {
      // Slide is wider than container — constrain by width, derive height
      stageWidth = Math.floor(letterboxWidth)
      stageHeight = Math.round(stageWidth / slideAspectRatioValue)
    } else {
      // Slide is taller than (or same as) container — constrain by height, derive width
      stageHeight = Math.floor(letterboxHeight)
      stageWidth = Math.round(stageHeight * slideAspectRatioValue)
    }
  }

  const isReady = !isStoreLoading && isOnline && !!embedUrl && stageWidth > 0 && stageHeight > 0

  return (
    <div className="render" style={{ backgroundColor: letterboxBackgroundColor }}>
      <div className="render-safe-zone">
        <div ref={letterboxRef} className="slides-letterbox">
          {isReady && embedUrl && (
            <div
              className="slides-viewport"
              style={{
                width: `${stageWidth}px`,
                height: `${stageHeight}px`,
              }}
            >
              <iframe
                key={`${embedUrl}-${refreshNonce}`}
                className="slides-frame"
                src={embedUrl}
                title="Google Slides Presentation"
                allow="autoplay; fullscreen"
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
