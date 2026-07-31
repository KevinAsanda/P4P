'use client';

import { useState } from 'react';
import { createSupplier } from '@/app/crud-actions';
import { Plus, User, Phone, Mail, Sparkles, Send, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  averageLeadTimeDays: number | null;
}

interface LowStockProduct {
  id: string;
  itemName: string;
  sku: string;
  qtyOnHand: number;
  reorderThreshold: number;
  unitPrice: any;
  supplierId: string | null;
  supplierName?: string;
}

interface SuppliersClientProps {
  suppliers: Supplier[];
  lowStockProducts: LowStockProduct[];
}

export default function SuppliersClient({ suppliers, lowStockProducts }: SuppliersClientProps) {
  const [showPoModal, setShowPoModal] = useState(false);
  const [dispatchedPos, setDispatchedPos] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Group low stock products by supplier
  const poGroups: Record<string, { supplier: Supplier | null; items: Array<LowStockProduct & { reorderQty: number; estimatedCost: number }> }> = {};

  lowStockProducts.forEach((prod) => {
    const suppKey = prod.supplierId || 'unassigned';
    const supp = suppliers.find((s) => s.id === prod.supplierId) || null;
    const reorderQty = Math.max(50, prod.reorderThreshold * 2 - prod.qtyOnHand);
    const estimatedCost = Number(prod.unitPrice) * reorderQty;

    if (!poGroups[suppKey]) {
      poGroups[suppKey] = { supplier: supp, items: [] };
    }
    poGroups[suppKey].items.push({ ...prod, reorderQty, estimatedCost });
  });

  const handleDispatchPo = (supplierName: string) => {
    setIsSending(true);
    setTimeout(() => {
      setDispatchedPos((prev) => [...prev, supplierName]);
      setIsSending(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Auto PO Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-jetblack">Procurement &amp; Low-Stock Automation</h3>
            <p className="text-xs text-gray-500">
              {lowStockProducts.length} stationery items currently below reorder threshold.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPoModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-jetblack text-papaya hover:bg-caramel hover:text-white font-black text-xs transition-all shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-papaya" />
          <span>⚡ Auto-Generate Supplier POs ({Object.keys(poGroups).length} Vendors)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Suppliers Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Supplier Name</th>
                  <th className="px-6 py-4">Contact Person</th>
                  <th className="px-6 py-4">Phone / Email</th>
                  <th className="px-6 py-4 text-center">Avg Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No suppliers registered yet. Use the registration form to add your first vendor.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supp) => (
                    <tr key={supp.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{supp.name}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium flex items-center gap-1.5 py-5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {supp.contactName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-1">
                        {supp.phone && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-3 w-3" />
                            {supp.phone}
                          </span>
                        )}
                        {supp.email && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Mail className="h-3 w-3" />
                            {supp.email}
                          </span>
                        )}
                        {!supp.phone && !supp.email && <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-gray-700">
                        {supp.averageLeadTimeDays ? `${supp.averageLeadTimeDays} days` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
            <Plus className="text-papaya h-5 w-5" />
            Enroll Supplier
          </h3>

          <form action={createSupplier} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-xs font-semibold text-gray-600">
                Supplier Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Croxley Wholesalers"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contactName" className="block text-xs font-semibold text-gray-600">
                Contact Person
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                placeholder="e.g. Dave Williams"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-600">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  placeholder="031 555 1234"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="averageLeadTimeDays" className="block text-xs font-semibold text-gray-600">
                  Lead Time (Days)
                </label>
                <input
                  type="number"
                  id="averageLeadTimeDays"
                  name="averageLeadTimeDays"
                  placeholder="3"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="orders@croxley.co.za"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-jetblack text-white hover:bg-caramel text-xs font-black rounded-xl transition-all"
            >
              Add Supplier to Directory
            </button>
          </form>
        </div>
      </div>

      {/* Auto Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-jetblack/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border-2 border-papaya shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-jetblack p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-caramel flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Automated Supplier Reordering
              </span>
              <h3 className="text-xl font-black text-jetblack">Generated Supplier Purchase Orders</h3>
              <p className="text-xs text-gray-500">
                Items currently below reorder threshold have been grouped by vendor into ready-to-dispatch Purchase Orders.
              </p>
            </div>

            {Object.keys(poGroups).length === 0 ? (
              <div className="p-8 text-center bg-green-50 border border-green-200 rounded-2xl text-green-800 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <p className="font-bold text-sm">All Inventory Healthy!</p>
                <p className="text-xs text-green-700">No products are currently below their reorder thresholds.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(poGroups).map(([key, group]) => {
                  const vendorName = group.supplier ? group.supplier.name : 'General Wholesaler';
                  const isSent = dispatchedPos.includes(vendorName);
                  const totalEst = group.items.reduce((sum, i) => sum + i.estimatedCost, 0);

                  return (
                    <div key={key} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-sm text-jetblack">{vendorName}</h4>
                          <p className="text-[10px] text-gray-500">
                            {group.supplier?.email || 'No email registered'} &bull; Lead time: {group.supplier?.averageLeadTimeDays || '3'} days
                          </p>
                        </div>
                        <span className="text-xs font-black text-caramel bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          Est Total: R {totalEst.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-150 text-xs">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-gray-700">
                            <span>
                              <strong className="font-bold text-jetblack">{item.itemName}</strong> ({item.sku})
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-vermillion font-bold">In stock: {item.qtyOnHand}</span>
                              <span className="font-black text-papaya bg-jetblack px-2 py-0.5 rounded text-[11px]">
                                Order +{item.reorderQty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleDispatchPo(vendorName)}
                        disabled={isSent || isSending}
                        className={`w-full py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isSent
                            ? 'bg-green-100 text-green-800 border border-green-200 cursor-default'
                            : 'bg-jetblack text-white hover:bg-caramel'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Purchase Order Dispatched to {vendorName}</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 text-papaya" />
                            <span>Dispatch Purchase Order Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
