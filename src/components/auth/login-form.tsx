"use client"

import { useActionState } from "react"
import { Loader2Icon, MailIcon } from "lucide-react"

import { requestMagicLink } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AuthFormState } from "@/lib/types"
import { cn } from "@/lib/utils"

const initialState: AuthFormState = {
  status: "idle",
}

type LoginFormProps = {
  errorMessage?: string
}

export function LoginForm({ errorMessage }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    initialState
  )
  const message = state.message ?? errorMessage
  const isSuccess = state.status === "success"

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={state.status === "error" || undefined}>
          <FieldLabel htmlFor="email">Seu email</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              aria-invalid={state.status === "error" || undefined}
              required
            />
            <FieldDescription>
              Você recebe um magic link e entra sem senha fixa.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      {message ? (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            isSuccess
              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {message}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <MailIcon data-icon="inline-start" />
        )}
        Enviar link de acesso
      </Button>
    </form>
  )
}
