'use client'

import Link from 'next/link'
import { useState } from 'react'
import { z } from 'zod'
import { apiFetch } from '@/lib/api'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'

const resendVerificationSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address')
})

export default function ResendVerificationPage() {
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

    const parsed = resendVerificationSchema.safeParse({ email })

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
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(parsed.data)
      })

      setSuccess('If that email exists and is not verified, a new verification email has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-white">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="premium-panel-strong rounded-[36px] bg-[linear-gradient(160deg,rgba(245,158,11,0.13),rgba(8,19,36,0.9)_34%,rgba(8,19,36,0.98))] p-8 lg:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-100/70">Verification</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight">
            Keep onboarding moving when the first email gets missed.
          </h1>
          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-sm font-medium text-white">Inbox retry</p>
              <p className="mt-2 text-white/62">
                Users can request a fresh verification link without opening support tickets.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-sm font-medium text-white">Safer flow</p>
              <p className="mt-2 text-white/62">
                The response stays generic so this page doesn&apos;t leak whether an account exists.
              </p>
            </div>
          </div>
        </div>

        <div className="premium-panel rounded-[36px] p-8 lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-white/45">Resend verification</p>
          <h2 className="mt-4 text-3xl font-semibold">Get a fresh email link</h2>
          <p className="mt-3 text-white/60">
            Enter your email to receive a new verification link.
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
              {loading ? 'Sending...' : 'Resend verification email'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-white/58">
            Already verified or ready to try again?{' '}
            <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
              Go to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
