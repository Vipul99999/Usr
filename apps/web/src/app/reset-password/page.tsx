'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { apiFetch } from '@/lib/api'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})
    setLoading(true)

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })

    if (!token) {
      setError('Missing reset token')
      setLoading(false)
      return
    }

    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message
        ])
      )
      setFieldErrors(nextErrors)
      setError(parsed.error.issues[0]?.message || 'Invalid input')
      setLoading(false)
      return
    }

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: parsed.data.password
        })
      })

      setSuccess('Password reset successful. Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="premium-panel w-full max-w-md rounded-[32px] p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Password reset</p>
        <h1 className="mt-4 text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-2 text-white/60">
          Set a fresh password and get back into your workspace securely.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <TextField
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            type="password"
            error={fieldErrors.password}
          />

          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            type="password"
            error={fieldErrors.confirmPassword}
          />

          <FormMessage error={error} success={success} />

          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="premium-panel w-full max-w-md rounded-[32px] p-8">
            <h1 className="text-3xl font-semibold">Reset password</h1>
            <p className="mt-8 text-white/70">Loading reset form...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
