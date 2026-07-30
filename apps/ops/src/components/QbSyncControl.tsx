'use client';

import React, { useState, useTransition } from 'react';
import { syncOrderToQuickBooksAction, verifyInvoiceStatusAction } from '@/app/qb-actions';
import { markOrderAsPaid } from '@/app/crud-actions';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Search,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

interface QbSyncControlProps {
  orderId: string;
  initialSyncStatus: string;
  invoiceId: string | null;
  paymentStatus: string;
  activeRole: string;
}

export default function QbSyncControl({
  orderId,
  initialSyncStatus,
  invoiceId,
  paymentStatus: initialPaymentStatus,
  activeRole,
}: QbSyncControlProps) {
  const [syncStatus, setSyncStatus] = useState(initialSyncStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [qbInvoiceId, setQbInvoiceId] = useState(invoiceId);
  const [isPending, startTransition] = useTransition();
  const [verificationDetails, setVerificationDetails] = useState<{
    docNumber: string;
    total: number;
    balance: number;
    isFullyPaid: boolean;
  } | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkPaid = () => {
    setError(null);
    startTransition(async () => {
      try {
        await markOrderAsPaid(orderId);
        setPaymentStatus('paid');
      } catch (err: any) {
        setError(err.message || 'Failed to update payment status.');
      }
    });
  };

  // Redact QuickBooks controls completely for Warehouse staff (as per RBAC Section 4)
  if (activeRole === 'warehouse') {
    return null;
  }

  // Only allow syncing for paid orders
  if (paymentStatus !== 'paid') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          Unpaid
        </span>
        <button
          onClick={handleMarkPaid}
          disabled={isPending}
          className="text-[10px] font-bold text-green-700 hover:text-green-900 underline cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Updating...' : 'Mark Paid'}
        </button>
      </div>
    );
  }

  const handleSync = () => {
    setError(null);
    startTransition(async () => {
      const res = await syncOrderToQuickBooksAction(orderId);
      if (res.success) {
        setSyncStatus('synced');
        setQbInvoiceId((res as any).qbInvoiceId || '');
      } else {
        setSyncStatus('failed');
        setError((res as any).error || 'Failed to sync to QuickBooks.');
      }
    });
  };

  const handleVerify = () => {
    setError(null);
    setVerificationDetails(null);
    setShowVerification(true);
    startTransition(async () => {
      const res = await verifyInvoiceStatusAction(orderId);
      const anyRes = res as any;
      if (res.success && anyRes.docNumber) {
        setVerificationDetails({
          docNumber: anyRes.docNumber,
          total: anyRes.total,
          balance: anyRes.balance,
          isFullyPaid: anyRes.isFullyPaid,
        });
      } else {
        setError(anyRes.error || 'Failed to verify invoice on QuickBooks.');
      }
    });
  };

  return (
    <div className="space-y-1.5 min-w-[140px]">
      <div className="flex items-center gap-2">
        {/* Sync Status Badge */}
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
            syncStatus === 'synced'
              ? 'bg-green-50 text-green-700 border-green-200'
              : syncStatus === 'failed'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {syncStatus}
        </span>

        {/* Action button */}
        {syncStatus === 'synced' ? (
          <button
            onClick={handleVerify}
            disabled={isPending}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 cursor-pointer disabled:opacity-55"
          >
            {isPending ? 'Verifying...' : 'Verify Balance'}
          </button>
        ) : (
          <button
            onClick={handleSync}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black text-white bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer transition-all disabled:opacity-55 shadow-xs"
          >
            {isPending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Sync
          </button>
        )}
      </div>

      {/* Error Output */}
      {error && (
        <p className="text-[10px] font-semibold text-red-600 leading-tight max-w-[160px] truncate" title={error}>
          Error: {error}
        </p>
      )}

      {/* Two-Way Pull Verification Details Panel */}
      {showVerification && (
        <div className="absolute z-20 bg-white border border-gray-200 rounded-xl p-3 shadow-md text-xs space-y-2 text-jetblack max-w-[200px]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-1">
            <span className="font-bold text-[10px] uppercase text-gray-400">QB Invoice Status</span>
            <button
              onClick={() => setShowVerification(false)}
              className="text-gray-400 hover:text-jetblack font-bold text-sm"
            >
              &times;
            </button>
          </div>
          {isPending ? (
            <div className="flex items-center gap-1.5 text-gray-500 py-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Checking QuickBooks...</span>
            </div>
          ) : verificationDetails ? (
            <div className="space-y-1 font-semibold text-gray-700">
              <p className="text-[10px] text-gray-400 leading-none">QB Doc #: {verificationDetails.docNumber}</p>
              <div className="flex justify-between mt-1">
                <span>Total Amt:</span>
                <span className="font-extrabold">R {verificationDetails.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>QB Balance:</span>
                <span className="font-extrabold text-indigo-600">R {verificationDetails.balance.toFixed(2)}</span>
              </div>
              <div className="mt-1 pt-1.5 border-t border-gray-100 flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    verificationDetails.isFullyPaid ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-[9px] uppercase font-black text-gray-500">
                  {verificationDetails.isFullyPaid ? 'Fully Settled' : 'Unpaid in QB'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-red-500 font-bold leading-tight">
              {error || 'Failed to load verification logs.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
