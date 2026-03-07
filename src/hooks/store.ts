import { createUseInstanceStoreState } from '@telemetryos/sdk/react'
export const useUiScaleStoreState = createUseInstanceStoreState<number>('ui-scale', 1)

export const useGoogleSlidesUrlStoreState = createUseInstanceStoreState<string>('google-slides-url', '')

export const useRefreshIntervalMinutesStoreState = createUseInstanceStoreState<string>('refresh-interval-minutes', '60')

export const useSlideDurationSecondsStoreState = createUseInstanceStoreState<string>('slide-duration-seconds', '10')

export const useBackgroundTypeStoreState = createUseInstanceStoreState<'default' | 'solid' | 'transparent'>('background-type', 'default')

export const useBackgroundColorStoreState = createUseInstanceStoreState<string>('background-color', '#000000')

export const useBackgroundOpacityPercentStoreState = createUseInstanceStoreState<string>('background-opacity-percent', '100')
