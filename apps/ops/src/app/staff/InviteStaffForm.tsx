'use client';

import { useState, useTransition } from 'react';
import { inviteStaffMember } from '@/app/auth-actions';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function InviteStaffForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await inviteStaffMember(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(`Invite sent to ${result.email}. They'll receive an email with a link to set their password.`);
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-vermillion/10 border border-vermillion/20 px-4 py-3 text-xs font-bold text-vermillion leading-relaxed">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-xs font-bold text-green-700 leading-relaxed flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="invite-email" className="block text-xs font-black uppercase tracking-wider text-gray-500">
          Email Address
        </label>
        <input
          id="invite-email"
          type="email"
          name="email"
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none transition"
          placeholder="staff@prepped4prep.co.za"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="invite-role" className="block text-xs font-black uppercase tracking-wider text-gray-500">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          required
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none transition"
        >
          <option value="">Select a role…</option>
          <option value="admin">Admin — full access</option>
          <option value="finance">Finance — orders, payments, BI</option>
          <option value="warehouse">Warehouse — packing queue only</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-jetblack py-2.5 px-4 text-sm font-black text-white hover:bg-caramel transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending invite…</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Send Invite</span>
          </>
        )}
      </button>
    </form>
  );
}
