import { NextResponse } from "next/server"

import { createClient } from "@/lib/server"
import { sanitizeRedirectPath } from "@/lib/purchases"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=Link%20de%20login%20inv%C3%A1lido.", requestUrl.origin)
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/login?error=N%C3%A3o%20foi%20poss%C3%ADvel%20concluir%20o%20login.", requestUrl.origin)
    )
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin))
}
