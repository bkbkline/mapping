'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/app/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setMagicLinkSent(true);
    toast.success('Check your email for the magic link');
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
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
          <p className="mt-1 text-sm text-[#9CA3AF]">Sign in to your account</p>
        </div>

        <Card className="border-[#374151] bg-[#111827]">
          <CardContent className="pt-6">
            <Tabs defaultValue="password">
              <TabsList className="mb-6 w-full">
                <TabsTrigger value="password" className="flex-1">
                  Email &amp; Password
                </TabsTrigger>
                <TabsTrigger value="magic" className="flex-1">
                  Magic Link
                </TabsTrigger>
              </TabsList>

              {/* Email & Password Tab */}
              <TabsContent value="password">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#F9FAFB]">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[#F9FAFB]">
                        Password
                      </Label>
                      <Link
                        href="/reset-password"
                        className="text-xs text-[#F59E0B] hover:text-[#D97706] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706] font-semibold"
                    size="lg"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Magic Link Tab */}
              <TabsContent value="magic">
                {magicLinkSent ? (
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
                      We sent a magic link to <span className="text-[#F59E0B]">{magicEmail}</span>
                    </p>
                    <button
                      onClick={() => setMagicLinkSent(false)}
                      className="mt-3 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                    >
                      Try a different email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email" className="text-[#F9FAFB]">
                        Email
                      </Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="you@company.com"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        required
                        className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706] font-semibold"
                      size="lg"
                    >
                      {loading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#374151]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111827] px-2 text-[#9CA3AF]">or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] hover:bg-[#1F2937]"
              size="lg"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-[#9CA3AF]">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[#F59E0B] hover:text-[#D97706] transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
