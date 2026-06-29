"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRoundIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/client"
import { cn } from "@/lib/utils"

type UpdatePasswordErrors = {
  password?: string
  confirmation?: string
}

export function UpdatePasswordForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<UpdatePasswordErrors>({})

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setMessage(null)
    setErrors({})

    const password = formData.get("password")?.toString() ?? ""
    const confirmation = formData.get("confirmation")?.toString() ?? ""
    const nextErrors: UpdatePasswordErrors = {}

    if (password.length < 8) {
      nextErrors.password = "A senha deve ter pelo menos 8 caracteres."
    }

    if (password !== confirmation) {
      nextErrors.confirmation = "As senhas precisam ser iguais."
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMessage("Revise os campos destacados.")
      setPending(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage("Nao foi possivel atualizar sua senha. Solicite um novo link.")
      setPending(false)
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.password) || undefined}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimo de 8 caracteres"
              aria-invalid={Boolean(errors.password) || undefined}
              required
            />
            <FieldDescription>
              Essa senha passa a ser usada junto com seu email no login.
            </FieldDescription>
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password}</p>
            ) : null}
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(errors.confirmation) || undefined}>
          <FieldLabel htmlFor="confirmation">Confirmar senha</FieldLabel>
          <FieldContent>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              aria-invalid={Boolean(errors.confirmation) || undefined}
              required
            />
            {errors.confirmation ? (
              <p className="text-sm text-destructive">{errors.confirmation}</p>
            ) : null}
          </FieldContent>
        </Field>
      </FieldGroup>

      {message ? (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {message}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <KeyRoundIcon data-icon="inline-start" />
        )}
        Salvar nova senha
      </Button>
    </form>
  )
}
