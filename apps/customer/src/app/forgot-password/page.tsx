'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const origin = window.location.origin;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${origin}/reset-password`,
        });

        if (resetError) {
          setError(resetError.message);
        } else {
          setIsSent(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send password reset email.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-sans flex flex-col justify-center items-center p-6 text-jetblack">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="relative h-14 w-52 mx-auto">
              <Image
                src="/brand/p4p-logo.png"
                alt="PREPPED 4 PREP Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-sky-200/80 p-8 shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-jetblack">Reset Your Password</h1>
            <p className="text-sm text-gray-600">
              Enter your account email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {isSent ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <h3 className="font-extrabold text-sm text-green-900">Check Your Email</h3>
              <p className="text-xs text-green-800 leading-relaxed">
                We sent a password reset link to <strong className="font-bold">{email}</strong>. Please check your inbox and click the link to choose a new password.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-jetblack hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 p-3 text-xs font-bold text-vermillion flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-jetblack focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-papaya px-4 py-3 text-sm font-bold text-jetblack hover:bg-caramel hover:text-white transition-all disabled:opacity-50"
              >
                <span>{isPending ? 'Sending Link...' : 'Send Reset Link'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-jetblack">
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
