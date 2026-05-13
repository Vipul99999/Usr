'use client'

import Link from 'next/link'
import { useState } from 'react'
import { z } from 'zod'
import { apiFetch } from '@/lib/api'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address')
})

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
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

    const parsed = forgotPasswordSchema.safeParse({ email })

    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
      )
      setFieldErrors(nextErrors)
      setError(parsed.error.issues[0]?.message || 'Invalid input')
      setLoading(false)
      return
    }

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(parsed.data)
      })

      setSuccess('If that email exists, a reset link has been generated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-white">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[36px] border border-white/10 bg-[rgba(8,19,36,0.86)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-white/45">Password recovery</p>
          <h1 className="mt-4 text-3xl font-semibold">Reset access without losing momentum</h1>
          <p className="mt-3 text-white/60">
            Enter your email and we&apos;ll generate a password reset link if the account exists.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <TextField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              error={fieldErrors.email}
            />

            <FormMessage error={error} success={success} />

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Submitting...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-white/58">
            <p>
              Remembered your password?{' '}
              <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
                Go back to login
              </Link>
            </p>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(103,232,249,0.12),rgba(8,19,36,0.9)_35%,rgba(8,19,36,0.98))] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] lg:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">Keep it secure</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight">
            Recovery that protects users without adding confusion.
          </h2>
          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-sm font-medium text-white">No account leakage</p>
              <p className="mt-2 text-white/62">
                The response stays generic so attackers cannot use this form to discover who has an account.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-sm font-medium text-white">Fast reset path</p>
              <p className="mt-2 text-white/62">
                Once the link is opened, users can set a new password and get back into the dashboard quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
