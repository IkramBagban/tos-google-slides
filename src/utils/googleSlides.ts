function parseUrl(rawInput: string): URL | null {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return null
  }

  const candidate = trimmed.replace(/\s+/g, '')

  try {
    return new URL(candidate)
  } catch {
    try {
      if (/^[a-z][a-z\d+.-]*:/i.test(candidate)) {
        return null
      }

      return new URL(`https://${candidate}`)
    } catch {
      return null
    }
  }
}

function isGoogleSlidesHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized === 'docs.google.com'
}

export function extractPublishedPresentationId(rawInput: string): string | null {
  const parsed = parseUrl(rawInput)
  if (!parsed || !/^https?:$/i.test(parsed.protocol) || !isGoogleSlidesHost(parsed.hostname)) {
    return null
  }

  const match = parsed.pathname.match(/\/presentation\/d\/e\/([^/]+)/i)
  const presentationId = match?.[1]?.trim() ?? ''

  if (!presentationId) {
    return null
  }

  if (!/^[A-Za-z0-9_-]+$/.test(presentationId)) {
    return null
  }

  return presentationId
}

export function isSharedOrEditGoogleSlidesUrl(rawInput: string): boolean {
  const parsed = parseUrl(rawInput)
  if (!parsed || !/^https?:$/i.test(parsed.protocol) || !isGoogleSlidesHost(parsed.hostname)) {
    return false
  }

  return /\/presentation\/d\//i.test(parsed.pathname) && !/\/presentation\/d\/e\//i.test(parsed.pathname)
}

export function normalizeGoogleSlidesUrlInput(rawInput: string): string {
  const parsed = parseUrl(rawInput)
  if (!parsed) {
    return rawInput.trim()
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    return rawInput.trim()
  }

  parsed.hash = ''

  if (isGoogleSlidesHost(parsed.hostname)) {
    const publishedPresentationId = extractPublishedPresentationId(parsed.toString())
    if (publishedPresentationId) {
      return `https://docs.google.com/presentation/d/e/${publishedPresentationId}/pub`
    }
  }

  return parsed.toString()
}
