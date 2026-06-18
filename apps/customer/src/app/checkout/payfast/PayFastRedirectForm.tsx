'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PayFastRedirectFormProps {
  action: string;
  payload: Record<string, string>;
  signature: string;
}

export function PayFastRedirectForm({
  action,
  payload,
  signature,
}: PayFastRedirectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <div className="text-center space-y-4 max-w-sm">
      <Loader2 className="h-10 w-10 animate-spin text-papaya mx-auto" />
      <h2 className="text-lg font-extrabold text-gray-900">Redirecting to PayFast Secure Checkout...</h2>
      <p className="text-sm text-gray-500">
        We are transferring you to the secure South African payment gateway to complete your transaction.
      </p>

      {/* Hidden Auto-submit Form */}
      <form ref={formRef} action={action} method="POST">
        {Object.entries(payload).map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}
        <input type="hidden" name="signature" value={signature} />

        <noscript>
          <button
            type="submit"
            className="w-full rounded-xl bg-jetblack text-white py-3 px-4 text-sm font-bold mt-4 hover:bg-opacity-90 transition-all"
          >
            Click here to proceed if not redirected automatically
          </button>
        </noscript>
      </form>
    </div>
  );
}
