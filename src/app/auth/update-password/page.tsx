import { redirect } from "next/navigation"
import { KeyRoundIcon } from "lucide-react"

import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/server"

export const dynamic = "force-dynamic"

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=Link%20de%20senha%20invalido%20ou%20expirado.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-4">
          <Badge variant="outline" className="w-fit">
            Acesso por senha
          </Badge>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-muted text-primary">
              <KeyRoundIcon />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-semibold">
                Criar nova senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Defina uma senha para continuar usando esta mesma conta.
              </p>
            </div>
          </div>
        </div>
        <UpdatePasswordForm />
      </section>
    </main>
  )
}
