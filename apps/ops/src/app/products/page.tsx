import { prisma } from '@p4p/db';
import { getActiveRole } from '@/lib/auth-utils';
import { createProduct, updateProductStock } from '@/app/crud-actions';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Plus, Edit3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const activeRole = await getActiveRole();

  if (activeRole !== 'admin') {
    return (
      <DashboardLayout activeRole={activeRole}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center py-12 max-w-lg mx-auto">
          <ShieldAlert className="h-10 w-10 text-vermillion mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            You do not have the required permissions to view or edit the product catalog. Admin clearance is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch products and suppliers
  const products = await prisma.product.findMany({
    include: {
      supplier: true,
    },
    orderBy: {
      itemName: 'asc',
    },
  });

  const suppliers = await prisma.supplier.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  // Client server action wrapper to handle stock level updates directly
  const handleUpdateStock = async (formData: FormData) => {
    'use server';
    const id = formData.get('productId') as string;
    const qty = formData.get('qtyOnHand') as string;
    if (id && qty) {
      await updateProductStock(id, Number(qty));
    }
  };

  return (
    <DashboardLayout activeRole={activeRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500">
            Monitor inventory, adjust current stock counts, and register new stationery items or fulfillment services.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Products Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-150 text-xs font-black uppercase text-gray-400 tracking-wider">
                    <th className="px-6 py-4">Item details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Unit Price</th>
                    <th className="px-6 py-4 text-center">Stock / Threshold</th>
                    <th className="px-6 py-4 text-right">Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No products registered yet. Use the form to enroll items.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 text-xs">
                          <p className="font-bold text-sm text-gray-900">{prod.itemName}</p>
                          <p className="text-gray-400 mt-0.5">
                            SKU: {prod.sku} {prod.brand ? `• Brand: ${prod.brand}` : ''}
                          </p>
                          {prod.supplier && (
                            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                              Vendor: {prod.supplier.name}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              prod.category === 'Service'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {prod.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                          R {Number(prod.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center text-xs">
                          <span className={`font-black ${prod.qtyOnHand <= prod.reorderThreshold ? 'text-vermillion' : 'text-gray-900'}`}>
                            {prod.qtyOnHand}
                          </span>
                          <span className="text-gray-400 block text-[10px]">Threshold: {prod.reorderThreshold}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={handleUpdateStock} className="inline-flex items-center gap-2">
                            <input type="hidden" name="productId" value={prod.id} />
                            <input
                              type="number"
                              name="qtyOnHand"
                              defaultValue={prod.qtyOnHand}
                              min={0}
                              className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-center font-bold focus:border-papaya focus:bg-white focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-lg border border-gray-200 transition-colors"
                              title="Update Stock"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Creation Form */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <Plus className="text-papaya h-5 w-5" />
              Register Item
            </h3>

            <form action={createProduct} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="itemName" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Item Name
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  required
                  placeholder="e.g. Croxley Ruler 30cm"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sku" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    required
                    placeholder="RUL-30C-CRX"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="brand" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    placeholder="Croxley"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="unitPrice" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Unit Price (ZAR)
                  </label>
                  <input
                    type="number"
                    id="unitPrice"
                    name="unitPrice"
                    step="0.01"
                    min="0"
                    required
                    placeholder="15.50"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="category" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="qtyOnHand" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    id="qtyOnHand"
                    name="qtyOnHand"
                    defaultValue="0"
                    min="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="reorderThreshold" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    id="reorderThreshold"
                    name="reorderThreshold"
                    defaultValue="50"
                    min="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="supplierId" className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Assigned Supplier
                </label>
                <select
                  id="supplierId"
                  name="supplierId"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-papaya focus:bg-white focus:outline-none"
                >
                  <option value="">-- No Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-jetblack py-3 px-4 text-xs font-black text-white hover:bg-caramel hover:shadow-md transition-all"
              >
                Register Item
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
