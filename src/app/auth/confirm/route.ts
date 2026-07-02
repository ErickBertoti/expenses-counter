import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/server"
import { sanitizeRedirectPath } from "@/lib/purchases"

const LINK_ERROR_PATH =
  "/auth/login?error=Link%20de%20senha%20inv%C3%A1lido%20ou%20expirado."
const DEFAULT_RECOVERY_PATH = "/auth/update-password"

function isSupportedOtpType(type: string | null): type is EmailOtpType {
  return type === "recovery"
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const nextPath = sanitizeRedirectPath(
    requestUrl.searchParams.get("next") ?? DEFAULT_RECOVERY_PATH
  )

  if (!tokenHash || !isSupportedOtpType(type)) {
    return NextResponse.redirect(new URL(LINK_ERROR_PATH, requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error) {
    return NextResponse.redirect(new URL(LINK_ERROR_PATH, requestUrl.origin))
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin))
}
