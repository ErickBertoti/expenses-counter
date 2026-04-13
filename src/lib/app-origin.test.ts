import { afterEach, describe, expect, it } from "vitest"

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
})

describe("resolveAppOrigin", () => {
  it("prefers an explicit public app url", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://expenses-counter.vercel.app/"

    expect(resolveAppOrigin()).toBe("https://expenses-counter.vercel.app")
  })

  it("accepts a bare configured host and normalizes it to https", () => {
    process.env.APP_URL = "expenses-counter.vercel.app"

    expect(resolveAppOrigin()).toBe("https://expenses-counter.vercel.app")
  })

  it("uses forwarded request headers when no explicit origin is configured", () => {
    expect(
      resolveAppOrigin({
        forwardedHost: "preview.example.com",
        forwardedProto: "https",
        host: "localhost:3000",
      })
    ).toBe("https://preview.example.com")
  })

  it("falls back to vercel runtime host when request headers are absent", () => {
    process.env.VERCEL_URL = "expenses-counter-git-main-erick.vercel.app"

    expect(resolveAppOrigin()).toBe(
      "https://expenses-counter-git-main-erick.vercel.app"
    )
  })

  it("keeps localhost as the final development fallback", () => {
    expect(resolveAppOrigin()).toBe("http://localhost:3000")
  })
})
