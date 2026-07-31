'use client';

import { useState, useTransition, useEffect } from 'react';
import { opsLogin } from '@/app/auth-actions';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface OpsLoginFormProps {
  redirectTo?: string;
}

export default function OpsLoginForm({ redirectTo }: OpsLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Listen for client-side implicit flow hash tokens (e.g. #access_token=...) from invite link redirects
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('access_token=') || hash.includes('type=invite') || hash.includes('type=recovery')) {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            window.location.href = redirectTo || '/';
          }
        });
      }
    }
  }, [redirectTo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (redirectTo) formData.set('redirectTo', redirectTo);

    startTransition(async () => {
      const result = await opsLogin(null, formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 px-4 py-3 text-xs font-bold text-vermillion leading-relaxed">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="ops-email" className="block text-xs font-black uppercase tracking-wider text-gray-400">
          Email Address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            id="ops-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-papaya/50 focus:bg-white/10 focus:outline-none transition"
            placeholder="your@prepped4prep.co.za"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="ops-password" className="block text-xs font-black uppercase tracking-wider text-gray-400">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            id="ops-password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:border-papaya/50 focus:bg-white/10 focus:outline-none transition"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-papaya py-3 px-4 text-sm font-black text-jetblack hover:bg-caramel transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <span>Sign In to Portal</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
