import Image from 'next/image';
import OpsLoginForm from './OpsLoginForm';
import { ShieldCheck } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
}

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  no_access:
    'Your account does not have Operations Portal access. Contact your administrator.',
  auth_callback_failed:
    'The sign-in link has expired or is invalid. Please request a new one from your admin.',
  session_expired: 'Your session has expired. Please sign in again.',
};

export default async function OpsLoginPage({ searchParams }: PageProps) {
  const { error, redirectTo } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'An unexpected error occurred. Please try again.') : null;

  return (
    <div className="min-h-screen bg-jetblack font-sans flex flex-col items-center justify-center p-6">
      {/* Logo + portal label */}
      <div className="mb-8 flex flex-col items-center gap-2">
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
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-8 space-y-6">
          {/* Heading */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-papaya/10 border border-papaya/20">
              <ShieldCheck className="h-5 w-5 text-papaya" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">Staff Sign In</h1>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Restricted to authorised Prepped 4 Prep staff only.
              </p>
            </div>
          </div>

          {/* Error banner (from URL param — e.g. redirect after session expiry) */}
          {errorMessage && (
            <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 px-4 py-3 text-xs font-bold text-vermillion leading-relaxed">
              {errorMessage}
            </div>
          )}

          <OpsLoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Not a staff member?{' '}
          <a
            href={process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://prepped4prep.co.za'}
            className="text-papaya hover:underline font-bold"
          >
            Go to the Customer Portal
          </a>
        </p>
      </div>
    </div>
  );
}
