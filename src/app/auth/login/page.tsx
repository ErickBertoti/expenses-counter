import { redirect } from "next/navigation"
import { KeyRoundIcon } from "lucide-react"

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
      <section className="grid w-full min-w-0 max-w-full grid-cols-1 overflow-hidden rounded-lg border border-border bg-card sm:max-w-5xl xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="order-2 flex min-w-0 flex-col justify-between gap-8 bg-primary p-6 text-primary-foreground sm:p-8 xl:order-1 xl:p-10">
          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              Local, simples e pessoal
            </Badge>
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-3xl leading-tight font-semibold text-balance sm:text-5xl">
                Contador de despesas parceladas.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-primary-foreground/75 sm:text-base">
                Entre com email e senha, registre compras antigas e acompanhe o
                que ainda falta cair nas faturas dos próximos meses.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
              <div className="text-sm font-medium">Parcelas antigas</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Informe data, total e quantidade de parcelas. O sistema calcula
                automaticamente o que já passou.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
              <div className="text-sm font-medium">Resumo por mês</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Veja em quais meses cada compra aparece e quanto sobra de saldo
                para frente.
              </p>
            </div>
          </div>
        </div>
        <div className="order-1 flex min-w-0 items-center p-4 sm:p-6 xl:order-2 xl:p-10">
          <div className="w-full min-w-0 rounded-md border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="w-fit">
                  Acesso por email
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-md bg-muted text-primary">
                    <KeyRoundIcon />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-semibold">
                      Entrar na aplicação
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Use sua senha ou crie uma pelo fluxo de primeiro acesso.
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
