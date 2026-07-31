'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
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
    <div className="min-h-screen bg-[#F0F9FF] font-sans flex flex-col justify-center items-center p-6 text-jetblack">
      <div className="w-full max-w-md space-y-6">
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

        <div className="bg-white rounded-3xl border border-sky-200/80 p-8 shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-jetblack">Set New Password</h1>
            <p className="text-sm text-gray-600">
              Please enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <h3 className="font-extrabold text-sm text-green-900">Password Updated!</h3>
              <p className="text-xs text-green-800">
                Your password has been changed successfully. Redirecting you to sign in...
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

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-jetblack focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-jetblack focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !password}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-papaya px-4 py-3 text-sm font-bold text-jetblack hover:bg-caramel hover:text-white transition-all disabled:opacity-50"
              >
                <span>{isPending ? 'Updating Password...' : 'Update Password'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
