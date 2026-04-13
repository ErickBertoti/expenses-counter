const LOCALHOST_ORIGIN = "http://localhost:3000"

type ResolveAppOriginOptions = {
  forwardedHost?: string | null
  forwardedProto?: string | null
  host?: string | null
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const trimmedValue = value.trim().replace(/\/+$/, "")
  if (!trimmedValue) {
    return null
  }

  const normalizedValue =
    trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")
      ? trimmedValue
      : `https://${trimmedValue}`

  try {
    return new URL(normalizedValue).origin
  } catch {
    return null
  }
}

function getConfiguredOrigin() {
  return normalizeOrigin(
    process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL
  )
}

function getVercelOrigin() {
  return normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_BRANCH_URL ??
      process.env.VERCEL_URL
  )
}

export function resolveAppOrigin(options: ResolveAppOriginOptions = {}) {
  const configuredOrigin = getConfiguredOrigin()
  if (configuredOrigin) {
    return configuredOrigin
  }

  const host = options.forwardedHost ?? options.host
  if (host) {
    const protocol =
      options.forwardedProto ?? (host.includes("localhost") ? "http" : "https")

    return `${protocol}://${host}`
  }

  return getVercelOrigin() ?? LOCALHOST_ORIGIN
}
