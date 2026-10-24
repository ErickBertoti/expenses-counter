import { afterEach, describe, expect, it, vi } from "vitest"

import { resolveAppOrigin } from "./app-origin"

function clearOriginEnv() {
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.APP_URL
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.SITE_URL
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  delete process.env.VERCEL_BRANCH_URL
  delete process.env.VERCEL_URL
}

afterEach(() => {
  clearOriginEnv()
  vi.unstubAllEnvs()
})

describe("resolveAppOrigin", () => {
  it("prefers an explicit public app url", () => {
    vi.stubEnv("NODE_ENV", "production")
    process.env.NEXT_PUBLIC_APP_URL = "https://expenses-counter.vercel.app/"

    expect(resolveAppOrigin()).toBe("https://expenses-counter.vercel.app")
  })

  it("accepts a bare configured host and normalizes it to https", () => {
    process.env.APP_URL = "expenses-counter.vercel.app"

    expect(resolveAppOrigin()).toBe("https://expenses-counter.vercel.app")
  })

  it("rejects request headers in production without an explicit origin", () => {
    vi.stubEnv("NODE_ENV", "production")

    expect(() =>
      resolveAppOrigin({
        forwardedHost: "attacker.example.com",
        forwardedProto: "https",
        host: "expenses-counter.vercel.app",
      })
    ).toThrow("Configure NEXT_PUBLIC_APP_URL or APP_URL")
  })

  it("uses forwarded request headers in development when no explicit origin is configured", () => {
    vi.stubEnv("NODE_ENV", "development")

    expect(
      resolveAppOrigin({
        forwardedHost: "preview.example.com",
        forwardedProto: "https",
        host: "localhost:3000",
      })
    ).toBe("https://preview.example.com")
  })

  it("falls back to vercel runtime host outside production when request headers are absent", () => {
    vi.stubEnv("NODE_ENV", "development")
    process.env.VERCEL_URL = "expenses-counter-git-main-erick.vercel.app"

    expect(resolveAppOrigin()).toBe(
      "https://expenses-counter-git-main-erick.vercel.app"
    )
  })

  it("keeps localhost as the final non-production fallback", () => {
    vi.stubEnv("NODE_ENV", "development")

    expect(resolveAppOrigin()).toBe("http://localhost:3000")
  })
})
