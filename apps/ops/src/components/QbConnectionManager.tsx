'use client';

import React, { useState, useTransition } from 'react';
import { disconnectQuickBooksAction } from '@/app/qb-actions';
import { CheckCircle, AlertCircle, RefreshCw, Link as LinkIcon, PowerOff } from 'lucide-react';

interface QbConnectionManagerProps {
  isConnected: boolean;
  realmId: string;
  activeRole: string;
}

export default function QbConnectionManager({
  isConnected,
  realmId,
  activeRole,
}: QbConnectionManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Only show connection manager to Admin & Finance clearance
  if (activeRole !== 'admin' && activeRole !== 'finance') {
    return null;
  }

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect QuickBooks Online integration?')) {
      startTransition(async () => {
        const res = await disconnectQuickBooksAction();
        if (!res.success) {
          setError(res.error || 'Failed to disconnect.');
        } else {
          window.location.reload();
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Authentic QuickBooks Green badge box */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white font-black text-xl select-none" title="QuickBooks">
            qb
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
              QuickBooks Online Sync
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  Not Connected
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isConnected
                ? `Authorized access for Sandbox Company Realm ID: ${realmId}`
                : 'Connect your developer sandbox to automatically push paid sales invoices.'}
            </p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-xs font-black text-red-600 rounded-xl bg-red-50/50 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all cursor-pointer"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Disconnect QB
            </button>
          ) : (
            <a
              href="/api/quickbooks/connect"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-xs font-black text-white rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect QuickBooks Sandbox
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
