import { redirect } from "next/navigation"
import { MailIcon } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"
import { Badge } from "@/components/ui/badge"

import { createClient } from "@/lib/server"

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

export const dynamic = "force-dynamic"

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  const errorMessage = readQueryParam(params.error)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-border/70 bg-background/90 shadow-xl shadow-foreground/5 backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 flex flex-col justify-between gap-8 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)] p-6 sm:p-8 xl:order-1 xl:p-10">
          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              Local, simples e pessoal
            </Badge>
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-4xl leading-tight font-semibold text-balance sm:text-5xl">
                Contador de despesas parceladas.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                Entre por magic link, registre compras antigas e acompanhe o que
                ainda falta cair nas faturas dos próximos meses.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
              <div className="text-sm font-medium">Parcelas antigas</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Informe data, total e quantidade de parcelas. O sistema calcula
                automaticamente o que já passou.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
              <div className="text-sm font-medium">Resumo por mês</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Veja em quais meses cada compra aparece e quanto sobra de saldo
                para frente.
              </p>
            </div>
          </div>
        </div>
        <div className="order-1 flex items-center p-4 sm:p-6 xl:order-2 xl:p-10">
          <div className="w-full rounded-[24px] border border-border/70 bg-background p-5 shadow-sm sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="w-fit">
                  Acesso por email
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MailIcon />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold">
                      Entrar na aplicação
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Receba um link seguro para abrir sua dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <LoginForm errorMessage={errorMessage} />
          </div>
        </div>
      </section>
    </main>
  )
}
