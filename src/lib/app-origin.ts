const LOCALHOST_ORIGIN = "http://localhost:3000"
const PRODUCTION_ORIGIN_ERROR =
  "Configure NEXT_PUBLIC_APP_URL or APP_URL for production auth redirects."

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
  return normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL)
}

function getVercelOrigin() {
  return normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_BRANCH_URL ??
      process.env.VERCEL_URL
  )
}

function getRequestOrigin(options: ResolveAppOriginOptions) {
  const host = options.forwardedHost ?? options.host
  if (!host) {
    return null
  }

  const normalizedHost = host.split(",")[0]?.trim()
  if (!normalizedHost) {
    return null
  }

  const protocol =
    options.forwardedProto?.split(",")[0]?.trim() ??
    (normalizedHost.includes("localhost") ? "http" : "https")

  return normalizeOrigin(`${protocol}://${normalizedHost}`)
}

export function resolveAppOrigin(options: ResolveAppOriginOptions = {}) {
  const configuredOrigin = getConfiguredOrigin()
  if (configuredOrigin) {
    return configuredOrigin
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(PRODUCTION_ORIGIN_ERROR)
  }

  return getRequestOrigin(options) ?? getVercelOrigin() ?? LOCALHOST_ORIGIN
}
