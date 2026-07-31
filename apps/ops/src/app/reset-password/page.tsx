'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function OpsResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          setError(updateError.message);
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update password.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-jetblack font-sans flex flex-col justify-center items-center p-6 text-white">
      <div className="w-full max-w-md space-y-6">
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

        <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-papaya/10 border border-papaya/20">
              <ShieldCheck className="h-5 w-5 text-papaya" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Set New Staff Password</h1>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Choose a strong new password for your Operations Portal account.
              </p>
            </div>
          </div>

          {success ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto" />
              <h3 className="font-extrabold text-sm text-green-300">Password Reset Complete!</h3>
              <p className="text-xs text-green-200/90">
                Your staff password has been updated. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 p-3 text-xs font-bold text-vermillion flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-gray-400">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-papaya/50 focus:bg-white/10 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-black uppercase tracking-wider text-gray-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-papaya/50 focus:bg-white/10 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !password}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-papaya py-3 px-4 text-sm font-black text-jetblack hover:bg-caramel transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                <span>{isPending ? 'Updating...' : 'Update Password'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
