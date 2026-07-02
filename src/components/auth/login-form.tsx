"use client"

import { useActionState } from "react"
import { KeyRoundIcon, Loader2Icon, LogInIcon } from "lucide-react"

import {
  requestPasswordResetAction,
  signInWithPasswordAction,
} from "@/app/actions"
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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

export function LoginForm({ errorMessage }: LoginFormProps) {
  const [loginState, loginAction, loginPending] = useActionState(
    signInWithPasswordAction,
    initialState
  )
  const [resetState, resetAction, resetPending] = useActionState(
    requestPasswordResetAction,
    initialState
  )
  const message = resetState.message ?? loginState.message ?? errorMessage
  const isSuccess = resetState.status === "success"
  const pending = loginPending || resetPending
  const emailError =
    resetState.fieldErrors?.email ?? loginState.fieldErrors?.email
  const passwordError = loginState.fieldErrors?.password

  return (
    <form action={loginAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field
          data-invalid={
            Boolean(emailError) ||
            (!emailError && loginState.status === "error") ||
            undefined
          }
        >
          <FieldLabel htmlFor="email">Seu email</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              aria-invalid={Boolean(emailError) || undefined}
              required
            />
            <FieldError message={emailError} />
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(passwordError) || undefined}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <FieldContent>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Sua senha"
              autoComplete="current-password"
              aria-invalid={Boolean(passwordError) || undefined}
              required
            />
            <FieldDescription>
              Primeiro acesso ou senha esquecida: receba um link para criar uma senha.
            </FieldDescription>
            <FieldError message={passwordError} />
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

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {loginPending ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <LogInIcon data-icon="inline-start" />
          )}
          Entrar
        </Button>
        <Button
          type="submit"
          variant="outline"
          size="lg"
          disabled={pending}
          formAction={resetAction}
          formNoValidate
        >
          {resetPending ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <KeyRoundIcon data-icon="inline-start" />
          )}
          Criar ou redefinir senha
        </Button>
      </div>
    </form>
  )
}
