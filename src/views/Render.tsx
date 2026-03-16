import { useEffect, useMemo, useState } from 'react'
import { useUiAspectRatio, useUiResponsiveFactors, useUiScaleToSetRem } from '@telemetryos/sdk/react'
import {
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
const GOOGLE_SLIDES_STAGE_WIDTH = 16
const GOOGLE_SLIDES_STAGE_HEIGHT = 9

export function Render() {
  const [isLoadingScale, uiScale] = useUiScaleStoreState()
  const [isLoadingUrl, googleSlidesUrl] = useGoogleSlidesUrlStoreState()
  const [isLoadingRefresh, refreshIntervalMinutes] = useRefreshIntervalMinutesStoreState()
  const [isLoadingDuration, slideDurationSeconds] = useSlideDurationSecondsStoreState()
  const uiAspectRatio = useUiAspectRatio()
  const { uiWidthFactor, uiHeightFactor } = useUiResponsiveFactors(uiScale, uiAspectRatio)
  const [refreshToken, setRefreshToken] = useState(0)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

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
    isLoadingDuration

  const publishedPresentationId = useMemo(() => extractPublishedPresentationId(googleSlidesUrl), [googleSlidesUrl])

  const refreshMs = normalizeRefreshMinutes(refreshIntervalMinutes) * 60_000
  const delayMs = normalizeSlideDurationSeconds(slideDurationSeconds) * 1000
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
    if (isStoreLoading || !embedUrl || !isOnline) {
      return
    }

    const timer = window.setTimeout(() => {
      setRefreshToken((current) => current + 1)
    }, refreshMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [embedUrl, isOnline, isStoreLoading, refreshMs, refreshToken])

  const iframeSrc = useMemo(() => {
    if (!embedUrl) {
      return null
    }

    const url = new URL(embedUrl)
    url.searchParams.set('refresh', String(refreshToken))
    return url.toString()
  }, [embedUrl, refreshToken])

  const stageStyle = {
    '--slides-native-width': String(GOOGLE_SLIDES_STAGE_WIDTH),
    '--slides-native-height': String(GOOGLE_SLIDES_STAGE_HEIGHT),
    '--ui-width-factor': String(uiWidthFactor),
    '--ui-height-factor': String(uiHeightFactor),
  } as React.CSSProperties

  const isReady = !isStoreLoading && isOnline && !!iframeSrc
  const renderClassName = uiAspectRatio < 1 ? 'render render--portrait' : 'render'

  if (!isReady) {
    return <div className={renderClassName} />
  }

  return (
    <div className={renderClassName}>
      <div className="render-safe-zone">
        <div className="slides-letterbox" style={stageStyle}>
          <div className="slides-viewport">
            <iframe
              className="slides-frame"
              src={iframeSrc ?? undefined}
              title="Google Slides Presentation"
              allow="autoplay; fullscreen"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
