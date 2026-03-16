import {
  SettingsColorFrame,
  SettingsContainer,
  SettingsError,
  SettingsField,
  SettingsHeading,
  SettingsHint,
  SettingsInputFrame,
  SettingsLabel,
  SettingsSelectFrame,
  SettingsSliderFrame,
} from '@telemetryos/sdk/react'
import {
  useBackgroundColorStoreState,
  useBackgroundOpacityPercentStoreState,
  useBackgroundTypeStoreState,
  useGoogleSlidesUrlStoreState,
  useRefreshIntervalMinutesStoreState,
  useSlideDurationSecondsStoreState,
  useUiScaleStoreState,
} from '../hooks/store'
import {
  extractPublishedPresentationId,
  isSharedOrEditGoogleSlidesUrl,
  normalizeGoogleSlidesUrlInput,
} from '../utils/googleSlides'

function getUrlValidationError(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null

  if (extractPublishedPresentationId(trimmed)) return null

  if (isSharedOrEditGoogleSlidesUrl(trimmed)) {
    return 'This looks like a shared/edit link. Publish the deck to the web first, then paste the published URL.'
  }

  return 'Invalid Google Slides URL. Paste a published Google Slides URL.'
}

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
  if (!Number.isFinite(parsed)) return 0
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

function sanitizeHexColor(value: string): string {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : '#000000'
}

export function Settings() {
  const [isLoadingUrl, googleSlidesUrl, setGoogleSlidesUrl] = useGoogleSlidesUrlStoreState(250)
  const [isLoadingRefresh, refreshIntervalMinutes, setRefreshIntervalMinutes] = useRefreshIntervalMinutesStoreState(250)
  const [isLoadingDuration, slideDurationSeconds, setSlideDurationSeconds] = useSlideDurationSecondsStoreState(250)
  const [isLoadingBackgroundType, backgroundType, setBackgroundType] = useBackgroundTypeStoreState()
  const [isLoadingBackgroundColor, backgroundColor, setBackgroundColor] = useBackgroundColorStoreState()
  const [isLoadingBackgroundOpacity, backgroundOpacityPercent, setBackgroundOpacityPercent] = useBackgroundOpacityPercentStoreState(5)
  const [isLoadingScale, uiScale, setUiScale] = useUiScaleStoreState(5)

  const isLoading =
    isLoadingUrl ||
    isLoadingRefresh ||
    isLoadingDuration ||
    isLoadingBackgroundType ||
    isLoadingBackgroundColor ||
    isLoadingBackgroundOpacity ||
    isLoadingScale
  const urlValidationError = getUrlValidationError(googleSlidesUrl)
  const appliedRefreshMinutes = normalizeRefreshMinutes(refreshIntervalMinutes)
  const appliedSlideDurationSeconds = normalizeSlideDurationSeconds(slideDurationSeconds)
  const appliedBackgroundOpacityPercent = normalizeOpacityPercent(backgroundOpacityPercent)

  return (
    <SettingsContainer>
      <SettingsHeading>Presentation Source</SettingsHeading>

      <SettingsField>
        <SettingsLabel>Google Slides URL</SettingsLabel>
        <SettingsInputFrame>
          <input
            type="text"
            placeholder="https://docs.google.com/presentation/d/e/.../pub"
            value={googleSlidesUrl}
            onChange={(e) => setGoogleSlidesUrl(e.target.value)}
            onBlur={() => setGoogleSlidesUrl(normalizeGoogleSlidesUrlInput(googleSlidesUrl))}
            disabled={isLoading}
          />
        </SettingsInputFrame>
        <SettingsHint>Use File → Share → Publish to web in Google Slides, then paste the published URL.</SettingsHint>
        {urlValidationError && <SettingsError>{urlValidationError}</SettingsError>}
      </SettingsField>

      <SettingsField>
        <SettingsLabel>Refresh Interval (minutes)</SettingsLabel>
        <SettingsInputFrame>
          <input
            type="text"
            inputMode="numeric"
            placeholder="60"
            value={refreshIntervalMinutes}
            onChange={(e) => setRefreshIntervalMinutes(e.target.value)}
            onBlur={() => setRefreshIntervalMinutes(String(appliedRefreshMinutes))}
            disabled={isLoading}
          />
        </SettingsInputFrame>
        <SettingsHint>How often the embed reloads to pick up presentation updates (between 5 and 1440 minutes).</SettingsHint>
      </SettingsField>

      <SettingsHeading>Display Options</SettingsHeading>

      <SettingsField>
        <SettingsLabel>Slide Duration (seconds)</SettingsLabel>
        <SettingsInputFrame>
          <input
            type="text"
            inputMode="numeric"
            placeholder="10"
            value={slideDurationSeconds}
            onChange={(e) => setSlideDurationSeconds(e.target.value)}
            onBlur={() => setSlideDurationSeconds(String(appliedSlideDurationSeconds))}
            disabled={isLoading}
          />
        </SettingsInputFrame>
        <SettingsHint>How long each slide stays on screen.</SettingsHint>
      </SettingsField>

      <SettingsHeading>Background</SettingsHeading>

      <SettingsField>
        <SettingsLabel>Background Type</SettingsLabel>
        <SettingsSelectFrame>
          <select
            value={backgroundType}
            onChange={(e) => setBackgroundType(e.target.value as 'default' | 'solid')}
            disabled={isLoading}
          >
            <option value="default">Default (black)</option>
            <option value="solid">Solid color</option>
          </select>
        </SettingsSelectFrame>
      </SettingsField>

      <SettingsField>
        <SettingsLabel>Solid Background Color</SettingsLabel>
        <SettingsColorFrame>
          <input
            type="color"
            value={sanitizeHexColor(backgroundColor)}
            onChange={(e) => setBackgroundColor(e.target.value)}
            onBlur={() => setBackgroundColor(sanitizeHexColor(backgroundColor))}
            disabled={isLoading || backgroundType !== 'solid'}
          />
        </SettingsColorFrame>
      </SettingsField>

      <SettingsField>
        <SettingsLabel>Background Transparency</SettingsLabel>
        <SettingsSliderFrame>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={appliedBackgroundOpacityPercent}
            onChange={(e) => setBackgroundOpacityPercent(e.target.value)}
            disabled={isLoading}
          />
        </SettingsSliderFrame>
        <SettingsHint>{appliedBackgroundOpacityPercent}% opacity</SettingsHint>
        <SettingsHint>Set opacity to 0% to keep the letterbox area fully transparent.</SettingsHint>
      </SettingsField>

      <SettingsHeading>Display Scale</SettingsHeading>

      <SettingsField>
        <SettingsLabel>UI Scale</SettingsLabel>
        <SettingsSliderFrame>
          <input
            type="range"
            min={0}
            max={3}
            step={0.01}
            value={uiScale}
            onChange={(e) => setUiScale(Number(e.target.value))}
            disabled={isLoading}
          />
        </SettingsSliderFrame>
        <SettingsHint>{uiScale.toFixed(2)}x</SettingsHint>
      </SettingsField>
    </SettingsContainer>
  )
}
