'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function OpsForgotPasswordPage() {
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
    <div className="min-h-screen bg-jetblack font-sans flex flex-col justify-center items-center p-6 text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-10 w-44">
            <Image
              src="/brand/logo-wordmark.svg"
              alt="PREPPED 4 PREP Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Operations Portal
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-papaya/10 border border-papaya/20">
              <ShieldCheck className="h-5 w-5 text-papaya" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Staff Account Recovery</h1>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Enter your staff email address to receive a secure password reset link.
              </p>
            </div>
          </div>

          {isSent ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-green-300">Reset Email Sent</h3>
              <p className="text-xs text-green-200/90 leading-relaxed">
                We sent a password reset link to <strong className="text-white font-bold">{email}</strong>. Check your inbox and follow the link to select a new password.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-papaya hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Staff Sign In
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

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-gray-400">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@prepped4prep.co.za"
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-papaya/50 focus:bg-white/10 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-papaya py-3 px-4 text-sm font-black text-jetblack hover:bg-caramel transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                <span>{isPending ? 'Sending...' : 'Send Recovery Link'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs font-semibold text-gray-500 hover:text-papaya">
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
