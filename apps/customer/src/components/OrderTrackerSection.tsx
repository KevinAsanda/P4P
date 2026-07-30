'use client';

import { useState, useTransition } from 'react';
import { Search, Package, CheckCircle2, Truck, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface OrderStatusResult {
  found: boolean;
  orderId?: string;
  customerName?: string;
  schoolName?: string;
  gradeLevel?: string;
  orderDate?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  itemCount?: number;
  deliveryMethod?: string;
  error?: string;
}

export default function OrderTrackerSection() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          setResult({ found: false, error: 'Order not found. Please check your reference or email.' });
        }
      } catch {
        setResult({ found: false, error: 'Unable to check order status. Please try again.' });
      }
    });
  };

  const getStepStatus = (status?: string) => {
    switch (status) {
      case 'delivered':
        return 4;
      case 'dispatched':
        return 3;
      case 'packed':
      case 'packing':
        return 2;
      case 'pending':
      default:
        return 1;
    }
  };

  const currentStep = getStepStatus(result?.fulfillmentStatus);

  return (
    <section id="track-order" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-3xl font-black text-jetblack sm:text-5xl tracking-tight">
            Track Your Child's Stationery Pack
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Enter your order reference ID (e.g. <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs">P4P-...</code>) or billing email address to check your packing and delivery status.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-4 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                aria-label="Order reference or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Order ID or Email address..."
                className="w-full rounded-2xl border-2 border-amber-200 bg-white pl-12 pr-4 py-4 text-sm font-semibold text-jetblack placeholder-gray-400 focus:border-papaya focus:outline-none focus:ring-4 focus:ring-papaya/20 shadow-sm transition"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="w-full sm:w-auto shrink-0 rounded-2xl bg-jetblack px-8 py-4 text-sm font-black text-white hover:bg-caramel hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {/* Result Card */}
          {result && (
            <div className="mt-8 text-left bg-white rounded-3xl border-2 border-amber-100 p-6 sm:p-8 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
              {result.found ? (
                <div className="space-y-6">
                  {/* Status Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">Order Reference</span>
                      <h4 className="text-lg font-black text-jetblack">{result.orderId}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 capitalize border border-green-200">
                        Payment: {result.paymentStatus}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-papaya/20 text-caramel capitalize border border-papaya/30">
                        Status: {result.fulfillmentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-bold">Child Name</span>
                      <span className="font-extrabold text-jetblack text-sm">{result.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">School & Grade</span>
                      <span className="font-extrabold text-jetblack text-sm">{result.schoolName} ({result.gradeLevel})</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">Order Date</span>
                      <span className="font-extrabold text-jetblack text-sm">{result.orderDate}</span>
                    </div>
                  </div>

                  {/* Progress Bar Steps */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <span className="text-xs font-semibold text-gray-500">Fulfillment Progress</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      {[
                        { step: 1, label: 'Order Registered', icon: Clock },
                        { step: 2, label: 'Packed & Labeled', icon: Package },
                        { step: 3, label: 'Out for Delivery', icon: Truck },
                        { step: 4, label: 'Delivered!', icon: CheckCircle2 },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isDone = currentStep >= item.step;
                        const isCurrent = currentStep === item.step;
                        return (
                          <div key={item.step} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-papaya text-jetblack font-black shadow-sm'
                                  : 'bg-gray-100 text-gray-400'
                              } ${isCurrent ? 'ring-4 ring-papaya/30 scale-105' : ''}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-[11px] font-bold leading-tight ${isDone ? 'text-jetblack' : 'text-gray-400'}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-vermillion p-2">
                  <AlertCircle className="h-6 w-6 shrink-0" />
                  <p className="text-sm font-bold">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
