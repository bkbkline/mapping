'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success('Password reset link sent');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#F59E0B]">
            <svg
              className="h-7 w-7 text-[#0A0E1A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Land Intel</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">Reset your password</p>
        </div>

        <Card className="border-[#374151] bg-[#111827]">
          <CardContent className="pt-6">
            {sent ? (
              <div className="rounded-lg border border-[#374151] bg-[#0A0E1A] p-6 text-center">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B]/10">
                  <svg
                    className="h-5 w-5 text-[#F59E0B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#F9FAFB]">Check your email</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  We sent a password reset link to{' '}
                  <span className="text-[#F59E0B]">{email}</span>
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-3 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-[#F9FAFB]">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                  />
                  <p className="text-xs text-[#9CA3AF]">
                    Enter the email associated with your account and we&apos;ll send you a link to
                    reset your password.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706] font-semibold"
                  size="lg"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-[#9CA3AF]">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-[#F59E0B] hover:text-[#D97706] transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
