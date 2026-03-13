'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1. Create the user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      toast.error('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Create organization record
    if (orgName.trim()) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName.trim(), owner_id: authData.user.id })
        .select('id')
        .single();

      if (orgError) {
        console.error('Failed to create organization:', orgError);
        // Don't block signup if org creation fails
      } else if (orgData) {
        // 3. Update user profile with org_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ organization_id: orgData.id })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Failed to update profile:', profileError);
        }
      }
    }

    toast.success('Account created successfully!');
    router.push('/app/dashboard');
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
          <p className="mt-1 text-sm text-[#9CA3AF]">Create your account</p>
        </div>

        <Card className="border-[#374151] bg-[#111827]">
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-[#F9FAFB]">
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-[#F9FAFB]">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-[#F9FAFB]">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                />
                <p className="text-xs text-[#9CA3AF]">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-[#F9FAFB]">
                  Organization Name
                </Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="border-[#374151] bg-[#0A0E1A] text-[#F9FAFB] placeholder:text-[#9CA3AF]"
                />
                <p className="text-xs text-[#9CA3AF]">Optional - you can set this up later</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706] font-semibold"
                size="lg"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[#9CA3AF]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[#F59E0B] hover:text-[#D97706] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
